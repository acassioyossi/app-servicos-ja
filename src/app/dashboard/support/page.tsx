
"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateSupportResponse } from "@/ai/flows/generate-support-response";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


interface Message {
  role: "user" | "model";
  content: string;
}

const quickQuestions = [
    "Como funciona o Wayne Cash?",
    "Como me cadastro como profissional?",
    "É seguro pagar pelo app?",
    "Como acompanho a chegada do profissional?",
];

export default function SupportPage() {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e?: React.FormEvent, question?: string) => {
    if (e) e.preventDefault();
    const messageToSend = question || newMessage;
    if (messageToSend.trim() === "") return;

    const userMessage: Message = {
      role: "user",
      content: messageToSend,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
        const history = [...messages, userMessage];
        const response = await generateSupportResponse({ question: messageToSend, history });
        const aiMessage: Message = {
            role: "model",
            content: response,
        };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
        console.error("AI support response failed:", error);
        const errorMessage = error.message || "Desculpe, não consegui processar sua pergunta. Tente novamente.";
        toast({ variant: "destructive", title: "Erro do Assistente", description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };

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
    <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-2xl mx-auto flex flex-col h-full">
            <CardHeader className="text-center border-b">
                <Avatar className="mx-auto size-16 mb-2">
                    <AvatarFallback><Bot /></AvatarFallback>
                    <AvatarImage src="https://placehold.co/100x100.png" alt="AI Assistant" data-ai-hint="robot avatar" />
                </Avatar>
                <CardTitle className="flex items-center justify-center gap-2">
                    <Bot /> Assistente de Suporte IA
                </CardTitle>
                <CardDescription>Tire suas dúvidas sobre a plataforma. Como posso ajudar?</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center text-muted-foreground p-8">
                             <h3 className="font-semibold mb-4">Perguntas Frequentes</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {quickQuestions.map((q) => (
                                    <Button key={q} variant="outline" size="sm" onClick={() => handleSendMessage(undefined, q)}>
                                        {q}
                                    </Button>
                                ))}
                             </div>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div
                        key={index}
                        className={cn(
                            "flex items-start gap-3",
                            message.role === "user" && "flex-row-reverse"
                        )}
                        >
                            <Avatar className="size-8">
                                <AvatarFallback>
                                {message.role === "user" ? <User /> : <Bot />}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={cn(
                                "max-w-xs rounded-lg p-3 text-sm lg:max-w-md",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                )}
                            >
                                <p>{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <Avatar className="size-8">
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <div className="max-w-xs rounded-lg p-3 text-sm lg:max-w-md bg-muted flex items-center gap-2">
                                <Loader2 className="animate-spin size-4" />
                                <span>Pensando...</span>
                            </div>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua pergunta..."
                        autoComplete="off"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={isLoading}>
                        <SendHorizonal />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
}
