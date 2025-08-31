
"use client"

import { useEffect, useState } from "react";
// import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Coins, Gift, LineChart, Percent, TrendingUp, Wallet, Zap, Stethoscope, Utensils, Fuel, ShoppingCart } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";


const transactionHistory = [
    { id: "TXN001", type: "Ganho", description: "Bônus - Serviço de Eletricista", amount: "+ WC 2.50", date: "15/06/2024" },
    { id: "TXN002", type: "Gasto", description: "Desconto - Serviço de Diarista", amount: "- WC 10.00", date: "10/06/2024" },
    { id: "TXN003", type: "Ganho", description: "Bônus - Serviço de Encanador", amount: "+ WC 1.80", date: "05/06/2024" },
    { id: "TXN004", type: "Ganho", description: "Bônus de Indicação", amount: "+ WC 5.00", date: "01/06/2024" },
    { id: "TXN005", type: "Gasto", description: "Desconto - Manutenção Jardim", amount: "- WC 8.50", date: "25/05/2024" },
];

const partnerList = [
    { name: "Drogaria Mais Saúde", category: "Farmácia", icon: Stethoscope },
    { name: "Padaria Pão Quente", category: "Alimentação", icon: Utensils },
    { name: "Posto Shell Conveniência", category: "Conveniência", icon: Fuel },
    { name: "Supermercado Compre Bem", category: "Mercado", icon: ShoppingCart },
]


export default function WayneCashPage() {
    const [chartData, setChartData] = useState<any[] | null>(null);

    useEffect(() => {
        // Generate chart data on the client-side to avoid hydration mismatch
        const data = [
            { month: "Jan", total: Math.floor(Math.random() * 20) + 5 },
            { month: "Fev", total: Math.floor(Math.random() * 20) + 5 },
            { month: "Mar", total: Math.floor(Math.random() * 20) + 5 },
            { month: "Abr", total: Math.floor(Math.random() * 20) + 10 },
            { month: "Mai", total: Math.floor(Math.random() * 20) + 10 },
            { month: "Jun", total: Math.floor(Math.random() * 20) + 15 },
        ];
        setChartData(data);
    }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
            <Coins />
            Minha Carteira Wayne Cash
        </h1>
      </div>
      <div className="grid gap-6 mt-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
                <CardDescription>Saldo Atual</CardDescription>
                <CardTitle className="text-4xl text-primary flex items-center gap-2">
                    WC 25,50
                    <span className="text-lg text-muted-foreground font-normal">(~R$ 25,50)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground">
                +5.2% em relação ao mês passado
                </div>
            </CardContent>
        </Card>
            <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Evolução do Saldo</CardTitle>
                <CardDescription>Seus ganhos de Wayne Cash nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                {/* Temporariamente comentado para resolver problemas de build
                {chartData ? (
                    <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={chartData}>
                            <XAxis
                            dataKey="month"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            />
                            <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `WC ${value}`}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <Skeleton className="w-full h-[100px]" />
                )}
                */}
                <div className="flex items-center justify-center h-[100px] bg-gray-100 rounded">
                    <p className="text-gray-500">Gráfico temporariamente indisponível</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mt-6">
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Seus ganhos e gastos recentes com Wayne Cash.</CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactionHistory.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                                <Badge variant={transaction.type === 'Ganho' ? 'default' : 'secondary'} className={transaction.type === 'Ganho' ? 'bg-green-600' : ''}>
                                    {transaction.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell className={`text-right font-semibold ${transaction.type === 'Ganho' ? 'text-green-600' : 'text-destructive'}`}>
                                {transaction.amount}
                            </TableCell>
                            <TableCell>{transaction.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet />
                    O que fazer com seu Wayne Cash?
                </CardTitle>
                <CardDescription>
                    Sua moeda digital exclusiva abre um mundo de possibilidades.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg bg-muted p-4">
                    <Percent className="size-8 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Descontos em Serviços</h4>
                        <p className="text-sm text-muted-foreground">Use seu saldo para pagar parte ou o total de qualquer serviço na plataforma.</p>
                    </div>
                </div>
                  <div className="flex items-start gap-4 rounded-lg bg-muted p-4">
                    <Gift className="size-8 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Recompensas e Bônus</h4>
                        <p className="text-sm text-muted-foreground">Ganhe mais Wayne Cash indicando amigos e participando de promoções.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg bg-muted p-4">
                    <Zap className="size-8 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Ofertas Exclusivas</h4>
                        <p className="text-sm text-muted-foreground">Acesse parceiros e ofertas especiais disponíveis apenas para quem usa Wayne Cash.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4 rounded-lg bg-muted p-4">
                    <TrendingUp className="size-8 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold">Valorização Futura</h4>
                        <p className="text-sm text-muted-foreground">Parte da taxa de serviço é reinvestida na moeda, com potencial de valorização.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart />
                    Onde Usar seu Wayne Cash?
                </CardTitle>
                <CardDescription>
                    Confira nossos parceiros e aproveite seus benefícios.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                {partnerList.map((partner) => (
                    <div key={partner.name} className="flex items-center gap-4 rounded-lg border p-4">
                       <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                           <partner.icon className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold">{partner.name}</h4>
                            <p className="text-sm text-muted-foreground">{partner.category}</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Ver Ofertas
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </>
  )
}
