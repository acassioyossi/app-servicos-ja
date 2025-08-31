/**
 * Authentication Service
 * Handles user authentication, token generation, and session management
 */

import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserType } from '@prisma/client';
import { CacheService } from './cache-service';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: UserType;
  isVerified: boolean;
  wayneCashBalance: number;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: UserType;
  iat?: number;
  exp?: number;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string,
  ipAddress?: string
): Promise<LoginResult> {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }

    const normalizedEmail = email.toLowerCase();
    const userCacheKey = `auth:user:${normalizedEmail}`;
    
    // Verificar cache primeiro
    let user = await CacheService.user.get(userCacheKey);
    
    if (!user) {
      // Find user by email no banco de dados
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          name: true,
          type: true,
          passwordHash: true,
          isVerified: true,
          wayneCashBalance: true,
          isActive: true,
        }
      });
      
      if (user) {
        // Cachear usuário por 1 hora (sem senha)
        const { passwordHash, ...userWithoutPassword } = user;
        await CacheService.user.set(userCacheKey, { ...userWithoutPassword, passwordHash: 'cached' }, 3600);
      }
    }

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new Error('Conta desativada');
    }

    // Verificar senha (buscar hash real se usuário veio do cache)
    let passwordHash = user.passwordHash;
    if (passwordHash === 'cached') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true }
      });
      passwordHash = dbUser?.passwordHash || '';
    }
    
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await logActivity(user.id, 'LOGIN_FAILED', {
        reason: 'invalid_password',
        ipAddress
      }, ipAddress);
      
      throw new Error('Credenciais inválidas');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      type: user.type
    });

    const refreshToken = await generateRefreshToken(user.id);
    
    // Cachear token de acesso por 15 minutos
    const tokenCacheKey = `token:${accessToken}`;
    await CacheService.session.set(tokenCacheKey, {
      userId: user.id,
      email: user.email,
      type: user.type,
      createdAt: new Date().toISOString()
    }, 15 * 60);
    
    // Cachear sessão do usuário
    const sessionCacheKey = `session:${user.id}`;
    await CacheService.session.set(sessionCacheKey, {
      accessToken,
      refreshToken,
      loginTime: new Date().toISOString(),
      ipAddress
    }, 24 * 60 * 60);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Log successful login
    await logActivity(user.id, 'LOGIN_SUCCESS', {
      loginMethod: 'email_password',
      ipAddress
    }, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        isVerified: user.isVerified,
        wayneCashBalance: user.wayneCashBalance
      },
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

/**
 * Verify and decode JWT access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Verificar cache primeiro
    const tokenCacheKey = `token:${token}`;
    const cachedTokenData = await CacheService.session.get(tokenCacheKey);
    
    if (cachedTokenData) {
      // Token válido no cache, retornar dados
      return {
        userId: cachedTokenData.userId,
        email: cachedTokenData.email,
        type: cachedTokenData.type
      };
    }
    
    // Se não estiver no cache, verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, type: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new Error('Token inválido');
    }
    
    // Cachear token válido por 15 minutos
    await CacheService.session.set(tokenCacheKey, {
      userId: user.id,
      email: user.email,
      type: user.type,
      createdAt: new Date().toISOString()
    }, 15 * 60);

    return {
      userId: user.id,
      email: user.email,
      type: user.type
    };
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  try {
    // Find and validate refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            type: true,
            isActive: true
          }
        }
      }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date() || !tokenRecord.user.isActive) {
      throw new Error('Refresh token inválido');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      type: tokenRecord.user.type
    });

    const newRefreshToken = await generateRefreshToken(tokenRecord.user.id);

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: tokenRecord.id }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 24 * 60 * 60
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Falha ao renovar token');
  }
}

/**
 * Logout user and invalidate refresh token
 */
export async function logoutUser(refreshToken: string, userId?: string): Promise<void> {
  try {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
        ...(userId && { userId })
      }
    });

    // Log logout activity
    if (userId) {
      await logActivity(userId, 'LOGOUT', {
        method: 'manual'
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw error for logout failures
  }
}

/**
 * Get user by ID with authentication context
 */
export async function getAuthenticatedUser(userId: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        isVerified: true,
        wayneCashBalance: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
      isVerified: user.isVerified,
      wayneCashBalance: user.wayneCashBalance
    };
  } catch (error) {
    console.error('Get authenticated user error:', error);
    return null;
  }
}

/**
 * Generate JWT access token
 */
function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'servicos-ja',
    audience: 'servicos-ja-users'
  });
}

/**
 * Generate and store refresh token
 */
async function generateRefreshToken(userId: string): Promise<string> {
  const token = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Clean up old refresh tokens for this user
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() }
    }
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return token;
}

/**
 * Log user activity
 */
async function logActivity(
  userId: string,
  action: string,
  details?: any,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details || {},
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error for logging failures
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
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

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Cache Management Functions
 */

/**
 * Limpar cache de usuário
 */
export async function clearUserCache(email: string): Promise<void> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    const userCacheKey = `auth:user:${email.toLowerCase()}`;
    await CacheService.user.del(userCacheKey);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

/**
 * Limpar cache de sessão
 */
export async function clearSessionCache(userId: string): Promise<void> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    const sessionCacheKey = `session:${userId}`;
    await CacheService.session.del(sessionCacheKey);
  } catch (error) {
    console.error('Error clearing session cache:', error);
  }
}

/**
 * Invalidar token no cache
 */
export async function invalidateToken(token: string): Promise<void> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    const tokenCacheKey = `token:${token}`;
    await CacheService.session.del(tokenCacheKey);
  } catch (error) {
    console.error('Error invalidating token:', error);
  }
}

/**
 * Obter estatísticas de cache
 */
export async function getCacheStats(): Promise<{
  users: number;
  sessions: number;
  tokens: number;
}> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Esta é uma implementação simplificada
    // Em produção, você pode querer implementar contadores específicos
    return {
      users: 0, // Implementar contagem real se necessário
      sessions: 0,
      tokens: 0
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { users: 0, sessions: 0, tokens: 0 };
  }
}

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true }
    });

    return !!user;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw new Error('Erro ao verificar email');
  }
}