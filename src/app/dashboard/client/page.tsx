

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 as Loader, Map, Star, User, Truck, Car, Bike, Package, Users as UsersIcon, Building2, Recycle, Upload, Camera, Bus, HelpCircle, Calendar as CalendarIcon, Clock, Lightbulb, Wrench, Siren, Check, ChevronsUpDown, MapPin, Sparkles } from 'lucide-react';
import { fullProfessionList } from '@/lib/professions';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from "date-fns"
import { calculateMarketPrice } from '@/ai/flows/calculate-market-price';
import { useToast } from '@/hooks/use-toast';
import { LazyMap, LazyChat } from '@/components/lazy-loader';


const motoKeywords = ["motoboy", "moto-táxi", "moto uber", "motociclista"];
const transportKeywords = ["motorista", "caminhoneiro", "carro", "ônibus", "uber", "táxi", "transporte", "piloto", "frete", "mudança", "van", "caminhão"];
const recycleKeyword = "catador de reciclagem";
const guinchoKeyword = "guincho";

const passengerVehicleOptions: { name: string; icon: LucideIcon }[] = [
    { name: "Carro Compacto", icon: Car },
    { name: "Carro Sedan", icon: Car },
    { name: "SUV", icon: Car },
    { name: "Van", icon: Bus },
];

const freightVehicleOptions: { name: string; icon: LucideIcon }[] = [
    { name: "Fiorino", icon: Truck },
    { name: "Van (Carga)", icon: Bus },
    { name: "Caminhão Pequeno", icon: Truck },
    { name: "Caminhão Grande", icon: Truck },
];

const guinchoVehicleOptions: { name: string; icon: LucideIcon }[] = [
    { name: "Motocicleta", icon: Bike },
    { name: "Carro de Passeio", icon: Car },
    { name: "SUV / Utilitário", icon: Car },
    { name: "Van", icon: Bus },
    { name: "Veículo Pesado", icon: Truck },
];

const guinchoReasonOptions = [ "Pane mecânica", "Pane elétrica", "Acidente", "Pneu furado", "Falta de combustível", "Superaquecimento", "Outro" ];


interface RideOption {
    name: string;
    price: number;
    eta: string;
    capacity: number;
    description: string;
    avatar: string;
    aiHint: string;
    icon: LucideIcon;
    professionalName: string;
}

interface Recommendation {
    icon: LucideIcon;
    title: string;
    description: string;
    specialty: string;
}

const staticRecommendations: Recommendation[] = [
    { icon: Wrench, title: "Manutenção de Ar Condicionado", description: "Sua última limpeza foi há mais de 6 meses. Agende uma manutenção preventiva e garanta o bom funcionamento.", specialty: "Técnico de Ar Condicionado" },
    { icon: Recycle, title: "Coleta de Recicláveis", description: "Facilite a coleta seletiva na sua casa. Chame um parceiro para retirar seus materiais recicláveis.", specialty: "Catador de Reciclagem" },
    { icon: Lightbulb, title: "Revisão Elétrica Preventiva", description: "Garanta a segurança da sua casa. Solicite uma revisão completa da fiação e dos disjuntores.", specialty: "Eletricista" },
];


export default function ClientDashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [requestState, setRequestState] = useState<'idle' | 'requesting' | 'options' | 'recycle_match' | 'tracking'>('idle');
    const [service, setService] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [genderPreference, setGenderPreference] = useState('any');
    const [serviceMedia, setServiceMedia] = useState<File | null>(null);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

    // State for scheduling
    const [scheduleType, setScheduleType] = useState('now');
    const [scheduledDate, setScheduledDate] = useState<Date>();
    const [scheduledTime, setScheduledTime] = useState("");
    
    const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);


    // State for vehicle selection
    const [isMotoService, setIsMotoService] = useState(false);
    const [isTransportService, setIsTransportService] = useState(false);
    const [isRecycleService, setIsRecycleService] = useState(false);
    const [isGuinchoService, setIsGuinchoService] = useState(false);

    const [motoCategory, setMotoCategory] = useState('');
    const [transportType, setTransportType] = useState(''); // 'passageiro' or 'frete'
    const [vehicle, setVehicle] = useState('');
    
    // State for guincho service
    const [guinchoVehicleType, setGuinchoVehicleType] = useState('');
    const [guinchoReason, setGuinchoReason] = useState('');
    
    const professionalToTrack = searchParams.get('professional');

    useEffect(() => {
        if (professionalToTrack) {
            setRequestState('tracking');
        }
    }, [professionalToTrack]);


    useEffect(() => {
        // Pre-fill gender preference if coming from "Espaço Mulher"
        if (searchParams.get('flow') === 'espaco-mulher') {
            setGenderPreference('feminino');
        }
    }, [searchParams]);


    useEffect(() => {
        const getRandomRecommendations = () => {
          const availableProfessions = fullProfessionList.filter(p => 
            !staticRecommendations.some(r => r.specialty === p)
          ).map(prof => ({
              icon: Sparkles, // Default icon
              title: `Contratar ${prof}`,
              description: `Precisa de um(a) ${prof}? Encontre os melhores profissionais aqui.`,
              specialty: prof,
          }));

          const shuffled = [...staticRecommendations, ...availableProfessions].sort(() => 0.5 - Math.random());
          setRecommendations(shuffled.slice(0, 3));
        };
    
        getRandomRecommendations();
      }, []);


    const handleServiceChange = (value: string) => {
        setService(value);
        const lowerCaseValue = value.toLowerCase();
        
        const isMoto = motoKeywords.some(keyword => lowerCaseValue.includes(keyword));
        const isTransport = transportKeywords.some(keyword => lowerCaseValue.includes(keyword));
        const isRecycle = lowerCaseValue.includes(recycleKeyword);
        const isGuincho = lowerCaseValue.includes(guinchoKeyword);

        setIsMotoService(isMoto);
        setIsTransportService(isTransport && !isMoto);
        setIsRecycleService(isRecycle);
        setIsGuinchoService(isGuincho);

        // Reset dependent fields
        setDescription("");
        setLocation("");
        setMotoCategory('');
        setTransportType('');
        setVehicle('');
        setGuinchoVehicleType('');
        setGuinchoReason('');
    }

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
             toast({
                variant: 'destructive',
                title: "Geolocalização não suportada",
                description: "Seu navegador não suporta esta funcionalidade.",
            });
            return;
        }

        setIsFetchingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, you would use position.coords.latitude and position.coords.longitude
                // to call a reverse geocoding API. Here we'll just simulate it.
                setLocation("Av. Paulista, 1578, São Paulo - SP");
                 toast({
                    title: "Localização Encontrada!",
                    description: "Seu endereço foi preenchido automaticamente.",
                });
                setIsFetchingLocation(false);
            },
            (error) => {
                let errorMessage = "Não foi possível obter sua localização.";
                 if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Você negou o acesso à sua localização. Por favor, habilite nas configurações do seu navegador.";
                }
                 toast({
                    variant: 'destructive',
                    title: "Erro de Geolocalização",
                    description: errorMessage,
                });
                setIsFetchingLocation(false);
            }
        );
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service || !description || !location) return;

        if (scheduleType === 'schedule' && (!scheduledDate || !scheduledTime)) {
            toast({
                variant: 'destructive',
                title: "Agendamento incompleto",
                description: "Por favor, selecione a data e a hora para o seu serviço agendado.",
            });
            return;
        }

        setRequestState('requesting');

        if (isRecycleService) {
             setTimeout(() => {
                router.push(`/dashboard/client?professional=Coletor de Reciclagem`);
            }, 3000);
             return;
        }

        // If it's a transport service, show ride options
        if (isMotoService || isTransportService) {
            if (isMotoService && !motoCategory) {
                setRequestState('idle'); // Abort if validation fails
                return;
            };
            if (isTransportService && (!transportType || !vehicle)) {
                setRequestState('idle'); // Abort if validation fails
                return;
            };

            try {
                const priceResult = await calculateMarketPrice({
                    jobDescription: description,
                    professionalSpecialty: service,
                });

                if (priceResult.suggestedPrice === 0) {
                     toast({
                        variant: 'destructive',
                        title: "Não foi possível calcular o preço",
                        description: priceResult.explanation,
                    });
                    setRequestState('idle');
                    return;
                }

                // Generate dynamic ride options based on AI result
                const basePrice = priceResult.suggestedPrice;
                 let dynamicRideOptions: RideOption[];

                if (isMotoService) {
                    dynamicRideOptions = [
                        { name: "ServiçosJá Moto", icon: Bike, price: basePrice, eta: '5 min', capacity: 1, description: "Entregas e viagens rápidas.", avatar: "https://placehold.co/100x100.png", aiHint: "motorcycle delivery", professionalName: "Marcos" },
                    ];
                } else { // isTransportService
                    dynamicRideOptions = [
                        { name: "ServiçosJá X", icon: Car, price: basePrice, eta: '5 min', capacity: 4, description: "Viagens acessíveis para o dia a dia.", avatar: "https://placehold.co/100x100.png", aiHint: "compact car", professionalName: "Carlos" },
                        { name: "ServiçosJá Black", icon: Car, price: basePrice * 1.5, eta: '3 min', capacity: 4, description: "Carros premium com os melhores motoristas.", avatar: "https://placehold.co/100x100.png", aiHint: "sedan car", professionalName: "Beatriz" },
                        { name: "ServiçosJá Van", icon: Bus, price: basePrice * 1.7, eta: '8 min', capacity: 7, description: "Para grupos de até 7 pessoas.", avatar: "https://placehold.co/100x100.png", aiHint: "van car", professionalName: "Roberto" },
                    ];
                }

                setRideOptions(dynamicRideOptions);
                setRequestState('options');

            } catch (error: any) {
                 toast({
                    variant: 'destructive',
                    title: "Erro ao calcular preço",
                    description: error.message || "Não foi possível buscar opções de viagem. Tente novamente.",
                });
                setRequestState('idle');
            }


        } else if (isGuinchoService) {
             if (!guinchoVehicleType || !guinchoReason) {
                setRequestState('idle'); // Abort if validation fails
                return;
            }
             setTimeout(() => {
                 router.push(`/dashboard/client?professional=${service}`);
            }, 3000);
        }
        else {
             // For any other service (eletrician, plumber, etc.), go directly to chat/map
            if (scheduleType === 'schedule' && scheduledDate) {
                toast({
                    title: "Serviço Agendado com Sucesso!",
                    description: `Seu serviço de ${service} foi agendado para ${format(scheduledDate, "PPP")} às ${scheduledTime}.`,
                });
                 // Short delay to allow toast to be seen before redirect
                 setTimeout(() => {
                    router.push(`/dashboard/client?professional=${service}`);
                }, 1000);
            } else {
                 setTimeout(() => {
                     router.push(`/dashboard/client?professional=${service}`);
                }, 3000);
            }
        }
    };

    const handleSelectRide = (option: RideOption) => {
        router.push(`/dashboard/client?professional=${option.professionalName} - ${option.name}`);
    }

    const isButtonDisabled = !service || !description || !location || 
        (isMotoService && !motoCategory) || 
        (isTransportService && (!transportType || !vehicle)) ||
        (isGuinchoService && (!guinchoVehicleType || !guinchoReason)) ||
        (scheduleType === 'schedule' && (!scheduledDate || !scheduledTime));
        
    const descriptionLabel = isTransportService || isMotoService
        ? "Descreva o destino e a distância (Ex: Ir para o Shopping Central, uma viagem de 15km)"
        : isRecycleService
        ? "Descreva os materiais para coleta (Ex: caixas de papelão, garrafas PET)"
        : isGuinchoService
        ? "Forneça detalhes adicionais (opcional)"
        : "Descreva o que precisa ser feito";

    const descriptionPlaceholder = isTransportService || isMotoService
        ? "Ex: Preciso de uma viagem para o aeroporto, cerca de 25 km."
        : isRecycleService
        ? "Tenho 10 caixas grandes de papelão e 2 sacos de garrafas PET para coleta."
        : isGuinchoService
        ? "Ex: O carro está na garagem do subsolo."
        : "Ex: Preciso instalar um chuveiro novo no endereço X.";

    const renderLoadingState = (title: string, message: string) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
             <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Loader className="animate-spin" />
                {title}
             </div>
            <p className="max-w-md text-muted-foreground">
                {message}
            </p>
            <div className="mt-4 w-full max-w-lg rounded-lg border border-dashed p-8 shadow-sm">
                <p className="font-semibold">{service}</p>
                <p className="text-sm text-muted-foreground">{location}</p>
            </div>
        </div>
    );


    if (requestState === 'requesting') {
        const title = scheduleType === 'schedule' 
            ? "Agendando seu serviço..."
            : (isMotoService || isTransportService) 
            ? "Buscando as melhores opções..." 
            : (isGuinchoService ? "Acionando o guincho mais próximo..." :`Encontrando um(a) ${service}...`);
            
        const message = scheduleType === 'schedule'
            ? `Estamos confirmando os detalhes do seu agendamento de ${service}.`
            : (isMotoService || isTransportService) 
            ? "Aguarde enquanto encontramos as melhores corridas e profissionais para você." 
            : (isGuinchoService ? "Estamos localizando um profissional de guincho paraatendê-lo imediatamente." :`Aguarde enquanto localizamos um(a) ${service} disponível para você.`);
        
        return renderLoadingState(title, message);
    }
    
    if (requestState === 'recycle_match') {
         return renderLoadingState("Encontrando um coletor parceiro...", "Estamos localizando o catador de reciclagem mais próximo para realizar sua coleta.");
    }


    if (requestState === 'options') {
        return (
             <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Escolha uma Viagem</CardTitle>
                        <CardDescription>Estas são as opções disponíveis para o seu destino.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {rideOptions.map((option) => (
                             <Card key={option.name} className="flex items-center gap-4 p-4 transition-all hover:bg-muted">
                                <Avatar className="size-16">
                                    <AvatarImage src={option.avatar} alt={option.name} data-ai-hint={option.aiHint} />
                                    <AvatarFallback><option.icon/></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold">{option.name}</p>
                                      <div className="flex items-center text-xs text-muted-foreground"><UsersIcon className='size-3 mr-1'/> {option.capacity}</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{option.description}</p>
                                    <p className="text-xs text-primary font-semibold">Chegada em {option.eta}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-primary">R$ {option.price.toFixed(2)}</p>
                                </div>
                                <Button onClick={() => handleSelectRide(option)} size="sm" className="ml-4">
                                    Selecionar
                                </Button>
                            </Card>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setRequestState('idle')}>Voltar</Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (requestState === 'tracking') {
        return (
            <div className='grid h-full lg:grid-cols-2 gap-6'>
                <div className='lg:col-span-1 h-full'>
                    <LazyChat />
                </div>
                <div className='hidden lg:block lg:col-span-1 h-full'>
                    <LazyMap />
                </div>
            </div>
        )
    }


    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">
                    {scheduleType === 'schedule' ? 'Agendar um Serviço' : 'Solicitar um Serviço'}
                </h1>
            </div>
             <div className="flex-1 rounded-lg border border-dashed shadow-sm">
                <Card className="mx-auto my-8 max-w-2xl border-none shadow-none">
                    <CardHeader>
                        <CardTitle>O que você precisa?</CardTitle>
                        <CardDescription>Preencha os detalhes abaixo para encontrarmos o profissional ideal para você em tempo real.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmitRequest} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Quando você precisa do serviço?</Label>
                                <RadioGroup defaultValue="now" value={scheduleType} onValueChange={setScheduleType} className="grid grid-cols-2 gap-4">
                                     <div>
                                        <RadioGroupItem value="now" id="now" className="peer sr-only" />
                                        <Label
                                            htmlFor="now"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <Clock className="mb-3 size-6" />
                                            Agora
                                        </Label>
                                    </div>

                                     <div>
                                        <RadioGroupItem value="schedule" id="schedule" className="peer sr-only" />
                                        <Label
                                            htmlFor="schedule"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                           <CalendarIcon className="mb-3 size-6" />
                                            Agendar
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            
                            <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", scheduleType === 'schedule' ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="schedule-date">Selecione a data</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !scheduledDate && "text-muted-foreground"
                                                )}
                                                >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {scheduledDate ? format(scheduledDate, "PPP") : <span>Escolha uma data</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={scheduledDate}
                                                    onSelect={setScheduledDate}
                                                    initialFocus
                                                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="schedule-time">Selecione a hora</Label>
                                        <Select onValueChange={setScheduledTime} value={scheduledTime}>
                                            <SelectTrigger id="schedule-time">
                                                <SelectValue placeholder="Escolha um horário" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="08:00">08:00</SelectItem>
                                                <SelectItem value="09:00">09:00</SelectItem>
                                                <SelectItem value="10:00">10:00</SelectItem>
                                                <SelectItem value="11:00">11:00</SelectItem>
                                                <SelectItem value="13:00">13:00</SelectItem>
                                                <SelectItem value="14:00">14:00</SelectItem>
                                                <SelectItem value="15:00">15:00</SelectItem>
                                                <SelectItem value="16:00">16:00</SelectItem>
                                                <SelectItem value="17:00">17:00</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>


                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="service" className={cn("flex items-center gap-2", isRecycleService && "text-green-600", isGuinchoService && "text-destructive")}>
                                        {isRecycleService && <Recycle />}
                                        {isGuinchoService && <Siren />}
                                        Qual serviço você precisa?
                                    </Label>
                                     <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isComboboxOpen}
                                                className="w-full justify-between"
                                            >
                                                {service
                                                    ? fullProfessionList.find((prof) => prof.toLowerCase() === service.toLowerCase())
                                                    : "Selecione uma profissão..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar profissão..." />
                                                <CommandList>
                                                    <CommandEmpty>Nenhuma profissão encontrada.</CommandEmpty>
                                                    <CommandGroup>
                                                        {fullProfessionList.map((prof) => (
                                                            <CommandItem
                                                                key={prof}
                                                                value={prof}
                                                                onSelect={(currentValue) => {
                                                                    const newValue = currentValue.toLowerCase() === service.toLowerCase() ? "" : prof;
                                                                    handleServiceChange(newValue);
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        service.toLowerCase() === prof.toLowerCase() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {prof}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                 <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="location">Onde será o serviço? (Ponto de Partida)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="location" placeholder="Ex: Rua das Flores, 123" value={location} onChange={e => setLocation(e.target.value)} />
                                        <Button type="button" size="icon" variant="outline" onClick={handleGetCurrentLocation} disabled={isFetchingLocation}>
                                            {isFetchingLocation ? <Loader className="animate-spin" /> : <MapPin />}
                                            <span className="sr-only">Usar minha localização atual</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender-preference">Preferência de Gênero do Profissional</Label>
                                <Select onValueChange={setGenderPreference} value={genderPreference}>
                                    <SelectTrigger id="gender-preference">
                                        <SelectValue placeholder="Selecione sua preferência" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Sem preferência</SelectItem>
                                        <SelectItem value="feminino">Feminino</SelectItem>
                                        <SelectItem value="masculino">Masculino</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* GUINCHO SERVICE OPTIONS */}
                             <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", isGuinchoService ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                                <div className="space-y-2">
                                    <Label htmlFor="guincho-vehicle">Qual veículo precisa de reboque?</Label>
                                    <Select onValueChange={setGuinchoVehicleType} value={guinchoVehicleType}>
                                        <SelectTrigger id="guincho-vehicle">
                                            <SelectValue placeholder="Selecione o tipo de veículo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {guinchoVehicleOptions.map(opt => (
                                                <SelectItem key={opt.name} value={opt.name}><div className="flex items-center gap-2"><opt.icon /> {opt.name}</div></SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guincho-reason">Qual o motivo da solicitação?</Label>
                                    <Select onValueChange={setGuinchoReason} value={guinchoReason}>
                                        <SelectTrigger id="guincho-reason">
                                            <SelectValue placeholder="Selecione o motivo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {guinchoReasonOptions.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* MOTO SERVICE OPTIONS */}
                            <div className={cn("space-y-2 transition-all duration-500 overflow-hidden", isMotoService ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                                <Label htmlFor="moto-category">Qual a finalidade?</Label>
                                <Select onValueChange={setMotoCategory} value={motoCategory}>
                                    <SelectTrigger id="moto-category">
                                        <SelectValue placeholder="Selecione a categoria da moto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bau"><div className="flex items-center gap-2"><Package /> Com Baú (Entregas)</div></SelectItem>
                                        <SelectItem value="termica"><div className="flex items-center gap-2"><Package /> Com Mochila Térmica</div></SelectItem>
                                        <SelectItem value="passageiro"><div className="flex items-center gap-2"><UsersIcon /> Para Passageiro</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                           {/* OTHER TRANSPORT SERVICES */}
                            <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", isTransportService ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                                <div className="space-y-2">
                                    <Label htmlFor="transport-type">Qual o tipo de transporte?</Label>
                                    <Select onValueChange={(v) => { setTransportType(v); setVehicle(''); }} value={transportType}>
                                        <SelectTrigger id="transport-type">
                                            <SelectValue placeholder="Selecione o tipo de transporte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="passageiro"><div className="flex items-center gap-2"><UsersIcon /> Transporte de Passageiros</div></SelectItem>
                                            <SelectItem value="frete"><div className="flex items-center gap-2"><Package /> Frete / Carga</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {transportType && (
                                     <div className="space-y-2">
                                        <Label>Qual veículo você precisa?</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {(transportType === 'passageiro' ? passengerVehicleOptions : freightVehicleOptions).map((option) => (
                                                <Card 
                                                    key={option.name} 
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-muted transition-colors",
                                                        vehicle === option.name && "border-primary ring-2 ring-primary"
                                                    )}
                                                    onClick={() => setVehicle(option.name)}
                                                >
                                                    <option.icon className="size-8 mb-2 text-primary" />
                                                    <p className="text-sm font-medium text-center">{option.name}</p>
                                                </Card>
                                            ))}
                                        </div>
                                     </div>
                                )}
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="description">
                                     {descriptionLabel}
                                </Label>
                                <Textarea 
                                    id="description" 
                                    placeholder={descriptionPlaceholder} 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="service-media">
                                    {isRecycleService ? "Foto dos materiais (opcional)" : "Foto ou vídeo do problema (opcional)"}
                                </Label>
                                 <Button asChild variant="outline" className="w-full cursor-pointer">
                                    <label htmlFor="service-media-upload">
                                        <Camera className="mr-2" />
                                        {serviceMedia ? serviceMedia.name : "Enviar Foto ou Vídeo"}
                                        <Input 
                                            id="service-media-upload" 
                                            type="file" 
                                            className="sr-only" 
                                            onChange={(e) => setServiceMedia(e.target.files ? e.target.files[0] : null)}
                                            accept="image/*,video/*"
                                        />
                                    </label>
                                </Button>
                            </div>

                            <Button type="submit" size="lg" className="w-full" disabled={isButtonDisabled}>
                                {scheduleType === 'schedule' ? 'Agendar Serviço' : (isRecycleService ? "Encontrar Catador" : (isMotoService || isTransportService) ? "Encontrar Opções de Viagem" : isGuinchoService ? "Chamar Guincho Agora" : "Encontrar Profissional")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                 <Card className="mx-auto max-w-2xl">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb />
                            Recomendações Inteligentes para Você
                        </CardTitle>
                        <CardDescription>
                            Com base na nossa inteligência, sugerimos alguns serviços que podem ser úteis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {recommendations.map((rec) => (
                             <div key={rec.title} className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                                    <rec.icon className="size-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{rec.title}</h4>
                                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                                </div>
                                <Button 
                                    size="sm"
                                    onClick={() => {
                                        handleServiceChange(rec.specialty);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    Solicitar
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                 </Card>
            </div>
        </>
    )
}
    
    

