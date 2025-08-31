
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Recycle, Users, Star, PackagePlus, Route } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const benefits = [
    { icon: PackagePlus, title: "Mais Coletas", description: "Receba mais solicitações de coleta na sua região de atuação." },
    { icon: Route, title: "Rota Otimizada", description: "Nosso sistema agrupa coletas próximas para otimizar seu tempo e combustível." },
    { icon: Users, title: "Comunidade Forte", description: "Faça parte de uma comunidade que valoriza e apoia seu trabalho essencial." },
    { icon: CheckCircle, title: "Processo Simplificado", description: "Gerencie tudo pelo app, desde a solicitação até a confirmação da coleta." },
];


export default function RecyclingPartnerPage() {
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
                            alt="Catador de material reciclável sorrindo"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="recycling collector smiling"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-primary mb-2">
                            <Recycle className="size-8" />
                            <span className="font-semibold text-lg">Parceria que Transforma</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Recicle com a gente. Simples, rápido e com impacto.</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Conectamos quem precisa descartar com quem vive da coleta. Juntos, fortalecemos a reciclagem e geramos renda.
                         </p>
                         <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Cliente&specialty=Catador+de+Reciclagem">Solicitar Coleta</Link>
                            </Button>
                             <Button size="lg" variant="secondary" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Catador+de+Reciclagem">Seja um Catador Parceiro</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Benefícios para o Catador Parceiro</h2>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                           {benefits.map(benefit => (
                                <div key={benefit.title} className="flex flex-col items-center text-center">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                        <benefit.icon className="size-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                                    <p className="text-muted-foreground">{benefit.description}</p>
                                </div>
                           ))}
                        </div>
                    </Card>
                </section>
                
                 <section className="my-12 md:my-16">
                     <Card className="p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Facilitando a Coleta para Todos</h2>
                         <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">Nossa plataforma simplifica o agendamento de coletas, conectando residências e empresas a catadores parceiros em poucos cliques.</p>
                        
                        <div className="relative flex justify-center">
                            <Image 
                                src="https://placehold.co/800x600.png"
                                alt="Interface do aplicativo mostrando um mapa com pontos de coleta e um chat"
                                width={800}
                                height={600}
                                className="rounded-lg shadow-lg"
                                data-ai-hint="app interface map chat"
                            />
                        </div>
                    </Card>
                </section>
            </main>
        </div>
    );
}
