
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Package, BadgeDollarSign, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const benefits = [
    { icon: BadgeDollarSign, title: "Renda Extra Flexível", description: "Faça entregas no seu ritmo, quando e onde quiser. Perfeito para horas vagas." },
    { icon: Footprints, title: "Saúde em Dia", description: "Mantenha o bem-estar e a saúde, transformando suas caminhadas em fonte de lucro." },
    { icon: MapPin, title: "Atue no seu Bairro", description: "Receba pedidos de parceiros locais, otimizando seu tempo e fortalecendo a comunidade." },
    { icon: Package, title: "Não precisa de veículo", description: "Sua disposição é a única ferramenta necessária. Sem custos com moto, carro ou bicicleta." },
];

export default function CaminhadaRemuneradaPage() {
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
                            alt="Pessoa caminhando em uma rua da cidade com uma mochila de entrega"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="person walking delivery"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-primary mb-2">
                            <Footprints className="size-8" />
                            <span className="font-semibold text-lg">Caminhada Remunerada</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Quer caminhar e ainda ganhar uma grana extra?</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Pega a visão, mano! Você não tem moto, nem carro, nem bicicleta? Agora você pode fazer entregas. Transforme seus passos em lucro.
                         </p>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Entregador+a+Pé+(Caminhada+Remunerada)">Cadastre-se Já!</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Vantagens de ser um Entregador a Pé</h2>
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
                                <h3 className="text-xl font-semibold">Cadastro Rápido</h3>
                                <p className="text-muted-foreground mt-2">Cadastre-se com uma taxa única de R$ 1,99. Para maiores de 17 anos.</p>
                            </Card>
                             <Card className="p-6 text-center border-dashed">
                                 <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                    <h3 className="text-3xl font-bold text-primary">2</h3>
                                </div>
                                <h3 className="text-xl font-semibold">Receba Pedidos</h3>
                                <p className="text-muted-foreground mt-2">Aceite pequenas entregas de parceiros locais (padarias, farmácias, mercados) perto de você.</p>
                            </Card>
                             <Card className="p-6 text-center border-dashed">
                                 <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                    <h3 className="text-3xl font-bold text-primary">3</h3>
                                </div>
                                <h3 className="text-xl font-semibold">Ganhe Dinheiro</h3>
                                <p className="text-muted-foreground mt-2">Para entregas de até 3km, a taxa é de R$ 6,00. Você fica com R$ 5,00 e ainda ganha bônus em Wayne Cash!</p>
                            </Card>
                        </div>
                    </Card>
                </section>

                 <section className="my-12 md:my-16 text-center">
                    <Card className="bg-primary text-primary-foreground p-8">
                        <h2 className="text-3xl font-bold mb-4">Vem pro Serviços Já!</h2>
                         <p className="text-primary-foreground/90 max-w-3xl mx-auto mb-6">
                            É rápido e fácil começar a ganhar dinheiro com suas caminhadas. Faça parte dessa novidade.
                        </p>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                           <Link href="/signup?type=Profissional&specialty=Entregador+a+Pé+(Caminhada+Remunerada)">Começar a Caminhada Remunerada</Link>
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}
