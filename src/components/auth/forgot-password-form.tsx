
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema } from "@/lib/validation";
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
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Recovery attempt for:", data.emailOrPhone);
    toast({
      title: "Link de Recuperação Enviado!",
      description: "Verifique seu e-mail ou SMS para redefinir sua senha.",
    });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
                    <Mail className="size-6 text-green-600" />
                </div>
                <CardTitle className="mt-4">Verifique seu E-mail/SMS</CardTitle>
                <CardDescription>
                    Enviamos um link de recuperação para{" "}
                    <b>{form.getValues("emailOrPhone")}</b>. Por favor, siga as instruções para criar uma nova senha.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" asChild className="w-full">
                    <Link href="/login">
                        <ArrowLeft className="mr-2"/>
                        Voltar para o Login
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <KeyRound className="size-6" />
          Recuperar Acesso
        </CardTitle>
        <CardDescription>
          Insira seu e-mail ou telefone para receber um link de recuperação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emailOrPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail ou Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com ou (11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg">
              Enviar Link de Recuperação
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
