

"use client";

import { create } from "zustand";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star, CreditCard, Coins, Heart, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { calculateWayneCash, CalculateWayneCashOutput } from "@/ai/flows/calculate-wayne-cash";
import { calculateWayneCashBonusProfessional, CalculateWayneCashBonusProfessionalOutput } from "@/ai/flows/calculate-wayne-cash-bonus-professional";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { ScreenReaderOnly, useScreenReaderAnnouncements, LiveRegion } from "@/components/accessibility/accessibility-utils";


interface PaymentDialogStore {
  isOpen: boolean;
  data?: { professionalName: string; service: string; amount: number };
  onOpen: (data: { professionalName: string; service: string; amount: number }) => void;
  onClose: () => void;
  setData: (data: { professionalName: string; service: string; amount: number }) => void;
}

export const usePaymentDialog = create<PaymentDialogStore>((set) => ({
  isOpen: false,
  data: undefined,
  onOpen: (data) => set({ isOpen: true, data }),
  onClose: () => set({ isOpen: false, data: undefined }),
  setData: (data) => set((state) => ({ ...state, data })),
}));

const PIXIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.228 2.023c.31-.63.953-.849 1.4-.498l4.428 3.543c.448.35.448.947 0 1.298l-4.428 3.543c-.448.35-1.09.13-1.4-.498l-1.786-3.214a.73.73 0 0 1 0-.66L12.228 2.023Z"/>
        <path d="M21.5 9.423v5.154c0 .486-.537.81-1.002.59l-4.27-1.996a1.46 1.46 0 0 1-1.455-2.528l1.786-3.214"/>
        <path d="m2.5 9.423 4.27 1.996a1.46 1.46 0 0 0 1.455-2.528L6.438 5.677c.31-.63-.33-1.28-1.4-1.088L2.5 5.34v4.083Z"/>
        <path d="m14.28 21.977-1.786-3.214a.73.73 0 0 0 0-.66l1.786-3.214c.31-.63.953-.849 1.4-.498l4.428 3.543c.448.35.448.947 0 1.298l-4.428 3.543c-.448.35-1.09.13-1.4-.498Z"/>
    </svg>
)

export function PaymentDialog() {
  const { isOpen, onClose, data } = usePaymentDialog();
  const { toast } = useToast();
  const router = useRouter();
  const { announce } = useScreenReaderAnnouncements();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tip, setTip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBonuses, setIsLoadingBonuses] = useState(false);
  
  const [clientBonus, setClientBonus] = useState<CalculateWayneCashOutput | null>(null);
  const [professionalBonus, setProfessionalBonus] = useState<CalculateWayneCashBonusProfessionalOutput | null>(null);

  const totalAmount = (data?.amount || 0) + (parseFloat(tip) || 0);
  
  const isApprentice = data?.service?.toLowerCase().includes("jovem aprendiz");
  const isTipForInfo = data?.service?.toLowerCase().includes("gorjeta por informação");


  useEffect(() => {
      async function fetchBonuses() {
        if (!isOpen || !data || data.amount <= 0) {
            setClientBonus(null);
            setProfessionalBonus(null);
            return;
        };

        setIsLoadingBonuses(true);
        try {
            const clientBonusPromise = calculateWayneCash({ serviceValue: data.amount });
            let professionalBonusPromise;
            // Jovem Aprendiz does not receive professional bonus, so we don't call the flow.
            if (!isApprentice) {
                 professionalBonusPromise = calculateWayneCashBonusProfessional({ serviceValue: data.amount });
            }

             const [clientBonusResult, professionalBonusResult] = await Promise.all([
                clientBonusPromise,
                professionalBonusPromise
            ]);

            setClientBonus(clientBonusResult);
            if(professionalBonusResult) setProfessionalBonus(professionalBonusResult);

        } catch (error) {
            console.error("Failed to calculate bonuses:", error);
            // Don't show a toast here, just fail silently.
        } finally {
            setIsLoadingBonuses(false);
        }
      }

      fetchBonuses();

  }, [isOpen, data, isApprentice]);

  async function handlePayment() {
    if (rating === 0 && !isTipForInfo) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, avalie o profissional antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (isTipForInfo && totalAmount <= 0) {
        toast({
            title: "Valor necessário",
            description: "Por favor, insira um valor para a gorjeta.",
            variant: "destructive",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        let toastTitle = "Pagamento Concluído!";
        let toastDescription = "Obrigado por usar nossos serviços!";
        
        if (isTipForInfo) {
            toastTitle = "Gorjeta Enviada!";
            toastDescription = `Você enviou uma gorjeta de R$ ${totalAmount.toFixed(2)} para ${data.professionalName}.`;
        } else if (clientBonus) {
            toastDescription = `Você ganhou WC ${clientBonus.clientBonus.toFixed(2)} de volta!`;
            if (professionalBonus) {
                toastDescription += ` O profissional também ganhou um bônus de WC ${professionalBonus.professionalBonus.toFixed(2)}.`;
            }
        }
        
        toast({
            title: toastTitle,
            description: toastDescription,
        });

        handleClose();
        router.push("/dashboard/client");
        
    } catch(error) {
        console.error("Payment failed:", error);
        toast({
            variant: "destructive",
            title: "Erro no Pagamento",
            description: "Não foi possível processar o pagamento. Tente novamente.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  function handleClose() {
    if (isLoading) return;
    setRating(0);
    setHoverRating(0);
    setPaymentMethod("credit-card");
    setTip('');
    setClientBonus(null);
    setProfessionalBonus(null);
    onClose();
  }

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        onInteractOutside={(e) => { if(isLoading) e.preventDefault()}} 
        className="sm:max-w-md"
        role="dialog"
        aria-labelledby="payment-dialog-title"
        aria-describedby="payment-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="payment-dialog-title" className="text-center text-2xl">{isTipForInfo ? "Gorjeta por Informação" : "Serviço Concluído"}</DialogTitle>
          <DialogDescription id="payment-dialog-description" className="text-center">
             {isTipForInfo 
                ? `Envie uma gorjeta para ${data.professionalName} pela ajuda fornecida.`
                : `Finalize o pagamento para ${data.professionalName} pelo serviço de ${data.service}.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <LiveRegion message={isLoading ? "Processando pagamento, aguarde..." : undefined} />
        
        <div className="my-4 text-center">
            <p className="text-muted-foreground">Valor Total a Pagar</p>
            <p className="text-4xl font-bold text-primary">R$ {totalAmount.toFixed(2)}</p>
            {parseFloat(tip) > 0 && !isTipForInfo && (
                 <p className="text-sm text-muted-foreground">
                    (Serviço: R$ {(data?.amount || 0).toFixed(2)} + Gorjeta: R$ {parseFloat(tip).toFixed(2)})
                </p>
            )}
        </div>

        <div className="space-y-6">
            {!isTipForInfo && (
                <div>
                    <Label className="font-semibold" id="rating-label">Avalie o profissional</Label>
                    <div 
                        className="mt-2 flex justify-center space-x-1"
                        role="radiogroup"
                        aria-labelledby="rating-label"
                        aria-required="true"
                    >
                    {[...Array(5)].map((_, index) => {
                        const starValue = index + 1;
                        return (
                        <button
                            key={starValue}
                            type="button"
                            role="radio"
                            aria-checked={starValue === rating}
                            aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
                            className={`cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded ${
                            starValue <= (hoverRating || rating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                            onClick={() => {
                                setRating(starValue);
                                announce(`Avaliação definida para ${starValue} estrela${starValue > 1 ? 's' : ''}`);
                            }}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                        >
                            <Star size={32} aria-hidden="true" />
                        </button>
                        );
                    })}
                    </div>
                    <ScreenReaderOnly>
                        <div aria-live="polite">
                            {rating > 0 ? `Avaliação atual: ${rating} estrela${rating > 1 ? 's' : ''}` : 'Nenhuma avaliação selecionada'}
                        </div>
                    </ScreenReaderOnly>
                </div>
            )}
            <div>
                 <Label htmlFor="tip" className="font-semibold flex items-center gap-2">
                    <Heart className="text-destructive" aria-hidden="true" />
                    {isTipForInfo ? "Valor da Gorjeta" : "Adicionar Gorjeta (Opcional)"}
                </Label>
                 <Input 
                    id="tip"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 10.00"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    className="mt-2"
                    aria-describedby="tip-description"
                    aria-required={isTipForInfo}
                />
                <ScreenReaderOnly>
                    <div id="tip-description">
                        {isTipForInfo ? "Digite o valor da gorjeta em reais" : "Campo opcional para adicionar gorjeta"}
                    </div>
                </ScreenReaderOnly>
            </div>
             <div>
                <Label className="font-semibold" id="payment-method-label">Forma de Pagamento</Label>
                <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value) => {
                        setPaymentMethod(value);
                        announce(`Método de pagamento selecionado: ${value === 'credit-card' ? 'Cartão de Crédito' : value === 'pix' ? 'PIX' : 'Wayne Cash'}`);
                    }} 
                    className="mt-2 grid grid-cols-1 gap-2"
                    aria-labelledby="payment-method-label"
                    aria-required="true"
                >
                    <Label htmlFor="credit-card" className="flex items-center gap-3 rounded-md border p-3 has-[input:checked]:border-primary cursor-pointer">
                        <RadioGroupItem value="credit-card" id="credit-card" aria-describedby="credit-card-desc" />
                        <CreditCard aria-hidden="true" />
                        Cartão de Crédito
                        <ScreenReaderOnly>
                            <span id="credit-card-desc">Pagar com cartão de crédito</span>
                        </ScreenReaderOnly>
                    </Label>
                     <Label htmlFor="pix" className="flex items-center gap-3 rounded-md border p-3 has-[input:checked]:border-primary cursor-pointer">
                        <RadioGroupItem value="pix" id="pix" aria-describedby="pix-desc" />
                        <div aria-hidden="true"><PIXIcon /></div>
                        PIX
                        <ScreenReaderOnly>
                            <span id="pix-desc">Pagar com PIX - transferência instantânea</span>
                        </ScreenReaderOnly>
                    </Label>
                     <Label htmlFor="wayne-cash" className="flex items-center gap-3 rounded-md border p-3 has-[input:checked]:border-primary cursor-pointer">
                        <RadioGroupItem value="wayne-cash" id="wayne-cash" aria-describedby="wayne-cash-desc" />
                        <Coins aria-hidden="true" />
                        Wayne Cash (Saldo: WC 25,50)
                        <ScreenReaderOnly>
                            <span id="wayne-cash-desc">Pagar com Wayne Cash - saldo disponível: 25 reais e 50 centavos</span>
                        </ScreenReaderOnly>
                    </Label>
                </RadioGroup>
            </div>
             {data.amount > 0 && (
                <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                    <Label className="font-semibold">Recompensas Wayne Cash</Label>
                    {isLoadingBonuses ? <Skeleton className="h-10 w-full" /> : 
                     clientBonus ? (
                        <div className="text-sm space-y-1">
                             <div className="flex justify-between items-center">
                                <p>Você receberá:</p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                   + WC {clientBonus.clientBonus.toFixed(2)}
                                </Badge>
                             </div>
                             {professionalBonus && (
                                 <div className="flex justify-between items-center">
                                    <p>{data.professionalName} receberá:</p>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                       + WC {professionalBonus.professionalBonus.toFixed(2)}
                                    </Badge>
                                 </div>
                             )}
                        </div>
                     ) : (
                        <p className="text-sm text-muted-foreground">Nenhum bônus para este serviço.</p>
                     )
                    }
                </div>
             )}
        </div>

        <Button 
          onClick={handlePayment} 
          className="mt-6 w-full" 
          size="lg" 
          disabled={isLoading}
          aria-describedby={isLoading ? "payment-processing-status" : undefined}
          aria-label={isLoading ? "Processando pagamento, aguarde" : isTipForInfo ? `Enviar gorjeta de ${totalAmount.toFixed(2)} reais` : `Confirmar pagamento de ${totalAmount.toFixed(2)} reais`}
        >
          {isLoading ? (
            <>
                <Loader2 className="mr-2 animate-spin" aria-hidden="true" />
                Processando Pagamento...
                <ScreenReaderOnly>
                    <span id="payment-processing-status">Aguarde enquanto processamos seu pagamento</span>
                </ScreenReaderOnly>
            </>
          ): isTipForInfo ? `Enviar Gorjeta de R$ ${totalAmount.toFixed(2)}` : `Pagar R$ ${totalAmount.toFixed(2)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
