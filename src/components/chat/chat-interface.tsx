

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateMarketPrice } from "@/lib/pricing";
import { diagnoseServiceIssue } from "@/lib/ai-diagnosis";
import { MessageList, type Message } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatHeader } from "./chat-header";
import { AIErrorBoundary } from "@/components/ai-error-boundary";
import { cn } from "@/lib/utils";
import { usePaymentDialog } from "../payment/payment-dialog";
import { useSearchParams } from 'next/navigation';
import type { DiagnoseServiceIssueOutput, CalculateMarketPriceOutput } from "@/types/ai";




interface ChatInterfaceProps {
  professionalName: string;
  isTransportService?: boolean;
}

export function ChatInterface({ professionalName, isTransportService = false }: ChatInterfaceProps) {
  const { toast } = useToast();
  const { onOpen } = usePaymentDialog();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Olá! Sou o ${professionalName}. Vi que você precisa de ajuda. Pode me contar mais detalhes?`,
      sender: "other",
      avatar: "https://placehold.co/100x100.png",
      timestamp: new Date()
    }
  ]);
  const [negotiationAccepted, setNegotiationAccepted] = useState(false);
  const [analyzingMessageId, setAnalyzingMessageId] = useState<number | null>(null);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const showPaymentButton = useMemo(() => {
     return negotiationAccepted || isTransportService;
   }, [negotiationAccepted, isTransportService]);
 
   const paymentData = useMemo(() => {
     if (isTransportService) {
       return { professionalName, service: professionalName, amount: 150 };
     }
     const acceptedNegotiation = messages.find(m => m.negotiation?.type === 'accepted');
     if (acceptedNegotiation?.negotiation) {
       return { 
         professionalName, 
         service: professionalName, 
         amount: acceptedNegotiation.negotiation.amount 
       };
     }
     return null;
   }, [messages, professionalName, isTransportService]);

  const handleSuggestPrice = async () => {
    setIsSuggestingPrice(true);
    try {
      const result = await calculateMarketPrice({
        serviceType: professionalName,
        location: "São Paulo, SP",
        urgency: "normal",
        complexity: "medium"
      });
      
      const newMessage: Message = {
        id: messages.length + 1,
        text: "",
        sender: "system",
        avatar: "https://placehold.co/100x100.png",
        timestamp: new Date(),
        aiSuggestion: {
          suggestedPrice: result.suggestedPrice,
          explanation: result.explanation,
          marketContext: result.marketContext
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível calcular o preço sugerido.",
        variant: "destructive"
      });
    } finally {
      setIsSuggestingPrice(false);
    }
  };





  
  const handleAcceptProposal = (messageId: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.negotiation) {
        return {
          ...msg,
          negotiation: {
            ...msg.negotiation,
            type: "accepted"
          }
        };
      }
      return msg;
    }));
    setNegotiationAccepted(true);
    
    toast({
      title: "Proposta aceita!",
      description: "Agora você pode finalizar o pagamento.",
    });
  };

  const handleDeclineProposal = (messageId: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.negotiation) {
        return {
          ...msg,
          negotiation: {
            ...msg.negotiation,
            type: "declined"
          }
        };
      }
      return msg;
    }));
    
    toast({
      title: "Proposta recusada",
      description: "Você pode enviar uma nova proposta.",
    });
  };


  
  const handleAnalyzeImage = async (imageUrl: string, messageId: number) => {
    setAnalyzingMessageId(messageId);
    try {
      const result = await diagnoseServiceIssue({
        imageUrl,
        serviceType: professionalName,
        description: "Análise de imagem para diagnóstico"
      });
      
      const analysisMessage: Message = {
        id: messages.length + 1,
        text: "",
        sender: "system",
        avatar: "https://placehold.co/100x100.png",
        timestamp: new Date(),
        aiAnalysis: {
          likelyCause: result.likelyCause,
          suggestedSteps: result.suggestedSteps,
          requiredTools: result.requiredTools,
          estimatedTime: result.estimatedTime,
          riskLevel: result.riskLevel
        }
      };
      
      setMessages(prev => [...prev, analysisMessage]);
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a imagem.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingMessageId(null);
    }
  };




  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Auto-reply logic
    if (lastMessage?.sender === 'me' && !lastMessage.negotiation && !lastMessage.mediaUrl) {
        const hasPendingProposal = messages.some(m => m.sender === 'me' && m.negotiation?.type === 'proposal' && !messages.some(n => n.negotiation?.type === 'accepted'));
        if (hasPendingProposal) return; // Don't auto-reply if waiting for professional's response
        
        const timer = setTimeout(() => {
            setMessages(prevMessages => [
                ...prevMessages, 
                {
                    id: Date.now(),
                    text: "Entendido.",
                    sender: 'other',
                    avatar: "https://placehold.co/100x100.png"
                }
            ]);
        }, 1500);
        return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);






  return (
    <AIErrorBoundary>
      <div className="flex flex-col h-full max-h-[700px] bg-background border rounded-lg shadow-sm">
        {/* Enhanced Header with Status */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://placehold.co/40x40.png" 
                  alt={professionalName}
                  className="w-10 h-10 rounded-full"
                />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>
              
              <div>
                <h3 className="font-semibold">{professionalName}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{professionalRating}</span>
                  </div>
                  <StatusBadge 
                    status={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'processing' : 'error'}
                    text={connectionStatus === 'connected' ? 'Online' : connectionStatus === 'connecting' ? 'Conectando' : 'Offline'}
                    size="sm"
                    animated={connectionStatus === 'connecting'}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Service Info Card */}
          {showServiceInfo && (estimatedArrival || location) && (
            <Card className="mt-3">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    {estimatedArrival && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Chegada: {estimatedArrival}</span>
                      </div>
                    )}
                    {location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowServiceInfo(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            analyzingMessageId={analyzingMessageId}
            onAcceptProposal={handleAcceptProposal}
            onDeclineProposal={handleDeclineProposal}
            onAnalyzeImage={handleAnalyzeImage}
            scrollAreaRef={scrollAreaRef}
          />
        </div>
        
        {/* Enhanced Input Area */}
        <div className="border-t p-4 space-y-3">
          {/* Quick Actions */}
          {!negotiationAccepted && !isTransportService && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSuggestPrice}
                disabled={isSuggestingPrice}
                className="text-xs"
              >
                {isSuggestingPrice ? (
                  <LoadingState variant="spinner" size="sm" />
                ) : (
                  "💡 Sugerir Preço"
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const quickMessages = [
                    "Qual é o prazo para conclusão?",
                    "Você tem experiência com esse tipo de serviço?",
                    "Pode me enviar algumas referências?"
                  ];
                  const randomMessage = quickMessages[Math.floor(Math.random() * quickMessages.length)];
                  handleSendMessage(randomMessage);
                }}
              >
                ❓ Pergunta Rápida
              </Button>
            </div>
          )}
          
          {/* Payment Button */}
          {showPaymentButton && paymentData && (
            <NotificationBanner
              variant="success"
              title="Serviço Acordado"
              description={`Valor: R$ ${paymentData.amount} - Clique para pagar`}
              action={{
                label: "💳 Pagar Agora",
                onClick: () => onOpen(paymentData)
              }}
              dismissible={false}
            />
          )}
          
          {/* Message Input */}
          <MessageInput
            onSuggestPrice={handleSuggestPrice}
            isSuggestingPrice={isSuggestingPrice}
            onSendMessage={handleSendMessage}
            onSendFile={(file) => {
              const fileUrl = URL.createObjectURL(file);
              const message: Message = {
                id: messages.length + 1,
                text: `Arquivo enviado: ${file.name}`,
                sender: "me",
                avatar: "https://placehold.co/100x100.png",
                timestamp: new Date(),
                media: {
                  type: file.type.startsWith('image/') ? 'image' : 'video',
                  url: fileUrl,
                  name: file.name
                }
              };
              setMessages(prev => [...prev, message]);
            }}
            onSendProposal={(amount) => {
              const message: Message = {
                id: messages.length + 1,
                text: "",
                sender: "me",
                avatar: "https://placehold.co/100x100.png",
                timestamp: new Date(),
                negotiation: {
                  type: "sent",
                  amount: amount,
                  description: `Proposta de orçamento: R$ ${amount.toFixed(2)}`
                }
              };
              setMessages(prev => [...prev, message]);
            }}
            disabled={connectionStatus !== 'connected'}
            placeholder={connectionStatus !== 'connected' ? 'Reconectando...' : 'Digite sua mensagem...'}
          />
        </div>
      </div>
    </AIErrorBoundary>
  );
}
