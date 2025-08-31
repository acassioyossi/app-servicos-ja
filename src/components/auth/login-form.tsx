
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { loginSchema } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ScreenReaderOnly, useScreenReaderAnnouncements, LiveRegion } from "@/components/accessibility/accessibility-utils";

type FormData = z.infer<typeof loginSchema>;
export type UserType = "client" | "professional" | "partner";


const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 size-4">
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 3.08-4.64 3.08-3.97 0-7.2-3.22-7.2-7.2s3.23-7.2 7.2-7.2c2.24 0 3.63.92 4.48 1.75l2.42-2.42C17.64 3.01 15.32 2 12.48 2 7.1 2 2.98 6.17 2.98 11.5s4.12 9.5 9.5 9.5c5.13 0 9.1-3.6 9.1-9.35 0-.6-.05-1.18-.15-1.73H12.48z" fill="currentColor"/>
    </svg>
)

export function LoginForm() {
  const router = useRouter();
  const { login } = useFirebaseAuth();
  const { announce } = useScreenReaderAnnouncements();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginMessage, setLoginMessage] = React.useState("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true);
      setLoginMessage("Processando login...");
      announce("Processando login, aguarde", "assertive");
      
      // Usar o novo sistema de autenticação JWT
      await login(data.email, data.password);

      setLoginMessage("Login realizado com sucesso! Redirecionando...");
      announce("Login realizado com sucesso! Redirecionando para o painel", "assertive");
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel...",
      });
      
      // O redirecionamento é feito automaticamente pelo store

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro no login. Verifique suas credenciais.";
      setLoginMessage(errorMessage);
      announce(`Erro no login: ${errorMessage}`, "assertive");
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md" role="main" aria-labelledby="login-title">
      <CardHeader className="text-center">
        <CardTitle id="login-title" className="flex items-center justify-center gap-2 text-2xl">
          <LogIn className="size-6" aria-hidden="true" />
          Entrar na sua Conta
        </CardTitle>
        <CardDescription>
          Use seu e-mail e senha para acessar a plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LiveRegion message={loginMessage} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-describedby="login-instructions">
            <ScreenReaderOnly>
              <div id="login-instructions">
                Preencha os campos abaixo para fazer login na plataforma. Use pro@email.com para acessar como profissional.
              </div>
            </ScreenReaderOnly>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="seu@email.com (ou pro@email.com)" 
                      aria-describedby="email-help"
                      aria-required="true"
                      {...field} 
                    />
                  </FormControl>
                  <ScreenReaderOnly>
                    <div id="email-help">
                      Digite seu endereço de e-mail. Use pro@email.com para acessar como profissional.
                    </div>
                  </ScreenReaderOnly>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center">
                        <FormLabel>Senha</FormLabel>
                         <Link 
                           href="/login/forgot-password" 
                           className="ml-auto inline-block text-sm text-primary hover:underline"
                           aria-label="Esqueci minha senha - abrir página de recuperação"
                         >
                            Esqueci minha senha
                        </Link>
                    </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Sua senha" 
                      aria-required="true"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
              aria-describedby={isLoading ? "loading-status" : undefined}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            {isLoading && (
              <ScreenReaderOnly>
                <div id="loading-status" aria-live="polite">
                  Processando login, aguarde...
                </div>
              </ScreenReaderOnly>
            )}
          </form>
        </Form>
        <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="mx-4 flex-shrink-0 text-xs uppercase text-muted-foreground">OU</span>
            <div className="flex-grow border-t border-muted"></div>
        </div>
        <Button 
          variant="outline" 
          className="w-full" 
          size="lg" 
          onClick={() => toast({ title: "Funcionalidade em desenvolvimento" })}
          aria-label="Entrar com conta do Google - funcionalidade em desenvolvimento"
        >
            <GoogleIcon />
            Entrar com o Google
        </Button>
        <div className="mt-6 text-center text-sm">
          Não tem uma conta?{" "}
          <Link 
            href="/signup" 
            className="font-semibold text-primary hover:underline"
            aria-label="Cadastre-se - criar nova conta"
          >
            Cadastre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
