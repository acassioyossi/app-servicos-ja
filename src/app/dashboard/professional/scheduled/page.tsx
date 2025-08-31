
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Check, MapPin, MessageSquare, Phone, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";


const scheduledServicesData = [
  {
    id: "SCHED_001",
    clientName: "Ana Silva",
    clientAvatar: "https://placehold.co/100x100.png",
    service: "Instalação de Ar Condicionado",
    date: "25 de Julho, 2024",
    time: "14:00",
    address: "Rua das Flores, 123 - São Paulo, SP",
    status: "confirmed"
  },
  {
    id: "SCHED_002",
    clientName: "Bruno Costa",
    clientAvatar: "https://placehold.co/100x100.png",
    service: "Revisão Elétrica Completa",
    date: "26 de Julho, 2024",
    time: "09:00",
    address: "Avenida Principal, 456 - Rio de Janeiro, RJ",
    status: "pending"
  },
  {
    id: "SCHED_003",
    clientName: "Carlos Mendes",
    clientAvatar: "https://placehold.co/100x100.png",
    service: "Manutenção Preventiva de Encanamento",
    date: "28 de Julho, 2024",
    time: "10:30",
    address: "Praça da Matriz, 789 - Belo Horizonte, MG",
    status: "confirmed"
  }
];

export default function ScheduledServicesPage() {
    const { toast } = useToast();
    const [services, setServices] = useState(scheduledServicesData);
    const [activeTab, setActiveTab] = useState("confirmed");

    const handleConfirm = (id: string) => {
        setServices(services.map(s => s.id === id ? { ...s, status: 'confirmed' } : s));
        toast({ title: "Serviço Confirmado!", description: "O cliente foi notificado da sua confirmação." });
    }

    const handleCancel = (id: string) => {
        setServices(services.filter(s => s.id !== id));
        toast({ title: "Serviço Cancelado", description: "O agendamento foi removido da sua lista.", variant: "destructive" });
    }

    const filteredServices = services.filter(s => s.status === activeTab);

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
                    <CalendarClock />
                    Meus Serviços Agendados
                </h1>
            </div>

             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="confirmed">Confirmados ({services.filter(s => s.status === 'confirmed').length})</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes ({services.filter(s => s.status === 'pending').length})</TabsTrigger>
                </TabsList>
                <TabsContent value="confirmed">
                    <ServiceList services={filteredServices} onConfirm={handleConfirm} onCancel={handleCancel} />
                </TabsContent>
                 <TabsContent value="pending">
                     <ServiceList services={filteredServices} onConfirm={handleConfirm} onCancel={handleCancel} />
                </TabsContent>
            </Tabs>
        </>
    );
}


function ServiceList({services, onConfirm, onCancel}: {services: typeof scheduledServicesData, onConfirm: (id: string) => void, onCancel: (id: string) => void}) {
    const { toast } = useToast();
    const router = useRouter();

    const handlePhoneCall = () => {
        toast({
            title: "Funcionalidade em desenvolvimento",
            description: "A ligação por voz será implementada em breve."
        });
    }

    const handleChat = (service: typeof scheduledServicesData[0]) => {
        router.push(`/dashboard/chat?professional=${service.service}`);
    }

    if (services.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12 shadow-sm my-6">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Nenhum serviço aqui
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Você não tem serviços com este status no momento.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
                <Card key={service.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-12">
                                    <AvatarImage src={service.clientAvatar} alt={service.clientName} data-ai-hint="person portrait" />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{service.clientName}</CardTitle>
                                    <CardDescription>{service.service}</CardDescription>
                                </div>
                            </div>
                           <Badge variant={service.status === 'confirmed' ? 'default' : 'secondary'} className={service.status === 'confirmed' ? 'bg-green-600' : ''}>
                                {service.status === 'confirmed' ? "Confirmado" : "Pendente"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                        <div className="flex items-center text-sm">
                            <CalendarClock className="mr-2 text-primary" />
                            <span>{service.date} às {service.time}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <MapPin className="mr-2 text-primary" />
                            <span>{service.address}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-2">
                        {service.status === 'pending' ? (
                            <>
                                 <Button variant="outline" onClick={() => onCancel(service.id)}>
                                    <X className="mr-2" />
                                    Recusar
                                </Button>
                                <Button onClick={() => onConfirm(service.id)}>
                                    <Check className="mr-2" />
                                    Confirmar
                                </Button>
                            </>
                        ) : (
                            <>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="col-span-2">Cancelar Agendamento</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O cliente será notificado que o serviço foi cancelado por você.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onCancel(service.id)} className='bg-destructive hover:bg-destructive/90'>Confirmar Cancelamento</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" onClick={handlePhoneCall}><Phone className="mr-2" /> Ligar</Button>
                                <Button onClick={() => handleChat(service)}><MessageSquare className="mr-2" /> Chat</Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

    