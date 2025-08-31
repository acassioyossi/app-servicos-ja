import { NextRequest, NextResponse } from 'next/server';
import { supportMessageSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import { verifyAuth } from '@/lib/auth';

/**
 * Rate limiting para mensagens de suporte usando Redis
 */
async function checkSupportRateLimit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `support_message:${identifier}`;
  const maxAttempts = 3;
  const windowMs = 5 * 60 * 1000; // 5 minutos
  
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
}

/**
 * API de envio de mensagens de suporte com validação server-side
 * POST /api/support/send-message
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Verificar autenticação (opcional para suporte)
    const authResult = await verifyAuth(request);
    const userId = authResult.user?.id;
    
    // Aplicar rate limiting baseado em usuário ou IP
    const identifier = userId || request.ip || 'anonymous';
    const rateLimitResult = await checkSupportRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas mensagens de suporte enviadas. Aguarde 5 minutos.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    
    // Validação server-side dos dados
    const validation = validateData(supportMessageSchema, body);
    
    if (!validation.success) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: validation.errors
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    const { name, email, subject, message, priority } = validation.data;
    
    // Sanitizar dados de entrada
    const sanitizedName = sanitizeText(name.trim());
    const sanitizedEmail = sanitizeText(email.trim());
    const sanitizedSubject = sanitizeText(subject.trim());
    const sanitizedMessage = sanitizeText(message.trim());
    
    // Verificar se os campos obrigatórios não estão vazios após sanitização
    if (!sanitizedName || !sanitizedEmail || !sanitizedSubject || !sanitizedMessage) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Todos os campos são obrigatórios'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Formato de email inválido'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Filtrar conteúdo inadequado
    const contentFilter = await filterInappropriateContent(sanitizedMessage);
    if (!contentFilter.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Mensagem contém conteúdo inadequado',
          reason: contentFilter.reason
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se não é spam (múltiplas mensagens idênticas)
    const isSpam = await checkForSpam(sanitizedEmail, sanitizedMessage);
    if (isSpam) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Mensagem detectada como spam'
        },
        { status: 429 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Salvar mensagem de suporte
    const savedMessage = await saveSupportMessage({
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      priority: priority || 'medium',
      userId: userId || null,
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date()
    });
    
    // Enviar notificação para equipe de suporte (assíncrono)
    notifySupportTeam({
      ticketId: savedMessage.id,
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      priority: priority || 'medium'
    }).catch(error => {
      console.error('Failed to notify support team:', error);
    });
    
    // Enviar email de confirmação para o usuário (assíncrono)
    sendConfirmationEmail(sanitizedEmail, {
      name: sanitizedName,
      ticketId: savedMessage.id,
      subject: sanitizedSubject
    }).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });
    
    // Log da mensagem de suporte
    console.info(`Support message created: ${savedMessage.id} from ${sanitizedEmail}`);
    
    const response = NextResponse.json({
      success: true,
      message: 'Mensagem de suporte enviada com sucesso',
      data: {
        ticketId: savedMessage.id,
        estimatedResponse: '24 horas',
        priority: priority || 'medium'
      }
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Support message error:', error);
    
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

// Função removida - usando request.ip diretamente

/**
 * Filtrar conteúdo inadequado usando múltiplas verificações
 * @param content Conteúdo da mensagem
 * @returns Resultado da filtragem
 */
async function filterInappropriateContent(content: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    const lowerContent = content.toLowerCase().trim();
    
    // Lista expandida de padrões proibidos
    const bannedPatterns = [
      // Spam e golpes em português
      { pattern: /\b(spam|golpe|fraude|hack|vírus|phishing)\b/i, reason: 'Conteúdo suspeito detectado' },
      { pattern: /\b(clique aqui|urgente|aja agora|tempo limitado)\b/i, reason: 'Padrão de spam detectado' },
      { pattern: /\b(ganhe dinheiro|fique rico|dinheiro fácil)\b/i, reason: 'Conteúdo promocional suspeito' },
      
      // Conteúdo malicioso
      { pattern: /\b(malware|trojan|keylogger|crack|pirate)\b/i, reason: 'Conteúdo malicioso detectado' },
      { pattern: /\b(illegal|ilegal|crime|criminoso)\b/i, reason: 'Conteúdo ilegal detectado' },
      
      // URLs suspeitas
      { pattern: /\b(bit\.ly|tinyurl|t\.co)\b/i, reason: 'URL encurtada suspeita' },
      { pattern: /\b[a-z0-9-]+\.(tk|ml|ga|cf)\b/i, reason: 'Domínio suspeito detectado' },
      
      // Linguagem ofensiva básica
      { pattern: /\b(ódio|ofensivo|abusivo)\b/i, reason: 'Linguagem inadequada' }
    ];
    
    // Verificar padrões proibidos
    for (const { pattern, reason } of bannedPatterns) {
      if (pattern.test(content)) {
        console.warn('Inappropriate content detected:', pattern.source);
        return {
          allowed: false,
          reason
        };
      }
    }
    
    // Verificações de estrutura suspeita
    
    // Mensagem muito curta (possível spam)
    if (content.length < 10) {
      return {
        allowed: false,
        reason: 'Mensagem muito curta'
      };
    }
    
    // Mensagem muito longa (possível spam)
    if (content.length > 5000) {
      console.warn('Message too long:', content.length);
      return {
        allowed: false,
        reason: 'Mensagem muito longa'
      };
    }
    
    // Muita repetição de caracteres (spam)
    if (/(.)\1{10,}/.test(content)) {
      console.warn('Excessive character repetition detected');
      return {
        allowed: false,
        reason: 'Repetição excessiva de caracteres'
      };
    }
    
    // Muitos links (possível spam)
    const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 3) {
      console.warn('Too many URLs detected:', urlCount);
      return {
        allowed: false,
        reason: 'Muitos links detectados'
      };
    }
    
    // Muitas maiúsculas (possível spam/grito)
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.7 && content.length > 50) {
      console.warn('Excessive uppercase detected:', upperCaseRatio);
      return {
        allowed: false,
        reason: 'Uso excessivo de maiúsculas'
      };
    }
    
    // Muitos números (possível spam de telefone/código)
    const numberRatio = (content.match(/[0-9]/g) || []).length / content.length;
    if (numberRatio > 0.5 && content.length > 20) {
      console.warn('Excessive numbers detected:', numberRatio);
      return {
        allowed: false,
        reason: 'Muitos números detectados'
      };
    }
    
    // Verificar caracteres especiais excessivos
    const specialCharRatio = (content.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) {
      console.warn('Excessive special characters detected:', specialCharRatio);
      return {
        allowed: false,
        reason: 'Caracteres especiais excessivos'
      };
    }
    
    // Verificar se a mensagem tem muitas repetições de palavras
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      return {
        allowed: false,
        reason: 'Mensagem com muitas repetições'
      };
    }
    
    return { allowed: true };
    
  } catch (error) {
    console.error('Content filter error:', error);
    return { allowed: true }; // Em caso de erro, não bloquear
  }
}

/**
 * Verificar se é spam usando Redis cache
 * @param email Email do remetente
 * @param message Conteúdo da mensagem
 * @returns True se for spam
 */
async function checkForSpam(email: string, message: string): Promise<boolean> {
  try {
    const messageHash = crypto.createHash('md5').update(message.toLowerCase().trim()).digest('hex');
    const emailKey = `spam_check:${email}`;
    
    // Verificar mensagens recentes do mesmo email
    const recentMessages = await CacheService.support.get(emailKey) || [];
    
    // Se a mesma mensagem foi enviada recentemente
    if (recentMessages.includes(messageHash)) {
      return true;
    }
    
    // Adicionar hash da mensagem atual ao cache
    const updatedMessages = [...recentMessages, messageHash].slice(-5); // Manter apenas as 5 mais recentes
    await CacheService.support.set(emailKey, updatedMessages, 60 * 60); // Cache por 1 hora
    
    // Verificar se há muitas mensagens do mesmo email em pouco tempo
    const emailCountKey = `email_count:${email}`;
    const emailCount = await CacheService.rateLimit.get(emailCountKey) || 0;
    
    if (emailCount >= 5) {
      return true; // Mais de 5 mensagens na última hora = spam
    }
    
    await CacheService.rateLimit.increment(emailCountKey, 60 * 60); // Incrementar contador por 1 hora
    
    return false;
  } catch (error) {
    console.error('Spam check error:', error);
    return false; // Em caso de erro, não bloquear
  }
}

/**
 * Salvar mensagem de suporte
 * @param messageData Dados da mensagem
 * @returns Mensagem salva
 */
async function saveSupportMessage(messageData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: string;
  userId: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}): Promise<{
  id: string;
  timestamp: Date;
}> {
  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        name: messageData.name,
        email: messageData.email,
        subject: messageData.subject,
        message: messageData.message,
        priority: messageData.priority.toUpperCase() as any,
        status: 'OPEN',
        userId: messageData.userId,
        ipAddress: messageData.ipAddress,
        userAgent: messageData.userAgent,
        createdAt: messageData.timestamp,
        updatedAt: messageData.timestamp
      }
    });
    
    // Log para auditoria
    await prisma.auditLog.create({
      data: {
        action: 'SUPPORT_TICKET_CREATED',
        userId: messageData.userId,
        details: {
          ticketId: ticket.id,
          email: messageData.email,
          subject: messageData.subject,
          priority: messageData.priority,
          ip: messageData.ipAddress
        },
        createdAt: new Date()
      }
    }).catch(() => {}); // Não falhar se log não funcionar
    
    console.info(`Support ticket ${ticket.id} saved from ${messageData.email}`);
    
    return {
      id: ticket.id,
      timestamp: ticket.createdAt
    };
  } catch (error) {
    console.error('Failed to save support ticket:', error);
    throw new Error('Falha ao salvar ticket de suporte');
  }
}

/**
 * Notificar equipe de suporte
 * @param ticketData Dados do ticket
 */
async function notifySupportTeam(ticketData: {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  priority: string;
}): Promise<void> {
  try {
    // Template de notificação para equipe
    const notificationData = {
      ticketId: ticketData.ticketId,
      from: `${ticketData.name} <${ticketData.email}>`,
      subject: ticketData.subject,
      priority: ticketData.priority,
      timestamp: new Date().toISOString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/support/${ticketData.ticketId}`
    };
    
    // TODO: Implementar notificação real
    // Exemplos:
    // - Email para equipe de suporte
    // - Webhook para Slack/Discord
    // - Push notification para app mobile da equipe
    // - SMS para casos de alta prioridade
    
    console.info(`Support team notification prepared for ticket ${ticketData.ticketId}`);
    console.info('Notification data:', notificationData);
    
    // Notificação especial para alta prioridade
    if (ticketData.priority === 'high') {
      console.warn('🚨 HIGH PRIORITY SUPPORT TICKET - Immediate attention required!');
      // TODO: Enviar notificação urgente (SMS, call, etc.)
    }
    
  } catch (error) {
    console.error('Failed to notify support team:', error);
    // Não propagar erro para não afetar o fluxo principal
  }
}

/**
 * Enviar email de confirmação
 * @param email Email do usuário
 * @param ticketData Dados do ticket
 */
async function sendConfirmationEmail(email: string, ticketData: {
  name: string;
  ticketId: string;
  subject: string;
}): Promise<void> {
  try {
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/support/track/${ticketData.ticketId}`;
    
    // Template de email profissional
    const emailTemplate = {
      to: email,
      subject: `Confirmação de Ticket de Suporte #${ticketData.ticketId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">Ticket de Suporte Criado</h2>
          </div>
          
          <p>Olá <strong>${ticketData.name}</strong>,</p>
          
          <p>Recebemos sua mensagem de suporte e criamos um ticket para acompanhamento:</p>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Número do Ticket:</strong> #${ticketData.ticketId}</p>
            <p><strong>Assunto:</strong> ${ticketData.subject}</p>
            <p><strong>Status:</strong> Aberto</p>
          </div>
          
          <p>Nossa equipe de suporte analisará sua solicitação e responderá em até <strong>24 horas</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Acompanhar Ticket</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #6c757d;">
            Se você não solicitou este suporte, pode ignorar este e-mail.<br>
            Para respostas rápidas, sempre mencione o número do ticket: <strong>#${ticketData.ticketId}</strong>
          </p>
          
          <p style="font-size: 14px; color: #6c757d;">
            Atenciosamente,<br>
            <strong>Equipe de Suporte</strong>
          </p>
        </div>
      `
    };
    
    // TODO: Implementar envio real usando serviço de email
    // Exemplo: await emailService.send(emailTemplate);
    
    console.info(`Confirmation email prepared for ${email} - ticket ${ticketData.ticketId}`);
    console.info(`Tracking URL: ${trackingUrl}`);
    
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Não propagar erro para não afetar o fluxo principal
  }
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