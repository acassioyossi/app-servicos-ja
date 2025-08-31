"use client";

import React, { Suspense, lazy, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { sanitizeText } from '@/lib/sanitize';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Cache para componentes lazy carregados
const componentCache = new Map<string, React.ComponentType<any>>();

// Preload inteligente baseado em interação do usuário
const preloadQueue = new Set<string>();
const preloadedComponents = new Set<string>();

/**
 * Componente de loading padrão para lazy loading
 */
const DefaultLoadingFallback = memo(() => {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Carregando...</span>
    </div>
  );
});
DefaultLoadingFallback.displayName = 'DefaultLoadingFallback';

/**
 * Loading skeleton para componentes de chat
 */
const ChatLoadingSkeleton = memo(() => {
  return (
    <Card className="w-full h-[calc(100vh-8rem)]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4 border-b pb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        
        <div className="space-y-4 flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-3 border-t pt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </CardContent>
    </Card>
  );
});
ChatLoadingSkeleton.displayName = 'ChatLoadingSkeleton';

/**
 * Loading skeleton para dashboard
 */
const DashboardLoadingSkeleton = memo(() => {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
DashboardLoadingSkeleton.displayName = 'DashboardLoadingSkeleton';

/**
 * Loading skeleton para mapas
 */
const MapLoadingSkeleton = memo(() => {
  return (
    <Card className="w-full h-96">
      <CardContent className="p-0 relative">
        <Skeleton className="h-full w-full rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
MapLoadingSkeleton.displayName = 'MapLoadingSkeleton';

/**
 * Função para preload de componentes
 */
function preloadComponent(componentKey: string, importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  if (preloadedComponents.has(componentKey)) return;
  
  preloadedComponents.add(componentKey);
  importFn().then(module => {
    componentCache.set(componentKey, module.default);
  }).catch(error => {
    console.warn(`Failed to preload component ${componentKey}:`, error);
    preloadedComponents.delete(componentKey);
  });
}

/**
 * HOC para lazy loading de componentes com cache e preload
 */
export function withLazyLoading<T extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType,
  componentKey?: string
) {
  const key = componentKey || importFn.toString();
  
  // Verificar se já está no cache
  if (componentCache.has(key)) {
    const CachedComponent = componentCache.get(key)!;
    return function CachedWrapper(props: T) {
      return <CachedComponent {...props} />;
    };
  }
  
  const LazyComponent = lazy(async () => {
    try {
      const module = await importFn();
      componentCache.set(key, module.default);
      return module;
    } catch (error) {
      console.error(`Failed to load component ${key}:`, error);
      throw error;
    }
  });
  const LoadingComponent = fallback || DefaultLoadingFallback;
  
  function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }
  
  // Adicionar método de preload
  (LazyWrapper as any).preload = () => preloadComponent(key, importFn);
  
  return LazyWrapper;
}

/**
 * Lazy loading específico para chat com preload
 */
export const LazyChat = withLazyLoading(
  () => import('@/components/chat/chat-interface'),
  ChatLoadingSkeleton,
  'chat-interface'
);

/**
 * Lazy loading específico para mapas com preload
 */
export const LazyMap = withLazyLoading(
  () => import('@/components/map/map-view'),
  MapLoadingSkeleton,
  'map-view'
);

/**
 * Lazy loading para dashboard
 */
export const LazyDashboard = withLazyLoading(
  () => import('@/components/dashboard/dashboard'),
  DashboardLoadingSkeleton,
  'dashboard'
);

/**
 * Hook para lazy loading condicional com cache
 */
export function useLazyComponent<T extends Record<string, any>>(
  condition: boolean,
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ComponentType,
  componentKey?: string
) {
  const [LazyComponent, setLazyComponent] = React.useState<React.ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const key = componentKey || importFn.toString();
  
  React.useEffect(() => {
    if (!condition) {
      setLazyComponent(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Verificar cache primeiro
    if (componentCache.has(key)) {
      setLazyComponent(() => componentCache.get(key)!);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    if (!LazyComponent && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      importFn()
        .then((module) => {
          componentCache.set(key, module.default);
          setLazyComponent(() => module.default);
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [condition, LazyComponent, isLoading, importFn, key]);
  
  if (error) {
    return {
      Component: () => (
        <div className="text-center p-4 text-destructive">
          Erro ao carregar componente: {sanitizeText(error.message)}
        </div>
      ),
      isLoading: false,
      error
    };
  }
  
  if (isLoading || (condition && !LazyComponent)) {
    const LoadingComponent = fallback || DefaultLoadingFallback;
    return {
      Component: LoadingComponent,
      isLoading: true,
      error: null
    };
  }
  
  return {
    Component: LazyComponent,
    isLoading: false,
    error: null
  };
}

/**
 * Componente para lazy loading de imagens
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
}

export const LazyImage = memo(function LazyImage({ src, alt, className, width, height, placeholder }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Começar a carregar 50px antes de entrar na viewport
      }
    );
    
    observer.observe(img);
    
    return () => observer.disconnect();
  }, []);
  
  if (hasError) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-muted-foreground text-sm">
          {placeholder || 'Erro ao carregar imagem'}
        </span>
      </div>
    );
  }
  
  return (
    <div className="relative" ref={imgRef}>
      {!isLoaded && (
        <Skeleton 
          className={className} 
          style={{ width, height }}
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

/**
 * Hook para preload inteligente baseado em hover/focus
 */
export function useIntelligentPreload() {
  const preloadOnHover = (componentKey: string, importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
    return {
      onMouseEnter: () => {
        if (!preloadQueue.has(componentKey)) {
          preloadQueue.add(componentKey);
          // Delay pequeno para evitar preloads desnecessários
          setTimeout(() => {
            if (preloadQueue.has(componentKey)) {
              preloadComponent(componentKey, importFn);
            }
          }, 100);
        }
      },
      onMouseLeave: () => {
        preloadQueue.delete(componentKey);
      }
    };
  };
  
  const preloadOnFocus = (componentKey: string, importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
    return {
      onFocus: () => preloadComponent(componentKey, importFn)
    };
  };
  
  return { preloadOnHover, preloadOnFocus };
}

/**
 * Função para limpar cache (útil para desenvolvimento)
 */
export function clearComponentCache() {
  componentCache.clear();
  preloadedComponents.clear();
  preloadQueue.clear();
}

/**
 * Função para obter estatísticas do cache
 */
export function getCacheStats() {
  return {
    cached: componentCache.size,
    preloaded: preloadedComponents.size,
    queued: preloadQueue.size
  };
}

export {
  DefaultLoadingFallback,
  ChatLoadingSkeleton,
  DashboardLoadingSkeleton,
  MapLoadingSkeleton
};