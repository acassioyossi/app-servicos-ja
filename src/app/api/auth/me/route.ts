import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Retornar dados do usuário (sem informações sensíveis)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.userId,
          email: user.email,
          type: user.type
        }
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Auth verification error:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Método não permitido para outras requisições
export async function POST() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}