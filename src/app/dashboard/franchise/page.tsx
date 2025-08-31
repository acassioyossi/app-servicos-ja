
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Users, TrendingUp, HandHeart, Network, Briefcase, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const benefits = [
    { icon: TrendingUp, title: "Renda Escalável", description: "Ganhe uma porcentagem sobre cada serviço realizado pela sua equipe." },
    { icon: Network, title: "Expansão de Mercado", description: "Atenda mais clientes em uma área geográfica maior sem se sobrecarregar." },
    { icon: Users, title: "Liderança e Gestão", description: "Desenvolva suas habilidades de liderança gerenciando e treinando sua equipe." },
    { icon: Briefcase, title: "Menos Esforço Físico", description: "Foque na gestão e captação de clientes, otimizando seu tempo e energia." },
];

const steps = [
    { number: "01", title: "Qualificação", description: "Profissionais com alta avaliação e tempo de plataforma são elegíveis." },
    { number: "02", title: "Seleção da Equipe", description: "Recrute profissionais de confiança ou Jovens Aprendizes para formar seu time." },
    { number: "03", title: "Gestão pelo App", description: "Use nossas ferramentas para distribuir serviços, acompanhar o desempenho e gerenciar pagamentos." },
    { number: "04", title: "Crescimento Contínuo", description: "Receba suporte da plataforma para expandir sua equipe e seus lucros." },
];

export default function FranchisePage() {
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
                            alt="Líder de equipe conversando com seu time de profissionais"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="team leader meeting"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-primary mb-2">
                            <HandHeart className="size-8" />
                            <span className="font-semibold text-lg">Modelo Microfranquia</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Seja um líder. Monte sua equipe.</h2>
                         <p className="mt-4 max-w-md text-lg text-muted-foreground">
                            Transforme sua experiência em um negócio. Com o nosso modelo de microfranquia, você pode gerenciar sua própria equipe de profissionais e escalar seus ganhos.
                         </p>
                         <div className="mt-6">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&specialty=Franqueado">Quero ser um Franqueado</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <Card className="bg-muted/50 p-8">
                        <h2 className="text-center text-3xl font-bold mb-8">Vantagens de se Tornar um Franqueado</h2>
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
                        <h2 className="text-center text-3xl font-bold mb-8">Como Funciona</h2>
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

                 <section className="my-12 md:my-16 text-center">
                    <Card className="bg-primary text-primary-foreground p-8">
                        <h2 className="text-3xl font-bold mb-4">Pronto para dar o próximo passo na sua carreira?</h2>
                         <p className="text-primary-foreground/90 max-w-3xl mx-auto mb-6">
                           Junte-se ao nosso programa de microfranquias e comece a construir seu império de serviços.
                        </p>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                           <Link href="/signup?type=Profissional&specialty=Franqueado">Começar Agora</Link>
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}
