
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Circle, Star, User, UserCheck, Search, ShieldCheck } from "lucide-react";
import { Input } from '../ui/input';
import { useSearchParams, useRouter } from 'next/navigation';

const professionals = [
    { name: "João Silva", specialty: "Eletricista", rating: 4.8, description: "Mais de 10 anos de experiência em instalações residenciais e comerciais. Segurança garantida.", price: 80, priceType: "hour", tag: "Instalações Elétricas", category: "Eletricistas", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: true },
    { name: "Maria Santos", specialty: "Diarista", rating: 5.0, description: "Limpeza completa e detalhada para sua casa ou escritório. Produtos de qualidade inclusos.", price: 150, priceType: "daily", tag: "Limpeza Residencial", category: "Diaristas", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: true },
    { name: "Carlos Oliveira", specialty: "Encanador", rating: 4.7, description: "Especialista em desentupimentos, reparos de vazamentos e instalações hidráulicas. Atendimento rápido.", price: 200, priceType: "task", tag: "Desentupimentos", category: "Encanadores", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: false },
    { name: "Ana Costa", specialty: "Pintora", rating: 4.9, description: "Pintura de qualidade com acabamento perfeito. Trabalho limpo e organizado. Orçamento sem compromisso.", price: 70, priceType: "hour", tag: "Pintura Interna", category: "Pintores", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: true },
    { name: "Pedro Martins", specialty: "Jardineiro", rating: 4.9, description: "Manutenção de jardins, poda de árvores e paisagismo com criatividade e excelência.", price: 55, priceType: "hour", tag: "Jardinagem", category: "Jardinagem", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: false },
    { name: "Sérgio Ramos", specialty: "Guincho", rating: 4.9, description: "Reboque rápido e seguro para carros e motos. Atendimento 24 horas na região metropolitana.", price: 180, priceType: "task", tag: "Emergência 24h", category: "Guincho", avatar: "https://placehold.co/100x100.png", aiHint: "tow truck driver", premium: true },
    { name: "José Fernandes", specialty: "Catador de Reciclagem", rating: 4.9, description: "Coleta de materiais recicláveis como papelão, vidro e plástico. Contribua com o meio ambiente.", price: 0, priceType: "task", tag: "Sustentabilidade", category: "Reciclagem", avatar: "https://placehold.co/100x100.png", aiHint: "recycling collector", premium: false },
    { name: "Sofia Lima", specialty: "Pet Sitter", rating: 5.0, description: "Amo animais! Cuido do seu pet com carinho e responsabilidade na sua ausência. Passeios e brincadeiras.", price: 40, priceType: "hour", tag: "Cuidado com Animais", category: "Pet Sitter", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: true },
    { name: "Ricardo Alves", specialty: "Marceneiro", rating: 4.8, description: "Criação e reparo de móveis planejados e sob medida. Acabamento de alta qualidade e durabilidade.", price: 90, priceType: "hour", tag: "Móveis Planejados", category: "Marceneiros", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: false },
    { name: "Juliana Ferreira", specialty: "Nutricionista", rating: 5.0, description: "Planos alimentares personalizados para uma vida mais saudável e equilibrada. Atendimento online.", price: 250, priceType: "task", tag: "Saúde", category: "Saúde", avatar: "https://placehold.co/100x100.png", aiHint: "professional portrait", premium: true },
];

const categories = ["Todos", "Eletricistas", "Encanadores", "Diaristas", "Pintores", "Jardinagem", "Guincho", "Pet Sitter", "Marceneiros", "Saúde", "Transporte", "Logística", "Reciclagem"];

const priceTypeLabels: Record<string, string> = {
    hour: "/hora",
    daily: "/diária",
    task: "/tarefa",
};


const Rating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
        <span className="ml-2 text-sm font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
);

export function ProfessionalsOnline() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [onlineCount, setOnlineCount] = useState(127);
    const [searchTerm, setSearchTerm] = useState("");
    
    const activeTab = searchParams.get('category') || 'Todos';

    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineCount(prev => {
                const change = Math.floor(Math.random() * 3) - 1;
                return Math.max(50, Math.min(200, prev + change));
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);
    
    const filteredProfessionals = professionals
        .filter(p => activeTab === "Todos" || p.category === activeTab)
        .filter(p => {
            const term = searchTerm.toLowerCase();
            return p.name.toLowerCase().includes(term) ||
                   p.specialty.toLowerCase().includes(term) ||
                   p.description.toLowerCase().includes(term) ||
                   p.tag.toLowerCase().includes(term);
        });
        
    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'Todos') {
            params.delete('category');
        } else {
            params.set('category', value);
        }
        // Using replace to avoid polluting browser history for tab changes
        router.replace(`/#profissionais?${params.toString()}`, { scroll: false });
    };


    return (
        <section id="profissionais" className="w-full bg-card py-20 sm:py-24">
            <div className="container">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <UserCheck className="size-8 text-primary" />
                        <h2 className="text-3xl font-bold md:text-4xl">Profissionais Online Agora</h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-green-700">
                        <Circle className="size-3 fill-current" />
                        <strong className="text-sm font-semibold">{onlineCount}</strong>
                        <span className="text-sm">profissionais disponíveis</span>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome, serviço ou palavra-chave..." 
                            className="w-full rounded-lg bg-background pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar profissional"
                        />
                    </div>
                    <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
                        <TabsList className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                            {categories.map(category => (
                                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                            ))}
                        </TabsList>
                        
                        <TabsContent value={activeTab} className="mt-8">
                            {filteredProfessionals.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredProfessionals.map((pro) => (
                                        <Card key={pro.name} className="flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                                            <CardHeader className="flex flex-row items-center gap-4">
                                                <div className="relative">
                                                    <Avatar className="size-16 border">
                                                        <AvatarImage src={pro.avatar} alt={pro.name} data-ai-hint={pro.aiHint} />
                                                        <AvatarFallback><User /></AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card bg-green-500"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold">{pro.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{pro.specialty}</p>
                                                    <Rating rating={pro.rating} />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-grow">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary">{pro.tag}</Badge>
                                                    {pro.premium && (
                                                        <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
                                                            <ShieldCheck className="mr-1" />
                                                            Segurança Premium
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-3 text-sm text-muted-foreground">{pro.description}</p>
                                            </CardContent>
                                            <CardFooter className="flex items-center justify-between bg-background/50 p-4">
                                                {pro.price > 0 ? (
                                                    <p className="text-xl font-bold text-primary">R$ {pro.price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">{priceTypeLabels[pro.priceType]}</span></p>
                                                ) : (
                                                    <p className="text-lg font-bold text-primary">Coleta Gratuita</p>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                      <Link href={`/signup?type=Cliente&specialty=${encodeURIComponent(pro.specialty)}`}>Ver Perfil</Link>
                                                    </Button>
                                                    <Button size="sm" asChild>
                                                        <Link href={`/signup?type=Cliente&specialty=${encodeURIComponent(pro.specialty)}`}>Contratar</Link>
                                                    </Button>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
                                        <h3 className="text-xl font-semibold">Nenhum profissional encontrado</h3>
                                        <p className="mt-2 text-muted-foreground">Tente ajustar sua busca ou selecionar outra categoria.</p>
                                    </div>
                                )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </section>
    );
}
