
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";

export function Registration() {
  return (
    <section id="cadastro" className="w-full bg-background py-20 sm:py-24">
      <div className="container">
        <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Pronto para Começar?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Junte-se à maior plataforma de serviços do Brasil. Temos a solução perfeita para você, seja para contratar ou para oferecer um serviço.
            </p>
        </div>
        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-2">
            
            <div className="relative flex flex-col justify-between rounded-2xl bg-card p-8 text-foreground shadow-lg border">
                <div className="text-center">
                    <div className="inline-block rounded-full bg-primary/10 p-4">
                       <Users className="size-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mt-4">Para Clientes</h3>
                    <p className="mt-2 text-muted-foreground">Encontre todos os serviços que você precisa em um só lugar. Contrate com praticidade e segurança, acompanhando tudo em tempo real.</p>
                </div>
                <div className="mt-6 w-full">
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/signup?type=Cliente">Encontrar um Profissional</Link>
                    </Button>
                </div>
            </div>

            <div className="relative flex flex-col justify-between rounded-2xl bg-primary p-8 text-primary-foreground shadow-lg">
                 <div className="text-center">
                    <div className="inline-block rounded-full bg-primary-foreground/20 p-4">
                        <Briefcase className="size-12 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mt-4">Para Profissionais</h3>
                    <p className="mt-2 text-primary-foreground/90">Aumente sua renda e alcance mais clientes. Oferecemos as ferramentas, a visibilidade e a segurança que você precisa para crescer.</p>
                </div>
                <div className="mt-6 w-full">
                    <Button className="w-full bg-white text-primary hover:bg-white/90" size="lg" asChild>
                      <Link href="/signup?type=Profissional">Oferecer meus Serviços</Link>
                    </Button>
                </div>
            </div>

        </div>
      </div>
    </section>
  );
}
