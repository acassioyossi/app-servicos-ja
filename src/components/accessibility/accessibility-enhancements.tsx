"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Skip Link Component for keyboard navigation
export interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  )
}

// Focus Trap Hook
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = React.useRef<HTMLElement>(null)
  
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])
  
  return containerRef
}

// Announce to Screen Readers
export const useAnnouncer = () => {
  const announcerRef = React.useRef<HTMLDivElement>(null)
  
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return
    
    announcerRef.current.setAttribute('aria-live', priority)
    announcerRef.current.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = ''
      }
    }, 1000)
  }, [])
  
  const AnnouncerComponent = React.useCallback(() => (
    <div
      ref={announcerRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  ), [])
  
  return { announce, AnnouncerComponent }
}

// Keyboard Navigation Hook
export const useKeyboardNavigation = ({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onHome,
  onEnd,
}: {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onHome?: () => void
  onEnd?: () => void
} = {}) => {
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.()
        break
      case 'Enter':
        onEnter?.()
        break
      case 'ArrowUp':
        e.preventDefault()
        onArrowUp?.()
        break
      case 'ArrowDown':
        e.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowLeft':
        onArrowLeft?.()
        break
      case 'ArrowRight':
        onArrowRight?.()
        break
      case 'Home':
        e.preventDefault()
        onHome?.()
        break
      case 'End':
        e.preventDefault()
        onEnd?.()
        break
    }
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onHome, onEnd])
  
  return { handleKeyDown }
}

// Focus Management Hook
export const useFocusManagement = () => {
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  
  const saveFocus = React.useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])
  
  const restoreFocus = React.useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])
  
  const focusFirst = React.useCallback((container: HTMLElement) => {
    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    focusableElement?.focus()
  }, [])
  
  return { saveFocus, restoreFocus, focusFirst }
}

// Accessible Modal Component
export interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className
}) => {
  const modalRef = useFocusTrap(isOpen)
  const { announce } = useAnnouncer()
  const { saveFocus, restoreFocus } = useFocusManagement()
  const { handleKeyDown } = useKeyboardNavigation({
    onEscape: onClose
  })
  
  React.useEffect(() => {
    if (isOpen) {
      saveFocus()
      announce(`Modal aberto: ${title}`, 'assertive')
      document.body.style.overflow = 'hidden'
    } else {
      restoreFocus()
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, title, saveFocus, restoreFocus, announce])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-lg font-semibold mb-2">
          {title}
        </h2>
        
        {description && (
          <p id="modal-description" className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
        )}
        
        {children}
      </div>
    </div>
  )
}

// Accessible List Component
export interface AccessibleListProps {
  items: Array<{
    id: string
    content: React.ReactNode
    onClick?: () => void
    disabled?: boolean
  }>
  selectedId?: string
  onSelectionChange?: (id: string) => void
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export const AccessibleList: React.FC<AccessibleListProps> = ({
  items,
  selectedId,
  onSelectionChange,
  orientation = 'vertical',
  className
}) => {
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)
  
  const { handleKeyDown } = useKeyboardNavigation({
    onArrowUp: orientation === 'vertical' ? () => {
      setFocusedIndex(prev => Math.max(0, prev - 1))
    } : undefined,
    onArrowDown: orientation === 'vertical' ? () => {
      setFocusedIndex(prev => Math.min(items.length - 1, prev + 1))
    } : undefined,
    onArrowLeft: orientation === 'horizontal' ? () => {
      setFocusedIndex(prev => Math.max(0, prev - 1))
    } : undefined,
    onArrowRight: orientation === 'horizontal' ? () => {
      setFocusedIndex(prev => Math.min(items.length - 1, prev + 1))
    } : undefined,
    onHome: () => setFocusedIndex(0),
    onEnd: () => setFocusedIndex(items.length - 1),
    onEnter: () => {
      const item = items[focusedIndex]
      if (item && !item.disabled) {
        item.onClick?.()
        onSelectionChange?.(item.id)
      }
    }
  })
  
  React.useEffect(() => {
    const listItems = listRef.current?.querySelectorAll('[role="option"]')
    const focusedItem = listItems?.[focusedIndex] as HTMLElement
    focusedItem?.focus()
  }, [focusedIndex])
  
  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        "focus:outline-none",
        orientation === 'vertical' ? "space-y-1" : "flex space-x-1",
        className
      )}
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={selectedId === item.id}
          aria-disabled={item.disabled}
          tabIndex={index === focusedIndex ? 0 : -1}
          onClick={() => {
            if (!item.disabled) {
              item.onClick?.()
              onSelectionChange?.(item.id)
              setFocusedIndex(index)
            }
          }}
          onFocus={() => setFocusedIndex(index)}
          className={cn(
            "cursor-pointer rounded px-3 py-2 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            selectedId === item.id && "bg-accent text-accent-foreground",
            item.disabled && "opacity-50 cursor-not-allowed",
            !item.disabled && "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {item.content}
        </li>
      ))}
    </ul>
  )
}

// Accessible Form Label with Required Indicator
export interface AccessibleLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  className?: string
}

export const AccessibleLabel: React.FC<AccessibleLabelProps> = ({
  htmlFor,
  children,
  required = false,
  className
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium", className)}
    >
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-label="obrigatório">
          *
        </span>
      )}
    </label>
  )
}

// Live Region for Dynamic Content Updates
export interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  className
}) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn("sr-only", className)}
    >
      {message}
    </div>
  )
}

// Accessible Progress Bar
export interface AccessibleProgressProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className
}) => {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progresso: ${percentage}%`}
        className="w-full bg-muted rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}