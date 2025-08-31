import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthResponse } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { loginSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { CacheService } from '@/lib/cache-service';

/**
 * Rate limiting para tentativas de login usando Redis
 */
async function checkLoginRateLimit(ip: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `login_attempts:${ip}`;
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutos
  
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

export async function POST(request: NextRequest) {
  try {
    // Conectar ao Redis se necessário
    if (!CacheService.utils.isAvailable()) {
      await CacheService.utils.connect();
    }
    
    // Aplicar rate limiting baseado em Redis
    const identifier = request.ip || 'anonymous';
    const rateLimitResult = await checkLoginRateLimit(identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
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
    }

    const body = await request.json();
    
    // Validar dados de entrada com novo sistema
    const validation = validateData(loginSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: !validation.success ? validation.errors : []
        },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    const { email, password } = validation.data;
    
    // Sanitizar dados de entrada
    const sanitizedEmail = sanitizeText(email.toLowerCase().trim());
    
    // Verificar cache de usuário primeiro
    const userCacheKey = `user:${sanitizedEmail}`;
    let user = await CacheService.user.get(userCacheKey);
    
    if (!user) {
      // Autenticar usuário se não estiver em cache
      user = await authenticateUser(sanitizedEmail, password);
      
      if (user) {
        // Cachear dados do usuário por 1 hora
        await CacheService.user.set(userCacheKey, user, 3600);
      }
    } else {
      // Verificar senha mesmo com cache (por segurança)
      const validUser = await authenticateUser(sanitizedEmail, password);
      if (!validUser) {
        user = null;
      }
    }
    
    if (!user) {
      // Log da tentativa de login falhada (em produção, usar logger apropriado)
      console.warn(`Failed login attempt for email: ${sanitizedEmail} from IP: ${request.ip}`);
      
      const response = NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
      applySecurityHeaders(response);
      return response;
    }
    
    // Limpar tentativas de rate limit após login bem-sucedido
    await CacheService.rateLimit.del(`login_attempts:${identifier}`);
    
    // Log do login bem-sucedido
    console.info(`Successful login for user: ${user.id} (${user.email}) from IP: ${request.ip}`);
    
    // Determinar redirecionamento baseado no tipo de usuário
    const redirectPath = user.type === 'client' 
      ? '/dashboard/client'
      : user.type === 'professional'
      ? '/dashboard/professional' 
      : '/dashboard/partner';
    
    // Criar resposta com cookie de autenticação
    const authResponse = await createAuthResponse(user, redirectPath);
    
    const response = NextResponse.json(
      { 
        success: true,
        user: {
          id: user.id,
          email: sanitizedEmail,
          name: sanitizeText(user.name),
          type: user.type,
          avatar: user.avatar
        },
        redirectTo: redirectPath
      },
      { 
        status: 200,
        headers: authResponse.headers
      }
    );
    
    // Aplicar cabeçalhos de segurança
    applySecurityHeaders(response);
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

// Método não permitido para outras requisições
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