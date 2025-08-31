import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-md hover:shadow-lg",
        outlined: "border-2 shadow-none",
        ghost: "border-none shadow-none bg-transparent",
        gradient: "bg-gradient-to-br from-card to-card/80 shadow-md",
      },
      size: {
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md hover:-translate-y-1 active:translate-y-0",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
  disabled?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, loading, disabled, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, interactive }),
          loading && "animate-pulse",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : (
          children
        )}
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centered?: boolean
  }
>(({ className, centered = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      centered && "text-center items-center",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    size?: "sm" | "default" | "lg" | "xl"
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg font-medium",
    default: "text-2xl font-semibold",
    lg: "text-3xl font-bold",
    xl: "text-4xl font-bold",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "leading-none tracking-tight",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    muted?: boolean
  }
>(({ className, muted = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm",
      muted ? "text-muted-foreground" : "text-foreground",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean
  }
>(({ className, noPadding = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      !noPadding && "p-6 pt-0", 
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: "start" | "center" | "end" | "between" | "around"
    direction?: "row" | "col"
  }
>(({ className, justify = "end", direction = "row", ...props }, ref) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  }
  
  const directionClasses = {
    row: "flex-row space-x-2",
    col: "flex-col space-y-2",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-0",
        justifyClasses[justify],
        directionClasses[direction],
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
