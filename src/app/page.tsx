import { AppFeatures } from '@/components/landing/app-features';
import { Cta } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ProfessionalsOnline } from '@/components/landing/professionals-online';
import { Registration } from '@/components/landing/registration';
import { Services } from '@/components/landing/services';
import { WayneCash } from '@/components/landing/wayne-cash';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <WayneCash />
        <HowItWorks />
        <Services />
        <ProfessionalsOnline />
        <Registration />
        <AppFeatures />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
