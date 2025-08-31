

"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "../logo";

const navLinks = [
  { href: "/#como-funciona", label: "Como Funciona" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#profissionais", label: "Profissionais" },
  { href: "/#wayne-cash", label: "Wayne Cash" },
  { href: "/#app", label: "App" },
  { href: "/#cadastro", label: "Cadastro" },
  { href: "/#contato", label: "Contato" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="hidden md:flex">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
           <Button asChild>
            <Link href="/login"><Search /> Contratar Profissional</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">Cadastre-se</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2">
                  <Logo />
                </Link>
                <nav>
                  <ul className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="flex flex-col gap-3">
                    <Button asChild><Link href="/login">Contratar Profissional</Link></Button>
                    <Button variant="secondary" asChild><Link href="/login">Entrar</Link></Button>
                    <Button variant="outline" asChild><Link href="/signup">Cadastre-se</Link></Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
