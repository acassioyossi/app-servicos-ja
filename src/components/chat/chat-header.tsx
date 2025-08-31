"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  MoreVertical,
  Phone,
  Video,
  CalendarPlus,
  Clock,
  ShieldAlert,
  XCircle,
  MessageSquare,
  Star,
  Info
} from "lucide-react";
import { PanicAlertDialog } from "./panic-alert-dialog";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  professionalName: string;
  professionalAvatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  rating?: number;
  totalReviews?: number;
  showPaymentButton?: boolean;
  negotiationAccepted?: boolean;
  paymentData?: {
    professionalName: string;
    service: string;
    amount: number;
  };
  onPayment?: (data: any) => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSchedule?: () => void;
  onExtend?: () => void;
  onCancel?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

export function ChatHeader({
  professionalName,
  professionalAvatar = "https://placehold.co/100x100.png",
  isOnline = true,
  lastSeen,
  rating,
  totalReviews,
  showPaymentButton = false,
  negotiationAccepted = false,
  paymentData,
  onPayment,
  onCall,
  onVideoCall,
  onSchedule,
  onExtend,
  onCancel,
  onViewProfile,
  className
}: ChatHeaderProps) {
  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handlePayment = () => {
    if (onPayment && paymentData) {
      onPayment(paymentData);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between border-b p-4 gap-4 w-full bg-background",
      className
    )}>
      {/* Professional info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={professionalAvatar} 
              alt={professionalName} 
              data-ai-hint="professional portrait" 
            />
            <AvatarFallback className="text-lg font-semibold">
              {professionalName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Online status indicator */}
          <div className={cn(
            "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg truncate">{professionalName}</h2>
            {rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                {totalReviews && (
                  <span className="text-xs text-muted-foreground">({totalReviews})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {isOnline ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm text-muted-foreground">Online</p>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <p className="text-sm text-muted-foreground">
                  {lastSeen ? `Visto ${formatLastSeen(lastSeen)}` : "Offline"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Payment button */}
        {showPaymentButton && (
          <Button 
            size="sm" 
            onClick={handlePayment}
            disabled={!negotiationAccepted}
            className="hidden sm:flex"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar e Pagar
          </Button>
        )}

        {/* Quick action buttons for larger screens */}
        <div className="hidden md:flex items-center gap-1">
          {onCall && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCall}
              aria-label="Ligar para o profissional"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          
          {onVideoCall && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onVideoCall}
              aria-label="Iniciar chamada de vídeo"
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mais opções">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            {/* Mobile payment option */}
            {showPaymentButton && (
              <>
                <DropdownMenuItem 
                  onClick={handlePayment}
                  disabled={!negotiationAccepted}
                  className="sm:hidden"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalizar e Pagar
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden" />
              </>
            )}

            {/* Profile option */}
            {onViewProfile && (
              <>
                <DropdownMenuItem onClick={onViewProfile}>
                  <Info className="mr-2 h-4 w-4" />
                  Ver Perfil Completo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Communication options */}
            {onCall && (
              <DropdownMenuItem onClick={onCall} className="md:hidden">
                <Phone className="mr-2 h-4 w-4" />
                Ligar para o profissional
              </DropdownMenuItem>
            )}
            
            {onVideoCall && (
              <DropdownMenuItem onClick={onVideoCall} className="md:hidden">
                <Video className="mr-2 h-4 w-4" />
                Iniciar chamada de vídeo
              </DropdownMenuItem>
            )}
            
            {(onCall || onVideoCall) && <DropdownMenuSeparator className="md:hidden" />}

            {/* Service management options */}
            {onSchedule && (
              <DropdownMenuItem onClick={onSchedule}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Agendar Serviço
              </DropdownMenuItem>
            )}
            
            {onExtend && (
              <DropdownMenuItem onClick={onExtend}>
                <Clock className="mr-2 h-4 w-4" />
                Estender Serviço
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />

            {/* Emergency options */}
            <DropdownMenuItem asChild>
              <PanicAlertDialog>
                <div className="flex items-center w-full text-destructive cursor-pointer">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Botão de Pânico
                </div>
              </PanicAlertDialog>
            </DropdownMenuItem>
            
            {onCancel && (
              <DropdownMenuItem 
                onClick={onCancel} 
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Serviço
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}