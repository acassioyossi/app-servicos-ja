"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce, throttle } from 'lodash-es';

// Hook para debounce otimizado
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle otimizado
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, delay, { leading: true, trailing: true }),
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      throttledCallback.cancel();
    };
  }, [throttledCallback]);

  return throttledCallback as T;
}

// Hook para memoização inteligente baseada em dependências
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: {
    maxAge?: number; // Tempo máximo em cache (ms)
    maxSize?: number; // Tamanho máximo do cache
  }
): T {
  const cache = useRef(new Map<string, { value: T; timestamp: number }>());
  const { maxAge = 5 * 60 * 1000, maxSize = 10 } = options || {};

  return useMemo(() => {
    const key = JSON.stringify(deps);
    const cached = cache.current.get(key);
    const now = Date.now();

    // Verificar se o cache é válido
    if (cached && (now - cached.timestamp) < maxAge) {
      return cached.value;
    }

    // Limpar cache antigo se necessário
    if (cache.current.size >= maxSize) {
      const oldestKey = Array.from(cache.current.keys())[0];
      cache.current.delete(oldestKey);
    }

    // Calcular novo valor
    const value = factory();
    cache.current.set(key, { value, timestamp: now });

    return value;
  }, deps);
}

// Hook para otimização de renderização com Intersection Observer
export function useIntersectionOptimization(
  threshold = 0.1,
  rootMargin = '0px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasIntersected]);

  return {
    ref: elementRef,
    isIntersecting,
    hasIntersected,
    shouldRender: isIntersecting || hasIntersected
  };
}

// Hook para otimização de scroll
export function useScrollOptimization() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const handleScroll = useThrottle(() => {
    const currentScrollY = window.scrollY;
    
    setScrollY(currentScrollY);
    setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
    setIsScrolling(true);
    
    lastScrollY.current = currentScrollY;

    // Detectar fim do scroll
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, 16); // ~60fps

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleScroll]);

  return {
    scrollY,
    scrollDirection,
    isScrolling,
    isAtTop: scrollY < 10,
    isAtBottom: scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10
  };
}

// Hook para otimização de resize
export function useResizeOptimization() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const handleResize = useThrottle(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setWindowSize({ width, height });
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);
  }, 100);

  useEffect(() => {
    // Definir valores iniciais
    const width = window.innerWidth;
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
}

// Hook para otimização de estado com batching
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const batchedUpdates = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchUpdate = useCallback((update: Partial<T> | ((prev: T) => Partial<T>)) => {
    const updateObj = typeof update === 'function' ? update(state) : update;
    batchedUpdates.current.push(updateObj);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => {
        const finalUpdate = batchedUpdates.current.reduce(
          (acc, curr) => ({ ...acc, ...curr }),
          {}
        );
        batchedUpdates.current = [];
        return { ...prevState, ...finalUpdate };
      });
    }, 0);
  }, [state]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate] as const;
}

// Hook para medição de performance de componentes
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    setMetrics(prev => {
      const newRenderCount = renderCount.current;
      const newAverageRenderTime = 
        (prev.averageRenderTime * (newRenderCount - 1) + renderTime) / newRenderCount;

      return {
        renderCount: newRenderCount,
        averageRenderTime: newAverageRenderTime,
        lastRenderTime: renderTime
      };
    });

    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (>16ms threshold)`
      );
    }

    startTime.current = performance.now();
  });

  return metrics;
}

// Hook para cache de dados com TTL
export function useDataCache<T>(key: string, ttl = 5 * 60 * 1000) {
  const cache = useRef(new Map<string, { data: T; timestamp: number }>());

  const get = useCallback((): T | null => {
    const cached = cache.current.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > ttl;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }

    return cached.data;
  }, [key, ttl]);

  const set = useCallback((data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [key]);

  const clear = useCallback(() => {
    cache.current.delete(key);
  }, [key]);

  const clearAll = useCallback(() => {
    cache.current.clear();
  }, []);

  return { get, set, clear, clearAll };
}

// Hook para otimização de lista virtual
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}