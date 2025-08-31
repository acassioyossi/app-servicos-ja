
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { PhoneCall, ShieldAlert, Megaphone } from "lucide-react";
import { Button } from "../ui/button";
import { ScreenReaderOnly } from "@/components/accessibility/accessibility-utils";

export function PanicAlertDialog({ children }: { children: React.ReactNode }) {
    const { toast } = useToast();

    const handleConfirmEmergency = () => {
        toast({
            variant: "destructive",
            title: "Alerta Sonoro Ativado!",
            description: "Um alarme foi disparado no seu dispositivo para dissuadir a ameaça. Seu contato de emergência foi notificado."
        });
    }

    const handleConfirmContact = () => {
        toast({
            variant: "default",
            title: "Contato de Emergência Acionado!",
            description: "Seu contato de emergência (Maria - Mãe) foi notificado. Sua localização atual foi compartilhada."
        });
    }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent role="alertdialog" aria-labelledby="panic-title" aria-describedby="panic-description">
        <AlertDialogHeader>
          <AlertDialogTitle id="panic-title" className="flex items-center gap-2">
            <ShieldAlert className="size-6 text-destructive" aria-hidden="true" />
            Você está em uma emergência?
            <ScreenReaderOnly>Diálogo de emergência aberto</ScreenReaderOnly>
          </AlertDialogTitle>
          <AlertDialogDescription id="panic-description">
            Use estas opções com responsabilidade. Sua segurança é nossa prioridade. Sua localização será compartilhada com seu contato de segurança.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid grid-cols-1 gap-2">
          <Button 
            onClick={handleConfirmContact}
            variant="outline"
            size="lg"
            className="h-auto py-3"
            aria-label="Notificar contato pessoal de emergência Maria com sua localização atual"
            aria-describedby="contact-help"
          >
            <div className="flex items-center gap-3 text-left">
                <PhoneCall className="size-6 shrink-0" aria-hidden="true"/>
                <div>
                    <p className="font-semibold">Notificar Contato Pessoal</p>
                    <p className="text-xs text-muted-foreground" id="contact-help">Envia um alerta para Maria (Mãe) com sua localização.</p>
                </div>
            </div>
          </Button>
          <Button 
            onClick={handleConfirmEmergency}
            variant="destructive"
            size="lg"
            className="h-auto py-3"
            aria-label="Disparar alerta sonoro alto no dispositivo para dissuasão de ameaças"
            aria-describedby="alarm-help"
          >
            <div className="flex items-center gap-3 text-left">
                <Megaphone className="size-6 shrink-0" aria-hidden="true"/>
                <div>
                    <p className="font-semibold">Disparar Alerta Sonoro</p>
                    <p className="text-xs text-destructive-foreground/80" id="alarm-help">Ativa um alarme alto no seu celular para dissuasão.</p>
                </div>
            </div>
          </Button>
        </div>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel className="w-full" aria-label="Cancelar e fechar diálogo de emergência">
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
