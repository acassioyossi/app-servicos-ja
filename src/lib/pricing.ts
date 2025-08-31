/**
 * Pricing utilities and calculations
 */

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'basic',
    name: 'Básico',
    price: 29.90,
    features: ['Até 10 serviços por mês', 'Suporte básico']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 59.90,
    features: ['Serviços ilimitados', 'Suporte prioritário', 'Analytics avançado']
  }
];

export function calculateServicePrice(basePrice: number, complexity: number = 1): number {
  return basePrice * complexity;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}