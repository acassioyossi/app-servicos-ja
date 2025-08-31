"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { sanitizeText } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary component para capturar erros de JavaScript em qualquer lugar da árvore de componentes.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualiza o state para mostrar a UI de erro
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro para serviços de monitoramento
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Chama callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Renderiza fallback personalizado se fornecido
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // UI de erro padrão
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Componente de fallback padrão para erros
 */
function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Oops! Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">Detalhes do erro (desenvolvimento):</p>
              <p className="text-xs font-mono text-destructive break-all">
                {sanitizeText(error.message)}
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook para usar Error Boundary de forma mais simples
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Aqui você pode integrar com serviços de monitoramento como Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  };
}

/**
 * Error Boundary específico para componentes de IA
 */
export function AIErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('AI Component Error:', error, errorInfo);
    // Log específico para erros de IA
  };

  const AIErrorFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          Erro no Assistente IA
        </CardTitle>
        <CardDescription>
          O assistente de IA está temporariamente indisponível. Tente novamente em alguns instantes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={resetError} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary fallback={AIErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary para páginas do dashboard
 */
export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Dashboard Error:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}