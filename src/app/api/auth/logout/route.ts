import { NextRequest, NextResponse } from 'next/server';
import { createLogoutResponse, verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const user = await verifyAuth(request);
    
    if (user) {
      // Log do logout
      console.info(`User logout: ${user.userId} (${user.email}) from IP: ${request.ip}`);
    }
    
    // Criar resposta de logout (remove o cookie)
    const response = createLogoutResponse('/login');
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Logout realizado com sucesso',
        redirectTo: '/login'
      },
      { 
        status: 200,
        headers: response.headers
      }
    );
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Mesmo com erro, fazer logout (remover cookie)
    const response = createLogoutResponse('/login');
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Logout realizado',
        redirectTo: '/login'
      },
      { 
        status: 200,
        headers: response.headers
      }
    );
  }
}

// Método não permitido para outras requisições
export async function GET() {
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