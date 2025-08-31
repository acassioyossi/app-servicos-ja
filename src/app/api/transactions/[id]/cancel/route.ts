import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/cache-service';

/**
 * POST /api/transactions/[id]/cancel - Cancelar transação específica
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const transactionId = params.id;

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

    if (!transaction) {
      const response = NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação pode ser cancelada
    if (transaction.status === 'completed') {
      const response = NextResponse.json(
        { error: 'Transação já foi concluída e não pode ser cancelada' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    if (transaction.status === 'cancelled') {
      const response = NextResponse.json(
        { error: 'Transação já foi cancelada' },
        { status: 400 }
      );
      applySecurityHeaders(response);
      return response;
    }

    // Verificar se a transação está em processamento há muito tempo
    if (transaction.status === 'processing') {
      const processingTime = Date.now() - transaction.updatedAt.getTime();
      const maxProcessingTime = 30 * 60 * 1000; // 30 minutos
      
      if (processingTime < maxProcessingTime) {
        const response = NextResponse.json(
          { 
            error: 'Transação está sendo processada e não pode ser cancelada no momento',
            retryAfter: Math.ceil((maxProcessingTime - processingTime) / 1000)
          },
          { status: 409 }
        );
        applySecurityHeaders(response);
        return response;
      }
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Cancelar transação
    const cancelledTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'cancelled',
        description: reason ? `Cancelado: ${reason}` : transaction.description,
        updatedAt: new Date()
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

    // Se a transação tinha um valor pago, processar reembolso
    if (transaction.status === 'completed' && transaction.amount > 0) {
      // Aqui você implementaria a lógica de reembolso com o gateway de pagamento
      // Por exemplo, chamar a API do Stripe, PayPal, etc.
      
      // Criar registro de reembolso
      await prisma.transaction.create({
        data: {
          userId: authUser.userId,
          amount: transaction.amount,
          currency: transaction.currency,
          type: 'refund',
          status: 'pending',
          description: `Reembolso da transação ${transactionId}`,
          paymentMethod: transaction.paymentMethod,
          serviceId: transaction.serviceId,
          professionalId: transaction.professionalId,
          gatewayTransactionId: null // Será preenchido quando o reembolso for processado
        }
      });
    }

    // Invalidar cache
    await CacheService.temp.invalidatePattern(`transactions:${authUser.userId}:*`);

    // Log do cancelamento
    console.info(`Transaction cancelled: ${transactionId} by user ${authUser.userId}`);

    const response = NextResponse.json({
      success: true,
      message: 'Transação cancelada com sucesso',
      transaction: {
        ...cancelledTransaction,
        description: cancelledTransaction.description,
        professional: cancelledTransaction.professional ? {
          ...cancelledTransaction.professional,
          name: cancelledTransaction.professional.name
        } : null,
        service: cancelledTransaction.service ? {
          ...cancelledTransaction.service,
          name: cancelledTransaction.service.name
        } : null
      },
      refundInfo: transaction.status === 'completed' && transaction.amount > 0 ? {
        message: 'Um reembolso foi iniciado e será processado em até 5 dias úteis',
        amount: transaction.amount,
        currency: transaction.currency
      } : null
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