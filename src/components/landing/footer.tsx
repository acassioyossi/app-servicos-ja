
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { Logo } from "../logo";

export function Footer() {
  return (
    <footer id="contato" className="w-full bg-foreground text-background">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link href="#" className="flex items-center gap-2">
                <Logo className="text-primary-foreground" />
            </Link>
            <div className="mt-6 flex gap-4">
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Facebook className="size-5" /></Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Twitter className="size-5" /></Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Instagram className="size-5" /></Link>
                <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"><Linkedin className="size-5" /></Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-primary">Clientes</h3>
            <ul className="space-y-2">
                <li><Link href="/#como-funciona" className="text-muted-foreground hover:text-primary">Como funciona</Link></li>
                <li><Link href="/#wayne-cash" className="text-muted-foreground hover:text-primary">Wayne Cash</Link></li>
                <li><Link href="/#profissionais" className="text-muted-foreground hover:text-primary">Profissionais online</Link></li>
                <li><Link href="/dashboard/support" className="text-muted-foreground hover:text-primary">Centro de Ajuda</Link></li>
                <li><Link href="/#app" className="text-muted-foreground hover:text-primary">Segurança</Link></li>
                <li><Link href="/dashboard/espaco-mulher" className="text-muted-foreground hover:text-primary">Espaço Mulher</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-primary">Profissionais</h3>
            <ul className="space-y-2">
                <li><Link href="/signup?type=Profissional" className="text-muted-foreground hover:text-primary">Cadastre-se</Link></li>
                <li><Link href="/partner-company" className="text-muted-foreground hover:text-primary">Seja um Parceiro</Link></li>
                <li><Link href="/#app" className="text-muted-foreground hover:text-primary">App Profissional</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Dicas</Link></li>
                <li><Link href="/dashboard/support" className="text-muted-foreground hover:text-primary">Suporte</Link></li>
                <li><Link href="/#profissionais" className="text-muted-foreground hover:text-primary">Receba Mais Serviços</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-primary">Legal</h3>
            <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Termos de Uso</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Política de Privacidade</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Política de Cookies</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Segurança de Dados</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Acessibilidade</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-muted-foreground/20 pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Serviços Já Tecnologia Ltda. Todos os direitos reservados. CNPJ: XX.XXX.XXX/0001-XX
        </div>
      </div>
    </footer>
  );
}
