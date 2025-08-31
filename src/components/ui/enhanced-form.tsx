"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

// Enhanced Form Field Component
export interface FormFieldProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  error?: string
  success?: string
  helperText?: string
  tooltip?: string
  required?: boolean
  disabled?: boolean
  loading?: boolean
  autoComplete?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  validation?: {
    rules: ValidationRule[]
    validateOnChange?: boolean
    validateOnBlur?: boolean
  }
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  inputClassName?: string
  multiline?: boolean
  rows?: number
}

export interface ValidationRule {
  test: (value: string) => boolean
  message: string
  type?: 'error' | 'warning'
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  value = "",
  onChange,
  onBlur,
  error,
  success,
  helperText,
  tooltip,
  required = false,
  disabled = false,
  loading = false,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  validation,
  leftIcon,
  rightIcon,
  className,
  inputClassName,
  multiline = false,
  rows = 3
}) => {
  const [internalValue, setInternalValue] = React.useState(value)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>([])
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasBeenBlurred, setHasBeenBlurred] = React.useState(false)
  
  const fieldId = `field-${name}`
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`
  
  // Sync internal value with prop
  React.useEffect(() => {
    setInternalValue(value)
  }, [value])
  
  // Validation function
  const validateValue = React.useCallback((val: string) => {
    if (!validation?.rules) return
    
    const errors: string[] = []
    const warnings: string[] = []
    
    validation.rules.forEach(rule => {
      if (!rule.test(val)) {
        if (rule.type === 'warning') {
          warnings.push(rule.message)
        } else {
          errors.push(rule.message)
        }
      }
    })
    
    setValidationErrors(errors)
    setValidationWarnings(warnings)
  }, [validation])
  
  // Handle value change
  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onChange?.(newValue)
    
    if (validation?.validateOnChange) {
      validateValue(newValue)
    }
  }
  
  // Handle blur
  const handleBlur = () => {
    setIsFocused(false)
    setHasBeenBlurred(true)
    onBlur?.()
    
    if (validation?.validateOnBlur) {
      validateValue(internalValue)
    }
  }
  
  // Handle focus
  const handleFocus = () => {
    setIsFocused(true)
  }
  
  // Determine field state
  const hasError = error || validationErrors.length > 0
  const hasWarning = validationWarnings.length > 0 && !hasError
  const hasSuccess = success && !hasError && !hasWarning
  const showValidation = hasBeenBlurred || isFocused
  
  // Character count
  const showCharCount = maxLength && (isFocused || internalValue.length > maxLength * 0.8)
  const charCount = internalValue.length
  const isNearLimit = maxLength && charCount > maxLength * 0.8
  const isOverLimit = maxLength && charCount > maxLength
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex items-center gap-2">
        <Label htmlFor={fieldId} className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:text-destructive after:ml-1",
          disabled && "opacity-50"
        )}>
          {label}
        </Label>
        
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Input Field */}
      <div className="relative">
        {multiline ? (
          <Textarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled || loading}
            required={required}
            maxLength={maxLength}
            minLength={minLength}
            rows={rows}
            className={cn(
              "resize-none",
              hasError && "border-destructive focus-visible:ring-destructive",
              hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              inputClassName
            )}
            aria-invalid={hasError}
            aria-describedby={cn(
              hasError && errorId,
              helperText && helperId
            )}
          />
        ) : (
          <Input
            id={fieldId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={internalValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled}
            loading={loading}
            required={required}
            autoComplete={autoComplete}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            leftIcon={leftIcon}
            rightIcon={rightIcon}
            error={hasError ? (error || validationErrors[0]) : undefined}
            success={hasSuccess ? success : undefined}
            className={cn(
              hasWarning && "border-yellow-500 focus-visible:ring-yellow-500",
              inputClassName
            )}
          />
        )}
        
        {/* Character Count */}
        {showCharCount && (
          <div className={cn(
            "absolute -bottom-5 right-0 text-xs",
            isOverLimit ? "text-destructive" : isNearLimit ? "text-yellow-600" : "text-muted-foreground"
          )}>
            {charCount}/{maxLength}
          </div>
        )}
      </div>
      
      {/* Validation Messages */}
      {showValidation && (
        <div className="space-y-1">
          {/* Errors */}
          {hasError && (
            <div id={errorId} className="flex items-start gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                {error && <p>{error}</p>}
                {validationErrors.map((err, index) => (
                  <p key={index}>{err}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {hasWarning && (
            <div className="flex items-start gap-1 text-xs text-yellow-600">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                {validationWarnings.map((warning, index) => (
                  <p key={index}>{warning}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Success */}
          {hasSuccess && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <p>{success}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Helper Text */}
      {helperText && !hasError && !hasWarning && (
        <p id={helperId} className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          {helperText}
        </p>
      )}
    </div>
  )
}

// Form Section Component
export interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
  className
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="space-y-1">
          {collapsible ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
            >
              <span>{title}</span>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </button>
          ) : (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      {(!collapsible || isExpanded) && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// Form Actions Component
export interface FormActionsProps {
  children: React.ReactNode
  justify?: "start" | "center" | "end" | "between"
  sticky?: boolean
  className?: string
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  justify = "end",
  sticky = false,
  className
}) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between"
  }
  
  return (
    <div className={cn(
      "flex items-center gap-3 pt-6 border-t",
      justifyClasses[justify],
      sticky && "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 -mx-6 px-6 pb-6",
      className
    )}>
      {children}
    </div>
  )
}

// Common validation rules
export const validationRules = {
  required: (message = "Este campo é obrigatório"): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message
  }),
  
  email: (message = "Digite um email válido"): ValidationRule => ({
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Mínimo de ${min} caracteres`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `Máximo de ${max} caracteres`
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    test: (value) => regex.test(value),
    message
  }),
  
  strongPassword: (message = "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo"): ValidationRule => ({
    test: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
    message
  }),
  
  phone: (message = "Digite um telefone válido"): ValidationRule => ({
    test: (value) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value.replace(/\s/g, '')),
    message
  }),
  
  cpf: (message = "Digite um CPF válido"): ValidationRule => ({
    test: (value) => {
      const cpf = value.replace(/\D/g, '')
      if (cpf.length !== 11) return false
      
      // Check for repeated digits
      if (/^(\d)\1{10}$/.test(cpf)) return false
      
      // Validate check digits
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf[i]) * (10 - i)
      }
      let digit1 = 11 - (sum % 11)
      if (digit1 > 9) digit1 = 0
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf[i]) * (11 - i)
      }
      let digit2 = 11 - (sum % 11)
      if (digit2 > 9) digit2 = 0
      
      return parseInt(cpf[9]) === digit1 && parseInt(cpf[10]) === digit2
    },
    message
  })
}