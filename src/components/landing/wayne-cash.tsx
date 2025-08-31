
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Gift, LineChart, Percent, Wallet, Zap, ShoppingCart } from "lucide-react";

const benefits = [
    { icon: Percent, title: "Descontos", description: "Use seu saldo para abater o valor de futuros serviços" },
    { icon: ShoppingCart, title: "Compras em Lojas", description: "Use seu Wayne Cash em lojas, farmácias e supermercados parceiros." },
    { icon: Gift, title: "Recompensas", description: "Indique amigos e ganhe bônus exclusivos" },
    { icon: LineChart, title: "Valorização", description: "Sua moeda pode valer mais no futuro" },
];

export function WayneCash() {
  return (
    <section id="wayne-cash" className="w-full bg-secondary py-20 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Coins className="size-8 text-primary" />
            <h2 className="text-3xl font-bold md:text-4xl">
              Wayne Cash: Sua Moeda de Benefícios
            </h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Um ecossistema financeiro exclusivo onde cada serviço contratado gera recompensas e fortalece sua carteira digital.
          </p>
        </div>

        <div className="mt-12 flex justify-center">
            <Card className="w-full max-w-3xl overflow-hidden border-2 border-dashed border-primary shadow-lg">
                <CardContent className="p-8 text-center">
                    <div className="mb-6 inline-block rounded-full bg-primary/10 p-4">
                        <Wallet className="size-12 text-primary" />
                    </div>
                    <h3 className="text-2xl font-semibold">Como você ganha?</h3>
                    <p className="mt-2 text-muted-foreground">
                     De nossa taxa de serviço, uma parte é dedicada ao Wayne Cash. Metade desse valor volta para você como bônus na sua carteira, e a outra metade é reinvestida para o desenvolvimento e valorização da moeda.
                    </p>
                    <p className="mt-4 rounded-lg bg-background p-3 font-mono text-sm">
                        <b>Exemplo prático:</b> Em um serviço de <b>R$ 100,00</b>, você acumula <b>R$ 0,50</b> em bônus Wayne Cash na sua carteira!
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="flex flex-col items-center gap-2 rounded-lg bg-background p-4 transition-transform hover:scale-105">
                                <benefit.icon className="size-7 text-primary" />
                                <h4 className="font-semibold">{benefit.title}</h4>
                                <p className="text-xs text-muted-foreground">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </section>
  );
}
