
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, User, Search, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface CustomerData {
    name: string;
    wayneCashBalance: number;
    avatar: string;
}

// Mock de dados de clientes para simulação
const mockCustomerDatabase: Record<string, CustomerData> = {
    "12345678900": { name: "Cliente Exemplo 1", wayneCashBalance: 150.75, avatar: "https://placehold.co/100x100.png" },
    "00987654321": { name: "Cliente Exemplo 2", wayneCashBalance: 25.50, avatar: "https://placehold.co/100x100.png" },
};

export default function PartnerCompanyDashboardPage() {
    const { toast } = useToast();
    const [customerIdentifier, setCustomerIdentifier] = useState("");
    const [transactionValue, setTransactionValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentResult, setPaymentResult] = useState<"success" | "error" | null>(null);

    const handleSearchCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerIdentifier) {
            toast({ variant: "destructive", title: "Erro", description: "Por favor, insira o CPF ou código do cliente." });
            return;
        }

        setIsSearching(true);
        setCustomerData(null);
        setPaymentResult(null);

        // Simula uma busca na API
        await new Promise(resolve => setTimeout(resolve, 1000));

        const foundCustomer = mockCustomerDatabase[customerIdentifier];
        if (foundCustomer) {
            setCustomerData(foundCustomer);
        } else {
            toast({ variant: "destructive", title: "Cliente não encontrado", description: "O identificador informado não corresponde a nenhum cliente." });
        }
        setIsSearching(false);
    };

    const handleProcessPayment = async () => {
        const value = parseFloat(transactionValue);
        if (!customerData || !value || value <= 0) {
            toast({ variant: "destructive", title: "Erro de Validação", description: "O valor da transação é inválido." });
            return;
        }

        if (value > customerData.wayneCashBalance) {
             toast({ variant: "destructive", title: "Saldo Insuficiente", description: `O cliente possui apenas WC ${customerData.wayneCashBalance.toFixed(2)}.` });
             return;
        }

        setIsProcessingPayment(true);
        setPaymentResult(null);

        // Simula o processamento do pagamento
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simula sucesso ou falha
        const success = Math.random() > 0.1; // 90% de chance de sucesso

        if (success) {
            setPaymentResult("success");
            toast({ title: "Pagamento Aprovado!", description: `WC ${value.toFixed(2)} foram debitados do cliente.` });
        } else {
            setPaymentResult("error");
            toast({ variant: "destructive", title: "Falha no Pagamento", description: "Ocorreu um erro ao processar a transação. Tente novamente." });
        }

        setIsProcessingPayment(false);
    };
    
    const handleReset = () => {
        setCustomerIdentifier("");
        setTransactionValue("");
        setCustomerData(null);
        setPaymentResult(null);
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Painel da Empresa Parceira</h1>
                 <Button asChild>
                    <Link href="/signup?type=Profissional&specialty=Empresa+Parceira">
                        Cadastrar Novo Parceiro
                    </Link>
                </Button>
            </div>

            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-6">
                <Card className="w-full max-w-lg border-none shadow-none">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                           <Coins /> Validar Pagamento com Wayne Cash
                        </CardTitle>
                        <CardDescription>
                           Use o CPF ou o código do cliente para processar um pagamento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentResult === "success" ? (
                            <div className="text-center space-y-4 py-8">
                                <CheckCircle className="size-20 mx-auto text-green-500" />
                                <h3 className="text-2xl font-bold">Pagamento Realizado com Sucesso!</h3>
                                <p className="text-muted-foreground">A transação foi concluída e o valor creditado em sua conta.</p>
                                <Button onClick={handleReset}>Nova Transação</Button>
                            </div>
                        ) : paymentResult === "error" ? (
                             <div className="text-center space-y-4 py-8">
                                <XCircle className="size-20 mx-auto text-destructive" />
                                <h3 className="text-2xl font-bold">Ocorreu um erro</h3>
                                <p className="text-muted-foreground">Não foi possível processar o pagamento. Por favor, tente novamente.</p>
                                <Button onClick={handleReset} variant="destructive">Tentar Novamente</Button>
                            </div>
                        ) : customerData ? (
                            <div className="space-y-6 text-center">
                                 <Card className="p-4 bg-muted/50">
                                    <div className="flex flex-col items-center gap-2">
                                        <Avatar className="size-20 border-2 border-primary">
                                            <AvatarImage src={customerData.avatar} alt={customerData.name} data-ai-hint="person portrait" />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-xl font-bold">{customerData.name}</h3>
                                        <p className="text-muted-foreground">Saldo Wayne Cash:</p>
                                        <p className="text-2xl font-semibold text-primary">WC {customerData.wayneCashBalance.toFixed(2)}</p>
                                    </div>
                                </Card>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="transaction-value">Valor da Compra (em WC)</Label>
                                    <Input 
                                        id="transaction-value"
                                        type="number"
                                        placeholder="Ex: 25.50"
                                        value={transactionValue}
                                        onChange={(e) => setTransactionValue(e.target.value)}
                                        disabled={isProcessingPayment}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" onClick={handleReset} disabled={isProcessingPayment}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleProcessPayment} disabled={isProcessingPayment || !transactionValue}>
                                        {isProcessingPayment ? <Loader2 className="mr-2 animate-spin" /> : null}
                                        {isProcessingPayment ? "Processando..." : `Confirmar Pagamento`}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSearchCustomer} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer-identifier">CPF ou Código do Cliente</Label>
                                    <Input 
                                        id="customer-identifier"
                                        placeholder="Digite o identificador do cliente"
                                        value={customerIdentifier}
                                        onChange={(e) => setCustomerIdentifier(e.target.value)}
                                        disabled={isSearching}
                                    />
                                </div>
                                <Button type="submit" className="w-full" size="lg" disabled={isSearching || !customerIdentifier}>
                                    {isSearching ? <Loader2 className="mr-2 animate-spin" /> : <Search className="mr-2" />}
                                    {isSearching ? "Buscando..." : "Buscar Cliente"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
