"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

const Modal = DialogPrimitive.Root
const ModalTrigger = DialogPrimitive.Trigger
const ModalPortal = DialogPrimitive.Portal
const ModalClose = DialogPrimitive.Close

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const modalVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
      type: {
        default: "border-border",
        success: "border-green-500",
        warning: "border-yellow-500",
        error: "border-destructive",
        info: "border-blue-500",
      },
    },
    defaultVariants: {
      size: "default",
      type: "default",
    },
  }
)

export interface ModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof modalVariants> {
  showCloseButton?: boolean
  closeOnEscape?: boolean
  closeOnOverlay?: boolean
}

const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ 
  className, 
  children, 
  size, 
  type, 
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlay = true,
  ...props 
}, ref) => {
  const typeIcons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    info: Info,
    default: null,
  }
  
  const TypeIcon = typeIcons[type || "default"]
  
  return (
    <ModalPortal>
      <ModalOverlay 
        onClick={closeOnOverlay ? undefined : (e) => e.preventDefault()}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(modalVariants({ size, type }), className)}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        {...props}
      >
        {type && type !== "default" && TypeIcon && (
          <div className="flex items-center justify-center mb-4">
            <div className={cn(
              "rounded-full p-3",
              type === "success" && "bg-green-100 text-green-600",
              type === "warning" && "bg-yellow-100 text-yellow-600",
              type === "error" && "bg-red-100 text-red-600",
              type === "info" && "bg-blue-100 text-blue-600"
            )}>
              <TypeIcon className="h-6 w-6" />
            </div>
          </div>
        )}
        
        {children}
        
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
})
ModalContent.displayName = DialogPrimitive.Content.displayName

const ModalHeader = ({
  className,
  centered = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  centered?: boolean
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5",
      centered ? "text-center" : "text-left",
      className
    )}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

const ModalFooter = ({
  className,
  justify = "end",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  justify?: "start" | "center" | "end" | "between"
}) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  }
  
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:space-x-2 gap-2",
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  )
}
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
    size?: "sm" | "default" | "lg"
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg font-medium",
    default: "text-xl font-semibold",
    lg: "text-2xl font-bold",
  }
  
  return (
    <DialogPrimitive.Title
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
ModalTitle.displayName = DialogPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

// Confirmation Modal Component
export interface ConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: "default" | "success" | "warning" | "error" | "info"
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Handle error if needed
      console.error("Confirmation action failed:", error)
    }
  }
  
  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }
  
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent type={type} size="sm">
        <ModalHeader centered>
          <ModalTitle>{title}</ModalTitle>
          {description && (
            <ModalDescription>{description}</ModalDescription>
          )}
        </ModalHeader>
        
        <ModalFooter justify="center">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === "error" ? "destructive" : "default"}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export {
  Modal,
  ModalPortal,
  ModalOverlay,
  ModalClose,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
}