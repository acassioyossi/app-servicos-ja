import { NextRequest, NextResponse } from 'next/server';
import { transactionSchema, validateData } from '@/lib/validation';
import { sanitizeText } from '@/lib/sanitize';
import { applySecurityHeaders } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

/**
 * Rate limiting para operações de transações usando Redis
 * @param operation Tipo de operação (GET, CREATE, UPDATE, DELETE)
 * @param identifier Identificador único (userId ou IP)
 * @returns Resultado do rate limiting
 */
async function checkTransactionsRateLimit(
  operation: 'GET' | 'CREATE' | 'UPDATE' | 'DELETE',
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const limits = {
      GET: 200, // 200 consultas por minuto
      CREATE: 10, // 10 criações por minuto
      UPDATE: 20, // 20 atualizações por minuto
      DELETE: 5   // 5 cancelamentos por minuto
    };
    
    const limit = limits[operation];
    const key = `rate_limit:transactions:${operation.toLowerCase()}:${identifier}`;
    const window = 60; // 1 minuto
    
    const current = await CacheService.auth.get(key) || 0;
    const remaining = Math.max(0, limit - current - 1);
    const reset = Math.ceil(Date.now() / 1000) + window;
    
    if (current >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset
      };
    }
    
    await CacheService.auth.set(key, current + 1, window);
    
    return {
      success: true,
      limit,
      remaining,
      reset
    };
    
  } catch (error) {
    console.error('Rate limit check error:', error);
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Math.ceil(Date.now() / 1000) + 60
    };
  }
}

/**
 * GET /api/transactions - Listar transações do usuário com filtros e paginação
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
    const rateLimitResult = await checkTransactionsRateLimit('GET', authUser.userId);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas consultas de transações. Tente novamente em breve.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = (page - 1) * limit;

    // Verificar cache primeiro
    const cacheKey = `transactions:${authUser.userId}:${status}:${type}:${startDate}:${endDate}:${minAmount}:${maxAmount}:${page}:${limit}`;
    const cachedResult = await CacheService.temp.get(cacheKey);
    
    if (cachedResult) {
      const response = NextResponse.json(cachedResult);
      applySecurityHeaders(response);
      return response;
    }

    // Construir filtros
    const where: any = {
      userId: authUser.userId
    };
    
    if (status) {
      where.status = status;
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount);
      }
    }

    // Buscar transações
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          type: true,
          description: true,
          paymentMethod: true,
          gatewayTransactionId: true,
          createdAt: true,
          updatedAt: true,
          service: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          professional: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    const result = {
      success: true,
      transactions: transactions.map(transaction => ({
        ...transaction,
        description: transaction.description ? sanitizeText(transaction.description) : null,
        professional: transaction.professional ? {
          ...transaction.professional,
          name: sanitizeText(transaction.professional.name)
        } : null,
        service: transaction.service ? {
          ...transaction.service,
          name: sanitizeText(transaction.service.name)
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        completedCount: transactions.filter(t => t.status === 'completed').length,
        pendingCount: transactions.filter(t => t.status === 'pending').length,
        failedCount: transactions.filter(t => t.status === 'failed').length
      }
    };

    // Cachear resultado por 2 minutos
    await CacheService.temp.set(cacheKey, result, 120);

    const response = NextResponse.json(result);
    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Get transactions error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * POST /api/transactions - Criar nova transação
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

    // Aplicar rate limiting
    const rateLimitResult = await checkTransactionsRateLimit('CREATE', authUser.userId);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas transações criadas. Aguarde um momento.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    
    // Validação dos dados
    const validation = validateData(transactionSchema, body);
    
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

    const { 
      amount, 
      currency, 
      type, 
      description, 
      paymentMethod, 
      serviceId, 
      professionalId 
    } = validation.data;

    // Sanitizar dados
    const sanitizedDescription = description ? sanitizeText(description.trim()) : null;

    // Verificar se o serviço existe (se fornecido)
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        const response = NextResponse.json(
          { error: 'Serviço não encontrado' },
          { status: 404 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }

    // Verificar se o profissional existe (se fornecido)
    if (professionalId) {
      const professional = await prisma.user.findFirst({
        where: {
          id: professionalId,
          type: 'professional'
        }
      });
      
      if (!professional) {
        const response = NextResponse.json(
          { error: 'Profissional não encontrado' },
          { status: 404 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }

    // Criar transação
    const transaction = await prisma.transaction.create({
      data: {
        userId: authUser.userId,
        amount,
        currency,
        type,
        description: sanitizedDescription,
        paymentMethod,
        serviceId,
        professionalId,
        status: 'pending'
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        professional: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Registrar log de auditoria
    try {
      await prisma.auditLog.create({
        data: {
          userId: authUser.userId,
          action: 'TRANSACTION_CREATED',
          resource: 'transaction',
          resourceId: transaction.id,
          details: {
            amount: transaction.amount,
            currency: transaction.currency,
            type: transaction.type,
            paymentMethod: transaction.paymentMethod,
            serviceId: transaction.serviceId,
            professionalId: transaction.professionalId
          },
          ipAddress: request.ip || '',
          userAgent: request.headers.get('user-agent') || '',
          timestamp: new Date()
        }
      });
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError);
    }

    // Invalidar cache
    await CacheService.temp.invalidatePattern(`transactions:${authUser.userId}:*`);

    const response = NextResponse.json({
      success: true,
      message: 'Transação criada com sucesso',
      transaction: {
        ...transaction,
        description: transaction.description ? sanitizeText(transaction.description) : null,
        professional: transaction.professional ? {
          ...transaction.professional,
          name: sanitizeText(transaction.professional.name)
        } : null,
        service: transaction.service ? {
          ...transaction.service,
          name: sanitizeText(transaction.service.name)
        } : null
      }
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Create transaction error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * PUT /api/transactions/[id] - Atualizar transação
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
    const rateLimitResult = await checkTransactionsRateLimit('UPDATE', authUser.userId);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitas atualizações de transações. Aguarde um momento.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const url = new URL(request.url);
    const transactionId = url.pathname.split('/').pop();

    if (!transactionId) {
      const response = NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: authUser.userId
      }
    });

    if (!existingTransaction) {
      const response = NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação pode ser atualizada
    if (existingTransaction.status === 'completed' || existingTransaction.status === 'cancelled') {
      const response = NextResponse.json(
        { error: 'Transação não pode ser atualizada' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    const body = await request.json();
    const { status, description } = body;

    // Sanitizar dados
    const updateData: any = {};
    
    if (status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      updateData.status = status;
    }
    
    if (description !== undefined) {
      updateData.description = description ? sanitizeText(description.trim()) : null;
    }

    // Atualizar transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        professional: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Registrar log de auditoria
    try {
      await prisma.auditLog.create({
        data: {
          userId: authUser.userId,
          action: 'TRANSACTION_UPDATED',
          resource: 'transaction',
          resourceId: transactionId,
          details: {
            previousData: {
              status: existingTransaction.status,
              description: existingTransaction.description
            },
            newData: updateData,
            transactionAmount: existingTransaction.amount,
            transactionType: existingTransaction.type
          },
          ipAddress: request.ip || '',
          userAgent: request.headers.get('user-agent') || '',
          timestamp: new Date()
        }
      });
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError);
    }

    // Invalidar cache
    await CacheService.temp.invalidatePattern(`transactions:${authUser.userId}:*`);

    const response = NextResponse.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      transaction: {
        ...updatedTransaction,
        description: updatedTransaction.description ? sanitizeText(updatedTransaction.description) : null,
        professional: updatedTransaction.professional ? {
          ...updatedTransaction.professional,
          name: sanitizeText(updatedTransaction.professional.name)
        } : null,
        service: updatedTransaction.service ? {
          ...updatedTransaction.service,
          name: sanitizeText(updatedTransaction.service.name)
        } : null
      }
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Update transaction error:', error);
    
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    applySecurityHeaders(response);
    return response;
  }
}

/**
 * DELETE /api/transactions/[id] - Cancelar transação
 */
export async function DELETE(request: NextRequest) {
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
    const rateLimitResult = await checkTransactionsRateLimit('DELETE', authUser.userId);
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Muitos cancelamentos de transações. Aguarde um momento.',
          retryAfter: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset.toString()
          }
        }
      );
      applySecurityHeaders(response);
      return response;
    }

    const url = new URL(request.url);
    const transactionId = url.pathname.split('/').pop();

    if (!transactionId) {
      const response = NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: authUser.userId
      }
    });

    if (!transaction) {
      const response = NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação pode ser cancelada
    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      const response = NextResponse.json(
        { error: 'Transação não pode ser cancelada' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Cancelar transação
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // Registrar log de auditoria
    try {
      await prisma.auditLog.create({
        data: {
          userId: authUser.userId,
          action: 'TRANSACTION_CANCELLED',
          resource: 'transaction',
          resourceId: transactionId,
          details: {
            previousStatus: transaction.status,
            transactionAmount: transaction.amount,
            transactionType: transaction.type,
            paymentMethod: transaction.paymentMethod,
            reason: 'User cancellation'
          },
          ipAddress: request.ip || '',
          userAgent: request.headers.get('user-agent') || '',
          timestamp: new Date()
        }
      });
    } catch (auditError) {
      console.error('Audit log error (non-blocking):', auditError);
    }

    // Invalidar cache
    await CacheService.temp.invalidatePattern(`transactions:${authUser.userId}:*`);

    // Invalidar cache de estatísticas do usuário
    try {
      await CacheService.user.del(`user_stats:${authUser.userId}`);
      await CacheService.user.del(`transaction_summary:${authUser.userId}`);
    } catch (cacheError) {
      console.error('Cache invalidation error (non-blocking):', cacheError);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Transação cancelada com sucesso'
    });

    applySecurityHeaders(response);
    return response;

  } catch (error) {
    console.error('Cancel transaction error:', error);
    
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