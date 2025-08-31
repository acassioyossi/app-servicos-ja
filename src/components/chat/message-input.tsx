"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/feedback";
import {
  SendHorizonal,
  Paperclip,
  Wand2,
  Coins,
  Loader2,
  Smile,
  Mic,
  MicOff,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onFileSelect: (file: File) => void;
  onSuggestPrice?: () => void;
  onTipForInfo?: () => void;
  onSendProposal?: (amount: number) => void;
  showNegotiation?: boolean;
  isTransportService?: boolean;
  negotiationAccepted?: boolean;
  isSuggestingPrice?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function MessageInput({
  onSendMessage,
  onFileSelect,
  onSuggestPrice,
  onTipForInfo,
  onSendProposal,
  showNegotiation = false,
  isTransportService = false,
  negotiationAccepted = false,
  isSuggestingPrice = false,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  className
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [negotiationValue, setNegotiationValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem (JPEG, PNG, GIF, WebP) ou vídeo (MP4, WebM)."
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB."
        });
        return;
      }

      onFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendProposal = () => {
    const amount = parseFloat(negotiationValue);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para a proposta."
      });
      return;
    }
    
    if (onSendProposal) {
      onSendProposal(amount);
      setNegotiationValue("");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        onFileSelect(file);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de gravação",
        description: "Não foi possível acessar o microfone."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😊', '😂', '👍', '👎', '❤️', '🔥', '💯', '🤔', '😅', '🙏'];

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={cn("border-t p-4 space-y-4", className)}>
      {/* Negotiation section */}
      {showNegotiation && !isTransportService && !negotiationAccepted && (
        <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSuggestPrice} 
              disabled={isSuggestingPrice || disabled}
              aria-label={isSuggestingPrice ? "Gerando sugestão de preço com IA, aguarde" : "Solicitar sugestão de preço usando inteligência artificial"}
            >
              {isSuggestingPrice ? (
                <Loader2 className="mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Wand2 className="mr-2" aria-hidden="true" />
              )}
              Sugerir Preço (IA)
            </Button>
            
            {onTipForInfo && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onTipForInfo}
                disabled={disabled}
                aria-label="Enviar gorjeta por informação prestada"
              >
                <Coins className="mr-2" aria-hidden="true" />
                Gorjeta por Info
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="negotiation-value" className="text-sm font-semibold">
              Sua Proposta de Orçamento
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                id="negotiation-value"
                type="number"
                placeholder="Ex: 140.00"
                value={negotiationValue}
                onChange={(e) => setNegotiationValue(e.target.value)}
                disabled={disabled}
                aria-describedby="negotiation-help"
                aria-required="true"
                step="0.01"
                min="0"
                aria-label="Valor da proposta de orçamento em reais"
                className="flex-1"
              />
              <Button 
                onClick={handleSendProposal} 
                disabled={!negotiationValue || disabled}
                aria-label={negotiationValue ? `Enviar proposta de ${negotiationValue} reais` : "Enviar proposta de orçamento"}
              >
                Enviar Proposta
              </Button>
            </div>
            <div id="negotiation-help" className="sr-only">
              Digite o valor em reais para sua proposta de orçamento
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="p-3 border rounded-lg bg-background shadow-lg">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:bg-muted"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2" role="form" aria-label="Formulário de envio de mensagem">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            autoComplete="off"
            aria-label="Campo de texto para digitar mensagem"
            aria-describedby="message-help"
            className={cn(
              "min-h-[44px] max-h-32 resize-none pr-12",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          
          {/* Emoji button */}
          <div className="absolute right-2 bottom-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              aria-label="Abrir seletor de emojis"
              className="h-8 w-8 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File attachment button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/*,video/*,audio/*"
          disabled={disabled}
          aria-label="Selecionar arquivo para anexar"
        />
        <Button 
          type="button" 
          size="icon" 
          variant="ghost" 
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Anexar arquivo de imagem, vídeo ou áudio"
        >
          <Paperclip aria-hidden="true" />
        </Button>

        {/* Voice recording button */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? "destructive" : "ghost"}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isRecording ? "Parar gravação de áudio" : "Iniciar gravação de áudio"}
        >
          {isRecording ? (
            <MicOff aria-hidden="true" />
          ) : (
            <Mic aria-hidden="true" />
          )}
        </Button>

        {/* Send button */}
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || disabled || isSending}
          aria-label={message.trim() ? "Enviar mensagem" : "Digite uma mensagem para enviar"}
          className="shrink-0"
        >
          {isSending ? (
            <LoadingState variant="spinner" size="sm" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      <div id="message-help" className="sr-only">
        Digite sua mensagem e pressione Enter ou clique no botão enviar
      </div>
    </div>
  );
}