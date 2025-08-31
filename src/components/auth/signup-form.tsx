

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { signupSchema } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Camera, ShieldCheck, Loader2, Upload, FileImage, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { fullProfessionList } from "@/lib/professions";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "../ui/checkbox";
import Image from "next/image";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { useFirebaseAuth, UserType } from "@/hooks/use-firebase-auth";
import { ScreenReaderOnly, useScreenReaderAnnouncements, LiveRegion } from "@/components/accessibility/accessibility-utils";

const vehicleKeywords = ["motorista", "caminhoneiro", "carro", "moto", "ônibus", "uber", "táxi", "transporte", "piloto", "frete", "mudança", "motoboy", "guincho"];
const nonVehicleKeywords = ["dono de frota / aluguel de veículo"];
const healthKeywords = ["médico", "enfermeiro", "enfermagem", "psicólogo", "fisioterapeuta", "dentista", "odontologia", "nutricionista", "veterinário", "farmacêutico", "pediatra", "cardiologista", "dermatologista", "ginecologista", "ortopedista", "técnico de enfermagem"];
const lawyerKeyword = "advogado";
const recycleKeyword = "catador de reciclagem";
const apprenticeKeyword = "jovem aprendiz";


type FormData = z.infer<typeof signupSchema>;
type Step = "form" | "verification" | "success";

function VerificationStep({ onVerificationComplete, onBack, isVerifying, documentPhotoFront, documentPhotoBack }: { onVerificationComplete: () => void, onBack: () => void, isVerifying: boolean, documentPhotoFront: File | null, documentPhotoBack: File | null }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [docFrontUrl, setDocFrontUrl] = useState<string | null>(null);
    const [docBackUrl, setDocBackUrl] = useState<string | null>(null);

     useEffect(() => {
        if (documentPhotoFront) {
            const url = URL.createObjectURL(documentPhotoFront);
            setDocFrontUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [documentPhotoFront]);
    
     useEffect(() => {
        if (documentPhotoBack) {
            const url = URL.createObjectURL(documentPhotoBack);
            setDocBackUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [documentPhotoBack]);


    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Acesso à Câmera Negado',
              description: 'Por favor, habilite o acesso nas configurações do seu navegador para continuar.',
            });
          }
        };
    
        getCameraPermission();
      }, [toast]);
    
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    <ShieldCheck className="size-6" />
                    Verificação de Segurança
                </CardTitle>
                <CardDescription>
                    Para sua segurança, faremos uma análise facial para comparar com seu documento.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
                 <div className="mb-6 w-full">
                     <h3 className="font-semibold mb-2">Sua Câmera</h3>
                     <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 overflow-hidden">
                        {isVerifying && <Loader2 className="size-16 animate-spin text-primary" />}

                        <video ref={videoRef} className={cn("absolute w-full h-full object-cover", (isVerifying || !hasCameraPermission) && "opacity-0")} autoPlay muted playsInline />

                        { !hasCameraPermission && !isVerifying && (
                            <Alert variant="destructive" className="m-4">
                              <AlertTitle>Câmera Indisponível</AlertTitle>
                              <AlertDescription>
                                Verifique as permissões de câmera do seu navegador.
                              </AlertDescription>
                            </Alert>
                        )}
                    </div>
                     <p className="text-xs text-muted-foreground mt-2">Posicione seu rosto na câmera.</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 w-full">
                    <div className="flex flex-col items-center gap-2">
                         <h3 className="font-semibold">Frente do Documento</h3>
                         <div className="relative flex h-32 w-48 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                            {docFrontUrl ? (
                                <Image src={docFrontUrl} alt="Frente do Documento" layout="fill" objectFit="contain" />
                            ) : (
                                <FileImage className="size-16 text-muted-foreground" />
                            )}
                        </div>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                         <h3 className="font-semibold">Verso do Documento</h3>
                         <div className="relative flex h-32 w-48 items-center justify-center rounded-lg border bg-muted overflow-hidden">
                            {docBackUrl ? (
                                <Image src={docBackUrl} alt="Verso do Documento" layout="fill" objectFit="contain" />
                            ) : (
                                <FileImage className="size-16 text-muted-foreground" />
                            )}
                        </div>
                    </div>
                </div>

                 <p className="mb-4 text-muted-foreground">Clique no botão abaixo para iniciar a verificação facial.</p>
                 <Button size="lg" className="w-full" onClick={onVerificationComplete} disabled={isVerifying || !hasCameraPermission}>
                    {isVerifying ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isVerifying ? "Verificando..." : "Iniciar Verificação Facial"}
                </Button>
                <Button variant="outline" className="w-full mt-2" onClick={onBack} disabled={isVerifying}>
                    Voltar
                </Button>
            </CardContent>
        </Card>
    )
}

function SuccessStep({ data }: { data: FormData }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isWoman = data.gender === "feminino";
    const dashboardType = data.type === "Profissional" ? "professional" : "client";
    const flowParam = searchParams.get('flow');

    const defaultRedirectUrl = `/dashboard/${dashboardType}`;
    
    const clientRedirectUrl = (isWoman || flowParam === 'espaco-mulher') ? `/dashboard/client?flow=espaco-mulher` : defaultRedirectUrl;
    
    const handleRedirect = () => {
        const url = data.type === 'Cliente' ? clientRedirectUrl : defaultRedirectUrl;
        router.push(url);
    };

    const handleWomenSpaceRedirect = () => {
        router.push('/dashboard/espaco-mulher');
    };

    if (isWoman) {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                     <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 mb-4">
                        <Check className="size-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">
                        Bem-vinda, {data.fullName.split(' ')[0]}!
                    </CardTitle>
                    <CardDescription>
                        Seu cadastro foi finalizado com sucesso! Temos uma comunidade especial para você.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="p-6 rounded-lg border bg-muted/50">
                        <h3 className="font-semibold text-primary">Conheça o Espaço Mulher</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Um ambiente seguro e acolhedor para que mulheres possam oferecer e contratar serviços com total confiança.
                        </p>
                    </div>
                    <div className="mt-6 flex flex-col gap-3">
                        <Button size="lg" onClick={handleWomenSpaceRedirect}>
                            Conhecer o Espaço Mulher <ArrowRight className="ml-2"/>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleRedirect}>
                            Ir para o painel principal
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    // Default success for others
    useEffect(() => {
        const timer = setTimeout(() => {
            handleRedirect();
        }, 2000);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
                 <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <Check className="size-10 text-green-600" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                    Cadastro Concluído!
                </CardTitle>
                 <CardDescription>
                    Seja bem-vindo(a), {data.fullName.split(' ')[0]}! Você será redirecionado em instantes.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center">
                 <Loader2 className="mt-4 size-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
}

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2">
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 3.08-4.64 3.08-3.97 0-7.2-3.22-7.2-7.2s3.23-7.2 7.2-7.2c2.24 0 3.63.92 4.48 1.75l2.42-2.42C17.64 3.01 15.32 2 12.48 2 7.1 2 2.98 6.17 2.98 11.5s4.12 9.5 9.5 9.5c5.13 0 9.1-3.6 9.1-9.35 0-.6-.05-1.18-.15-1.73H12.48z" fill="currentColor"/>
    </svg>
)

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams()
  const { toast } = useToast();
  const typeParam = searchParams.get('type') as "Cliente" | "Profissional" | null;
  const specialtyParam = searchParams.get('specialty');
  const flowParam = searchParams.get('flow');


  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null);
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null);
  const [cnhPreview, setCnhPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      gender: flowParam === 'espaco-mulher' ? 'feminino' : undefined,
      type: typeParam || undefined,
      password: "",
      cep: "",
      addressStreet: "",
      addressNumber: "",
      addressNeighborhood: "",
      addressCity: "",
      addressCountry: "Brasil",
      isPcd: false,
      backgroundCheck: false,
      specialty: specialtyParam || undefined,
    },
  });

  const userType = form.watch("type");
  const specialty = form.watch("specialty") || "";
  
  const specialtyLower = specialty.toString().toLowerCase();
  const isRecycleProf = specialtyLower.includes(recycleKeyword);
  const isApprentice = specialtyLower.includes(apprenticeKeyword);
  const isNonVehicleProf = nonVehicleKeywords.some(keyword => specialtyLower.includes(keyword));
  const isVehicleProf = vehicleKeywords.some(keyword => specialtyLower.includes(keyword));
  const isHealthProf = healthKeywords.some(keyword => specialtyLower.includes(keyword));
  const isLawyer = specialtyLower.includes(lawyerKeyword);
  
  const shouldShowVehicleFields = isVehicleProf && !isNonVehicleProf && !isApprentice && !isRecycleProf;
  const shouldShowLicenseFields = (isHealthProf || isLawyer) && !isApprentice && !isRecycleProf;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormData, setPreview: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue(fieldName, e.target.files);
      setPreview(URL.createObjectURL(file));
    } else {
      form.setValue(fieldName, null);
      setPreview(null);
    }
  };


  const handleCepBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const cep = event.target.value;
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) {
        return;
    }

    setIsFetchingCep(true);
    form.setValue("addressStreet", "", { shouldValidate: true });
    form.setValue("addressNeighborhood", "", { shouldValidate: true });
    form.setValue("addressCity", "", { shouldValidate: true });

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        if (!response.ok) throw new Error('CEP not found');
        const data = await response.json();

        if (data.erro) {
            toast({ variant: 'destructive', title: 'CEP não encontrado', description: 'Por favor, verifique o CEP digitado.' });
            return;
        }
        
        form.setValue("addressStreet", data.logradouro, { shouldValidate: true });
        form.setValue("addressNeighborhood", data.bairro, { shouldValidate: true });
        form.setValue("addressCity", data.localidade, { shouldValidate: true });
        form.setValue("addressCountry", "Brasil", { shouldValidate: true });
        document.getElementById('addressNumber')?.focus();

    } catch (error) {
         toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: 'Não foi possível buscar o endereço. Tente novamente.' });
    } finally {
        setIsFetchingCep(false);
    }
};


  async function onSubmit(data: FormData) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const dataWithId = { ...data, userId };
    setFormData(dataWithId);
    setStep("verification");
  }

  function handleVerification() {
    setIsVerifying(true);
    setTimeout(() => {
        setIsVerifying(false);
        setStep("success");
        toast({
            title: "Verificação concluída com sucesso!",
            description: "Bem-vindo(a) ao Serviços Já!",
        });
    }, 3000);
  }

  async function handleGoogleSignUp() {
    toast({
        title: "Login com Google",
        description: "A funcionalidade de login com Google será implementada em breve. Por favor, continue com o cadastro manual.",
    });
    // Placeholder for actual Google Sign-In logic
    // const provider = new GoogleAuthProvider();
    // try {
    //   const result = await signInWithPopup(auth, provider);
    //   const user = result.user;
    //   // ... handle user data and redirection
    // } catch (error) {
    //   console.error("Google Sign-In error:", error);
    //   toast({ variant: "destructive", title: "Erro no Login com Google" });
    // }
  }


  if (step === "verification" && formData) {
      const docFront = (formData.documentPhotoFront as FileList)?.[0] ?? null;
      const docBack = (formData.documentPhotoBack as FileList)?.[0] ?? null;
      return <VerificationStep onVerificationComplete={handleVerification} onBack={() => setStep('form')} isVerifying={isVerifying} documentPhotoFront={docFront} documentPhotoBack={docBack} />;
  }
  
  if (step === "success" && formData) {
      return <SuccessStep data={formData} />;
  }

  return (
    <Card className="w-full max-w-2xl my-8">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <UserPlus className="size-6" />
          Crie sua Conta
        </CardTitle>
        <CardDescription>
          Rápido e fácil. Comece a usar o Serviços Já agora mesmo.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignUp}>
                <GoogleIcon />
                Cadastre-se com o Google
            </Button>
            <p className="text-xs text-muted-foreground text-center">Para a segurança de todos, o cadastro na plataforma requer o preenchimento completo dos dados e o envio de um documento para verificação, independentemente do método escolhido.</p>
        </div>

        <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="mx-4 flex-shrink-0 text-xs uppercase text-muted-foreground">OU</span>
            <div className="flex-grow border-t border-muted"></div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <h3 className="font-medium text-foreground">Informações Pessoais e de Segurança</h3>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                            <Input type="tel" placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>E-mail (para notificações)</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Identidade de Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={flowParam === 'espaco-mulher'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="masculino">Masculino</SelectItem>
                                <SelectItem value="feminino">Feminino</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                                <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                          Campo opcional. Se preenchido, ajuda a conectar você com clientes que tenham preferência de gênero.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Senha (código de segurança)</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Crie uma senha segura" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF/CNPJ (número de documento)</FormLabel>
                            <FormControl>
                                <Input placeholder="Seu CPF ou CNPJ" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="documentPhotoFront"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Foto da Frente do Documento (RG ou CNH)</FormLabel>
                            {documentFrontPreview && <Image src={documentFrontPreview} alt="Preview do documento (frente)" width={120} height={80} className="rounded-md border p-1" />}
                            <FormControl>
                                <Button asChild variant="outline" className="w-full cursor-pointer">
                                    <label htmlFor="document-front-upload">
                                        <Upload className="mr-2" />
                                        {documentFrontPreview ? ((form.getValues('documentPhotoFront') as FileList)?.[0]?.name || "Trocar Foto") : "Enviar Foto da Frente"}
                                        <Input
                                            id="document-front-upload"
                                            type="file"
                                            className="sr-only"
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            onChange={(e) => handleFileChange(e, "documentPhotoFront", setDocumentFrontPreview)}
                                            accept="image/*"
                                        />
                                    </label>
                                </Button>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="documentPhotoBack"
                    render={({ field }) => (
                         <FormItem>
                            <FormLabel>Foto do Verso do Documento (RG ou CNH)</FormLabel>
                            {documentBackPreview && <Image src={documentBackPreview} alt="Preview do documento (verso)" width={120} height={80} className="rounded-md border p-1" />}
                            <FormControl>
                                <Button asChild variant="outline" className="w-full cursor-pointer">
                                    <label htmlFor="document-back-upload">
                                        <Upload className="mr-2" />
                                        {documentBackPreview ? ((form.getValues('documentPhotoBack') as FileList)?.[0]?.name || "Trocar Foto") : "Enviar Foto do Verso"}
                                        <Input
                                            id="document-back-upload"
                                            type="file"
                                            className="sr-only"
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            onChange={(e) => handleFileChange(e, "documentPhotoBack", setDocumentBackPreview)}
                                            accept="image/*"
                                        />
                                    </label>
                                </Button>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
             <FormField
                control={form.control}
                name="isPcd"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Sou uma pessoa com deficiência (PCD)
                        </FormLabel>
                        <FormDescription>
                          Marque esta opção para nos ajudar a oferecer uma melhor experiência.
                        </FormDescription>
                    </div>
                    </FormItem>
                )}
                />

            <div className="my-4 border-t pt-4 space-y-2">
                 <h3 className="font-medium text-foreground">Endereço</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                 <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input placeholder="Seu CEP" {...field} maxLength={9} onBlur={handleCepBlur} />
                                    </FormControl>
                                    {isFetchingCep && <Loader2 className="absolute right-2 top-2.5 size-4 animate-spin text-muted-foreground" />}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 <FormField
                        control={form.control}
                        name="addressStreet"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Logradouro</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Rua das Flores" {...field} disabled={isFetchingCep} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 <FormField
                        control={form.control}
                        name="addressNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                    <Input id="addressNumber" placeholder="Ex: 123" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="addressNeighborhood"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Centro" {...field} disabled={isFetchingCep} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="addressCity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: São Paulo" {...field} disabled={isFetchingCep} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="addressCountry"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Brasil" {...field} disabled={isFetchingCep} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
            </div>
            
             <div className="my-4 border-t pt-4">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo de Cadastro</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Eu sou..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Cliente">Cliente</SelectItem>
                        <SelectItem value="Profissional">Profissional</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", userType === 'Profissional' ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="my-4 border-t pt-4">
                    <h3 className="font-medium text-foreground">Informações do Profissional</h3>
                    <p className="text-sm text-muted-foreground">Preencha seus dados para começar a receber serviços.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                     <div className="md:col-span-2">
                        <FormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Especialidade Principal</FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        // Reset conditional fields when specialty changes
                                        form.resetField("vehicleType");
                                        form.resetField("vehicleModel");
                                        form.resetField("vehiclePlate");
                                        form.resetField("vehicleColor");
                                        form.resetField("vehicleYear");
                                        form.resetField("cnhPhoto");
                                        form.resetField("crm");
                                        form.resetField("oab");
                                        setCnhPreview(null);
                                        form.trigger(); // Re-run validation
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione sua principal área" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {fullProfessionList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="my-4 border-t pt-4">
                     <FormField
                        control={form.control}
                        name="backgroundCheck"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-primary/5">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="flex items-center gap-2">
                                    <ShieldCheck className="text-green-600" />
                                    Optar pela Verificação de Segurança Premium
                                </FormLabel>
                                <FormDescription>
                                Autorizo uma verificação de antecedentes para obter o selo de "Segurança Premium", aumentando a confiança dos clientes.
                                </FormDescription>
                            </div>
                            </FormItem>
                        )}
                        />
                </div>


                {/* Conditional Fields: Health/Law */}
                <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", shouldShowLicenseFields ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                    <div className="my-4 border-t pt-4">
                        <h3 className="font-medium text-foreground">Informações de Licença Profissional</h3>
                        <p className="text-sm text-muted-foreground">Por favor, forneça seu número de registro profissional.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {isHealthProf && (
                            <FormField
                                control={form.control}
                                name="crm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CRM / Registro Profissional</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 123456-SP" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         {isLawyer && (
                            <FormField
                                control={form.control}
                                name="oab"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número da OAB</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: 123456/SP" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>

                {/* Conditional Fields: Vehicle */}
                <div className={cn("space-y-4 transition-all duration-500 overflow-hidden", shouldShowVehicleFields ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                    <div className="my-4 border-t pt-4">
                        <h3 className="font-medium text-foreground">Informações do Veículo</h3>
                        <p className="text-sm text-muted-foreground">Como sua profissão envolve transporte, precisamos dos dados do seu veículo.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                         <FormField
                            control={form.control}
                            name="vehicleType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Veículo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ''}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Carro de Passeio">Carro de Passeio</SelectItem>
                                            <SelectItem value="Motocicleta">Motocicleta</SelectItem>
                                            <SelectItem value="Caminhão (Frete/Mudança)">Caminhão (Frete/Mudança)</SelectItem>
                                            <SelectItem value="Van/Utilitário">Van/Utilitário</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="vehicleModel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modelo do Veículo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Fiat Uno, Honda Biz" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="vehiclePlate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Placa do Veículo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="ABC-1234" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="vehicleColor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cor</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Prata" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="vehicleYear"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ano</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 2023" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="pt-2">
                        <FormField
                            control={form.control}
                            name="cnhPhoto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Foto da CNH</FormLabel>
                                    {cnhPreview && <Image src={cnhPreview} alt="Preview da CNH" width={120} height={80} className="rounded-md border p-1" />}
                                    <FormControl>
                                        <Button asChild variant="outline" className="w-full cursor-pointer">
                                            <label htmlFor="cnh-upload">
                                                <Upload className="mr-2" />
                                                {cnhPreview ? ((form.getValues('cnhPhoto') as FileList)?.[0]?.name || "Trocar Foto") : "Enviar Foto da CNH"}
                                                <Input
                                                    id="cnh-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    onChange={(e) => handleFileChange(e, "cnhPhoto", setCnhPreview)}
                                                    accept="image/*"
                                                />
                                            </label>
                                        </Button>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continuar para Verificação
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
