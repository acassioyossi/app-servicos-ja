'use server';
/**
 * @fileOverview Um flow para calcular o bônus em Wayne Cash para o profissional.
 *
 * - calculateWayneCashBonusProfessional - Uma função que calcula o bônus com base no valor do serviço.
 * - CalculateWayneCashBonusProfessionalInput - O tipo de entrada para a função.
 * - CalculateWayneCashBonusProfessionalOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
// import {z} from 'genkit';
import { z } from 'zod';

// Placeholder function for mobile build
export async function calculateWayneCashBonusProfessional(input: any) {
  return {
    bonus: 0,
    message: 'Cálculo temporariamente indisponível'
  };
}

/*

const CalculateWayneCashBonusProfessionalInputSchema = z.object({
  serviceValue: z.number().positive("O valor do serviço deve ser positivo."),
});
export type CalculateWayneCashBonusProfessionalInput = z.infer<typeof CalculateWayneCashBonusProfessionalInputSchema>;

const CalculateWayneCashBonusProfessionalOutputSchema = z.object({
  professionalBonus: z.number().describe("Bônus de 0.5% do valor do serviço para o profissional em Wayne Cash."),
  explanation: z.string().describe("Uma breve explicação de como o bônus foi calculado."),
});
export type CalculateWayneCashBonusProfessionalOutput = z.infer<typeof CalculateWayneCashBonusProfessionalOutputSchema>;


export async function calculateWayneCashBonusProfessional(input: CalculateWayneCashBonusProfessionalInput): Promise<CalculateWayneCashBonusProfessionalOutput> {
  return calculateWayneCashBonusProfessionalFlow(input);
}

const calculateWayneCashBonusProfessionalFlow = ai.defineFlow(
  {
    name: 'calculateWayneCashBonusProfessionalFlow',
    inputSchema: CalculateWayneCashBonusProfessionalInputSchema,
    outputSchema: CalculateWayneCashBonusProfessionalOutputSchema,
  },
  async ({ serviceValue }) => {
    const professionalBonus = serviceValue * 0.005;

    return {
      professionalBonus,
      explanation: `Para um serviço de R$ ${serviceValue.toFixed(2)}, você recebe um bônus de 0.5%, resultando em WC ${professionalBonus.toFixed(2)}. Este valor é adicionado à sua carteira Wayne Cash.`
    };
  }
);
*/
