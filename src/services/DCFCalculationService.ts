import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

interface DCFInputData {
  // Income Statement Data
  ebit: number[];
  taxRate: number[];
  depreciation: number[];
  
  // Cash Flow Statement Data
  capitalExpenditure: number[];
  
  // Balance Sheet Data - for ΔNWC calculation
  receivables: number[];
  inventories: number[];
  payables: number[];
  
  // Financial Position
  totalDebt: number;
  cash: number;
  sharesOutstanding: number;
  
  // DCF Parameters
  wacc: number;
  terminalGrowthRate?: number;
}

interface DCFResult {
  projectedFcf: number[];
  projectedFcfPv: number[];
  wacc: number;
  terminalValuePv: number;
  netDebt: number;
  sharesOutstanding: number;
  dcfValue: number;
  sumPvProjectedFcf: number;
  enterpriseValue: number;
  equityValue: number;
  intrinsicValue: number;
  debugOutput?: DCFDebugYear[];
}

interface DCFDebugYear {
  year: number;
  ebit: number;
  taxRate: number;
  nopat: number;
  depreciation: number;
  capex: number;
  deltaWC: number;
  fcff: number;
  pvFcff: number;
  units: string;
}

/**
 * Custom DCF Calculation Service
 * Performs own FCFF calculation instead of using API's pre-calculated values
 */
export class DCFCalculationService {
  private static readonly TERMINAL_GROWTH_RATE = 0.025; // 2.5% default terminal growth
  private static readonly MIN_YEARS_REQUIRED = 3;

  /**
   * Fetch raw financial data from FMP API
   */
  private static async fetchRawFinancialData(ticker: string): Promise<DCFInputData> {
    console.log(`Fetching raw financial data for ${ticker}`);
    
    try {
      // Fetch multiple financial statements in parallel
      const [incomeResponse, cashFlowResponse, balanceResponse, profileResponse] = await Promise.all([
        axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}`, {
          params: { limit: 5, apikey: DEFAULT_FMP_API_KEY }
        }),
        axios.get(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}`, {
          params: { limit: 5, apikey: DEFAULT_FMP_API_KEY }
        }),
        axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}`, {
          params: { limit: 5, apikey: DEFAULT_FMP_API_KEY }
        }),
        axios.get(`https://financialmodelingprep.com/api/v3/profile/${ticker}`, {
          params: { apikey: DEFAULT_FMP_API_KEY }
        })
      ]);

      const incomeData = incomeResponse.data;
      const cashFlowData = cashFlowResponse.data;
      const balanceData = balanceResponse.data;
      const profileData = profileResponse.data[0];

      if (!incomeData?.length || !cashFlowData?.length || !balanceData?.length) {
        throw new Error(`Insufficient financial data for ${ticker}`);
      }

      // Extract 5 years of data (most recent first)
      const years = Math.min(incomeData.length, cashFlowData.length, balanceData.length, 5);
      
      // Calculate WACC using actual company data
      let wacc = 0.10; // Default 10% as fallback
      try {
        const { calculateWACC } = await import('@/utils/waccCalculator');
        const waccPercentage = await calculateWACC(ticker);
        wacc = waccPercentage / 100; // Convert from percentage to decimal
        console.log(`Using calculated WACC: ${waccPercentage}% (${wacc} as decimal)`);
      } catch (error) {
        console.error('Error calculating WACC in DCF, using default 10%:', error);
      }

      const inputData: DCFInputData = {
        ebit: incomeData.slice(0, years).map((d: any) => d.operatingIncome || 0),
        taxRate: incomeData.slice(0, years).map((d: any) => 
          d.incomeBeforeTax > 0 ? Math.abs(d.incomeTaxExpense || 0) / d.incomeBeforeTax : 0.25
        ),
        depreciation: cashFlowData.slice(0, years).map((d: any) => 
          Math.abs(d.depreciationAndAmortization || 0)
        ),
        capitalExpenditure: cashFlowData.slice(0, years).map((d: any) => 
          Math.abs(d.capitalExpenditure || 0)
        ),
        receivables: balanceData.slice(0, years).map((d: any) => d.netReceivables || 0),
        inventories: balanceData.slice(0, years).map((d: any) => d.inventory || 0),
        payables: balanceData.slice(0, years).map((d: any) => d.accountPayables || 0),
        totalDebt: balanceData[0]?.totalDebt || 0,
        cash: balanceData[0]?.cashAndCashEquivalents || 0,
        sharesOutstanding: Math.abs(profileData?.mktCap && profileData?.price ? 
          profileData.mktCap / profileData.price : balanceData[0]?.weightedAverageShsOutDil || 0),
        wacc: wacc, // Use calculated WACC from FMP API data
        terminalGrowthRate: this.TERMINAL_GROWTH_RATE
      };

      console.log('Raw financial data extracted:', {
        years,
        ebitSample: inputData.ebit[0],
        sharesOutstanding: inputData.sharesOutstanding,
        netDebt: inputData.totalDebt - inputData.cash
      });

      return inputData;
    } catch (error) {
      console.error('Error fetching raw financial data:', error);
      throw error;
    }
  }

  /**
   * Calculate ΔNWC (Change in Net Working Capital)
   */
  private static calculateDeltaNWC(
    receivables: number[], 
    inventories: number[], 
    payables: number[]
  ): number[] {
    const deltaWC: number[] = [];
    
    for (let i = 1; i < receivables.length; i++) {
      const currentNWC = (receivables[i-1] || 0) + (inventories[i-1] || 0) - (payables[i-1] || 0);
      const previousNWC = (receivables[i] || 0) + (inventories[i] || 0) - (payables[i] || 0);
      
      // Positive ΔNWC means cash outflow (increase in working capital)
      deltaWC.push(currentNWC - previousNWC);
    }
    
    return deltaWC;
  }

  /**
   * Calculate FCFF (Free Cash Flow to Firm)
   * FCFF = NOPAT + Depreciation - CapEx - ΔNWC
   */
  private static calculateFCFF(data: DCFInputData): { fcff: number[], debugYears: DCFDebugYear[] } {
    const fcff: number[] = [];
    const debugYears: DCFDebugYear[] = [];
    const deltaWC = this.calculateDeltaNWC(data.receivables, data.inventories, data.payables);
    
    // Use historical years for projection base (skip current year for Δ calculations)
    const yearsToProject = Math.min(data.ebit.length - 1, 5);
    
    for (let i = 0; i < yearsToProject; i++) {
      const ebit = data.ebit[i] || 0;
      const taxRate = data.taxRate[i] || 0.25;
      const nopat = ebit * (1 - taxRate);
      const depreciation = data.depreciation[i] || 0;
      const capex = data.capitalExpenditure[i] || 0;
      const deltaWCValue = deltaWC[i] || 0;
      
      const fcffValue = nopat + depreciation - capex - deltaWCValue;
      fcff.push(fcffValue);
      
      // Debug output
      debugYears.push({
        year: new Date().getFullYear() + i + 1,
        ebit,
        taxRate: taxRate * 100,
        nopat,
        depreciation,
        capex,
        deltaWC: deltaWCValue,
        fcff: fcffValue,
        pvFcff: 0, // Will be calculated later
        units: 'Million USD' // Could be enhanced with actual currency detection
      });
    }
    
    console.log('FCFF Calculation completed:', {
      fcffValues: fcff,
      averageFCFF: fcff.reduce((a, b) => a + b, 0) / fcff.length
    });
    
    return { fcff, debugYears };
  }

  /**
   * Calculate Terminal Value with guard for negative FCFF
   */
  private static calculateTerminalValue(
    fcff: number[], 
    wacc: number, 
    terminalGrowthRate: number
  ): number {
    if (fcff.length === 0) return 0;
    
    const finalYearFCFF = fcff[fcff.length - 1];
    
    // Terminal Guard: Don't perpetuate negative FCFF
    if (finalYearFCFF <= 0) {
      console.warn('Terminal Guard triggered: Final year FCFF is negative or zero, setting TV = 0');
      return 0;
    }
    
    // Terminal Value = FCFF_N × (1 + g) / (WACC - g)
    const terminalFCFF = finalYearFCFF * (1 + terminalGrowthRate);
    const terminalValue = terminalFCFF / (wacc - terminalGrowthRate);
    
    // Present value of terminal value (discounted back to today)
    const terminalValuePV = terminalValue / Math.pow(1 + wacc, fcff.length);
    
    console.log('Terminal Value Calculation:', {
      finalYearFCFF,
      terminalFCFF,
      terminalValue,
      terminalValuePV,
      yearsToDiscount: fcff.length
    });
    
    return Math.max(0, terminalValuePV);
  }

  /**
   * Calculate present values of projected FCFF
   */
  private static calculatePresentValues(fcff: number[], wacc: number): number[] {
    return fcff.map((cashFlow, index) => {
      const pv = cashFlow / Math.pow(1 + wacc, index + 1);
      return pv;
    });
  }

  /**
   * Main DCF calculation method
   */
  public static async calculateDCF(ticker: string): Promise<DCFResult> {
    console.log(`Starting DCF calculation for ${ticker}`);
    
    try {
      // 1. Fetch raw financial data
      const inputData = await this.fetchRawFinancialData(ticker);
      
      // 2. Calculate FCFF
      const { fcff, debugYears } = this.calculateFCFF(inputData);
      
      if (fcff.length < this.MIN_YEARS_REQUIRED) {
        throw new Error(`Insufficient data: Only ${fcff.length} years available, minimum ${this.MIN_YEARS_REQUIRED} required`);
      }
      
      // 3. Calculate present values
      const projectedFcfPv = this.calculatePresentValues(fcff, inputData.wacc);
      
      // Update debug years with PV calculations
      debugYears.forEach((year, index) => {
        if (index < projectedFcfPv.length) {
          year.pvFcff = projectedFcfPv[index];
        }
      });
      
      // 4. Calculate terminal value
      const terminalValuePv = this.calculateTerminalValue(
        fcff, 
        inputData.wacc, 
        inputData.terminalGrowthRate || this.TERMINAL_GROWTH_RATE
      );
      
      // 5. Calculate Enterprise Value
      const sumPvProjectedFcf = projectedFcfPv.reduce((sum, pv) => sum + pv, 0);
      const enterpriseValue = sumPvProjectedFcf + terminalValuePv;
      
      // 6. Calculate Equity Value: EV - Net Debt
      const netDebt = inputData.totalDebt - inputData.cash;
      const equityValue = enterpriseValue - netDebt;
      
      // 7. Calculate intrinsic value per share
      const intrinsicValue = inputData.sharesOutstanding > 0 ? 
        equityValue / inputData.sharesOutstanding : 0;
      
      const result: DCFResult = {
        projectedFcf: fcff,
        projectedFcfPv,
        wacc: inputData.wacc,
        terminalValuePv,
        netDebt,
        sharesOutstanding: inputData.sharesOutstanding,
        dcfValue: intrinsicValue,
        sumPvProjectedFcf,
        enterpriseValue,
        equityValue,
        intrinsicValue,
        debugOutput: debugYears
      };
      
      // Debug output
      console.log('DCF Calculation Results:', {
        ticker,
        enterpriseValue: `${(enterpriseValue / 1000000).toFixed(2)}M`,
        netDebt: `${(netDebt / 1000000).toFixed(2)}M`,
        equityValue: `${(equityValue / 1000000).toFixed(2)}M`,
        sharesOutstanding: `${(inputData.sharesOutstanding / 1000000).toFixed(2)}M`,
        intrinsicValuePerShare: `${intrinsicValue.toFixed(2)}`,
        currency: 'USD'
      });
      
      console.log('DCF Debug Years:');
      debugYears.forEach(year => {
        console.log(`Year ${year.year}: EBIT=${(year.ebit/1000000).toFixed(1)}M, NOPAT=${(year.nopat/1000000).toFixed(1)}M, FCFF=${(year.fcff/1000000).toFixed(1)}M, PV=${(year.pvFcff/1000000).toFixed(1)}M`);
      });
      
      return result;
    } catch (error) {
      console.error(`DCF calculation failed for ${ticker}:`, error);
      throw error;
    }
  }
}