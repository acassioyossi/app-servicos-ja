

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, User, Star, HardHat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const steps = [
    { number: "01", title: "Cadastre-se Gratuitamente", description: "Crie sua conta como fornecedor de equipamentos de forma simples e rápida." },
    { number: "02", title: "Anuncie seus Equipamentos", description: "Liste suas ferramentas e máquinas com fotos, descrições e preços." },
    { number: "03", title: "Receba Pedidos", description: "Nossa plataforma conecta você a profissionais e empresas que precisam dos seus equipamentos." },
    { number: "04", title: "Negocie e Alugue", description: "Utilize nosso chat para combinar detalhes, tirar dúvidas e fechar o aluguel." },
];

const messages = [
  { sender: "other", text: "Boa tarde, preciso alugar uma betoneira para uma obra. A sua está disponível para a próxima semana?" },
  { sender: "me", text: "Boa tarde! Sim, está disponível. O valor da diária é R$ 80,00." },
  { sender: "other", text: "Ótimo. Vocês entregam no local da obra?" },
  { sender: "me", text: "Entregamos sim, com uma pequena taxa de frete. Podemos combinar tudo por aqui e formalizar o aluguel." },
];

const Rating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
);


export default function RentEquipmentPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-background p-4 border-b">
                 <Link href="/dashboard/professional" className="font-semibold text-primary hover:underline">
                    &larr; Voltar para o Painel do Profissional
                </Link>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <Card className="overflow-hidden shadow-lg md:grid md:grid-cols-2 md:gap-8">
                     <div className="relative h-64 md:h-full">
                        <Image 
                            src="https://placehold.co/600x400.png"
                            alt="Equipamentos de construção civil"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="construction equipment tools"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Faça seus equipamentos renderem mais</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Alugue suas ferramentas e máquinas para outros profissionais e empresas. Transforme seus ativos parados em lucro.
                         </p>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Fornecedor+de+Equipamentos">Alugar meus Equipamentos</Link>
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
                        <h2 className="text-center text-3xl font-bold mb-8">Negocie com clientes pelo Chat</h2>
                         <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">Receba pedidos de orçamento, ajuste preços e combine os detalhes da entrega e retirada diretamente pela plataforma.</p>
                        
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-1">
                                <h3 className="text-xl font-semibold mb-4">Cliente Interessado</h3>
                                <Card>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="size-16 border">
                                            <AvatarImage src="https://placehold.co/100x100.png" alt="Engenheiro" data-ai-hint="engineer portrait" />
                                            <AvatarFallback><HardHat /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold">Construtora Silva</h4>
                                            <p className="text-sm text-muted-foreground">Perfil Verificado</p>
                                            <Rating rating={4.9} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">"Precisamos de equipamentos para uma obra de médio porte. Buscando fornecedores confiáveis."</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-semibold mb-4">Exemplo de Chat de Aluguel</h3>
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
