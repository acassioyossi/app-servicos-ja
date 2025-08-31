
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Heart, Users, MessageSquare, Shield, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


const featuredProfessionals = [
    {
        name: "Juliana Silva",
        specialty: "Designer de Interiores",
        description: "“Transformo casas em lares, com criatividade e atenção aos detalhes. Cada projeto é uma nova história.”",
        avatar: "https://placehold.co/100x100.png",
        banner: "https://placehold.co/400x200.png",
        aiHintAvatar: "woman portrait smiling",
        aiHintBanner: "modern living room",
    },
    {
        name: "Fernanda Costa",
        specialty: "Fotógrafa de Eventos",
        description: "“Capturo emoções e momentos únicos. Minha lente conta a sua história com sensibilidade e arte.”",
        avatar: "https://placehold.co/100x100.png",
        banner: "https://placehold.co/400x200.png",
        aiHintAvatar: "woman holding camera",
        aiHintBanner: "wedding photography",
    },
    {
        name: "Beatriz Almeida",
        specialty: "Eletricista Residencial",
        description: "“Segurança e qualidade em primeiro lugar. Ofereço soluções elétricas confiáveis para sua casa.”",
        avatar: "https://placehold.co/100x100.png",
        banner: "https://placehold.co/400x200.png",
        aiHintAvatar: "professional woman portrait",
        aiHintBanner: "electrical panel",
    },
];

const Rating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${rating > i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);


export default function EspacoMulherPage() {
    return (
        <div className="min-h-screen bg-muted/20">
            <header className="bg-background p-4 border-b">
                 <Link href="/" className="font-semibold text-primary hover:underline">
                    &larr; Voltar para a Página Inicial
                </Link>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <Card className="overflow-hidden shadow-lg md:grid md:grid-cols-2 md:gap-4 bg-card">
                     <div className="relative h-64 md:h-full">
                        <Image 
                            src="https://placehold.co/600x800.png"
                            alt="Mulheres profissionais de diversas áreas colaborando"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="diverse women working"
                        />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-3 text-primary mb-3">
                            <Heart className="size-8" />
                            <span className="font-bold text-2xl tracking-tight">Espaço Mulher</span>
                         </div>
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Conectando e Fortalecendo Profissionais</h2>
                         <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                           Um ambiente seguro e acolhedor, criado para que mulheres possam oferecer seus serviços com confiança e para que clientes encontrem o talento feminino que procuram.
                         </p>
                         <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Profissional&flow=espaco-mulher">Oferecer Meus Serviços</Link>
                            </Button>
                             <Button size="lg" variant="secondary" className="text-lg h-12 px-8" asChild>
                                <Link href="/signup?type=Cliente&flow=espaco-mulher">Contratar uma Profissional</Link>
                            </Button>
                        </div>
                    </div>
                </Card>

                <section className="my-12 md:my-16">
                     <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold tracking-tight">Conheça nossas Profissionais</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Uma vitrine de talentos e histórias inspiradoras.</p>
                     </div>
                     <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {featuredProfessionals.map((pro) => (
                            <Card key={pro.name} className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <CardHeader className="p-0">
                                    <div className="relative h-40">
                                        <Image 
                                            src={pro.banner}
                                            alt={`Serviço de ${pro.name}`}
                                            layout="fill"
                                            objectFit="cover"
                                            data-ai-hint={pro.aiHintBanner}
                                        />
                                    </div>
                                    <div className="relative flex items-end gap-4 px-6 -mt-12">
                                        <Avatar className="size-24 border-4 border-card">
                                            <AvatarImage src={pro.avatar} alt={pro.name} data-ai-hint={pro.aiHintAvatar} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                         <div className="pb-2 flex-1">
                                            <h3 className="text-xl font-bold">{pro.name}</h3>
                                            <p className="text-sm text-primary font-medium">{pro.specialty}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-4">
                                     <Rating rating={5}/>
                                     <p className="mt-4 text-muted-foreground italic">"{pro.description}"</p>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" asChild>
                                        <Link href={`/signup?type=Cliente&flow=espaco-mulher&specialty=${encodeURIComponent(pro.specialty)}`}>
                                            Ver Perfil e Contratar
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                     </div>
                </section>
                

                 <section className="my-12 md:my-16 text-center">
                    <Card className="bg-primary text-primary-foreground p-8">
                        <h2 className="text-3xl font-bold mb-4">Junte-se a nós e faça parte dessa mudança!</h2>
                         <p className="text-primary-foreground/90 max-w-3xl mx-auto mb-6">
                           Seja você uma cliente em busca de um serviço com mais segurança ou uma profissional querendo expandir seu alcance em um ambiente de apoio, o Espaço Mulher é para você.
                        </p>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                           <Link href="/signup">Cadastre-se Agora</Link>
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}
