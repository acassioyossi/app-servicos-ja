import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CreditCard, Map, MessageCircle, Shield, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
    title: string;
    description: string;
    icon: LucideIcon;
}

const features: Feature[] = [
    { title: "GPS em Tempo Real", description: "Acompanhe a chegada do profissional em tempo real, como no Uber. Saiba exatamente quando ele chegará.", icon: Map },
    { title: "Chat Integrado", description: "Comunique-se diretamente com o profissional antes e durante o serviço. Envie fotos e detalhes importantes.", icon: MessageCircle },
    { title: "Profissionais Verificados", description: "Todos os profissionais passam por verificação de identidade e têm avaliações de outros clientes.", icon: Shield },
    { title: "Pagamento Seguro", description: "Pague com cartão, PIX ou Wayne Cash diretamente no app. Sem dinheiro trocado e com segurança garantida.", icon: CreditCard },
    { title: "Avaliações e Notas", description: "Veja as avaliações de outros clientes e deixe sua avaliação após o serviço. Qualidade garantida.", icon: Star },
    { title: "Notificações", description: "Receba notificações em tempo real sobre o status do seu serviço, chegada do profissional e ofertas especiais.", icon: Bell },
];

export function AppFeatures() {
    return (
        <section id="app" className="w-full bg-background py-20 sm:py-24">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">Recursos do App Serviços Já</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Tudo que você precisa em um só lugar, com tecnologia de ponta
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <Card key={feature.title} className="group text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
                           <CardHeader>
                                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary">
                                    <feature.icon className="size-8 text-primary transition-colors group-hover:text-primary-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <h3 className="text-xl font-semibold">{feature.title}</h3>
                                <p className="mt-2 text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
