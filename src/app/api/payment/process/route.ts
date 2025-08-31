import { NextRequest, NextResponse } from 'next/server';
import { paymentDataSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { CacheService } from '@/lib/cache-service';
import { prisma } from '@/lib/prisma';

/**
 * Rate limiting para processamento de pagamentos usando Redis
 */
async function checkPaymentRateLimit(userId: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `payment_attempts:${userId}`;
  const maxAttempts = 3;
  const windowMs = 60 * 1000; // 1 minuto
  
  try {
    const current = await CacheService.rateLimit.get(key) || 0;
    
    if (current >= maxAttempts) {
      return {
        success: false,
        remaining: 0,
        reset: Date.now() + windowMs
      };
    }
    
    await CacheService.rateLimit.increment(key, windowMs / 1000);
    
    return {
      success: true,
      remaining: maxAttempts - current - 1,
      reset: Date.now() + windowMs
    };
  } catch (error) {
    console.error('Payment rate limit check error:', error);
    // Em caso de erro, permitir a operação
    return {
      success: true,
      remaining: maxAttempts - 1,
      reset: Date.now() + windowMs
    };
  }
}

/**
 * API de processamento de pagamentos com validação server-side
 * POST /api/payment/process
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      const response = NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Aplicar rate limiting baseado em Redis
    const rateLimitResult = await checkPaymentRateLimit(userId);
    
    if (!rateLimitResult.success) {
      // Log da tentativa de pagamento bloqueada por rate limit
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_RATE_LIMITED',
            resource: 'payment',
            resourceId: null,
            details: {
              ip: request.ip,
              userAgent: request.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
      
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de pagamento. Aguarde um momento.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    
    // Validação server-side dos dados
    const validation = validateData(paymentDataSchema, body);
    
    if (!validation.success) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Dados de pagamento inválidos',
          errors: validation.errors
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    const { 
      amount, 
      currency, 
      paymentMethod, 
      cardNumber, 
      expiryDate, 
      cvv, 
      cardholderName,
      billingAddress,
      serviceId
    } = validation.data;
    
    // Sanitizar dados sensíveis
    const sanitizedCardholderName = sanitizeText(cardholderName.trim());
    const sanitizedBillingAddress = {
      street: sanitizeText(billingAddress.street.trim()),
      city: sanitizeText(billingAddress.city.trim()),
      state: sanitizeText(billingAddress.state.trim()),
      zipCode: sanitizeText(billingAddress.zipCode.trim()),
      country: sanitizeText(billingAddress.country.trim())
    };
    
    // Validações adicionais de segurança
    const securityChecks = await performSecurityChecks({
      userId,
      amount,
      cardNumber,
      clientIP: getClientIP(request)
    });
    
    if (!securityChecks.passed) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Transação bloqueada por segurança',
          reason: securityChecks.reason
        },
        { status: 403 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se o serviço existe e está disponível
    const service = await getServiceById(serviceId);
    if (!service) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Serviço não encontrado'
        },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se o valor corresponde ao serviço
    if (amount !== service.price) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Valor do pagamento não corresponde ao preço do serviço'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Validar cartão de crédito
    const cardValidation = await validateCreditCard({
      cardNumber,
      expiryDate,
      cvv,
      cardholderName: sanitizedCardholderName
    });
    
    if (!cardValidation.valid) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Dados do cartão inválidos',
          reason: cardValidation.reason
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Criar transação
    const transaction = await createTransaction({
      userId,
      serviceId,
      amount,
      currency,
      paymentMethod,
      cardLast4: cardNumber.slice(-4),
      cardBrand: cardValidation.brand,
      billingAddress: sanitizedBillingAddress,
      timestamp: new Date()
    });
    
    // Processar pagamento com gateway
    const paymentResult = await processPaymentWithGateway({
      transactionId: transaction.id,
      amount,
      currency,
      cardNumber,
      expiryDate,
      cvv,
      cardholderName: sanitizedCardholderName,
      billingAddress: sanitizedBillingAddress
    });
    
    if (!paymentResult.success) {
      // Atualizar transação como falhada
      await updateTransactionStatus(transaction.id, 'failed', paymentResult.error);
      
      // Log de auditoria para pagamento falhado
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_FAILED',
            resource: 'payment',
            resourceId: transaction.id,
            details: {
              transactionId: transaction.id,
              amount,
              currency,
              paymentMethod,
              serviceId,
              errorReason: paymentResult.error,
              cardLast4: cardNumber.slice(-4),
              ip: request.ip,
              userAgent: request.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Audit log error:', error);
      }
      
      const response = NextResponse.json(
        {
          success: false,
          message: 'Falha no processamento do pagamento',
          reason: paymentResult.error,
          transactionId: transaction.id
        },
        { status: 402 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Atualizar transação como bem-sucedida
    await updateTransactionStatus(transaction.id, 'completed', null, paymentResult.gatewayTransactionId);
    
    // Ativar serviço para o usuário
    await activateServiceForUser(userId, serviceId, transaction.id);
    
    // Enviar confirmação por email
    await sendPaymentConfirmation(userId, {
      transactionId: transaction.id,
      serviceName: service.name,
      amount,
      currency
    });
    
    // Log de auditoria para pagamento bem-sucedido
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_SUCCESS',
          resource: 'payment',
          resourceId: transaction.id,
          details: {
            transactionId: transaction.id,
            gatewayTransactionId: paymentResult.gatewayTransactionId,
            amount,
            currency,
            paymentMethod,
            serviceId,
            serviceName: service.name,
            cardLast4: cardNumber.slice(-4),
            cardBrand: cardValidation.brand,
            ip: request.ip,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
    
    // Invalidar caches relacionados
    try {
      await CacheService.user.del(`user_transactions:${userId}`);
      await CacheService.user.del(`user_services:${userId}`);
      await CacheService.payment.del(`payment_stats:${userId}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
    
    // Log da transação
    console.info(`Payment completed: ${transaction.id} for user ${userId}`);
    
    const response = NextResponse.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      data: {
        transactionId: transaction.id,
        amount,
        currency,
        serviceName: service.name,
        status: 'completed',
        timestamp: transaction.timestamp
      }
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Payment processing error:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor'
      },
      { status: 500 }
    );
    
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * Obter ID do usuário da requisição
 * @param request Requisição HTTP
 * @returns ID do usuário ou null se não autenticado
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // TODO: Implementar verificação real de JWT
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  // Simular decodificação de JWT
  if (token.startsWith('access_')) {
    return 'user_123';
  }
  
  return null;
}

/**
 * Obter IP do cliente
 * @param request Requisição HTTP
 * @returns IP do cliente
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

/**
 * Realizar verificações de segurança
 * @param data Dados para verificação
 * @returns Resultado das verificações
 */
async function performSecurityChecks(data: {
  userId: string;
  amount: number;
  cardNumber: string;
  clientIP: string;
}): Promise<{
  passed: boolean;
  reason?: string;
}> {
  // TODO: Implementar verificações reais de segurança
  
  // Verificar se o valor não é suspeito
  if (data.amount > 10000) {
    return {
      passed: false,
      reason: 'Valor muito alto para transação'
    };
  }
  
  // Verificar se o cartão não está na lista negra
  const isBlacklisted = await checkCardBlacklist(data.cardNumber);
  if (isBlacklisted) {
    return {
      passed: false,
      reason: 'Cartão bloqueado'
    };
  }
  
  // Verificar se o IP não é suspeito
  const isSuspiciousIP = await checkSuspiciousIP(data.clientIP);
  if (isSuspiciousIP) {
    return {
      passed: false,
      reason: 'IP suspeito'
    };
  }
  
  return { passed: true };
}

/**
 * Verificar se cartão está na lista negra
 * @param cardNumber Número do cartão
 * @returns True se estiver na lista negra
 */
async function checkCardBlacklist(cardNumber: string): Promise<boolean> {
  // TODO: Implementar verificação real
  return false;
}

/**
 * Verificar se IP é suspeito
 * @param ip Endereço IP
 * @returns True se for suspeito
 */
async function checkSuspiciousIP(ip: string): Promise<boolean> {
  // TODO: Implementar verificação real
  return false;
}

/**
 * Obter serviço por ID
 * @param serviceId ID do serviço
 * @returns Dados do serviço
 */
async function getServiceById(serviceId: string): Promise<{
  id: string;
  name: string;
  price: number;
  currency: string;
} | null> {
  // TODO: Implementar busca real no banco de dados
  const mockServices = [
    {
      id: 'service_1',
      name: 'Reparo Elétrico Básico',
      price: 150.00,
      currency: 'BRL'
    },
    {
      id: 'service_2',
      name: 'Instalação de Encanamento',
      price: 300.00,
      currency: 'BRL'
    }
  ];
  
  return mockServices.find(service => service.id === serviceId) || null;
}

/**
 * Validar cartão de crédito
 * @param cardData Dados do cartão
 * @returns Resultado da validação
 */
async function validateCreditCard(cardData: {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}): Promise<{
  valid: boolean;
  brand?: string;
  reason?: string;
}> {
  // TODO: Implementar validação real de cartão
  
  // Validação básica do algoritmo de Luhn
  const isValidLuhn = validateLuhnAlgorithm(cardData.cardNumber);
  if (!isValidLuhn) {
    return {
      valid: false,
      reason: 'Número do cartão inválido'
    };
  }
  
  // Detectar bandeira do cartão
  const brand = detectCardBrand(cardData.cardNumber);
  
  // Validar data de expiração
  const isValidExpiry = validateExpiryDate(cardData.expiryDate);
  if (!isValidExpiry) {
    return {
      valid: false,
      reason: 'Data de expiração inválida'
    };
  }
  
  return {
    valid: true,
    brand
  };
}

/**
 * Validar algoritmo de Luhn
 * @param cardNumber Número do cartão
 * @returns True se válido
 */
function validateLuhnAlgorithm(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  return sum % 10 === 0;
}

/**
 * Detectar bandeira do cartão
 * @param cardNumber Número do cartão
 * @returns Bandeira do cartão
 */
function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\D/g, '');
  
  if (number.startsWith('4')) {
    return 'Visa';
  } else if (number.startsWith('5') || number.startsWith('2')) {
    return 'Mastercard';
  } else if (number.startsWith('3')) {
    return 'American Express';
  }
  
  return 'Unknown';
}

/**
 * Validar data de expiração
 * @param expiryDate Data no formato MM/YY
 * @returns True se válida
 */
function validateExpiryDate(expiryDate: string): boolean {
  const [month, year] = expiryDate.split('/').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  if (month < 1 || month > 12) {
    return false;
  }
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
}

/**
 * Criar transação
 * @param transactionData Dados da transação
 * @returns Transação criada
 */
async function createTransaction(transactionData: any): Promise<{
  id: string;
  timestamp: Date;
}> {
  // TODO: Implementar criação real no banco de dados
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.info(`Creating transaction ${transactionId}`);
  
  return {
    id: transactionId,
    timestamp: transactionData.timestamp
  };
}

/**
 * Processar pagamento com gateway
 * @param paymentData Dados do pagamento
 * @returns Resultado do processamento
 */
async function processPaymentWithGateway(paymentData: any): Promise<{
  success: boolean;
  gatewayTransactionId?: string;
  error?: string;
}> {
  // TODO: Implementar integração real com gateway de pagamento
  
  // Simular processamento
  console.info(`Processing payment for transaction ${paymentData.transactionId}`);
  
  // Simular sucesso na maioria dos casos
  const success = Math.random() > 0.1; // 90% de sucesso
  
  if (success) {
    return {
      success: true,
      gatewayTransactionId: `gw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  } else {
    return {
      success: false,
      error: 'Cartão recusado'
    };
  }
}

/**
 * Atualizar status da transação
 * @param transactionId ID da transação
 * @param status Novo status
 * @param error Erro (se houver)
 * @param gatewayTransactionId ID da transação no gateway
 */
async function updateTransactionStatus(
  transactionId: string, 
  status: string, 
  error?: string | null,
  gatewayTransactionId?: string
): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: status.toUpperCase() as any,
        processedAt: status === 'completed' ? new Date() : undefined,
        gatewayTransactionId,
        errorMessage: error
      }
    });
    
    console.info(`Transaction ${transactionId} status updated to ${status}`);
  } catch (error) {
    console.error('Failed to update transaction status:', error);
    throw new Error('Falha ao atualizar status da transação');
  }
}

/**
 * Ativar serviço para usuário
 * @param userId ID do usuário
 * @param serviceId ID do serviço
 * @param transactionId ID da transação
 */
async function activateServiceForUser(userId: string, serviceId: string, transactionId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Criar registro de serviço ativo para o usuário
    await prisma.userService.create({
      data: {
        userId,
        serviceId,
        transactionId,
        activatedAt: new Date(),
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      }
    });
    
    // Registrar atividade
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SERVICE_ACTIVATED',
        details: `Serviço ${serviceId} ativado via transação ${transactionId}`,
        ipAddress: '0.0.0.0', // TODO: Obter IP real
        userAgent: 'System'
      }
    });
    
    console.info(`Service ${serviceId} activated for user ${userId}`);
  } catch (error) {
    console.error('Failed to activate service:', error);
    throw new Error('Falha ao ativar serviço');
  }
}

/**
 * Enviar confirmação de pagamento
 * @param userId ID do usuário
 * @param paymentData Dados do pagamento
 */
async function sendPaymentConfirmation(userId: string, paymentData: any): Promise<void> {
  // TODO: Implementar envio real de email
  console.info(`Sending payment confirmation to user ${userId}`);
}

// Métodos não permitidos
export async function GET() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

export async function PUT() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
  applySecurityHeaders(response);
  return response;
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  applySecurityHeaders(response);
  return response;
}