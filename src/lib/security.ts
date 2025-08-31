/**
 * Security utilities and configurations
 * Provides CORS, CSP, and other security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheService } from './cache-service';
import { prisma } from './prisma';

/**
 * CORS configuration
 */
export const corsConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://yourdomain.com', // Replace with your production domain
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development
    'https://vercel.live',
    'https://va.vercel-scripts.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://vercel.live',
    'wss://ws-us3.pusher.com', // For real-time notifications
  ],
  'media-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(cspConfig)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set(
    'Access-Control-Allow-Methods',
    corsConfig.allowedMethods.join(', ')
  );
  
  response.headers.set(
    'Access-Control-Allow-Headers',
    corsConfig.allowedHeaders.join(', ')
  );
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set(
    'Access-Control-Max-Age',
    corsConfig.maxAge.toString()
  );
  
  return response;
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', generateCSPHeader());
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return applyCorsHeaders(request, response);
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // API routes
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  // Authentication routes
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
  },
  // Sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 sensitive operations per hour
  },
};

/**
 * Security middleware for API routes
 */
export function securityMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  // Apply CORS headers
  const corsResponse = applyCorsHeaders(request, response);
  
  // Apply security headers
  const secureResponse = applySecurityHeaders(corsResponse);
  
  return secureResponse;
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Allow same-origin requests
  if (!origin && !referer) {
    return true;
  }
  
  // Check origin against allowed list
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check referer against allowed list
  if (referer) {
    const refererOrigin = new URL(referer).origin;
    return corsConfig.allowedOrigins.includes(refererOrigin);
  }
  
  return false;
}

/**
 * Sanitize request headers
 */
export function sanitizeHeaders(request: NextRequest): Record<string, string> {
  const sanitizedHeaders: Record<string, string> = {};
  
  // Only allow specific headers
  const allowedHeaders = [
    'content-type',
    'authorization',
    'user-agent',
    'accept',
    'accept-language',
    'accept-encoding',
  ];
  
  allowedHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) {
      sanitizedHeaders[header] = value;
    }
  });
  
  return sanitizedHeaders;
}

/**
 * Detectar tentativas de força bruta
 * @param identifier Identificador (IP, email, etc.)
 * @param action Ação sendo realizada
 * @returns Se a tentativa deve ser bloqueada
 */
export async function detectBruteForce(
  identifier: string,
  action: 'login' | 'signup' | 'password_reset' = 'login'
): Promise<{ blocked: boolean; attempts: number; resetTime?: number }> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }

    const limits = {
      login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas em 15 min
      signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas em 1 hora
      password_reset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 } // 3 tentativas em 1 hora
    };

    const limit = limits[action];
    const key = `brute_force:${action}:${identifier}`;
    
    const attempts = await CacheService.rateLimit.increment(key, limit.windowMs / 1000);
    
    if (attempts && attempts > limit.maxAttempts) {
      return {
        blocked: true,
        attempts,
        resetTime: Date.now() + limit.windowMs
      };
    }

    return { blocked: false, attempts: attempts || 0 };
  } catch (error) {
    console.error('Error in brute force detection:', error);
    return { blocked: false, attempts: 0 };
  }
}

/**
 * Log de evento de segurança
 * @param event Tipo de evento
 * @param details Detalhes do evento
 * @param request Request object
 */
export async function logSecurityEvent(
  event: 'BRUTE_FORCE_DETECTED' | 'SUSPICIOUS_ACTIVITY' | 'INVALID_TOKEN' | 'UNAUTHORIZED_ACCESS',
  details: any,
  request?: NextRequest
): Promise<void> {
  try {
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for')?.split(',')[0] || 
      request?.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = request?.headers.get('user-agent') || 'unknown';
    
    await prisma.auditLog.create({
      data: {
        action: event,
        resource: 'SECURITY',
        metadata: {
          ...details,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString()
        },
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Validar força da senha
 * @param password Senha para validar
 * @returns Resultado da validação
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Comprimento mínimo
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  }

  // Letra maiúscula
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra maiúscula');
  }

  // Letra minúscula
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos uma letra minúscula');
  }

  // Número
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um número');
  }

  // Caractere especial
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Adicione pelo menos um caractere especial');
  }

  // Comprimento extra
  if (password.length >= 12) {
    score += 1;
  }

  // Verificar padrões comuns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /(.)\1{2,}/ // caracteres repetidos
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Evite padrões comuns e caracteres repetidos');
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
}

/**
 * Verificar se IP está em lista negra
 * @param ipAddress Endereço IP
 * @returns Se o IP está bloqueado
 */
export async function isIPBlacklisted(ipAddress: string): Promise<boolean> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }

    const blacklistKey = `ip_blacklist:${ipAddress}`;
    const isBlacklisted = await CacheService.temp.get(blacklistKey);
    
    return !!isBlacklisted;
  } catch (error) {
    console.error('Error checking IP blacklist:', error);
    return false;
  }
}

/**
 * Adicionar IP à lista negra
 * @param ipAddress Endereço IP
 * @param reason Motivo do bloqueio
 * @param duration Duração em segundos (padrão: 24 horas)
 */
export async function blacklistIP(
  ipAddress: string, 
  reason: string, 
  duration: number = 24 * 60 * 60
): Promise<void> {
  try {
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }

    const blacklistKey = `ip_blacklist:${ipAddress}`;
    await CacheService.temp.set(blacklistKey, {
      reason,
      blockedAt: new Date().toISOString()
    }, duration);

    // Log do bloqueio
    await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      action: 'IP_BLACKLISTED',
      ipAddress,
      reason,
      duration
    });
  } catch (error) {
    console.error('Error blacklisting IP:', error);
  }
}