
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Briefcase, GraduationCap, Clock, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const whoIsItFor = [
    { icon: GraduationCap, title: "Faixa Etária", description: "Adolescentes e jovens entre 14 e 24 anos." },
    { icon: GraduationCap, title: "Escolaridade", description: "Necessário estar matriculado e frequentando a escola (fundamental ou médio)." },
    { icon: GraduationCap, title: "Pessoas com Deficiência", description: "Não há limite máximo de idade para pessoas com deficiência." },
];

const howItWorks = [
    { icon: FileText, title: "Contrato Formal", description: "Contrato de trabalho com carteira assinada, garantindo direitos como salário, 13º e férias." },
    { icon: Clock, title: "Carga Horária Reduzida", description: "Jornada de 4 a 6 horas por dia, permitindo conciliar trabalho e estudos." },
    { icon: Briefcase, title: "Formação Teórica e Prática", description: "O programa combina aprendizado teórico em uma instituição com a prática na empresa." },
];

export default function JovemAprendizPage() {
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
                            alt="Jovem aprendiz em um ambiente de trabalho moderno"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="young apprentice working"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-primary mb-2">
                            <GraduationCap className="size-8" />
                            <span className="font-semibold text-lg">Programa Jovem Aprendiz</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Sua porta de entrada para o mercado de trabalho</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Combine formação teórica com a prática profissional, desenvolva novas habilidades e inicie uma carreira de sucesso.
                         </p>
                         <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Jovem+Aprendiz">Quero ser Jovem Aprendiz</Link>
                            </Button>
                             <Button size="lg" variant="secondary" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Cliente&specialty=Jovem+Aprendiz">Quero Contratar um Aprendiz</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Para quem é o Programa?</h2>
                        <div className="grid gap-8 md:grid-cols-3">
                           {whoIsItFor.map(item => (
                                <div key={item.title} className="flex flex-col items-center text-center">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                        <item.icon className="size-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                           ))}
                        </div>
                    </Card>
                </section>
                
                 <section className="my-12 md:my-16">
                     <Card className="p-8">
                        <h2 className="text-center text-3xl font-bold mb-10">Como funciona?</h2>
                        <div className="grid gap-8 md:grid-cols-3">
                           {howItWorks.map(item => (
                                <Card key={item.title} className="p-6 text-center">
                                     <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-4 mx-auto">
                                        <item.icon className="size-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">{item.title}</h3>
                                    <p className="text-muted-foreground mt-2">{item.description}</p>
                                </Card>
                           ))}
                        </div>
                    </Card>
                </section>

                 <section className="my-12 md:my-16 text-center">
                    <Card className="bg-primary text-primary-foreground p-8">
                        <h2 className="text-3xl font-bold mb-4">Empresas Parceiras do Serviços Já</h2>
                         <p className="text-primary-foreground/90 max-w-3xl mx-auto mb-6">
                            Conectamos você diretamente com empresas que buscam novos talentos. Encontre vagas de jovem aprendiz em diversas áreas e comece sua carreira em um ambiente de inovação e crescimento.
                        </p>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                            <Link href="/signup?type=Profissional&specialty=Jovem+Aprendiz">Ver Vagas Disponíveis</Link>
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}
