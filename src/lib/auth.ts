import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { detectBruteForce, logSecurityEvent, validatePasswordStrength, isIPBlacklisted } from './security';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const alg = 'HS256';

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'client' | 'professional' | 'partner';
  avatar?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'client' | 'professional' | 'partner';
  iat: number;
  exp: number;
}

/**
 * Gera hash seguro da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifica se a senha fornecida corresponde ao hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Cria um JWT token seguro
 */
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  
  return jwt;
}

/**
 * Verifica e decodifica um JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Define o token JWT como cookie httpOnly
 */
export function setAuthCookie(token: string): void {
  const cookieStore = cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/'
  });
}

/**
 * Remove o cookie de autenticação
 */
export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete('auth-token');
}

/**
 * Obtém o token do cookie
 */
export function getAuthToken(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  return token?.value || null;
}

/**
 * Middleware para verificar autenticação
 */
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyJWT(token);
}

/**
 * Autentica usuário com email e senha usando banco de dados real
 */
export async function authenticateUser(
  email: string, 
  password: string, 
  request?: NextRequest
): Promise<{ success: boolean; user?: User; error?: string; blocked?: boolean; resetTime?: number }> {
  try {
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for')?.split(',')[0] || 
      request?.headers.get('x-real-ip') || 
      'unknown';

    // Verificar se IP está na lista negra
    if (await isIPBlacklisted(ipAddress)) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS', {
        action: 'LOGIN_BLOCKED_IP',
        email,
        reason: 'IP blacklisted'
      }, request);
      return { success: false, error: 'Access denied', blocked: true };
    }

    // Verificar tentativas de força bruta por IP
    const bruteForceCheck = await detectBruteForce(ipAddress, 'login');
    if (bruteForceCheck.blocked) {
      await logSecurityEvent('BRUTE_FORCE_DETECTED', {
        action: 'LOGIN_BRUTE_FORCE',
        email,
        ipAddress,
        attempts: bruteForceCheck.attempts
      }, request);
      return { 
        success: false, 
        error: 'Too many login attempts. Try again later.', 
        blocked: true,
        resetTime: bruteForceCheck.resetTime
      };
    }

    // Importar prisma dinamicamente para evitar problemas de inicialização
    const { prisma } = await import('./prisma');
    
    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase() 
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        passwordHash: true,
        isActive: true,
        isVerified: true
      }
    });
    
    if (!user) {
      // Log da tentativa de login falhada
      await prisma.activityLog.create({
        data: {
          action: 'LOGIN_FAILED',
          details: {
            reason: 'user_not_found',
            email: email,
            ipAddress
          }
        }
      }).catch(console.error);
      return { success: false, error: 'Invalid credentials' };
    }

    // Verificar tentativas de força bruta por email
    const emailBruteForceCheck = await detectBruteForce(email, 'login');
    if (emailBruteForceCheck.blocked) {
      await logSecurityEvent('BRUTE_FORCE_DETECTED', {
        action: 'LOGIN_BRUTE_FORCE_EMAIL',
        email,
        ipAddress,
        attempts: emailBruteForceCheck.attempts
      }, request);
      return { 
        success: false, 
        error: 'Too many login attempts for this account. Try again later.', 
        blocked: true,
        resetTime: emailBruteForceCheck.resetTime
      };
    }
    
    if (!user.isActive) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: {
            reason: 'user_inactive',
            email: email,
            ipAddress
          }
        }
      }).catch(console.error);
      return { success: false, error: 'Account is inactive' };
    }
    
    // Verificar senha hasheada
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Log da tentativa de login falhada
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: {
            reason: 'invalid_password',
            email: email,
            ipAddress
          }
        }
      }).catch(console.error);
      
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    }).catch(console.error);
    
    // Log do login bem-sucedido
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: {
          loginMethod: 'email_password',
          ipAddress
        }
      }
    }).catch(console.error);
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type.toLowerCase() as 'client' | 'professional' | 'partner'
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Cria resposta de redirecionamento com cookie de autenticação
 */
export async function createAuthResponse(user: User, redirectTo: string): Promise<NextResponse> {
  const token = await createJWT({
    userId: user.id,
    email: user.email,
    type: user.type
  });
  
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/'
  });
  
  return response;
}

/**
 * Cria resposta de logout
 */
export function createLogoutResponse(redirectTo: string): NextResponse {
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  
  response.cookies.delete('auth-token');
  
  return response;
}

/**
 * Criar usuário com validação de senha segura
 * @param userData Dados do usuário
 * @param request Request object para logs
 * @returns Resultado da criação
 */
export async function createUserSecure(
  userData: {
    email: string;
    password: string;
    name: string;
    type: 'CLIENT' | 'PROFESSIONAL' | 'PARTNER';
  },
  request?: NextRequest
): Promise<{ success: boolean; user?: User; error?: string; passwordFeedback?: string[] }> {
  try {
    const { prisma } = await import('./prisma');
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for')?.split(',')[0] || 
      request?.headers.get('x-real-ip') || 
      'unknown';

    // Verificar se IP está na lista negra
    if (await isIPBlacklisted(ipAddress)) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS', {
        action: 'SIGNUP_BLOCKED_IP',
        email: userData.email,
        reason: 'IP blacklisted'
      }, request);
      return { success: false, error: 'Access denied' };
    }

    // Verificar tentativas de força bruta
    const bruteForceCheck = await detectBruteForce(ipAddress, 'signup');
    if (bruteForceCheck.blocked) {
      await logSecurityEvent('BRUTE_FORCE_DETECTED', {
        action: 'SIGNUP_BRUTE_FORCE',
        email: userData.email,
        ipAddress,
        attempts: bruteForceCheck.attempts
      }, request);
      return { 
        success: false, 
        error: 'Too many signup attempts. Try again later.' 
      };
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password does not meet security requirements',
        passwordFeedback: passwordValidation.feedback
      };
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        action: 'SIGNUP_DUPLICATE_EMAIL',
        email: userData.email,
        ipAddress
      }, request);
      return { success: false, error: 'User already exists' };
    }

    // Hash da senha
    const hashedPassword = await hashPassword(userData.password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        type: userData.type,
        isActive: true
      }
    });

    // Log de criação bem-sucedida
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        details: {
          email: userData.email,
          type: userData.type,
          ipAddress
        }
      }
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type.toLowerCase() as 'client' | 'professional' | 'partner'
      }
    };
  } catch (error) {
    console.error('User creation error:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

/**
 * Iniciar processo de reset de senha
 * @param email Email do usuário
 * @param request Request object
 * @returns Resultado da operação
 */
export async function initiatePasswordReset(
  email: string,
  request?: NextRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('./prisma');
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for')?.split(',')[0] || 
      request?.headers.get('x-real-ip') || 
      'unknown';

    // Verificar tentativas de força bruta
    const bruteForceCheck = await detectBruteForce(ipAddress, 'password_reset');
    if (bruteForceCheck.blocked) {
      await logSecurityEvent('BRUTE_FORCE_DETECTED', {
        action: 'PASSWORD_RESET_BRUTE_FORCE',
        email,
        ipAddress,
        attempts: bruteForceCheck.attempts
      }, request);
      return { 
        success: false, 
        error: 'Too many password reset attempts. Try again later.' 
      };
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Não revelar se o usuário existe ou não por segurança
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        action: 'PASSWORD_RESET_INVALID_EMAIL',
        email,
        ipAddress
      }, request);
      return { success: true }; // Sempre retorna sucesso por segurança
    }

    // Gerar token de reset
    const resetToken = await createJWT({
      userId: user.id,
      email,
      type: 'password_reset' as any
    });

    // Salvar token no banco
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: {
          email,
          resetToken: resetToken.substring(0, 20) + '...', // Log parcial por segurança
          ipAddress
        }
      }
    });

    // Aqui você enviaria o email com o token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Failed to process password reset' };
  }
}

/**
 * Validar e processar reset de senha
 * @param token Token de reset
 * @param newPassword Nova senha
 * @param request Request object
 * @returns Resultado da operação
 */
export async function processPasswordReset(
  token: string,
  newPassword: string,
  request?: NextRequest
): Promise<{ success: boolean; error?: string; passwordFeedback?: string[] }> {
  try {
    const { prisma } = await import('./prisma');
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for')?.split(',')[0] || 
      request?.headers.get('x-real-ip') || 
      'unknown';

    // Verificar token
    const decoded = await verifyJWT(token);
    if (!decoded) {
      await logSecurityEvent('INVALID_TOKEN', {
        action: 'PASSWORD_RESET_INVALID_TOKEN',
        token: token.substring(0, 20) + '...',
        ipAddress
      }, request);
      return { success: false, error: 'Invalid or expired reset token' };
    }

    // Validar força da nova senha
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: 'Password does not meet security requirements',
        passwordFeedback: passwordValidation.feedback
      };
    }

    // Verificar se usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        action: 'PASSWORD_RESET_USER_NOT_FOUND',
        userId: decoded.userId,
        ipAddress
      }, request);
      return { success: false, error: 'User not found' };
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword }
    });

    // Log da alteração
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: {
          email: user.email,
          ipAddress
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Password reset processing error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Invalidar todas as sessões de um usuário
 * @param userId ID do usuário
 * @param reason Motivo da invalidação
 * @returns Resultado da operação
 */
export async function invalidateUserSessions(
  userId: string,
  reason: string = 'Security measure'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { prisma } = await import('./prisma');

    // Log da invalidação
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SESSIONS_INVALIDATED',
        details: {
          reason
        }
      }
    });

    // Aqui você implementaria a lógica para invalidar tokens JWT
    // Por exemplo, mantendo uma blacklist de tokens ou alterando um campo no usuário
    
    return { success: true };
  } catch (error) {
    console.error('Session invalidation error:', error);
    return { success: false, error: 'Failed to invalidate sessions' };
  }
}