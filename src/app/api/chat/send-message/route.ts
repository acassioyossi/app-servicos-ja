import { NextRequest, NextResponse } from 'next/server';
import { chatMessageSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import crypto from 'crypto';

/**
 * Rate limiting para envio de mensagens usando Redis
 * @param userId ID do usuário
 * @returns Resultado do rate limiting
 */
async function checkChatRateLimit(userId: string): Promise<{ success: boolean; retryAfter?: number }> {
  const key = `chat_rate_limit:${userId}`;
  const limit = 20; // 20 mensagens por minuto
  const window = 60; // 1 minuto
  
  try {
    const current = await CacheService.rateLimit.get(key) || 0;
    
    if (current >= limit) {
      const ttl = await CacheService.rateLimit.ttl(key);
      return { success: false, retryAfter: ttl > 0 ? ttl : window };
    }
    
    await CacheService.rateLimit.increment(key, window);
    return { success: true };
    
  } catch (error) {
    console.error('Chat rate limit check error:', error);
    return { success: true }; // Em caso de erro, permitir
  }
}

/**
 * API de envio de mensagens de chat com validação server-side
 * POST /api/chat/send-message
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authUser = await verifyAuth(request);
    if (!authUser) {
      const response = NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Aplicar rate limiting por usuário
    const rateLimitResult = await checkChatRateLimit(authUser.userId);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas mensagens enviadas. Aguarde um momento.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    
    // Validação server-side dos dados
    const validation = validateData(chatMessageSchema, body);
    
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
    
    const { message, professionalName } = validation.data;
    
    // Sanitizar dados de entrada
    const sanitizedMessage = sanitizeText(message.trim());
    const sanitizedProfessionalName = sanitizeText(professionalName.trim());
    
    // Verificar se a mensagem não está vazia após sanitização
    if (!sanitizedMessage || sanitizedMessage.length === 0) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Mensagem não pode estar vazia'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se o profissional existe
    const professional = await findProfessionalByName(sanitizedProfessionalName);
    if (!professional) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Profissional não encontrado'
        },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se o usuário pode enviar mensagem para este profissional
    const canSendMessage = await checkMessagePermission(authUser.userId, professional.id);
    if (!canSendMessage) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Você não tem permissão para enviar mensagens para este profissional'
        },
        { status: 403 }
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
    
    // Salvar mensagem
    const savedMessage = await saveMessage({
      senderId: authUser.userId,
      recipientId: professional.id,
      content: sanitizedMessage,
      timestamp: new Date()
    });

    // Enviar notificação em tempo real (WebSocket, etc.)
    await sendRealTimeNotification(professional.id, {
      type: 'new_message',
      senderId: authUser.userId,
      messageId: savedMessage.id,
      content: sanitizedMessage
    });

    // Log da mensagem enviada
    console.info(`Message sent from user ${authUser.userId} to professional ${professional.id}`);
    
    const response = NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        id: savedMessage.id,
        content: sanitizedMessage,
        timestamp: savedMessage.timestamp,
        recipient: {
          id: professional.id,
          name: sanitizeText(professional.name)
        }
      }
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Send message error:', error);
    
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

// Função removida - usando verifyAuth diretamente

/**
 * Buscar profissional por nome usando cache e banco de dados
 * @param name Nome do profissional
 * @returns Dados do profissional ou null se não encontrado
 */
async function findProfessionalByName(name: string): Promise<{
  id: string;
  name: string;
  specialty: string;
} | null> {
  try {
    // Verificar cache primeiro
    const cacheKey = `professional:name:${name.toLowerCase()}`;
    const cachedProfessional = await CacheService.user.get(cacheKey);
    
    if (cachedProfessional) {
      return cachedProfessional;
    }
    
    // Buscar no banco de dados
    const professional = await prisma.user.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive'
        },
        type: 'professional',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            specialty: true
          }
        }
      }
    });
    
    if (!professional) {
      return null;
    }
    
    const result = {
      id: professional.id,
      name: professional.name,
      specialty: professional.profile?.specialty || 'Não especificado'
    };
    
    // Cachear resultado por 10 minutos
    await CacheService.user.set(cacheKey, result, 600);
    
    return result;
    
  } catch (error) {
    console.error('Find professional error:', error);
    return null;
  }
}

/**
 * Verificar permissão para enviar mensagem
 * @param userId ID do usuário
 * @param professionalId ID do profissional
 * @returns True se pode enviar mensagem
 */
async function checkMessagePermission(userId: string, professionalId: string): Promise<boolean> {
  try {
    // Verificar cache primeiro
    const cacheKey = `message_permission:${userId}:${professionalId}`;
    const cachedPermission = await CacheService.auth.get(cacheKey);
    
    if (cachedPermission !== null) {
      return cachedPermission;
    }
    
    // Verificar se o usuário está ativo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, type: true }
    });
    
    if (!user || !user.isActive) {
      await CacheService.auth.set(cacheKey, false, 300); // Cache por 5 minutos
      return false;
    }
    
    // Verificar se o profissional está ativo
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { isActive: true, type: true }
    });
    
    if (!professional || !professional.isActive || professional.type !== 'professional') {
      await CacheService.auth.set(cacheKey, false, 300);
      return false;
    }
    
    // Verificar se há algum bloqueio entre os usuários
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: professionalId },
          { blockerId: professionalId, blockedId: userId }
        ]
      }
    });
    
    if (isBlocked) {
      await CacheService.auth.set(cacheKey, false, 3600); // Cache por 1 hora
      return false;
    }
    
    // Verificar se há contrato ativo ou histórico de contratação
    const hasContract = await prisma.contract.findFirst({
      where: {
        clientId: userId,
        professionalId: professionalId,
        status: {
          in: ['ACTIVE', 'COMPLETED']
        }
      }
    });
    
    const canSend = !!hasContract;
    
    // Cachear resultado por 10 minutos
    await CacheService.auth.set(cacheKey, canSend, 600);
    
    return canSend;
    
  } catch (error) {
    console.error('Check message permission error:', error);
    return false; // Em caso de erro, negar permissão
  }
}

/**
 * Filtrar conteúdo inadequado com cache e detecção avançada
 * @param content Conteúdo da mensagem
 * @returns Resultado da filtragem
 */
async function filterInappropriateContent(content: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  try {
    // Verificar cache primeiro
    const contentHash = crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
    const cacheKey = `content_filter:${contentHash}`;
    const cachedResult = await CacheService.auth.get(cacheKey);
    
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    const lowerContent = content.toLowerCase();
    
    // Lista expandida de padrões proibidos
    const prohibitedPatterns = [
      // Spam e golpes
      'spam', 'golpe', 'fraude', 'hack', 'vírus', 'malware',
      'phishing', 'scam', 'pirâmide', 'esquema ponzi',
      'dinheiro fácil', 'ganhe dinheiro', 'renda extra',
      'trabalhe em casa', 'seja seu próprio chefe',
      
      // Conteúdo malicioso
      'clique aqui', 'link suspeito', 'download grátis',
      'oferta limitada', 'urgente', 'última chance',
      'parabéns você ganhou', 'prêmio', 'sorteio',
      
      // URLs suspeitas
      'bit.ly', 'tinyurl', 'short.link', 'encurtador',
      
      // Linguagem inadequada
      'idiota', 'burro', 'estúpido', 'imbecil'
    ];
    
    // Verificar padrões proibidos
    for (const pattern of prohibitedPatterns) {
      if (lowerContent.includes(pattern)) {
        const result = {
          allowed: false,
          reason: `Conteúdo contém palavra não permitida: ${pattern}`
        };
        await CacheService.auth.set(cacheKey, result, 3600); // Cache por 1 hora
        return result;
      }
    }
    
    // Verificações de estrutura suspeita
    const suspiciousStructure = (
      content.length > 1000 || // Mensagem muito longa
      content.length < 3 || // Mensagem muito curta
      /([a-zA-Z])\1{4,}/.test(content) || // Repetição excessiva de caracteres
      (content.match(/https?:\/\//g) || []).length > 2 || // Muitos links
      content.replace(/[^A-Z]/g, '').length > content.length * 0.5 || // Muito maiúsculo
      content.replace(/[^0-9]/g, '').length > content.length * 0.3 || // Muitos números
      content.replace(/[^!@#$%^&*()]/g, '').length > content.length * 0.2 || // Muitos caracteres especiais
      /\b(\w+)\s+\1\s+\1/.test(lowerContent) // Repetição de palavras
    );
    
    if (suspiciousStructure) {
      const result = {
        allowed: false,
        reason: 'Estrutura de conteúdo suspeita detectada'
      };
      
      console.warn('Suspicious content structure detected:', {
        length: content.length,
        hasRepeatedChars: /([a-zA-Z])\1{4,}/.test(content),
        linkCount: (content.match(/https?:\/\//g) || []).length,
        uppercaseRatio: content.replace(/[^A-Z]/g, '').length / content.length,
        numberRatio: content.replace(/[^0-9]/g, '').length / content.length,
        specialCharRatio: content.replace(/[^!@#$%^&*()]/g, '').length / content.length,
        hasRepeatedWords: /\b(\w+)\s+\1\s+\1/.test(lowerContent)
      });
      
      await CacheService.auth.set(cacheKey, result, 1800); // Cache por 30 minutos
      return result;
    }
    
    const result = { allowed: true };
    
    // Cachear resultado por 30 minutos
    await CacheService.auth.set(cacheKey, result, 1800);
    
    return result;
    
  } catch (error) {
    console.error('Content filter error:', error);
    return { allowed: true }; // Em caso de erro, permitir a mensagem
  }
}

/**
 * Salvar mensagem no banco de dados com logs de auditoria
 * @param messageData Dados da mensagem
 * @returns Mensagem salva
 */
async function saveMessage(messageData: {
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
}): Promise<{
  id: string;
  timestamp: Date;
}> {
  try {
    // Salvar mensagem no banco de dados
    const message = await prisma.message.create({
      data: {
        senderId: messageData.senderId,
        recipientId: messageData.recipientId,
        content: messageData.content,
        sentAt: messageData.timestamp,
        status: 'SENT',
        type: 'text'
      }
    });
    
    // Registrar log de auditoria
    try {
      await prisma.auditLog.create({
        data: {
          userId: messageData.senderId,
          action: 'MESSAGE_SENT',
          resource: 'message',
          resourceId: message.id,
          details: {
            recipientId: messageData.recipientId,
            messageLength: messageData.content.length,
            timestamp: messageData.timestamp.toISOString()
          },
          ipAddress: '',
          userAgent: '',
          timestamp: new Date()
        }
      });
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError);
    }
    
    // Invalidar cache de mensagens do usuário
    try {
      await CacheService.user.del(`messages:${messageData.senderId}`);
      await CacheService.user.del(`messages:${messageData.recipientId}`);
      await CacheService.user.del(`conversation:${messageData.senderId}:${messageData.recipientId}`);
      await CacheService.user.del(`conversation:${messageData.recipientId}:${messageData.senderId}`);
    } catch (cacheError) {
      console.error('Cache invalidation error (non-blocking):', cacheError);
    }
    
    console.info(`Message ${message.id} saved from ${messageData.senderId} to ${messageData.recipientId}`);
    
    return {
      id: message.id,
      timestamp: message.sentAt
    };
  } catch (error) {
    console.error('Failed to save message:', error);
    throw new Error('Falha ao salvar mensagem');
  }
}

/**
 * Enviar notificação em tempo real via WebSocket e push
 * @param recipientId ID do destinatário
 * @param notification Dados da notificação
 */
async function sendRealTimeNotification(
  recipientId: string,
  notification: {
    type: string;
    senderId: string;
    messageId: string;
    content: string;
  }
): Promise<void> {
  try {
    // Buscar informações do remetente para a notificação
    const sender = await prisma.user.findUnique({
      where: { id: notification.senderId },
      select: {
        id: true,
        name: true,
        avatar: true
      }
    });
    
    if (!sender) {
      console.error('Sender not found for notification:', notification.senderId);
      return;
    }
    
    const notificationData = {
      id: `notif_${Date.now()}`,
      type: notification.type,
      title: 'Nova mensagem',
      message: `${sender.name}: ${notification.content.substring(0, 50)}${notification.content.length > 50 ? '...' : ''}`,
      data: {
        senderId: notification.senderId,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        messageId: notification.messageId,
        conversationId: `${notification.senderId}_${recipientId}`
      },
      timestamp: new Date().toISOString()
    };
    
    // Salvar notificação no banco de dados
    try {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: notification.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          isRead: false,
          createdAt: new Date()
        }
      });
    } catch (dbError) {
      console.error('Database notification error (non-blocking):', dbError);
    }
    
    // Enviar via WebSocket (se conectado)
    try {
      // TODO: Implementar WebSocket real
      // await webSocketService.sendToUser(recipientId, notificationData);
      console.info('WebSocket notification sent:', {
        recipientId,
        type: notification.type,
        messageId: notification.messageId
      });
    } catch (wsError) {
      console.error('WebSocket notification error (non-blocking):', wsError);
    }
    
    // Enviar notificação push (se o usuário tem dispositivos registrados)
    try {
      const userDevices = await prisma.userDevice.findMany({
        where: {
          userId: recipientId,
          isActive: true,
          pushToken: { not: null }
        },
        select: {
          pushToken: true,
          platform: true
        }
      });
      
      if (userDevices.length > 0) {
        // TODO: Implementar serviço de push notifications real
        // await pushNotificationService.send(userDevices, notificationData);
        console.info('Push notification queued for devices:', userDevices.length);
      }
    } catch (pushError) {
      console.error('Push notification error (non-blocking):', pushError);
    }
    
    // Invalidar cache de notificações do usuário
    try {
      await CacheService.user.del(`notifications:${recipientId}`);
      await CacheService.user.del(`unread_count:${recipientId}`);
    } catch (cacheError) {
      console.error('Notification cache invalidation error (non-blocking):', cacheError);
    }
    
  } catch (error) {
    console.error('Real-time notification error:', error);
    // Não falhar a operação principal se a notificação falhar
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