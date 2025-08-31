"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Zap, Eye } from 'lucide-react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domContentLoaded: number;
  loadComplete: number;
}

interface PerformanceMonitorProps {
  showInProduction?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({ 
  showInProduction = false, 
  position = 'bottom-right' 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);

  // Não mostrar em produção por padrão
  const shouldShow = process.env.NODE_ENV === 'development' || showInProduction;

  useEffect(() => {
    if (!shouldShow) return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics: Partial<PerformanceMetrics> = {};

      // First Contentful Paint
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) newMetrics.fcp = Math.round(fcp.startTime);

      // Time to First Byte
      if (navigation) {
        newMetrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
        newMetrics.domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart);
        newMetrics.loadComplete = Math.round(navigation.loadEventEnd - navigation.navigationStart);
      }

      setMetrics(newMetrics);
    };

    // Medir Web Vitals
    const measureWebVitals = () => {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }));
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: Math.round(entry.processingStart - entry.startTime) }));
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Monitorar uso de memória
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMemoryUsage(usedMB);
      }
    };

    // Executar medições
    measurePerformance();
    measureWebVitals();
    measureMemory();

    // Atualizar memória periodicamente
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const getScoreColor = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'secondary';

    if (value <= threshold.good) return 'default';
    if (value <= threshold.poor) return 'secondary';
    return 'destructive';
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm`}>
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="ml-auto text-xs hover:bg-muted rounded px-2 py-1"
            >
              {isVisible ? 'Hide' : 'Show'}
            </button>
          </CardTitle>
        </CardHeader>
        
        {isVisible && (
          <CardContent className="space-y-3 text-xs">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Core Web Vitals
              </h4>
              
              {metrics.fcp && (
                <div className="flex items-center justify-between">
                  <span>FCP:</span>
                  <Badge variant={getScoreColor('fcp', metrics.fcp)}>
                    {metrics.fcp}ms
                  </Badge>
                </div>
              )}
              
              {metrics.lcp && (
                <div className="flex items-center justify-between">
                  <span>LCP:</span>
                  <Badge variant={getScoreColor('lcp', metrics.lcp)}>
                    {metrics.lcp}ms
                  </Badge>
                </div>
              )}
              
              {metrics.fid && (
                <div className="flex items-center justify-between">
                  <span>FID:</span>
                  <Badge variant={getScoreColor('fid', metrics.fid)}>
                    {metrics.fid}ms
                  </Badge>
                </div>
              )}
              
              {metrics.cls !== undefined && (
                <div className="flex items-center justify-between">
                  <span>CLS:</span>
                  <Badge variant={getScoreColor('cls', metrics.cls)}>
                    {metrics.cls}
                  </Badge>
                </div>
              )}
            </div>

            {/* Loading Metrics */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Loading Times
              </h4>
              
              {metrics.ttfb && (
                <div className="flex items-center justify-between">
                  <span>TTFB:</span>
                  <Badge variant={getScoreColor('ttfb', metrics.ttfb)}>
                    {metrics.ttfb}ms
                  </Badge>
                </div>
              )}
              
              {metrics.domContentLoaded && (
                <div className="flex items-center justify-between">
                  <span>DOM Ready:</span>
                  <Badge variant="outline">
                    {metrics.domContentLoaded}ms
                  </Badge>
                </div>
              )}
              
              {metrics.loadComplete && (
                <div className="flex items-center justify-between">
                  <span>Load Complete:</span>
                  <Badge variant="outline">
                    {metrics.loadComplete}ms
                  </Badge>
                </div>
              )}
            </div>

            {/* Memory Usage */}
            {memoryUsage > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Memory Usage
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>JS Heap:</span>
                    <Badge variant={memoryUsage > 50 ? 'destructive' : 'default'}>
                      {memoryUsage}MB
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.min((memoryUsage / 100) * 100, 100)} 
                    className="h-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Hook para medir performance de componentes
export function usePerformanceMetrics(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // Marcar performance no Performance API
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
    };
  }, [componentName]);
  
  // Marcar início do render
  performance.mark(`${componentName}-render-start`);
}

// HOC para medir performance de componentes
export function withPerformanceMonitoring<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function PerformanceMonitoredComponent(props: T) {
    usePerformanceMetrics(displayName);
    return <WrappedComponent {...props} />;
  }
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return PerformanceMonitoredComponent;
}