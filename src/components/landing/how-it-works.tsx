import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, FileText, Map, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
    title: string;
    description: string;
    icon: LucideIcon;
}

const steps: Step[] = [
    {
        title: "Publique sua Demanda",
        description: "Descreva o serviço que precisa, data e localização. É rápido e fácil!",
        icon: FileText
    },
    {
        title: "Profissional Aceita",
        description: "Profissionais próximos veem sua demanda e podem aceitar em segundos.",
        icon: MapPin
    },
    {
        title: "GPS em Tempo Real",
        description: "Converse diretamente e acompanhe a chegada do profissional em tempo real.",
        icon: Map
    },
    {
        title: "Pague com Segurança",
        description: "Pague pelo app com cartão, PIX ou usando seus Wayne Cash acumulados.",
        icon: CreditCard
    }
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full bg-card py-20 sm:py-24">
        <div className="container">
            <div className="text-center">
                <h2 className="text-3xl font-bold md:text-4xl">Como Funciona</h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Conectar-se com profissionais qualificados nunca foi tão fácil e seguro.
                </p>
            </div>
            <div className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                 <div className="absolute left-0 top-1/2 -z-10 hidden h-px w-full -translate-y-1/2 bg-border lg:block"></div>
                 {steps.map((step, index) => (
                    <Card key={step.title} className="group transform-gpu border-transparent bg-background text-center shadow-none transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
                        <CardHeader className="flex flex-row items-center justify-center gap-4 md:flex-col">
                            <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-primary bg-background transition-colors group-hover:bg-primary">
                               <step.icon className="size-8 text-primary transition-colors group-hover:text-primary-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold">{step.title}</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{step.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </section>
  )
}
