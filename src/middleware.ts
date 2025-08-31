import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { 
  applySecurityHeaders, 
  applyCorsHeaders, 
  handlePreflight, 
  validateOrigin,
  rateLimitConfig,
  isIPBlacklisted,
  logSecurityEvent 
} from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/chat',
  '/payments'
];

// Rotas que só usuários não autenticados podem acessar
const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password'
];

// Rotas públicas que não precisam de verificação
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ipAddress = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';
  
  try {
    // Verificar se IP está na lista negra
    if (await isIPBlacklisted(ipAddress)) {
      await logSecurityEvent('UNAUTHORIZED_ACCESS', {
        action: 'BLOCKED_IP_ACCESS',
        pathname,
        reason: 'IP blacklisted'
      }, request);
      return new NextResponse('Access denied', { status: 403 });
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }
    
    // Validate request origin for sensitive operations
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/payment/')) {
      if (!validateOrigin(request)) {
        await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
          action: 'INVALID_ORIGIN',
          pathname,
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer')
        }, request);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    // Apply rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      const rateLimiter = pathname.startsWith('/api/auth/') 
        ? rateLimit.auth
        : pathname.includes('payment') || pathname.includes('sensitive')
        ? rateLimit.sensitive
        : rateLimit.api;
      
      const rateLimitResult = await rateLimiter.check(request);
      if (!rateLimitResult.success) {
        await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
          action: 'RATE_LIMIT_EXCEEDED',
          pathname,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        }, request);
        return new NextResponse('Too Many Requests', { 
          status: 429,
          headers: {
            'Retry-After': Math.round(rateLimitResult.reset / 1000).toString(),
          }
        });
      }
    }
  
  // Permitir acesso a arquivos estáticos e API routes não protegidas
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname)
  ) {
    const response = NextResponse.next();
    return applySecurityHeaders(applyCorsHeaders(request, response));
  }
  
  // Verificar autenticação
  const user = await verifyAuth(request);
  const isAuthenticated = !!user;
  
  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Verificar se a rota atual é de autenticação
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Redirecionar usuários não autenticados de rotas protegidas
  if (isProtectedRoute && !isAuthenticated) {
    // Log tentativa de acesso não autorizado
    await logSecurityEvent('UNAUTHORIZED_ACCESS', {
      action: 'UNAUTHENTICATED_ACCESS',
      pathname,
      userAgent: request.headers.get('user-agent')
    }, request);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirecionar usuários autenticados de rotas de auth
  if (isAuthRoute && isAuthenticated) {
    const dashboardPath = user.type === 'client' 
      ? '/dashboard/client'
      : user.type === 'professional'
      ? '/dashboard/professional' 
      : '/dashboard/partner';
    
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }
  
  // Verificar permissões específicas para dashboards
  if (pathname.startsWith('/dashboard/') && isAuthenticated) {
    const dashboardType = pathname.split('/')[2]; // client, professional, partner
    
    if (dashboardType && dashboardType !== user.type) {
      // Log tentativa de acesso ao dashboard incorreto
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        action: 'WRONG_DASHBOARD_ACCESS',
        userId: user.id,
        userType: user.type,
        attemptedPath: pathname
      }, request);
      // Redirecionar para o dashboard correto do usuário
      const correctDashboard = `/dashboard/${user.type}`;
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }
  
    // Aplicar headers de segurança e CORS
    const response = NextResponse.next();
    return applySecurityHeaders(applyCorsHeaders(request, response));
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Log erro do middleware
    try {
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        action: 'MIDDLEWARE_ERROR',
        pathname,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, request);
    } catch (logError) {
      console.error('Failed to log middleware error:', logError);
    }
    
    // Em caso de erro, aplicar apenas os cabeçalhos de segurança básicos
    const response = NextResponse.next();
    return applySecurityHeaders(applyCorsHeaders(request, response));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};