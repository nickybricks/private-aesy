import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

/**
 * Clamps a value between min and max
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculate Weighted Average Cost of Capital (WACC)
 * Based on the same logic as the valuation edge function
 */
export async function calculateWACC(ticker: string): Promise<number> {
  try {
    console.log(`Calculating WACC for ${ticker}`);
    
    // Fetch required financial data
    const [profileRes, balanceRes, incomeRes] = await Promise.all([
      axios.get(`https://financialmodelingprep.com/api/v3/profile/${ticker}`, {
        params: { apikey: DEFAULT_FMP_API_KEY }
      }),
      axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}`, {
        params: { period: 'annual', limit: 4, apikey: DEFAULT_FMP_API_KEY }
      }),
      axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}`, {
        params: { period: 'annual', limit: 4, apikey: DEFAULT_FMP_API_KEY }
      })
    ]);

    const profile = profileRes.data[0];
    const balance = balanceRes.data;
    const income = incomeRes.data;

    if (!profile || !balance?.length || !income?.length) {
      console.warn(`Insufficient data for WACC calculation for ${ticker}, using default 10%`);
      return 10.0; // Default fallback
    }

    // Market cap (E)
    const marketCap = profile.mktCap || 0;
    
    // Average debt from last 4 quarters (including lease liabilities)
    const recentBalances = balance.slice(0, Math.min(4, balance.length));
    const avgDebt = recentBalances.reduce((sum: number, b: any) => {
      const shortTermDebt = b.shortTermDebt || 0;
      const longTermDebt = b.longTermDebt || 0;
      const operatingLeases = b.operatingLeaseNonCurrent || 0; // Include lease liabilities
      const totalDebt = shortTermDebt + longTermDebt + operatingLeases;
      return sum + totalDebt;
    }, 0) / Math.max(1, recentBalances.length);
    
    const D = Math.max(0, avgDebt);
    const E = Math.max(1, marketCap);
    const V = E + D;
    
    // Risk-free rate (assume 4% for 10-year US Treasury)
    const rf = 0.04;
    
    // Beta (from profile, clamped between 0.5 and 2.5)
    const rawBeta = profile.beta || 1.0;
    const beta = clamp(rawBeta, 0.5, 2.5);
    
    // Market risk premium (6% default)
    const mrp = 0.06;
    
    // Cost of equity (Re = rf + beta * mrp)
    const Re = rf + beta * mrp;
    
    // Cost of debt (Rd = Interest / Average Debt)
    const recentIncome = income.slice(0, Math.min(4, income.length));
    const avgInterestExpense = recentIncome.reduce((sum: number, i: any) => {
      return sum + Math.abs(i.interestExpense || 0);
    }, 0) / Math.max(1, recentIncome.length);
    
    // Handle negative or zero interest
    const Rd = (D > 0 && avgInterestExpense > 0) ? avgInterestExpense / D : 0;
    
    // Tax rate (smoothed over last 4 years)
    const taxRates = recentIncome
      .filter((i: any) => i.incomeTaxExpense && i.incomeBeforeTax && i.incomeBeforeTax > 0)
      .map((i: any) => i.incomeTaxExpense / i.incomeBeforeTax);
    
    const taxRate = taxRates.length > 0
      ? clamp(taxRates.reduce((a: number, b: number) => a + b, 0) / taxRates.length, 0, 0.5)
      : 0.21;
    
    // WACC = (E/V)*Re + (D/V)*Rd*(1-Tc)
    const wacc = (E / V) * Re + (D / V) * Rd * (1 - taxRate);
    
    // Clamp WACC between 8% and 12%
    const clampedWacc = clamp(wacc * 100, 8, 12);
    
    console.log(`WACC calculation for ${ticker}: E=${E.toFixed(2)}, D=${D.toFixed(2)}, Re=${(Re * 100).toFixed(2)}%, Rd=${(Rd * 100).toFixed(2)}%, Tax=${(taxRate * 100).toFixed(2)}%, WACC=${clampedWacc.toFixed(2)}%`);
    
    return parseFloat(clampedWacc.toFixed(2));
  } catch (error) {
    console.error(`Error calculating WACC for ${ticker}:`, error);
    console.warn(`Falling back to default WACC of 10% for ${ticker}`);
    return 10.0; // Fallback to default
  }
}
