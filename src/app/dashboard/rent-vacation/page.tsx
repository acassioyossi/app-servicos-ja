
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, User, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const steps = [
    { number: "01", title: "Cadastro Rápido", description: "Crie sua conta de anfitrião e adicione os detalhes do seu espaço." },
    { number: "02", title: "Defina seu Calendário", description: "Gerencie suas datas disponíveis e preços de forma flexível para os hóspedes." },
    { number: "03", title: "Receba Hóspedes", description: "Conecte-se com viajantes verificados que procuram um lugar para ficar." },
    { number: "04", title: "Negocie e Alugue", description: "Use nosso chat seguro para combinar os detalhes e confirmar a reserva." },
];

const messages = [
  { sender: "other", text: "Olá! Adorei sua casa na praia. Estará disponível para o feriado de 7 de setembro?" },
  { sender: "me", text: "Olá! Que bom que gostou. Sim, está disponível. A diária para o feriado é R$ 350." },
  { sender: "other", text: "Excelente! O check-in pode ser feito na sexta-feira pela manhã?" },
  { sender: "me", text: "Com certeza! Podemos combinar o horário que for melhor para você. A reserva pode ser feita pela plataforma." },
];

const Rating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
);


export default function RentVacationPage() {
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
                            alt="Casa de praia aconchegante com vista para o mar"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="beach house interior"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Transforme seu espaço em um destino de viagem</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Anuncie sua casa, apartamento ou quarto para viajantes e ganhe dinheiro com aluguel por temporada.
                         </p>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Anfitrião+de+Aluguel+por+Temporada">Seja um Anfitrião</Link>
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
                        <h2 className="text-center text-3xl font-bold mb-8">Combine tudo pelo Chat</h2>
                         <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">Converse com hóspedes, tire dúvidas e confirme reservas diretamente pela nossa plataforma segura.</p>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <h3 className="text-xl font-semibold mb-4">Viajante Interessado</h3>
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="size-16 border">
                                            <AvatarImage src="https://placehold.co/100x100.png" alt="Viajante" data-ai-hint="tourist portrait" />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold">Fernanda Oliveira</h4>
                                            <p className="text-sm text-muted-foreground">Viajante Verificada</p>
                                            <Rating rating={5.0} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">"Planejando uma viagem em família e procurando um lugar aconchegante para ficar."</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-semibold mb-4">Exemplo de Chat de Reserva</h3>
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
