
import { Button } from "@/components/ui/button";

export function Cta() {
    return (
        <section className="w-full bg-gradient-to-br from-primary from-30% to-[#009dcb] py-20 sm:py-24">
            <div className="container text-center text-primary-foreground">
                <h2 className="text-3xl font-bold md:text-4xl">Pronto para transformar sua vida com o Serviços Já?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
                    Junte-se a milhares de pessoas que já usam o Serviços Já para tornar sua vida mais fácil e produtiva.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                        Baixar App para iPhone
                    </Button>
                    <Button size="lg" variant="secondary" className="hover:text-primary">
                        Baixar App para Android
                    </Button>
                </div>
            </div>
        </section>
    );
}
