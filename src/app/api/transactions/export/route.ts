import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeText } from '@/lib/sanitize';

/**
 * GET /api/transactions/export - Exportar transações em CSV ou PDF
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validar formato
    if (!['csv', 'pdf'].includes(format)) {
      const response = NextResponse.json(
        { error: 'Formato inválido. Use csv ou pdf.' },
        { status: 400 }
      );
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

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
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
            name: true,
            category: true
          }
        },
        professional: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Gerar CSV
      const csvHeaders = [
        'ID',
        'Data',
        'Valor',
        'Moeda',
        'Status',
        'Tipo',
        'Descrição',
        'Método de Pagamento',
        'Serviço',
        'Categoria',
        'Profissional',
        'ID Gateway'
      ];

      const csvRows = transactions.map(transaction => [
        transaction.id,
        transaction.createdAt.toISOString().split('T')[0],
        transaction.amount.toString(),
        transaction.currency,
        transaction.status,
        transaction.type,
        transaction.description ? sanitizeText(transaction.description) : '',
        transaction.paymentMethod || '',
        transaction.service ? sanitizeText(transaction.service.name) : '',
        transaction.service ? transaction.service.category : '',
        transaction.professional ? sanitizeText(transaction.professional.name) : '',
        transaction.gatewayTransactionId || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      const response = new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });

      applySecurityHeaders(response);
      return response;
    }

    if (format === 'pdf') {
      // Para PDF, retornar dados estruturados que o frontend pode usar para gerar o PDF
      // Em uma implementação real, você poderia usar uma biblioteca como puppeteer ou jsPDF no servidor
      const pdfData = {
        title: 'Relatório de Transações',
        generatedAt: new Date().toISOString(),
        user: {
          id: authUser.userId,
          email: authUser.email
        },
        filters: {
          status,
          type,
          startDate,
          endDate
        },
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          date: transaction.createdAt.toISOString().split('T')[0],
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          type: transaction.type,
          description: transaction.description ? sanitizeText(transaction.description) : null,
          paymentMethod: transaction.paymentMethod,
          service: transaction.service ? {
            name: sanitizeText(transaction.service.name),
            category: transaction.service.category
          } : null,
          professional: transaction.professional ? {
            name: sanitizeText(transaction.professional.name)
          } : null,
          gatewayTransactionId: transaction.gatewayTransactionId
        })),
        summary: {
          total: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
          byStatus: {
            pending: transactions.filter(t => t.status === 'pending').length,
            processing: transactions.filter(t => t.status === 'processing').length,
            completed: transactions.filter(t => t.status === 'completed').length,
            failed: transactions.filter(t => t.status === 'failed').length,
            cancelled: transactions.filter(t => t.status === 'cancelled').length
          },
          byType: {
            payment: transactions.filter(t => t.type === 'payment').length,
            refund: transactions.filter(t => t.type === 'refund').length,
            transfer: transactions.filter(t => t.type === 'transfer').length
          }
        }
      };

      const response = NextResponse.json(pdfData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.json"`
        }
      });

      applySecurityHeaders(response);
      return response;
    }

  } catch (error) {
    console.error('Export transactions error:', error);
    
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