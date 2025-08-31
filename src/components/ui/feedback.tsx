"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

// Enhanced Toast Component
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-500 bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100",
        warning: "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100",
        info: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Loading States Component
export interface LoadingStateProps {
  variant?: "spinner" | "dots" | "pulse" | "skeleton"
  size?: "sm" | "default" | "lg"
  text?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = "spinner",
  size = "default",
  text,
  className
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  }

  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      
      case "dots":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-current animate-pulse",
                  size === "sm" ? "h-1 w-1" : size === "lg" ? "h-3 w-3" : "h-2 w-2"
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1.4s"
                }}
              />
            ))}
          </div>
        )
      
      case "pulse":
        return (
          <div className={cn(
            "rounded-full bg-current animate-pulse",
            sizeClasses[size]
          )} />
        )
      
      case "skeleton":
        return (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        )
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {renderLoader()}
      {text && (
        <span className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
        )}>
          {text}
        </span>
      )}
    </div>
  )
}

// Progress Indicator Component
export interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  variant?: "default" | "minimal" | "detailed"
  orientation?: "horizontal" | "vertical"
  className?: string
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  variant = "default",
  orientation = "horizontal",
  className
}) => {
  const isHorizontal = orientation === "horizontal"
  
  return (
    <div className={cn(
      "flex",
      isHorizontal ? "flex-row items-center" : "flex-col",
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep
        
        return (
          <React.Fragment key={index}>
            <div className={cn(
              "flex items-center",
              !isHorizontal && "flex-col text-center"
            )}>
              {/* Step Circle */}
              <div className={cn(
                "flex items-center justify-center rounded-full border-2 transition-all duration-300",
                variant === "minimal" ? "h-3 w-3" : "h-8 w-8",
                isCompleted && "bg-primary border-primary text-primary-foreground",
                isCurrent && "bg-primary/20 border-primary text-primary animate-pulse",
                isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground"
              )}>
                {variant !== "minimal" && (
                  isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )
                )}
              </div>
              
              {/* Step Label */}
              {variant === "detailed" && (
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isHorizontal ? "ml-2" : "mt-2",
                  isCompleted && "text-primary",
                  isCurrent && "text-primary",
                  isUpcoming && "text-muted-foreground"
                )}>
                  {step}
                </span>
              )}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "transition-colors duration-300",
                isHorizontal ? "flex-1 h-0.5 mx-2" : "w-0.5 h-8 my-2 mx-auto",
                index < currentStep ? "bg-primary" : "bg-muted"
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// Status Badge Component
export interface StatusBadgeProps {
  status: "success" | "error" | "warning" | "info" | "pending" | "processing"
  text?: string
  size?: "sm" | "default" | "lg"
  animated?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = "default",
  animated = false,
  className
}) => {
  const statusConfig = {
    success: { icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-200" },
    error: { icon: AlertCircle, color: "bg-red-100 text-red-800 border-red-200" },
    warning: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    info: { icon: Info, color: "bg-blue-100 text-blue-800 border-blue-200" },
    pending: { icon: AlertCircle, color: "bg-gray-100 text-gray-800 border-gray-200" },
    processing: { icon: Loader2, color: "bg-blue-100 text-blue-800 border-blue-200" }
  }

  const config = statusConfig[status]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    default: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      config.color,
      sizeClasses[size],
      className
    )}>
      <Icon className={cn(
        iconSizes[size],
        (status === "processing" || (animated && status === "pending")) && "animate-spin"
      )} />
      {text && <span>{text}</span>}
    </span>
  )
}

// Notification Banner Component
export interface NotificationBannerProps {
  variant?: "info" | "success" | "warning" | "error"
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant = "info",
  title,
  description,
  action,
  dismissible = true,
  onDismiss,
  className
}) => {
  const variantConfig = {
    info: { icon: Info, color: "bg-blue-50 border-blue-200 text-blue-900" },
    success: { icon: CheckCircle2, color: "bg-green-50 border-green-200 text-green-900" },
    warning: { icon: AlertTriangle, color: "bg-yellow-50 border-yellow-200 text-yellow-900" },
    error: { icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-900" }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 border rounded-lg",
      config.color,
      className
    )}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{title}</h4>
        {description && (
          <p className="mt-1 text-sm opacity-90">{description}</p>
        )}
        
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className="mt-2 h-auto p-0 font-medium underline hover:no-underline"
          >
            {action.label}
          </Button>
        )}
      </div>
      
      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export { toastVariants }