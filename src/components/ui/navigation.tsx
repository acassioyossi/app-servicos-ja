"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronRight, Home, ArrowLeft, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

// Breadcrumb Component
export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  separator?: React.ReactNode
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
  separator = <ChevronRight className="h-4 w-4" />,
  className
}) => {
  const allItems = showHome 
    ? [{ label: "Início", href: "/", icon: <Home className="h-4 w-4" /> }, ...items]
    : items

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1", className)}>
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <span className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  isLast ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.icon}
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Back Button Component
export interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
  showIcon?: boolean
  variant?: "default" | "ghost" | "outline"
  className?: string
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  onClick,
  label = "Voltar",
  showIcon = true,
  variant = "ghost",
  className
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const content = (
    <>
      {showIcon && <ArrowLeft className="h-4 w-4" />}
      {label}
    </>
  )

  if (href) {
    return (
      <Button variant={variant} asChild className={className}>
        <Link href={href}>
          {content}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant={variant} onClick={handleClick} className={className}>
      {content}
    </Button>
  )
}

// Navigation Menu Component
const navigationVariants = cva(
  "flex items-center",
  {
    variants: {
      orientation: {
        horizontal: "flex-row space-x-1",
        vertical: "flex-col space-y-1",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "default",
    },
  }
)

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  external?: boolean
}

export interface NavigationMenuProps extends VariantProps<typeof navigationVariants> {
  items: NavigationItem[]
  activeItem?: string
  className?: string
  itemClassName?: string
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  activeItem,
  orientation,
  size,
  className,
  itemClassName
}) => {
  const pathname = usePathname()
  
  return (
    <nav className={cn(navigationVariants({ orientation, size }), className)}>
      {items.map((item, index) => {
        const isActive = activeItem ? item.href === activeItem : pathname === item.href
        const isDisabled = item.disabled
        
        const linkContent = (
          <span className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground font-medium",
            isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
            itemClassName
          )}>
            {item.icon}
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </span>
        )
        
        if (isDisabled) {
          return (
            <div key={index}>
              {linkContent}
            </div>
          )
        }
        
        return (
          <Link
            key={index}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
          >
            {linkContent}
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile Navigation Component
export interface MobileNavigationProps {
  items: NavigationItem[]
  trigger?: React.ReactNode
  title?: string
  className?: string
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  trigger,
  title = "Menu",
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  
  // Close menu when route changes
  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  
  // Close menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
        className={className}
      >
        {trigger || <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Mobile Menu */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-80 max-w-[90vw] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation Items */}
        <nav className="p-4">
          <NavigationMenu
            items={items}
            orientation="vertical"
            className="w-full"
            itemClassName="w-full justify-start"
          />
        </nav>
      </div>
    </>
  )
}

// Page Header Component
export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: BreadcrumbItem[]
  actions?: React.ReactNode
  backButton?: boolean | BackButtonProps
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  actions,
  backButton,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}
      
      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {backButton && (
              <BackButton
                {...(typeof backButton === 'object' ? backButton : {})}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}