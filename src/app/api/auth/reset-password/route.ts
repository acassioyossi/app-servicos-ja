import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Rate limiting para tentativas de redefinição de senha usando Redis
 */
async function checkResetPasswordRateLimit(ip: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `reset_password:${ip}`;
  const maxAttempts = 5;
  const windowMs = 60 * 60 * 1000; // 1 hora
  
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
 * API de redefinição de senha com token
 * POST /api/auth/reset-password
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Aplicar rate limiting baseado em Redis
    const identifier = request.ip || 'anonymous';
    const rateLimitResult = await checkResetPasswordRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de redefinição. Tente novamente em 1 hora.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
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
    const validation = validateData(resetPasswordSchema, body);
    
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
    
    const { token, password, confirmPassword } = validation.data;
    
    // Sanitizar dados de entrada
    const sanitizedToken = sanitizeText(token.trim());
    
    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Senhas não coincidem'
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Validar força da senha
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'Senha não atende aos critérios de segurança',
          errors: passwordValidation.errors
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Verificar e validar token
    const tokenValidation = await validateResetToken(sanitizedToken);
    
    if (!tokenValidation.isValid) {
      const response = NextResponse.json(
        {
          success: false,
          message: tokenValidation.message
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Atualizar senha do usuário
    const hashedPassword = await bcrypt.hash(password, 12);
    
    await prisma.$transaction(async (tx) => {
      // Atualizar senha
      await tx.user.update({
        where: { id: tokenValidation.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Marcar token como usado
      await tx.passwordResetToken.updateMany({
        where: {
          userId: tokenValidation.userId,
          used: false
        },
        data: { used: true }
      });
      
      // Log da redefinição de senha
      await tx.auditLog.create({
        data: {
          action: 'PASSWORD_RESET_COMPLETED',
          userId: tokenValidation.userId,
          details: {
            ip: request.ip,
            userAgent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          },
          createdAt: new Date()
        }
      }).catch(() => {}); // Não falhar se log não funcionar
    });
    
    // Invalidar cache do usuário
    await CacheService.users.invalidatePattern(`user:${tokenValidation.userId}:*`);
    
    // Invalidar token do cache
    const hashedToken = crypto.createHash('sha256').update(sanitizedToken).digest('hex');
    await CacheService.auth.delete(`reset_token:${hashedToken}`);
    
    console.info(`Password reset completed for user: ${tokenValidation.userId} from IP: ${request.ip}`);
    
    const response = NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso. Você pode fazer login com sua nova senha.'
    });
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Reset password error:', error);
    
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
 * Validar token de redefinição de senha
 * @param token Token de redefinição
 * @returns Resultado da validação
 */
async function validateResetToken(token: string): Promise<{
  isValid: boolean;
  message: string;
  userId?: string;
}> {
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Verificar cache primeiro
    const cacheKey = `reset_token:${hashedToken}`;
    const cachedToken = await CacheService.auth.get(cacheKey);
    
    if (cachedToken) {
      if (cachedToken.expiresAt < Date.now()) {
        await CacheService.auth.delete(cacheKey);
        return {
          isValid: false,
          message: 'Token expirado'
        };
      }
      
      return {
        isValid: true,
        message: 'Token válido',
        userId: cachedToken.userId
      };
    }
    
    // Verificar no banco de dados
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() }
      },
      select: {
        userId: true,
        expiresAt: true,
        createdAt: true
      }
    });
    
    if (!resetToken) {
      return {
        isValid: false,
        message: 'Token inválido ou expirado'
      };
    }
    
    // Verificar se o usuário ainda existe e está ativo
    const user = await prisma.user.findFirst({
      where: {
        id: resetToken.userId,
        active: true
      },
      select: { id: true }
    });
    
    if (!user) {
      return {
        isValid: false,
        message: 'Usuário não encontrado ou inativo'
      };
    }
    
    return {
      isValid: true,
      message: 'Token válido',
      userId: resetToken.userId
    };
    
  } catch (error) {
    console.error('Failed to validate reset token:', error);
    return {
      isValid: false,
      message: 'Erro ao validar token'
    };
  }
}

/**
 * Validar força da senha
 * @param password Senha a ser validada
 * @returns Resultado da validação
 */
function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  // Verificar senhas comuns
  const commonPasswords = [
    '12345678', 'password', '123456789', 'qwerty', 'abc123',
    'password123', '123123123', 'admin', 'letmein', 'welcome'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Senha muito comum, escolha uma senha mais segura');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
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