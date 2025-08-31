import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, AlertCircle, CheckCircle2, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:ring-ring",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  success?: string
  helperText?: string
  showPasswordToggle?: boolean
  clearable?: boolean
  onClear?: () => void
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    size,
    leftIcon,
    rightIcon,
    error,
    success,
    helperText,
    showPasswordToggle = false,
    clearable = false,
    onClear,
    loading = false,
    disabled,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [inputType, setInputType] = React.useState(type)
    
    // Determine variant based on validation state
    const effectiveVariant = error ? "error" : success ? "success" : variant
    
    // Handle password toggle
    React.useEffect(() => {
      if (showPasswordToggle && type === "password") {
        setInputType(showPassword ? "text" : "password")
      } else {
        setInputType(type)
      }
    }, [showPassword, type, showPasswordToggle])
    
    const hasValue = value !== undefined && value !== null && value !== ""
    const showClearButton = clearable && hasValue && !disabled && !loading
    
    return (
      <div className="relative w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: effectiveVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || showPasswordToggle || showClearButton) && "pr-10",
              loading && "cursor-wait",
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            value={value}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error ? `${props.id}-error` : 
              success ? `${props.id}-success` : 
              helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            )}
            
            {showClearButton && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {showPasswordToggle && type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {rightIcon && !showPasswordToggle && !showClearButton && !loading && (
              <div className="text-muted-foreground">
                {rightIcon}
              </div>
            )}
            
            {error && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            
            {success && !error && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        
        {(error || success || helperText) && (
          <div className="mt-1 text-xs">
            {error && (
              <p id={`${props.id}-error`} className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
            {success && !error && (
              <p id={`${props.id}-success`} className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {success}
              </p>
            )}
            {helperText && !error && !success && (
              <p id={`${props.id}-helper`} className="text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
