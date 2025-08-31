

"use client";

import { useEffect, useState } from 'react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Tag, Check, X, MapPin, Wrench, Banknote, TrendingUp, Share2, Lightbulb, Upload, Rocket, CalendarClock, Bot, Loader2, Award, ShieldCheck, Trophy, Target, Briefcase, Map, HandHeart, Users, ChevronRight, User, Image as ImageIcon, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { fullProfessionList } from '@/lib/professions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { diagnoseServiceIssue, DiagnoseServiceIssueOutput } from '@/ai/flows/diagnose-service-issue';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const IncomingRequest = ({ onRequestAction, specialty }: { onRequestAction: (accepted: boolean) => void, specialty: string }) => {

    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const handleAccept = () => {
        setIsAccepting(true);
        setTimeout(() => {
            onRequestAction(true);
            setIsAccepting(false);
        }, 1500)
    }

    const handleDecline = () => {
        setIsDeclining(true);
         setTimeout(() => {
            onRequestAction(false);
            setIsDeclining(false);
        }, 1500)
    }


    return (
        <Card className="border-primary bg-primary/5 animate-pulse-slow" role="region" aria-labelledby="request-title" aria-describedby="request-description">
            <CardHeader>
                <CardTitle id="request-title" className="flex items-center gap-2">
                    <Wrench aria-hidden="true" />
                    Novo Pedido de Serviço!
                </CardTitle>
                <CardDescription id="request-description">Um cliente próximo precisa de um(a) {specialty}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <Avatar className="size-12">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="Cliente" data-ai-hint="person portrait" />
                        <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">Cliente Anônimo</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="size-3" />
                            <span>Aprox. 2.1 km de distância</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="font-semibold text-sm">Descrição:</p>
                    <p className="text-muted-foreground text-sm">"Preciso instalar um chuveiro novo e trocar duas tomadas."</p>
                </div>
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                disabled={isAccepting || isDeclining}
                                aria-label="Recusar pedido de serviço"
                            >
                               <X className="mr-2" aria-hidden="true" />
                                Recusar
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent role="alertdialog" aria-labelledby="decline-title" aria-describedby="decline-description">
                            <AlertDialogHeader>
                            <AlertDialogTitle id="decline-title">Tem certeza que deseja recusar?</AlertDialogTitle>
                            <AlertDialogDescription id="decline-description">
                                Esta ação não pode ser desfeita. Recusar muitos serviços pode afetar sua visibilidade na plataforma.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel aria-label="Voltar e manter pedido pendente">Voltar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDecline} 
                                className='bg-destructive hover:bg-destructive/90'
                                aria-label="Confirmar recusa do pedido de serviço"
                            >
                                Confirmar Recusa
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                        onClick={handleAccept} 
                        disabled={isAccepting || isDeclining}
                        aria-label={isAccepting ? "Processando aceitação do pedido" : "Aceitar pedido de serviço"}
                        aria-describedby={isAccepting ? "accept-status" : undefined}
                    >
                        {isAccepting ? <Loader2 className="mr-2 animate-spin" aria-hidden="true" /> : <Check className="mr-2" aria-hidden="true" />}
                        {isAccepting ? "Aceitando..." : "Aceitar (25s)"}
                        {isAccepting && <span id="accept-status" className="sr-only">Aguarde enquanto processamos a aceitação</span>}
                    </Button>
                 </div>
            </CardContent>
        </Card>
    );
};

const DiagnosisAssistant = ({ specialty }: { specialty: string }) => {
    const { toast } = useToast();
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DiagnoseServiceIssueOutput | null>(null);

    const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleDiagnose = async () => {
        if (!mediaFile && !description) {
            toast({
                variant: 'destructive',
                title: "Dados insuficientes",
                description: "Por favor, envie uma foto/vídeo ou descreva o problema.",
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const mediaDataUri = mediaFile ? await fileToDataUri(mediaFile) : "data:text/plain;base64,";
            
            const diagnosisResult = await diagnoseServiceIssue({
                mediaDataUri,
                description: description || "Analisar a mídia para identificar o problema.",
                professionalSpecialty: specialty,
            });

            setResult(diagnosisResult);

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "Não foi possível gerar o diagnóstico. Tente novamente.";
            toast({
                variant: 'destructive',
                title: "Erro da IA",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> Assistente de Diagnóstico com IA
                </CardTitle>
                <CardDescription>
                    Envie uma foto/vídeo ou descreva um problema para receber uma análise técnica, passos sugeridos e lista de materiais.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="specialty-display">Minha Especialidade Principal</Label>
                        <Input id="specialty-display" value={specialty} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="media-upload">Foto ou Vídeo do Problema (Opcional)</Label>
                         <Button asChild variant="outline" className="w-full cursor-pointer">
                            <label htmlFor="media-upload-input">
                                <Upload className="mr-2" />
                                {mediaFile ? mediaFile.name : "Enviar Mídia"}
                                <Input 
                                    id="media-upload-input" 
                                    type="file" 
                                    className="sr-only" 
                                    onChange={(e) => setMediaFile(e.target.files ? e.target.files[0] : null)}
                                    accept="image/*,video/*"
                                />
                            </label>
                        </Button>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="problem-description">Descrição do Problema (Opcional)</Label>
                        <Textarea 
                            id="problem-description"
                            placeholder="Ex: Chuveiro não esquenta, faz barulho mas a água sai fria."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleDiagnose} disabled={isLoading || (!mediaFile && !description)} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Bot className="mr-2" />}
                        {isLoading ? "Analisando..." : "Diagnosticar com IA"}
                    </Button>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                    {isLoading ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
                            <p className="mt-4 font-semibold">Analisando com IA...</p>
                            <p className="text-sm">Isso pode levar alguns segundos.</p>
                        </div>
                    ) : result ? (
                        <Alert variant="default" className="border-blue-200 bg-blue-50 text-blue-900">
                           <Bot className="text-blue-600" />
                            <AlertTitle className="font-semibold text-blue-900">Diagnóstico da IA</AlertTitle>
                            <AlertDescription className="space-y-3 text-blue-800">
                                <div>
                                    <h4 className="font-bold">Causa Provável</h4>
                                    <p className="text-sm">{result.probableCause}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold">Passos Sugeridos</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                        {result.suggestedSteps.map((step, i) => <li key={i}>{step}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold">Ferramentas e Materiais</h4>
                                    <ul className="list-disc pl-5 text-sm">
                                        {result.requiredToolsAndMaterials.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <div className="text-center text-muted-foreground">
                            <p className="font-semibold">Aguardando Dados</p>
                            <p className="text-sm">Forneça uma mídia e/ou descrição e clique no botão para a IA gerar um diagnóstico.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const missions = [
    { title: "Complete 5 serviços nesta semana", progress: 60, goal: 5, current: 3, reward: "WC 10,00" },
    { title: "Receba uma avaliação 5 estrelas", progress: 0, goal: 1, current: 0, reward: "WC 5,00" },
    { title: "Compartilhe seu conhecimento na comunidade", progress: 100, goal: 1, current: 1, reward: "Maior visibilidade" },
]

const ActivationCard = ({ onActivate }: { onActivate: () => void }) => {
    const baseFee = 1.99;
    const sealFee = 0.99;
    
    const [addSeal, setAddSeal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const totalFee = baseFee + (addSeal ? sealFee : 0);

    function handleActivation() {
        setIsLoading(true);
        setTimeout(() => {
            onActivate();
            setIsLoading(false);
        }, 2000);
    }
    
    return (
        <Card id="activation-card" className="my-6 border-primary bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Rocket className="text-primary" />
                    Ative seu Perfil para Começar!
                </CardTitle>
                <CardDescription>
                    Para garantir a segurança e a qualidade da plataforma, há uma taxa única de ativação para começar a receber pedidos de serviço.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Taxa de Ativação Padrão</Label>
                        <span className="font-bold">R$ {baseFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                        <Checkbox id="premium-seal" checked={addSeal} onCheckedChange={(checked) => setAddSeal(!!checked)} />
                        <div className="grid gap-1.5 leading-none">
                            <label
                            htmlFor="premium-seal"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                            >
                            Adicionar Selo de Verificação Premium <ShieldCheck className="ml-2 text-green-600"/>
                            </label>
                            <p className="text-sm text-muted-foreground">
                            Aumente a confiança dos clientes e sua visibilidade. (+ R$ {sealFee.toFixed(2)})
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left bg-muted/50 p-4 rounded-b-lg">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Valor Total da Ativação</p>
                    <p className="text-2xl font-bold text-primary">R$ {totalFee.toFixed(2)}</p>
                </div>
                <Button size="lg" onClick={handleActivation} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
                    {isLoading ? "Processando..." : `Ativar Perfil por R$ ${totalFee.toFixed(2)}`}
                </Button>
            </CardFooter>
        </Card>
    )
}

const ExpansionOpportunities = () => {
    const opportunities = [
        { 
            icon: Briefcase, 
            title: "Adicionar Novas Habilidades", 
            description: "Diversifique seus serviços e alcance mais clientes.",
            href: "#"
        },
        { 
            icon: Map, 
            title: "Explorar Novas Regiões", 
            description: "Atue em bairros vizinhos e aumente sua área de cobertura.",
            href: "#"
        },
        { 
            icon: HandHeart, 
            title: "Abra sua Microfranquia Serviços Já", 
            description: "Lidere sua própria equipe e ganhe sobre os serviços dela.",
            href: "/dashboard/franchise"
        },
        { 
            icon: Users, 
            title: "Contratar Ajudante ou Jovem Aprendiz", 
            description: "Aumente sua capacidade de atendimento e forme novos talentos.",
            href: "/dashboard/jovem-aprendiz"
        },
        {
            icon: Wrench,
            title: "Alugue suas Ferramentas e Equipamentos",
            description: "Transforme seus ativos parados em uma nova fonte de renda.",
            href: "/dashboard/rent-equipment"
        }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp /> Oportunidades de Expansão</CardTitle>
                <CardDescription>Amplie seus horizontes. Explore novas formas de aumentar sua renda e expandir seus negócios dentro da nossa plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {opportunities.map((opp, index) => (
                    <Link href={opp.href} key={index} className="block group">
                        <div className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:bg-muted hover:border-primary">
                            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                                <opp.icon className="size-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold">{opp.title}</h4>
                                <p className="text-sm text-muted-foreground">{opp.description}</p>
                            </div>
                            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}


export default function ProfessionalDashboardPage() {
    const { toast } = useToast();
    const [isActivated, setIsActivated] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [pricingModel, setPricingModel] = useState("hour");
    const [specialty, setSpecialty] = useState("Eletricista");
    const [hasRequest, setHasRequest] = useState(false);
    const [pixKey, setPixKey] = useState("");
    
    const [contributionTitle, setContributionTitle] = useState("");
    const [contributionDescription, setContributionDescription] = useState("");
    const [contributionFile, setContributionFile] = useState<File | null>(null);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>("https://placehold.co/100x100.png");
    const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
    const [portfolioVideos, setPortfolioVideos] = useState<string[]>([]);
    const [price, setPrice] = useState("");


    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOnline && isActivated) {
            timer = setTimeout(() => {
                setHasRequest(true);
            }, 8000); 
        } else {
            setHasRequest(false);
        }
        return () => clearTimeout(timer);
    }, [isOnline, isActivated]);
    
    const handleStatusChange = (status: boolean) => {
        setIsOnline(status);
        if (!status) setHasRequest(false);
        toast({ title: "Status alterado!", description: `Você está ${status ? "Online" : "Offline"}.` });
    }

    const handlePricingChange = (value: string) => {
        setPricingModel(value);
        const labels: Record<string, string> = {
            hour: "Por Hora",
            daily: "Por Diária",
            task: "Por Tarefa",
        };
        toast({ title: "Tipo de cobrança alterado!", description: `Agora você cobra: ${labels[value]}.` });
    }

    const handleRequestAction = (accepted: boolean) => {
        setHasRequest(false);
        if (accepted) {
            toast({ title: "Serviço Aceito!", description: "Informações enviadas ao cliente. Dirija-se ao local." });
        } else {
            toast({ title: "Serviço Recusado", description: "O pedido foi cancelado.", variant: "destructive" });
        }
    }
    
    const handleSaveSettings = () => {
        if (!pixKey) {
             toast({ title: "Erro", description: "Por favor, insira uma chave PIX válida.", variant: "destructive" });
             return;
        }
        if(!price) {
            toast({ title: "Erro", description: "Por favor, insira um valor para seu serviço.", variant: "destructive" });
             return;
        }
        toast({ title: "Configurações Salvas!", description: "Suas informações de perfil e pagamento foram atualizadas." });
    }
    
    const handleSendContribution = () => {
        if (!contributionTitle || !contributionDescription) {
             toast({ title: "Campos obrigatórios", description: "Por favor, preencha o título e a descrição da sua contribuição.", variant: "destructive" });
             return;
        }

        console.log("Submitting contribution:", {
            title: contributionTitle,
            description: contributionDescription,
            file: contributionFile ? contributionFile.name : "No file",
        });
        toast({ title: "Contribuição Enviada!", description: "Obrigado por compartilhar seu conhecimento com a comunidade!" });

        setContributionTitle("");
        setContributionDescription("");
        setContributionFile(null);
    }

    const handleActivateProfile = () => {
        toast({
            title: "Pagamento Simulado com Sucesso!",
            description: "Seu perfil foi ativado. Você já pode ficar online para receber serviços."
        });
        setIsActivated(true);
    }

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setProfileImageUrl(URL.createObjectURL(file));
        }
    }
    
    const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const urls = files.map(file => URL.createObjectURL(file));
            if (type === 'image') {
                setPortfolioImages(prev => [...prev, ...urls]);
            } else {
                setPortfolioVideos(prev => [...prev, ...urls]);
            }
            toast({ title: "Mídia adicionada!", description: `${files.length} arquivo(s) adicionado(s) ao seu portfólio.`});
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Painel do Profissional</h1>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="online-status" 
                        checked={isOnline} 
                        onCheckedChange={handleStatusChange} 
                        aria-label='Status Online/Offline'
                        disabled={!isActivated}
                    />
                    <Label htmlFor="online-status" className="flex items-center gap-2">
                       <span className={cn(!isActivated && "text-muted-foreground")}> {isOnline ? "Online" : "Offline"} </span>
                       <Badge variant={isActivated ? (isOnline ? "default" : "destructive") : "secondary"} className={cn("transition-colors", isActivated && isOnline ? "bg-green-500 hover:bg-green-600" : isActivated && !isOnline ? "bg-gray-400 hover:bg-gray-500" : "bg-orange-400 hover:bg-orange-500")}>
                         {isActivated ? "Disponível" : "Indisponível"}
                       </Badge>
                    </Label>
                </div>
            </div>

            {!isActivated && <ActivationCard onActivate={handleActivateProfile} />}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
                        <Banknote className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 1.250,75</div>
                        <p className="text-xs text-muted-foreground">Pronto para saque</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganhos no Mês</CardTitle>
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+R$ 4.832,20</div>
                        <p className="text-xs text-muted-foreground">+15.2% em relação ao mês passado</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Serviços Agendados</CardTitle>
                        <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3 Agendamentos</div>
                        <Button size="sm" variant="link" className="p-0 text-xs" asChild>
                            <Link href="/dashboard/professional/scheduled">Ver agenda</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {hasRequest && isActivated ? (
                <IncomingRequest onRequestAction={handleRequestAction} specialty={specialty} />
            ) : (
                <div className="my-6 flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 shadow-sm">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">
                             {isActivated ? "Você não tem novos pedidos" : "Seu perfil está inativo"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                           {isActivated ? "Fique online para receber notificações de novos serviços." : "Ative seu perfil para começar a receber serviços."}
                        </p>
                         {!isActivated && (
                            <Button className="mt-4" onClick={() => document.querySelector('#activation-card')?.scrollIntoView({ behavior: 'smooth' })}>
                                <Rocket className="mr-2" />
                                Ativar Perfil Agora
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-6">

                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciar Perfil e Serviços</CardTitle>
                        <CardDescription>Ajuste suas informações, preços e mostre seu trabalho para atrair mais clientes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                            <Avatar className="size-24 border-2 border-primary">
                                <AvatarImage src={profileImageUrl || ''} alt="Foto de Perfil" />
                                <AvatarFallback><User size={40}/></AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h4 className="font-semibold">Sua Foto de Perfil</h4>
                                <p className="text-sm text-muted-foreground">Uma boa foto aumenta a confiança do cliente.</p>
                            </div>
                             <Button asChild variant="outline">
                                <label htmlFor="profile-image-upload">
                                    <Upload className="mr-2" />
                                    {profileImage ? "Trocar Foto" : "Enviar Foto"}
                                    <Input 
                                        id="profile-image-upload" 
                                        type="file" 
                                        className="sr-only" 
                                        onChange={handleProfileImageChange}
                                        accept="image/*"
                                    />
                                </label>
                            </Button>
                        </div>

                        <div className="grid gap-6 border-t pt-6 md:grid-cols-2">
                             <div>
                                <h4 className="mb-4 font-semibold">Minha Especialidade Principal</h4>
                                 <Select value={specialty} onValueChange={setSpecialty}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma especialidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fullProfessionList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <h4 className="mb-4 font-semibold">Tipo de Cobrança</h4>
                                <RadioGroup defaultValue={pricingModel} onValueChange={handlePricingChange} className="grid grid-cols-3 gap-2">
                                     <div>
                                        <RadioGroupItem value="hour" id="hour" className="peer sr-only" />
                                        <Label htmlFor="hour" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Por Hora</Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="daily" id="daily" className="peer sr-only"/>
                                        <Label htmlFor="daily" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Por Diária</Label>
                                    </div>
                                     <div>
                                        <RadioGroupItem value="task" id="task" className="peer sr-only" />
                                        <Label htmlFor="task" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Por Tarefa</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="price-value">Meu Valor (R$)</Label>
                                <Input id="price-value" type="number" placeholder="Ex: 80.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                                <p className="text-xs text-muted-foreground mt-1">Insira seu preço base correspondente ao tipo de cobrança selecionado.</p>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h4 className="mb-4 font-semibold">Configuração de Pagamento</h4>
                            <Label htmlFor="pix-key">Sua chave PIX para recebimentos</Label>
                             <div className="flex space-x-2 mt-2">
                                <Input 
                                    id="pix-key"
                                    placeholder="CPF, e-mail, telefone ou chave aleatória" 
                                    value={pixKey} 
                                    onChange={(e) => setPixKey(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="border-t pt-6">
                            <h4 className="mb-4 font-semibold">Meu Portfólio</h4>
                            <p className="text-sm text-muted-foreground mb-4">Mostre seus melhores trabalhos. Adicione fotos e vídeos dos serviços que você já realizou.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button asChild variant="outline">
                                    <label htmlFor="portfolio-image-upload">
                                        <ImageIcon className="mr-2" />
                                        Adicionar Fotos ao Portfólio
                                        <Input 
                                            id="portfolio-image-upload" 
                                            type="file" 
                                            className="sr-only" 
                                            onChange={(e) => handlePortfolioChange(e, 'image')}
                                            accept="image/*"
                                            multiple
                                        />
                                    </label>
                                </Button>
                                 <Button asChild variant="outline">
                                    <label htmlFor="portfolio-video-upload">
                                        <Video className="mr-2" />
                                        Adicionar Vídeos ao Portfólio
                                        <Input 
                                            id="portfolio-video-upload" 
                                            type="file" 
                                            className="sr-only" 
                                            onChange={(e) => handlePortfolioChange(e, 'video')}
                                            accept="video/*"
                                            multiple
                                        />
                                    </label>
                                </Button>
                            </div>
                             <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {portfolioImages.map((url, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <Image src={url} alt={`Portfolio image ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                                    </div>
                                ))}
                                {portfolioVideos.map((url, index) => (
                                    <div key={index} className="relative aspect-square">
                                        <video src={url} className="rounded-md w-full h-full object-cover" controls />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleSaveSettings} className="w-full" size="lg">
                            <Check className="mr-2" />
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>

                <DiagnosisAssistant specialty={specialty} />
                <ExpansionOpportunities />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy /> Status de Profissional</CardTitle>
                             <CardDescription>Seu nível e conquistas na plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center gap-4 rounded-lg bg-muted p-4">
                                <Award className="size-16 text-amber-500" />
                                <div>
                                    <p className="text-muted-foreground">Seu Nível</p>
                                    <p className="text-2xl font-bold text-amber-600">Profissional Ouro</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Conquistas</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="border-green-500 text-green-700"><ShieldCheck className="mr-1" /> Verificação Premium</Badge>
                                    <Badge variant="secondary" className="border-blue-500 text-blue-700"><Check className="mr-1" /> 10+ Serviços Concluídos</Badge>
                                    <Badge variant="secondary"><Star className="mr-1" /> Avaliação 4.8+</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2"><Target /> Missões da Semana</CardTitle>
                           <CardDescription>Complete tarefas para ganhar bônus e destaque.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {missions.map(mission => (
                                <div key={mission.title}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium">{mission.title}</p>
                                        <p className="text-sm font-semibold text-primary">Bônus: {mission.reward}</p>
                                    </div>
                                    <Progress value={mission.progress} />
                                    <p className="text-xs text-muted-foreground mt-1 text-right">{mission.current}/{mission.goal} concluídos</p>
                                </div>
                           ))}
                        </CardContent>
                    </Card>
                </div>
                
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 />
                            Compartilhe seu Conhecimento
                        </CardTitle>
                        <CardDescription>
                           Ajude outros profissionais enviando fotos ou vídeos de problemas comuns e suas soluções. Sua contribuição fortalece toda a comunidade.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="contribution-title" className="flex items-center gap-2">
                                <Lightbulb />
                                Título do Problema/Solução
                            </Label>
                            <Input 
                                id="contribution-title"
                                placeholder="Ex: Como trocar resistência de chuveiro Lorenzetti"
                                value={contributionTitle}
                                onChange={(e) => setContributionTitle(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="contribution-description">Descrição Detalhada</Label>
                            <Textarea 
                                id="contribution-description"
                                placeholder="Descreva o passo a passo da solução, ferramentas utilizadas e dicas importantes."
                                value={contributionDescription}
                                onChange={(e) => setContributionDescription(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="contribution-file">Foto ou Vídeo</Label>
                             <Button asChild variant="outline" className="w-full cursor-pointer">
                                <label htmlFor="contribution-file-upload">
                                    <Upload className="mr-2" />
                                    {contributionFile ? contributionFile.name : "Enviar Foto ou Vídeo"}
                                    <Input 
                                        id="contribution-file-upload" 
                                        type="file" 
                                        className="sr-only" 
                                        onChange={(e) => setContributionFile(e.target.files ? e.target.files[0] : null)}
                                        accept="image/*,video/*"
                                    />
                                </label>
                            </Button>
                        </div>
                        <Button onClick={handleSendContribution} className="w-full">
                            Enviar Contribuição
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
