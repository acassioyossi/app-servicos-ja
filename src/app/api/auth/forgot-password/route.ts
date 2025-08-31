import { NextRequest, NextResponse } from 'next/server';
import { forgotPasswordSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import crypto from 'crypto';

/**
 * Rate limiting para tentativas de recuperação de senha usando Redis
 */
async function checkForgotPasswordRateLimit(ip: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `forgot_password:${ip}`;
  const maxAttempts = 3;
  const windowMs = 60 * 60 * 1000; // 1 hora
  
  const current = await CacheService.rateLimit.get(key) || 0;
  
  if (current >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      reset: Date.now() + windowMs // Usar windowMs como fallback
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
 * API de recuperação de senha com validação server-side
 * POST /api/auth/forgot-password
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Aplicar rate limiting baseado em Redis
    const identifier = request.ip || 'anonymous';
    const rateLimitResult = await checkForgotPasswordRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de recuperação. Tente novamente em 1 hora.',
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
    const validation = validateData(forgotPasswordSchema, body);
    
    if (!validation.success) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: (validation as { success: false; errors: string[] }).errors
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    const { emailOrPhone } = validation.data;
    
    // Sanitizar dados de entrada
    const sanitizedInput = sanitizeText(emailOrPhone.toLowerCase().trim());
    
    // Determinar se é e-mail ou telefone
    const isEmail = sanitizedInput.includes('@');
    const isPhone = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(sanitizedInput);
    
    if (!isEmail && !isPhone) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Formato inválido',
          error: 'Deve ser um e-mail ou telefone válido'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar se usuário existe
    const user = await findUserByEmailOrPhone(sanitizedInput);
    
    // Por segurança, sempre retornar sucesso mesmo se usuário não existir
    // Isso previne enumeração de usuários
    if (user) {
      // Verificar se não há muitas tentativas recentes para este usuário
      const userResetKey = `user_reset:${user.id}`;
      const userResetCount = await CacheService.rateLimit.get(userResetKey) || 0;
      
      if (userResetCount >= 3) {
        // Log da tentativa bloqueada
        console.warn(`Password reset blocked for user: ${user.id} (too many attempts) from IP: ${request.ip}`);
      } else {
        // Incrementar contador de tentativas do usuário
        await CacheService.rateLimit.increment(userResetKey, 24 * 60 * 60); // 24 horas
        
        // Gerar token de recuperação
        const resetToken = await generateResetToken(user.id);
        
        // Enviar e-mail ou SMS de recuperação
        if (isEmail) {
          await sendPasswordResetEmail(user.email, resetToken, user.name);
        } else {
          await sendPasswordResetSMS(user.phone, resetToken, user.name);
        }
        
        // Log da tentativa de recuperação
        console.info(`Password reset requested for user: ${user.id} (${sanitizedInput}) from IP: ${request.ip}`);
      }
    } else {
      // Log da tentativa com usuário inexistente
      console.warn(`Password reset attempted for non-existent user: ${sanitizedInput} from IP: ${request.ip}`);
    }
    
    const response = NextResponse.json({
      success: true,
      message: isEmail 
        ? 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
        : 'Se o telefone estiver cadastrado, você receberá um SMS com instruções para redefinir sua senha.'
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Forgot password error:', error);
    
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
 * Buscar usuário por e-mail ou telefone
 * @param emailOrPhone E-mail ou telefone do usuário
 * @returns Dados do usuário ou null se não encontrado
 */
async function findUserByEmailOrPhone(emailOrPhone: string): Promise<{
  id: string;
  email: string;
  phone: string;
  name: string;
  isActive: boolean;
} | null> {
  try {
    // Verificar cache primeiro
    const cacheKey = `user_lookup:${emailOrPhone}`;
    const cachedUser = await CacheService.user.get(cacheKey);
    
    if (cachedUser) {
      return cachedUser;
    }
    
    // Limpar telefone removendo caracteres não numéricos
    const cleanPhone = emailOrPhone.replace(/\D/g, '');
    
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { email: emailOrPhone },
              { phone: cleanPhone },
              { phone: emailOrPhone }
            ]
          },
          { isActive: true } // Apenas usuários ativos
        ]
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        isActive: true
      }
    });
    
    // Cache por 5 minutos
    if (user) {
      await CacheService.user.set(cacheKey, user, 300);
    }
    
    return user;
  } catch (error) {
    console.error('Failed to find user by email or phone:', error);
    return null;
  }
}

/**
 * Gerar token de recuperação de senha
 * @param userId ID do usuário
 * @returns Token de recuperação
 */
async function generateResetToken(userId: string): Promise<string> {
  try {
    // Gerar token seguro usando crypto nativo
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    
    // TODO: Implementar tabela passwordResetToken no schema do Prisma
    // Invalidar tokens anteriores do usuário
    // await prisma.passwordResetToken.updateMany({
    //   where: {
    //     userId,
    //     used: false,
    //     expiresAt: {
    //       gt: new Date()
    //     }
    //   },
    //   data: {
    //     used: true
    //   }
    // });
    
    // Criar novo token (armazenar hash no banco)
    // TODO: Implementar tabela passwordResetToken no schema do Prisma
     // await prisma.passwordResetToken.create({
     //   data: {
     //     userId,
     //     token: hashedToken, // Armazenar hash, não o token original
     //     expiresAt,
     //     used: false,
     //     createdAt: new Date(),
     //     ipAddress: 'unknown' // TODO: Passar IP do request
     //   }
     // });
    
    // Cache do token para validação rápida
    const cacheKey = `reset_token:${hashedToken}`;
    await CacheService.temp.set(cacheKey, { userId, expiresAt: expiresAt.getTime() }, 3600);
    
    console.info(`Generated reset token for user ${userId} (expires in 1 hour)`);
    
    return token; // Retornar token original para envio
  } catch (error) {
    console.error('Failed to generate reset token:', error);
    throw new Error('Falha ao gerar token de recuperação');
  }
}

/**
 * Enviar e-mail de recuperação de senha
 * @param email E-mail do usuário
 * @param token Token de recuperação
 * @param userName Nome do usuário
 */
async function sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void> {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // Template de e-mail seguro
    const emailTemplate = {
      to: email,
      subject: 'Recuperação de Senha - Plataforma',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Olá, ${userName}!</h2>
          <p>Você solicitou a recuperação de sua senha. Clique no link abaixo para redefinir:</p>
          <a href="${resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Redefinir Senha</a>
          <p><strong>Este link expira em 1 hora.</strong></p>
          <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
          <hr>
          <small>Por segurança, nunca compartilhe este link com outras pessoas.</small>
        </div>
      `
    };
    
    // TODO: Implementar envio real usando serviço de e-mail
    // Exemplo: await emailService.send(emailTemplate);
    
    console.info(`Password reset email prepared for: ${email}`);
    console.info(`Reset URL: ${resetUrl}`);
    
    // Log para auditoria
    // TODO: Implementar tabela auditLog no schema do Prisma
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'PASSWORD_RESET_EMAIL_SENT',
    //     details: { email, timestamp: new Date().toISOString() },
    //     createdAt: new Date()
    //   }
    // }).catch(() => {}); // Não falhar se log não funcionar
    
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Falha ao enviar e-mail de recuperação');
  }
}

/**
 * Enviar SMS de recuperação de senha
 * @param phone Telefone do usuário
 * @param token Token de recuperação
 * @param userName Nome do usuário
 */
async function sendPasswordResetSMS(phone: string, token: string, userName: string): Promise<void> {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // Template de SMS seguro
    const smsMessage = `Olá ${userName}! Clique para redefinir sua senha: ${resetUrl} (Expira em 1h). Se não foi você, ignore.`;
    
    // TODO: Implementar envio real usando serviço de SMS
    // Exemplo: await smsService.send({ to: phone, message: smsMessage });
    
    console.info(`Password reset SMS prepared for: ${phone}`);
    console.info(`SMS message: ${smsMessage}`);
    
    // Log para auditoria
    // TODO: Implementar tabela auditLog no schema do Prisma
    // await prisma.auditLog.create({
    //   data: {
    //     action: 'PASSWORD_RESET_SMS_SENT',
    //     details: { phone, timestamp: new Date().toISOString() },
    //     createdAt: new Date()
    //   }
    // }).catch(() => {}); // Não falhar se log não funcionar
    
  } catch (error) {
    console.error('Failed to send password reset SMS:', error);
    throw new Error('Falha ao enviar SMS de recuperação');
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