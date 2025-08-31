"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Car, Clock, MapPin, User } from "lucide-react";
import { Progress } from "../ui/progress";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function MapView() {
    const searchParams = useSearchParams()
    const professionalName = searchParams.get('professional') || 'Profissional';

    const [progress, setProgress] = useState(15);
    const [eta, setEta] = useState(12);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + 10;
                return next > 100 ? 100 : next;
            });
            setEta(prev => {
                const next = prev - 1;
                return next < 0 ? 0 : next;
            });
        }, 3000);

        return () => clearInterval(timer);
    }, []);

    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>GPS em Tempo Real</span>
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-sm font-medium text-muted-foreground">Rastreamento Ativo</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
                <div className="relative h-2/3 w-full overflow-hidden rounded-lg">
                    <Image 
                        src="https://placehold.co/800x600.png" 
                        alt="Mapa com rota do profissional"
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="map route"
                    />
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4">
                    <Avatar className="size-14">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={professionalName} data-ai-hint="professional portrait" />
                        <AvatarFallback>{professionalName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold">{professionalName}</p>
                        <p className="text-sm text-primary font-semibold">A caminho</p>
                        <Progress value={progress} className="mt-2 h-2" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                        <Clock className="size-5 text-primary"/>
                        <div>
                            <p className="font-semibold">Tempo Estimado</p>
                            <p className="text-muted-foreground">{eta} minutos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                        <MapPin className="size-5 text-primary"/>
                        <div>
                            <p className="font-semibold">Distância</p>
                            <p className="text-muted-foreground">{(eta * 0.3).toFixed(1)} km</p>
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}
