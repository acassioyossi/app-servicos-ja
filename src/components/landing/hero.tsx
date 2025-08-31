

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden hero-section">
       <div className="absolute inset-0 z-0">
         <Image 
          src="/deep-Qegz6Pwcc0o-unsplash.jpg"
          alt="Profissionais de diversas áreas trabalhando"
          layout="fill"
          objectFit="cover"
          className="opacity-20"
          data-ai-hint="diverse professionals working"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary from-30% to-[#009dcb] opacity-90"></div>
       </div>
      <div className="container relative z-10 flex min-h-[calc(100vh-4rem)] items-center py-20 lg:py-0">
        <div className="flex flex-col items-center gap-12 lg:flex-row">
          <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h1 className="text-4xl font-bold text-primary-foreground md:text-5xl lg:text-6xl">
              Todos os Serviços em Um Só Lugar
            </h1>
            <p className="max-w-prose text-lg text-primary-foreground/90">
              Conectamos você aos melhores profissionais de todas as áreas. Acompanhe a chegada em tempo real, pague com segurança e ganhe recompensas com nosso sistema exclusivo Wayne Cash.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href="/signup">Baixar App</Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href="/signup?type=Profissional">Torne-se um Profissional</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
