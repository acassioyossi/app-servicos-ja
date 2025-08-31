'use server';
/**
 * @fileOverview Um flow para calcular a distribuição de taxas do Wayne Cash.
 *
 * - calculateWayneCash - Uma função que calcula a divisão das taxas de um serviço.
 * - CalculateWayneCashInput - O tipo de entrada para a função calculateWayneCash.
 * - CalculateWayneCashOutput - O tipo de retorno para a função calculateWayneCash.
 */

import { z } from 'zod';

// Placeholder function to allow build to work
export async function calculateWayneCash(input: any): Promise<any> {
  return { wayneCash: 0, bonus: 0 };
}

// Placeholder types
export type CalculateWayneCashInput = {
  serviceValue: number;
};

export type CalculateWayneCashOutput = {
  wayneCash: number;
  bonus: number;
};
