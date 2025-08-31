import { NextRequest, NextResponse } from 'next/server';
import { userSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Rate limiting para operações de usuários usando Redis
 * @param request Requisição HTTP
 * @param operation Tipo de operação (get, create, update, delete)
 * @returns Resultado do rate limiting
 */
async function checkUsersRateLimit(
  request: NextRequest,
  operation: 'get' | 'create' | 'update' | 'delete'
): Promise<{ success: boolean; retryAfter?: number }> {
  const authUser = await verifyAuth(request);
  const identifier = authUser?.userId || request.ip || 'anonymous';
  
  const limits = {
    get: { requests: 100, window: 60 }, // 100 requests per minute for GET
    create: { requests: 5, window: 60 }, // 5 creates per minute
    update: { requests: 10, window: 60 }, // 10 updates per minute
    delete: { requests: 3, window: 60 } // 3 deletes per minute
  };
  
  const limit = limits[operation];
  const key = `users_rate_limit:${operation}:${identifier}`;
  
  try {
    const current = await CacheService.rateLimit.get(key) || 0;
    
    if (current >= limit.requests) {
      const ttl = await CacheService.rateLimit.ttl(key);
      return { success: false, retryAfter: ttl > 0 ? ttl : limit.window };
    }
    
    await CacheService.rateLimit.increment(key, limit.window);
    return { success: true };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { success: true }; // Em caso de erro, permitir
  }
}

/**
 * GET /api/users - Listar usuários com filtros e paginação
 */
export async function GET(request: NextRequest) {
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

    // Aplicar rate limiting
    const rateLimitResult = await checkUsersRateLimit(request, 'get');
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas requisições. Tente novamente em breve.',
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Verificar cache primeiro
    const cacheKey = `users:${search}:${type}:${isActive}:${page}:${limit}`;
    const cachedResult = await CacheService.user.get(cacheKey);
    
    if (cachedResult) {
      const response = NextResponse.json(cachedResult);
      applySecurityHeaders(response);
      return response;
    }

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Buscar usuários
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          type: true,
          isActive: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          // Não incluir dados sensíveis como senha
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    const result = {
      success: true,
      users: users.map(user => ({
        ...user,
        name: sanitizeText(user.name),
        email: sanitizeText(user.email)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cachear resultado por 5 minutos
    await CacheService.user.set(cacheKey, result, 300);

    const response = NextResponse.json(result);
    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Get users error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * POST /api/users - Criar novo usuário (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authUser = await verifyAuth(request);
    if (!authUser || authUser.type !== 'admin') {
      const response = NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Aplicar rate limiting
    const rateLimitResult = await checkUsersRateLimit(request, 'create');
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de criação. Tente novamente em breve.',
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
    
    // Validação dos dados
    const validation = validateData(userSchema, body);
    
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

    const { name, email, password, type } = validation.data;

    // Sanitizar dados
    const sanitizedName = sanitizeText(name.trim());
    const sanitizedEmail = sanitizeText(email.toLowerCase().trim());

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      const response = NextResponse.json(
        {
          success: false,
          message: 'E-mail já cadastrado'
        },
        { status: 409 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        type,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        userId: authUser.userId,
        details: {
          createdUserId: user.id,
          createdUserEmail: user.email,
          createdUserType: user.type,
          ip: request.ip
        },
        createdAt: new Date()
      }
    }).catch(() => {}); // Não falhar se log não funcionar

    // Invalidar cache
    await CacheService.user.invalidatePattern('users:*');

    const response = NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        ...user,
        name: sanitizeText(user.name),
        email: sanitizeText(user.email)
      }
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Create user error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * PUT /api/users/[id] - Atualizar usuário
 */
export async function PUT(request: NextRequest) {
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

    // Aplicar rate limiting
    const rateLimitResult = await checkUsersRateLimit(request, 'update');
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de atualização. Tente novamente em breve.',
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

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      const response = NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se pode editar este usuário
    if (authUser.userId !== userId && authUser.type !== 'admin') {
      const response = NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    const { name, email, isActive } = body;

    // Sanitizar dados
    const updateData: any = {};
    
    if (name) {
      updateData.name = sanitizeText(name.trim());
    }
    
    if (email) {
      updateData.email = sanitizeText(email.toLowerCase().trim());
      
      // Verificar se email já existe
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: userId }
        }
      });
      
      if (existingUser) {
        const response = NextResponse.json(
          { error: 'E-mail já está em uso' },
          { status: 409 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }
    
    if (typeof isActive === 'boolean' && authUser.type === 'admin') {
      updateData.isActive = isActive;
    }

    // Buscar dados anteriores para auditoria
    const previousUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, isActive: true }
    });

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        userId: authUser.userId,
        details: {
          updatedUserId: userId,
          previousData: previousUser,
          newData: {
            name: updatedUser.name,
            email: updatedUser.email,
            isActive: updatedUser.isActive
          },
          ip: request.ip
        },
        createdAt: new Date()
      }
    }).catch(() => {}); // Não falhar se log não funcionar

    // Invalidar cache
    await CacheService.user.invalidatePattern('users:*');
    await CacheService.user.del(`user:${updatedUser.email}`);
    if (previousUser?.email && previousUser.email !== updatedUser.email) {
      await CacheService.user.del(`user:${previousUser.email}`);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: {
        ...updatedUser,
        name: sanitizeText(updatedUser.name),
        email: sanitizeText(updatedUser.email)
      }
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Update user error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * DELETE /api/users/[id] - Deletar usuário (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authUser = await verifyAuth(request);
    if (!authUser || authUser.type !== 'admin') {
      const response = NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Aplicar rate limiting
    const rateLimitResult = await checkUsersRateLimit(request, 'delete');
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas tentativas de exclusão. Tente novamente em breve.',
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

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      const response = NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Não permitir deletar o próprio usuário
    if (authUser.userId === userId) {
      const response = NextResponse.json(
        { error: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Log de auditoria antes de deletar
    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        userId: authUser.userId,
        details: {
          deletedUserId: userId,
          deletedUserEmail: user.email,
          deletedUserName: user.name,
          deletedUserType: user.type,
          ip: request.ip
        },
        createdAt: new Date()
      }
    }).catch(() => {}); // Não falhar se log não funcionar

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId }
    });

    // Invalidar cache
    await CacheService.user.invalidatePattern('users:*');
    await CacheService.user.del(`user:${user.email}`);
    await CacheService.auth.del(`user_sessions:${userId}`);
    await CacheService.auth.del(`user_tokens:${userId}`);

    const response = NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Delete user error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

// Método OPTIONS para CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  applySecurityHeaders(response);
  return response;
}