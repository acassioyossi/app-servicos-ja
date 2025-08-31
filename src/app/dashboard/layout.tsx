

"use client";

import Link from "next/link";
import {
  Bell,
  CircleUser,
  Home,
  Menu,
  MessageSquare,
  Package,
  Search,
  Users,
  CalendarClock,
  HelpCircle,
  Store,
  Briefcase,
  Coins,
  Bot,
  HardHat
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardErrorBoundary } from "@/components/error-boundary";
import { NotificationCenter } from "@/components/notifications/notification-center";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
        router.push("/login");
    }
  }, [user, isMounted, router]);


  const handleLogout = () => {
    logout();
    router.push('/');
  }
  
  if (!isMounted || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Carregando...</p>
        </div>
    );
  }
  
  const navLinks = [
      { href: "/dashboard/client", icon: Home, label: "Dashboard Cliente" },
      { href: "/dashboard/professional", icon: HardHat, label: "Dashboard Profissional" },
      { href: "/dashboard/partner-company", icon: Store, label: "Painel do Parceiro" },
      { href: "/dashboard/professional/scheduled", icon: CalendarClock, label: "Serviços Agendados" },
      { href: "/dashboard/chat", icon: MessageSquare, label: "Mensagens" },
      { href: "/dashboard/wayne-cash", icon: Coins, label: "Wayne Cash" },
      { href: "/dashboard/support", icon: Bot, label: "Suporte (Assistente IA)" },
  ];

  return (
    <DashboardErrorBoundary>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo />
            </Link>
            <div className="ml-auto">
              <NotificationCenter />
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4" role="navigation" aria-label="Navegação principal">
              {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    aria-label={`Ir para ${link.label}`}
                >
                    <link.icon className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card x-chunk="dashboard-02-chunk-0">
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Ajuda?
                </CardTitle>
                <CardDescription>
                  Fale com nosso assistente de IA ou entre em contato com o suporte.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full" asChild>
                  <Link href="/dashboard/support" aria-label="Abrir assistente de IA para suporte">Assistente de IA</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Abrir menu de navegação"
                aria-expanded={false}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col" aria-labelledby="mobile-nav-title">
              <nav id="mobile-navigation" className="grid gap-2 text-lg font-medium" role="navigation" aria-label="Navegação principal mobile">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                  aria-label="Ir para página inicial"
                >
                  <Logo />
                </Link>
                 {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                        aria-label={`Ir para ${link.label}`}
                    >
                        <link.icon className="h-5 w-5" aria-hidden="true" />
                        {link.label}
                    </Link>
                 ))}
              </nav>
              <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Ajuda?
                    </CardTitle>
                    <CardDescription>
                      Fale com nosso assistente de IA ou entre em contato com o suporte.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="w-full" asChild>
                       <Link href="/dashboard/support" aria-label="Abrir assistente de IA para suporte">Assistente de IA</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Procurar serviços..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <NotificationCenter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/support">Suporte</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </DashboardErrorBoundary>
  );
}
