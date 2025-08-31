
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Coins, Store, Users, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const benefits = [
    { icon: Users, title: "Novos Clientes", description: "Atraia milhares de usuários da plataforma com saldo Wayne Cash para gastar." },
    { icon: TrendingUp, title: "Aumento de Vendas", description: "Ofereça uma nova forma de pagamento e incentive o consumo no seu estabelecimento." },
    { icon: Coins, title: "Transações Seguras", description: "Receba pagamentos de forma rápida e segura através do nosso aplicativo." },
    { icon: Store, title: "Visibilidade na Plataforma", description: "Seu negócio será divulgado para toda a nossa base de clientes e profissionais." },
];

export default function PartnerCompanyPage() {
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
                            alt="Cliente pagando com celular em uma loja parceira"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="mobile payment store"
                        />
                    </div>
                    <CardHeader className="p-8 text-foreground flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-primary mb-2">
                            <Store className="size-8" />
                            <span className="font-semibold text-lg">Parceria de Sucesso</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Aceite Wayne Cash e aumente suas vendas.</h2>
                         <CardDescription className="mt-4 max-w-md text-lg text-muted-foreground">
                            Faça parte da nossa rede de parceiros e conecte seu negócio a milhares de clientes prontos para comprar.
                         </CardDescription>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Empresa+Parceira">Quero ser um Parceiro</Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Vantagens de ser um Parceiro Serviços Já</h2>
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
                        <h2 className="text-center text-3xl font-bold mb-10">Como Funciona</h2>
                        <div className="grid gap-8 md:grid-cols-3">
                             <Card className="p-6 text-center border-dashed">
                                 <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                    <h3 className="text-3xl font-bold text-primary">1</h3>
                                </div>
                                <h3 className="text-xl font-semibold">Cadastre-se</h3>
                                <p className="text-muted-foreground mt-2">Crie sua conta de parceiro de forma rápida e simples.</p>
                            </Card>
                             <Card className="p-6 text-center border-dashed">
                                 <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                    <h3 className="text-3xl font-bold text-primary">2</h3>
                                </div>
                                <h3 className="text-xl font-semibold">Integre o Pagamento</h3>
                                <p className="text-muted-foreground mt-2">Nossa equipe te ajudará a configurar o recebimento via Wayne Cash no seu sistema.</p>
                            </Card>
                             <Card className="p-6 text-center border-dashed">
                                 <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                    <h3 className="text-3xl font-bold text-primary">3</h3>
                                </div>
                                <h3 className="text-xl font-semibold">Receba Clientes</h3>
                                <p className="text-muted-foreground mt-2">Comece a aceitar pagamentos e veja seu negócio crescer com a nossa comunidade.</p>
                            </Card>
                        </div>
                    </Card>
                </section>

                 <section className="my-12 md:my-16 text-center">
                    <Card className="bg-primary text-primary-foreground p-8">
                        <h2 className="text-3xl font-bold mb-4">Pronto para fazer parte da revolução?</h2>
                         <p className="text-primary-foreground/90 max-w-3xl mx-auto mb-6">
                            Junte-se a nós e transforme a maneira como seus clientes compram e pagam.
                        </p>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                           <Link href="/signup?type=Profissional&specialty=Empresa+Parceira">Cadastre seu Negócio Agora</Link>
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}
