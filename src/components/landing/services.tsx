



import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dog, GraduationCap, Hammer, Home, Laptop, Package, Paintbrush, Scissors, Sparkles, TreePine, Wrench, Droplets, Utensils, HeartPulse, Building, Shirt, Car, Camera, Music, Bus, Stethoscope, Bike, Recycle, Siren, Users, Footprints } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

interface Service {
    title: string;
    category: string;
    description: string;
    icon: LucideIcon;
    tag: string;
    href?: string; 
    isSpecialPage?: boolean;
}

const servicesList: Service[] = [
    { title: "Eletricista", category: "Eletricistas", description: "Instalações, reparos e manutenção elétrica com segurança.", icon: Wrench, tag: "Mais Contratado" },
    { title: "Motorista de App", category: "Transporte", description: "Viagens rápidas e seguras pela cidade para passageiros.", icon: Car, tag: "Transporte" },
    { title: "Diarista", category: "Diaristas", description: "Limpeza residencial completa com profissionais confiáveis.", icon: Sparkles, tag: "Popular" },
    { title: "Guincho 24h", category: "Guincho", description: "Reboque rápido e seguro para carros e motos em qualquer situação.", icon: Siren, tag: "Emergência" },
    { title: "Caminhada Remunerada", category: "Entregas", description: "Faça entregas a pé no seu bairro e ganhe uma renda extra. Não precisa de veículo!", icon: Footprints, tag: "Novo!", href: "/dashboard/caminhada-remunerada", isSpecialPage: true },
    { title: "Espaço Mulher", category: "Comunidade", description: "Um ambiente seguro para mulheres oferecerem e contratarem serviços, com foco em confiança e empoderamento.", icon: Users, tag: "Empoderamento", href: "/dashboard/espaco-mulher", isSpecialPage: true },
    { title: "Jovem Aprendiz", category: "Carreira", description: "Dê o primeiro passo na sua carreira. Encontre oportunidades de aprendizado e trabalho.", icon: GraduationCap, tag: "Primeiro Emprego", href: "/dashboard/jovem-aprendiz", isSpecialPage: true },
    { title: "Parceiro de Coleta", category: "Reciclagem", description: "Conecte-se com catadores para a coleta de materiais recicláveis.", icon: Recycle, tag: "Sustentável", href: "/dashboard/recycling-partner", isSpecialPage: true },
    { title: "Motoboy", category: "Transporte", description: "Entregas e serviços rápidos com agilidade de moto.", icon: Bike, tag: "Agilidade" },
    { title: "Fretes e Mudanças", category: "Logística", description: "Para transportar qualquer coisa, do pequeno ao grande volume.", icon: Package, tag: "Logística" },
    { title: "Alugue seu veículo", category: "Aluguel", description: "Ganhe uma renda extra alugando seu carro para motoristas parceiros.", icon: Car, tag: "Renda Extra", href: "/dashboard/rent-vehicle", isSpecialPage: true },
    { title: "Aluguel de Imóveis", category: "Imobiliário", description: "Encontre casas e apartamentos para alugar, com segurança e sem burocracia.", icon: Home, tag: "Imóveis", href: "/dashboard/rent-property", isSpecialPage: true },
    { title: "Aluguel por Temporada", category: "Imobiliário", description: "Casas, apartamentos e espaços para estadias curtas e viagens.", icon: Building, tag: "Viagem", href: "/dashboard/rent-vacation", isSpecialPage: true },
    { title: "Aluguel de Equipamentos", category: "Aluguel", description: "Alugue ferramentas e equipamentos para suas obras e projetos.", icon: Wrench, tag: "Projetos", href: "/dashboard/rent-equipment", isSpecialPage: true },
    { title: "Encanador", category: "Encanadores", description: "Vazamentos, instalações hidráulicas e desentupimentos.", icon: Droplets, tag: "Rápido" },
    { title: "Pintor", category: "Pintores", description: "Pintura interna e externa com acabamento profissional.", icon: Paintbrush, tag: "Qualidade" },
    { title: "Jardineiro", category: "Jardinagem", description: "Manutenção de jardins, podas e paisagismo.", icon: TreePine, tag: "Verde" },
    { title: "Pet Sitter", category: "Pet Sitter", description: "Cuidados com seu pet enquanto você trabalha ou viaja.", icon: Dog, tag: "Amor" },
    { title: "Cabeleireiro", category: "Beleza", description: "Cortes, penteados e tratamentos para seu cabelo.", icon: Scissors, tag: "Beleza" },
    { title: "Professor Particular", category: "Educação", description: "Reforço escolar e aulas de diversas matérias.", icon: GraduationCap, tag: "Educação" },
    { title: "Marido de Aluguel", category: "Reparos", description: "Reparos domésticos, instalações e pequenas reformas.", icon: Hammer, tag: "Versátil" },
    { title: "Cozinheiro(a)", category: "Culinária", description: "Chefs e cozinheiros para eventos ou para o dia a dia.", icon: Utensils, tag: "Saboroso" },
    { title: "Cuidador(a) de Idosos", category: "Cuidado", description: "Acompanhamento, cuidados e companhia para idosos.", icon: HeartPulse, tag: "Cuidado" },
    { title: "Técnico em Informática", category: "TI", description: "Manutenção de computadores, redes e suporte técnico.", icon: Laptop, tag: "Digital" },
    { title: "Fisioterapeuta", category: "Saúde", description: "Tratamentos e recuperação de lesões no seu lar.", icon: Stethoscope, tag: "Saúde" },
];

export function Services() {
    return (
        <section id="servicos" className="w-full bg-background py-20 sm:py-24">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold md:text-4xl">Nossos Serviços</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Todos os tipos de profissionais qualificados à sua disposição
                    </p>
                </div>
                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {servicesList.map((service) => {
                         const hireLink = `/signup?type=Cliente&specialty=${encodeURIComponent(service.title)}`;
                         const offerLink = `/signup?type=Profissional&specialty=${encodeURIComponent(service.title)}`;
                         
                         if (service.isSpecialPage) {
                           return (
                             <Link key={service.title} href={service.href!} className="block h-full transition-transform duration-300 hover:-translate-y-2">
                                <Card className="group flex h-full flex-col overflow-hidden">
                                     <div className="flex h-40 items-center justify-center bg-primary/10">
                                        <service.icon className="size-12 text-primary transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                    <CardContent className="p-6 flex-grow">
                                        <h3 className="text-xl font-semibold">{service.title}</h3>
                                        <p className="mt-2 text-muted-foreground">{service.description}</p>
                                        <Badge variant="secondary" className="mt-4 font-semibold">{service.tag}</Badge>
                                    </CardContent>
                                     <CardFooter className="p-4 bg-muted/50">
                                         <Button className="w-full">Ver Página</Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                           )
                        }
                        
                        return (
                            <Card key={service.title} className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                                <div className="flex h-40 items-center justify-center bg-primary/10">
                                    <service.icon className="size-12 text-primary transition-transform duration-300 group-hover:scale-110" />
                                </div>
                                <CardContent className="p-6 flex-grow">
                                    <h3 className="text-xl font-semibold">{service.title}</h3>
                                    <p className="mt-2 text-muted-foreground">{service.description}</p>
                                    <Badge variant="secondary" className="mt-4 font-semibold">{service.tag}</Badge>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-2 p-4 bg-muted/50">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={offerLink}>Oferecer Serviço</Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href={hireLink}>Contratar</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
