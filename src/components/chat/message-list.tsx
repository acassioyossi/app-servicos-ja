"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { generateAudio } from "@/lib/audio";
import {
  Loader2,
  Pause,
  Megaphone,
  Wand2,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Bot as AiIcon
} from "lucide-react";
import Image from "next/image";

export interface Message {
  id: number;
  text?: string;
  sender: 'me' | 'other' | 'system';
  avatar?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  negotiation?: {
    type: 'proposal' | 'accepted' | 'declined';
    amount: number;
  };
  analysis?: {
    probableCause: string;
    suggestedSteps: string[];
    requiredToolsAndMaterials: string[];
  };
  priceSuggestion?: {
    suggestedPrice: number;
    explanation: string;
    marketContext?: {
      pricePerUnit: number;
      priceType: string;
    };
  };
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageListProps {
  messages: Message[];
  professionalName: string;
  isTyping?: boolean;
  onAnalyzeImage?: (messageId: number) => void;
  onAcceptProposal?: (amount: number) => void;
  onDeclineProposal?: (amount: number) => void;
  analyzingMessageId?: number | null;
  className?: string;
  scrollAreaRef?: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  professionalName,
  isTyping = false,
  onAnalyzeImage,
  onAcceptProposal,
  onDeclineProposal,
  analyzingMessageId,
  className,
  scrollAreaRef
}: MessageListProps) {
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handlePlayAudio = async (messageId: number, text: string) => {
    if (loadingAudioId === messageId) return;

    // If another audio is playing, pause it
    if (playingMessageId !== null && audioRef.current) {
      audioRef.current.pause();
      setPlayingMessageId(null);
    }

    // If the clicked message is already playing, pause it
    if (playingMessageId === messageId && audioRef.current) {
      audioRef.current.pause();
      setPlayingMessageId(null);
      return;
    }

    setLoadingAudioId(messageId);
    try {
      const { media } = await generateAudio(text);
      if (audioRef.current) {
        audioRef.current.src = media;
        audioRef.current.play();
        setPlayingMessageId(messageId);
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
      toast({
        variant: "destructive",
        title: "Erro de Áudio",
        description: "Não foi possível gerar o áudio."
      });
    } finally {
      setLoadingAudioId(null);
    }
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return "";
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
      case 'sent':
        return <div className="w-3 h-3 rounded-full bg-muted-foreground" />;
      case 'delivered':
        return <div className="w-3 h-3 rounded-full bg-blue-500" />;
      case 'read':
        return <div className="w-3 h-3 rounded-full bg-green-500" />;
      case 'failed':
        return <div className="w-3 h-3 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  return (
    <ScrollArea className={cn("flex-1 p-4 w-full", className)} ref={scrollAreaRef}>
      <div className="space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={cn(
                "flex items-start gap-3",
                message.sender === "me" && "flex-row-reverse"
              )}
            >
              {message.sender !== 'system' && (
                <Avatar className="size-8 shrink-0">
                  <AvatarImage 
                    src={message.avatar} 
                    alt="Avatar" 
                    data-ai-hint="person portrait" 
                  />
                  <AvatarFallback>
                    {message.sender === "me" ? "EU" : professionalName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex items-center gap-2 max-w-[70%]">
                {/* Audio button for other's messages */}
                {message.sender === 'other' && message.text && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 shrink-0"
                    onClick={() => handlePlayAudio(message.id, message.text!)}
                    disabled={loadingAudioId === message.id}
                    aria-label={`Reproduzir áudio da mensagem: ${message.text.substring(0, 50)}...`}
                  >
                    {loadingAudioId === message.id ? (
                      <Loader2 className="animate-spin" />
                    ) : playingMessageId === message.id ? (
                      <Pause className="text-primary" />
                    ) : (
                      <Megaphone />
                    )}
                  </Button>
                )}

                {/* Message content */}
                <div
                  className={cn(
                    "rounded-lg p-3 text-sm relative",
                    message.sender === "me"
                      ? "bg-primary text-primary-foreground"
                      : message.sender === 'other' 
                      ? "bg-muted" 
                      : "w-full max-w-full"
                  )}
                >
                  {/* System messages with analysis */}
                  {message.sender === 'system' && message.analysis && (
                    <Alert variant={message.analysis.probableCause === 'Erro na Análise' ? 'destructive' : 'default'} 
                           className="border-blue-200 bg-blue-50 text-blue-900">
                      <AiIcon className="h-4 w-4" />
                      <AlertTitle className="font-semibold flex items-center gap-2">
                        Análise da IA (Visível apenas para você)
                      </AlertTitle>
                      <AlertDescription className="space-y-2 text-blue-800">
                        <div>
                          <h4 className="font-bold">Causa Provável</h4>
                          <p className="text-sm">{message.analysis.probableCause}</p>
                        </div>
                        <div>
                          <h4 className="font-bold">Passos Sugeridos</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {message.analysis.suggestedSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold">Ferramentas e Materiais Necessários</h4>
                          <ul className="list-disc pl-5 text-sm">
                            {message.analysis.requiredToolsAndMaterials.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* System messages with price suggestion */}
                  {message.sender === 'system' && message.priceSuggestion && (
                    <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-900">
                      <Bot className="h-4 w-4" />
                      <AlertTitle className="font-semibold flex items-center gap-2">
                        Sugestão de Orçamento da IA
                      </AlertTitle>
                      <AlertDescription className="space-y-2 text-amber-800">
                        {message.priceSuggestion.suggestedPrice > 0 ? (
                          <>
                            <p className="text-3xl font-bold text-center text-amber-900 my-2">
                              R$ {message.priceSuggestion.suggestedPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-center">{message.priceSuggestion.explanation}</p>
                            {message.priceSuggestion.marketContext && (
                              <div className="text-center mt-2">
                                <Badge variant="outline">
                                  Ref. Mercado: R$ {message.priceSuggestion.marketContext.pricePerUnit.toFixed(2)} / {message.priceSuggestion.marketContext.priceType.replace('_', ' ')}
                                </Badge>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-center">{message.priceSuggestion.explanation}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Negotiation messages */}
                  {message.negotiation && (
                    <div className="w-full">
                      {message.negotiation.type === 'proposal' && message.sender === 'me' ? (
                        <Alert variant="default" className="border-green-200 bg-green-50 text-green-900 text-center">
                          <AlertTitle>Proposta Enviada</AlertTitle>
                          <AlertDescription className="text-green-800">
                            Você enviou uma proposta de <span className="font-bold">R$ {message.negotiation.amount.toFixed(2)}</span>.
                            <br/>Aguardando a resposta do profissional.
                          </AlertDescription>
                        </Alert>
                      ) : message.negotiation.type === 'proposal' && message.sender === 'other' ? (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-center font-semibold">
                            O profissional enviou uma proposta de R$ {message.negotiation.amount.toFixed(2)}.
                          </p>
                        </div>
                      ) : message.negotiation.type === 'accepted' ? (
                        <Alert variant="default" className="border-green-200 bg-green-50 text-green-900 text-center">
                          <AlertTitle>Proposta Aceita!</AlertTitle>
                          <AlertDescription className="text-green-800">
                            O valor de <span className="font-bold">R$ {message.negotiation.amount.toFixed(2)}</span> foi aceito.
                          </AlertDescription>
                        </Alert>
                      ) : message.negotiation.type === 'declined' ? (
                        <Alert variant="destructive" className="text-center">
                          <AlertTitle>Proposta Recusada</AlertTitle>
                          <AlertDescription>
                            O valor de <span className="font-bold">R$ {message.negotiation.amount.toFixed(2)}</span> foi recusado.
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </div>
                  )}

                  {/* Regular text messages */}
                  {!message.negotiation && !message.analysis && !message.priceSuggestion && message.text && (
                    <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.text) }} />
                  )}

                  {/* Media attachments */}
                  {message.mediaUrl && (
                    <div className="mt-2 space-y-2">
                      <div className="relative h-40 w-full cursor-pointer overflow-hidden rounded-md">
                        {message.mediaType === 'image' ? (
                          <Image 
                            src={message.mediaUrl} 
                            alt="Anexo" 
                            layout="fill" 
                            objectFit="cover" 
                            data-ai-hint="attachment image" 
                          />
                        ) : (
                          <video 
                            src={message.mediaUrl} 
                            controls 
                            className="h-full w-full object-contain" 
                          />
                        )}
                      </div>
                      {onAnalyzeImage && (
                        analyzingMessageId === message.id ? (
                          <Button className="w-full" disabled>
                            <Loader2 className="animate-spin mr-2" />
                            Analisando...
                          </Button>
                        ) : (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full" 
                            onClick={() => onAnalyzeImage(message.id)} 
                            disabled={analyzingMessageId !== null}
                          >
                            <Wand2 className="mr-2" />
                            Analisar com IA
                          </Button>
                        )
                      )}
                    </div>
                  )}

                  {/* Message timestamp and status */}
                  <div className={cn(
                    "flex items-center gap-1 mt-1 text-xs",
                    message.sender === "me" ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.timestamp && (
                      <span>{formatTimestamp(message.timestamp)}</span>
                    )}
                    {message.sender === "me" && getStatusIcon(message.status)}
                  </div>
                </div>

                {/* Audio button for my messages */}
                {message.sender === 'me' && message.text && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6 shrink-0"
                    onClick={() => handlePlayAudio(message.id, message.text!)}
                    disabled={loadingAudioId === message.id}
                    aria-label={`Reproduzir áudio da sua mensagem: ${message.text.substring(0, 50)}...`}
                  >
                    {loadingAudioId === message.id ? (
                      <Loader2 className="animate-spin" />
                    ) : playingMessageId === message.id ? (
                      <Pause className="text-primary" />
                    ) : (
                      <Megaphone />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Proposal response buttons */}
            {message.sender === 'me' && message.negotiation?.type === 'proposal' && onAcceptProposal && onDeclineProposal && (
              <div className="flex items-start gap-3 mt-4">
                <Avatar className="size-8">
                  <AvatarImage 
                    src="https://placehold.co/100x100.png" 
                    alt="Avatar" 
                    data-ai-hint="person portrait" 
                  />
                  <AvatarFallback>
                    {professionalName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-center font-semibold">
                    O cliente enviou uma proposta de R$ {message.negotiation.amount.toFixed(2)}.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDeclineProposal(message.negotiation!.amount)}
                      aria-label={`Recusar proposta de ${message.negotiation!.amount} reais`}
                    >
                      <ThumbsDown className="mr-2" aria-hidden="true" /> 
                      Recusar
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onAcceptProposal(message.negotiation!.amount)}
                      aria-label={`Aceitar proposta de ${message.negotiation!.amount} reais`}
                    >
                      <ThumbsUp className="mr-2" aria-hidden="true" /> 
                      Aceitar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarImage 
                src="https://placehold.co/100x100.png" 
                alt="Avatar" 
                data-ai-hint="person portrait" 
              />
              <AvatarFallback>
                {professionalName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3 max-w-[70%]">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground ml-2">digitando...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} className="hidden" />
    </ScrollArea>
  );
}