
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, MessageSquare, User, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const steps = [
    { number: "01", title: "Cadastro Gratuito", description: "Crie sua conta como proprietário(a) de forma rápida e sem custos." },
    { number: "02", title: "Anuncie seu Imóvel", description: "Adicione fotos, descrição e todos os detalhes do seu imóvel na plataforma." },
    { number: "03", title: "Encontre o Inquilino Ideal", description: "Nossa plataforma conecta você com inquilinos verificados e interessados." },
    { number: "04", title: "Negocie e Feche Contrato", description: "Use nosso chat seguro para negociar e formalize o aluguel com tranquilidade." },
];

const messages = [
  { sender: "other", text: "Olá, boa tarde! Vi seu apartamento de 2 quartos no centro. Ele ainda está disponível?" },
  { sender: "me", text: "Boa tarde! Sim, está disponível para visita. Você gostaria de agendar?" },
  { sender: "other", text: "Gostaria sim! Tenho interesse. O valor do aluguel é negociável?" },
  { sender: "me", text: "Podemos conversar sobre os valores e as garantias. O processo de análise é feito aqui pela plataforma." },
  { sender: "other", text: "Perfeito! Tenho todos os meus documentos verificados no app. Podemos agendar para amanhã às 15h?" },
];

const Rating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
);


export default function RentPropertyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-background p-4 border-b">
                 <Link href="/" className="font-semibold text-primary hover:underline">
                    &larr; Voltar para a Página Inicial
                </Link>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <Card className="overflow-hidden shadow-lg md:grid md:grid-cols-2 md:gap-8">
                     <div className="relative h-64 md:h-full">
                        <Image 
                            src="https://placehold.co/600x400.png"
                            alt="Pessoa recebendo as chaves de uma casa"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="house keys handover"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Anuncie seu imóvel e alugue com segurança</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Transforme seu imóvel vago em fonte de renda. Conectamos você a inquilinos verificados e simplificamos todo o processo.
                         </p>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Corretor+de+Imóveis">Anunciar meu Imóvel</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Como funciona</h2>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                           {steps.map(step => (
                                <div key={step.number} className="flex items-start gap-4">
                                    <div className="flex-shrink-0 text-primary text-5xl font-bold">{step.number}</div>
                                    <div>
                                        <h3 className="text-xl font-semibold">{step.title}</h3>
                                        <p className="text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                           ))}
                        </div>
                    </Card>
                </section>
                
                 <section className="my-12 md:my-16">
                     <Card className="p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Negocie e Feche Contrato pelo Chat</h2>
                         <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">Converse com inquilinos interessados, agende visitas e receba propostas diretamente pela nossa plataforma segura.</p>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <h3 className="text-xl font-semibold mb-4">Inquilino Interessado</h3>
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="size-16 border">
                                            <AvatarImage src="https://placehold.co/100x100.png" alt="Inquilino" data-ai-hint="person portrait" />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold">Mariana Lima</h4>
                                            <p className="text-sm text-muted-foreground">Perfil Verificado</p>
                                            <Rating rating={5.0} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">"Procuro um apartamento no centro para morar com minha família. Renda comprovada."</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-semibold mb-4">Exemplo de Chat de Negociação</h3>
                                 <Card className="h-[400px] flex flex-col">
                                    <CardContent className="p-4 flex-1 space-y-4 overflow-y-auto">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex items-end gap-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.sender === 'other' && <Avatar className="size-8"><AvatarFallback><User/></AvatarFallback></Avatar>}
                                                <div className={`max-w-xs rounded-lg p-3 text-sm lg:max-w-md ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardFooter className="p-2 border-t">
                                        <div className="flex w-full items-center gap-2">
                                            <input placeholder="Digite sua mensagem..." className="flex-1 bg-transparent outline-none text-sm px-2" />
                                            <Button><MessageSquare className="mr-2"/> Enviar</Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>

                    </Card>
                </section>
            </main>
        </div>
    );
}
