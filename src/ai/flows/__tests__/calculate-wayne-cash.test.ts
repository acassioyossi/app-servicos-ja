import { calculateWayneCash } from '../calculate-wayne-cash'
import type { CalculateWayneCashInput, CalculateWayneCashOutput } from '../calculate-wayne-cash'

// Mock the AI flow
jest.mock('@/ai/genkit', () => ({
  ai: {
    defineFlow: jest.fn((config, fn) => fn),
  },
}))

describe('calculateWayneCash', () => {
  it('calculates Wayne Cash distribution correctly for R$ 100 service', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 100,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    expect(result.totalFee).toBe(10) // 10% of 100
    expect(result.paymentGatewayFee).toBe(2) // 2% of 100
    expect(result.platformFee).toBe(7) // 7% of 100
    expect(result.wayneCashTotal).toBe(1) // 1% of 100
    expect(result.clientBonus).toBe(0.5) // 0.5% of 100
    expect(result.platformInvestment).toBe(0.5) // 0.5% of 100
  })

  it('calculates Wayne Cash distribution correctly for R$ 250 service', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 250,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    expect(result.totalFee).toBe(25) // 10% of 250
    expect(result.paymentGatewayFee).toBe(5) // 2% of 250
    expect(result.platformFee).toBe(17.5) // 7% of 250
    expect(result.wayneCashTotal).toBe(2.5) // 1% of 250
    expect(result.clientBonus).toBe(1.25) // 0.5% of 250
    expect(result.platformInvestment).toBe(1.25) // 0.5% of 250
  })

  it('calculates Wayne Cash distribution correctly for R$ 50 service', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 50,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    expect(result.totalFee).toBe(5) // 10% of 50
    expect(result.paymentGatewayFee).toBe(1) // 2% of 50
    expect(result.platformFee).toBe(3.5) // 7% of 50
    expect(result.wayneCashTotal).toBe(0.5) // 1% of 50
    expect(result.clientBonus).toBe(0.25) // 0.5% of 50
    expect(result.platformInvestment).toBe(0.25) // 0.5% of 50
  })

  it('ensures fee breakdown adds up to total fee', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 150,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    const calculatedTotal = result.paymentGatewayFee + result.platformFee + result.wayneCashTotal
    expect(calculatedTotal).toBeCloseTo(result.totalFee, 10)
  })

  it('ensures Wayne Cash breakdown adds up correctly', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 200,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    const wayneCashBreakdown = result.clientBonus + result.platformInvestment
    expect(wayneCashBreakdown).toBeCloseTo(result.wayneCashTotal, 10)
  })

  it('handles decimal values correctly', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 33.33,
    }

    const result: CalculateWayneCashOutput = await calculateWayneCash(input)

    expect(result.totalFee).toBeCloseTo(3.333, 3)
    expect(result.paymentGatewayFee).toBeCloseTo(0.6666, 4)
    expect(result.platformFee).toBeCloseTo(2.3331, 4)
    expect(result.wayneCashTotal).toBeCloseTo(0.3333, 4)
    expect(result.clientBonus).toBeCloseTo(0.16665, 5)
    expect(result.platformInvestment).toBeCloseTo(0.16665, 5)
  })

  it('validates positive service value requirement', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: -100,
    }

    // This should throw an error due to Zod validation
    await expect(calculateWayneCash(input)).rejects.toThrow()
  })

  it('validates zero service value', async () => {
    const input: CalculateWayneCashInput = {
      serviceValue: 0,
    }

    // This should throw an error due to Zod validation (positive requirement)
    await expect(calculateWayneCash(input)).rejects.toThrow()
  })
})