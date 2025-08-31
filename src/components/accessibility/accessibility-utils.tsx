"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente para texto apenas para leitores de tela
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span 
      className={cn(
        "sr-only absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden",
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Componente para pular para o conteúdo principal
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      Pular para o conteúdo principal
    </a>
  );
}

/**
 * Hook para gerenciar foco programático
 */
export function useFocusManagement() {
  const focusElement = React.useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }, []);

  const focusFirstInteractiveElement = React.useCallback((container?: HTMLElement) => {
    const containerElement = container || document;
    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  }, []);

  const trapFocus = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    focusElement,
    focusFirstInteractiveElement,
    trapFocus,
  };
}

/**
 * Hook para anúncios de leitores de tela
 */
export function useScreenReaderAnnouncements() {
  const [announcements, setAnnouncements] = React.useState<string[]>([]);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);
    
    // Criar elemento temporário para anúncio
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover após um tempo
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
      setAnnouncements(prev => prev.filter(a => a !== message));
    }, 1000);
  }, []);

  return { announce, announcements };
}

/**
 * Componente para região de anúncios ao vivo
 */
interface LiveRegionProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ message, priority = 'polite', className }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  );
}

/**
 * Componente para melhorar a navegação por teclado
 */
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export function KeyboardNavigation({ 
  children, 
  onEscape, 
  onEnter, 
  className 
}: KeyboardNavigationProps) {
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          onEnter();
        }
        break;
    }
  }, [onEscape, onEnter]);

  return (
    <div 
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

/**
 * Componente para indicador de foco visível
 */
interface FocusIndicatorProps {
  children: React.ReactNode;
  className?: string;
}

export function FocusIndicator({ children, className }: FocusIndicatorProps) {
  return (
    <div 
      className={cn(
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded-md",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Hook para detectar preferências de acessibilidade
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = React.useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersLargeText: false,
  });

  React.useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersLargeText: window.matchMedia('(min-resolution: 2dppx)').matches,
      });
    };

    updatePreferences();

    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(min-resolution: 2dppx)'),
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  return preferences;
}

/**
 * Componente para texto alternativo dinâmico
 */
interface DynamicAltTextProps {
  src: string;
  alt: string;
  fallbackAlt?: string;
  className?: string;
}

export function AccessibleImage({ 
  src, 
  alt, 
  fallbackAlt = "Imagem não disponível", 
  className 
}: DynamicAltTextProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <>
      {isLoading && (
        <ScreenReaderOnly>Carregando imagem: {alt}</ScreenReaderOnly>
      )}
      <img
        src={src}
        alt={hasError ? fallbackAlt : alt}
        className={className}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        role="img"
      />
      {hasError && (
        <ScreenReaderOnly>Erro ao carregar imagem: {alt}</ScreenReaderOnly>
      )}
    </>
  );
}