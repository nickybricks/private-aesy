import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BasisMode = 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';

interface ValuationInput {
  ticker: string;
  mode: BasisMode;
  currentPrice: number;
}

interface ValuationResponse {
  ticker: string;
  price: number;
  mode: BasisMode;
  fairValuePerShare: number;
  marginOfSafetyPct: number;
  assumptions: {
    discountRatePct: number;
    growthYears: number;
    growthRatePct: number;
    terminalYears: number;
    terminalRatePct: number;
    tangibleBookPerShare: number;
    includeTangibleBook: boolean;
    predictability: string;
  };
  components: {
    startValuePerShare: number;
    pvPhase1: number;
    pvPhase2: number;
    tangibleBookAdded: number;
  };
  asOf: string;
}

// Helper functions
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function trimmedMean(values: number[], trimPct: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPct);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// Fetch financial data from FMP
async function fetchFinancialData(ticker: string) {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  console.log(`Fetching data for ${ticker}`);
  
  // Fetch income statements, balance sheets, cash flows, and profile
  const [incomeRes, balanceRes, cashFlowRes, profileRes, metricsRes] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=annual&limit=10&apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${FMP_API_KEY}`)
  ]);

  if (!incomeRes.ok || !balanceRes.ok || !cashFlowRes.ok || !profileRes.ok) {
    throw new Error('Failed to fetch financial data');
  }

  const income = await incomeRes.json();
  const balance = await balanceRes.json();
  const cashFlow = await cashFlowRes.json();
  const profile = await profileRes.json();
  const metrics = metricsRes.ok ? await metricsRes.json() : null;

  return { income, balance, cashFlow, profile: profile[0], metrics: metrics?.[0] };
}

// Calculate WACC with improved debt handling
async function calculateWACC(ticker: string, data: any): Promise<number> {
  const profile = data.profile;
  const balance = data.balance;
  const income = data.income;
  
  // Market cap (E)
  const marketCap = profile.mktCap || 0;
  
  // Average debt from last 4 quarters (including lease liabilities)
  const recentBalances = balance.slice(0, 4);
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
  const recentIncome = income.slice(0, 4);
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
  
  console.log(`WACC calculation: E=${E}, D=${D}, Re=${Re.toFixed(4)}, Rd=${Rd.toFixed(4)}, Tax=${taxRate.toFixed(2)}, WACC=${clampedWacc.toFixed(2)}%`);
  
  return clampedWacc;
}

// Calculate starting value based on mode with smoothing
function calculateStartValue(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  const profile = data.profile;
  const metrics = data.metrics;
  
  const sharesOutstanding = profile.sharesOutstanding || 1;
  
  if (mode === 'EPS_WO_NRI') {
    // EPS without non-recurring items - use trimmed mean of last 3-5 years for smoothing
    const recentEps = income.slice(0, 5)
      .map((i: any) => i.eps || i.epsdiluted || 0)
      .filter((v: number) => v > 0);
    
    if (recentEps.length >= 3) {
      // Use trimmed mean (remove top/bottom 20%)
      return trimmedMean(recentEps, 0.2);
    } else if (recentEps.length >= 1) {
      // Fallback to median if not enough data
      return median(recentEps);
    }
    
    return 0;
  }
  
  if (mode === 'FCF_PER_SHARE') {
    // Free Cash Flow per share with robust handling
    const recentCashFlows = cashFlow.slice(0, 5);
    const fcfPerShareValues = recentCashFlows
      .map((cf: any) => (cf.freeCashFlow || 0) / sharesOutstanding);
    
    // Filter positive values
    const positiveFcf = fcfPerShareValues.filter((v: number) => v > 0);
    
    // Use trimmed mean for smoothing if we have enough data
    if (positiveFcf.length >= 3) {
      return trimmedMean(positiveFcf, 0.2);
    }
    
    // If TTM is negative but median is positive, use median
    const allFcf = fcfPerShareValues.filter((v: number) => !isNaN(v));
    if (allFcf.length >= 3) {
      const medianFcf = median(allFcf);
      if (medianFcf > 0) {
        return medianFcf;
      }
    }
    
    // Last resort: use TTM if positive
    const ttmFcfPerShare = fcfPerShareValues[0] || 0;
    return Math.max(0, ttmFcfPerShare);
  }
  
  if (mode === 'ADJUSTED_DIVIDEND') {
    // Dividend + Net Buyback per share - smoothed over 3 years
    const dividendPerShare = metrics?.dividendPerShareTTM || 0;
    
    // Calculate net buyback smoothed over 3 years
    const recentCashFlows = cashFlow.slice(0, 3);
    const buybackPerShareValues = recentCashFlows.map((cf: any) => {
      const stockRepurchased = Math.abs(cf.commonStockRepurchased || 0);
      const stockIssued = cf.commonStockIssued || 0;
      const netBuyback = stockRepurchased - stockIssued;
      return netBuyback / sharesOutstanding;
    });
    
    const avgBuybackPerShare = buybackPerShareValues.length > 0
      ? buybackPerShareValues.reduce((a, b) => a + b, 0) / buybackPerShareValues.length
      : 0;
    
    return Math.max(0, dividendPerShare + avgBuybackPerShare);
  }
  
  return 0;
}

// Calculate historical growth rate with improved smoothing
function calculateGrowthRate(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  
  if (mode === 'EPS_WO_NRI') {
    // Calculate EPS CAGR over 5-10 years (prefer 5, fallback to 10)
    const epsValues = income.slice(0, 11)
      .map((i: any) => i.eps || i.epsdiluted || 0)
      .filter((v: number) => v > 0);
    
    if (epsValues.length >= 6) {
      // Use 5-year CAGR
      const startEps = epsValues[5];
      const endEps = epsValues[0];
      const years = 5;
      const cagr = (Math.pow(endEps / startEps, 1 / years) - 1) * 100;
      return clamp(cagr, 0, 15);
    } else if (epsValues.length >= 3) {
      // Fallback to available years
      const startEps = epsValues[epsValues.length - 1];
      const endEps = epsValues[0];
      const years = epsValues.length - 1;
      const cagr = (Math.pow(endEps / startEps, 1 / years) - 1) * 100;
      return clamp(cagr, 0, 15);
    }
    
    // Default conservative growth
    return 5;
  }
  
  if (mode === 'FCF_PER_SHARE') {
    // Calculate FCF CAGR over 5-10 years
    const profile = data.profile;
    const sharesOutstanding = profile.sharesOutstanding || 1;
    const fcfValues = cashFlow.slice(0, 11)
      .map((cf: any) => (cf.freeCashFlow || 0) / sharesOutstanding)
      .filter((v: number) => v > 0);
    
    if (fcfValues.length >= 6) {
      // Use 5-year CAGR
      const startFcf = fcfValues[5];
      const endFcf = fcfValues[0];
      const years = 5;
      const cagr = (Math.pow(endFcf / startFcf, 1 / years) - 1) * 100;
      return clamp(cagr, 0, 15);
    } else if (fcfValues.length >= 3) {
      // Fallback to available years
      const startFcf = fcfValues[fcfValues.length - 1];
      const endFcf = fcfValues[0];
      const years = fcfValues.length - 1;
      const cagr = (Math.pow(endFcf / startFcf, 1 / years) - 1) * 100;
      return clamp(cagr, 0, 15);
    }
    
    // Default conservative growth
    return 4;
  }
  
  if (mode === 'ADJUSTED_DIVIDEND') {
    // Use conservative dividend growth (5% default, max 10%)
    // Could enhance this by calculating historical dividend growth if available
    return 5;
  }
  
  // Default conservative growth rate
  return 6;
}

// Calculate finite horizon valuation (20 years, 2 phases)
function calculateFiniteHorizonValuation(
  startValue: number,
  wacc: number,
  growthRate: number,
  terminalRate: number,
  growthYears: number,
  terminalYears: number,
  tangibleBook: number,
  includeTBV: boolean
): { fairValue: number; pvPhase1: number; pvPhase2: number; tbvAdded: number } {
  const r = wacc / 100;
  const g1 = growthRate / 100;
  const g2 = terminalRate / 100;
  
  let mt = startValue;
  let pvPhase1 = 0;
  
  // Phase 1: Growth years
  for (let t = 1; t <= growthYears; t++) {
    mt *= (1 + g1);
    pvPhase1 += mt / Math.pow(1 + r, t);
  }
  
  // Phase 2: Terminal years
  let pvPhase2 = 0;
  for (let t = 1; t <= terminalYears; t++) {
    mt *= (1 + g2);
    pvPhase2 += mt / Math.pow(1 + r, growthYears + t);
  }
  
  let fairValue = pvPhase1 + pvPhase2;
  const tbvAdded = (includeTBV && tangibleBook > 0) ? tangibleBook : 0;
  fairValue += tbvAdded;
  
  return {
    fairValue: parseFloat(fairValue.toFixed(2)),
    pvPhase1: parseFloat(pvPhase1.toFixed(2)),
    pvPhase2: parseFloat(pvPhase2.toFixed(2)),
    tbvAdded: parseFloat(tbvAdded.toFixed(2))
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ticker = url.searchParams.get('ticker');
    const mode = (url.searchParams.get('mode') || 'EPS_WO_NRI') as BasisMode;
    const priceStr = url.searchParams.get('price');
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing ticker parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Valuation request: ticker=${ticker}, mode=${mode}`);
    
    // Fetch financial data
    const data = await fetchFinancialData(ticker);
    
    // Calculate WACC
    const wacc = await calculateWACC(ticker, data);
    console.log(`Calculated WACC: ${wacc.toFixed(2)}%`);
    
    // Calculate start value based on mode
    const startValue = calculateStartValue(mode, data);
    console.log(`Start value for mode ${mode}: ${startValue.toFixed(2)}`);
    
    // Warnings array for data quality issues
    const warnings: string[] = [];
    
    if (startValue <= 0) {
      warnings.push(`Keine ausreichenden Daten für Modus ${mode}. Berechnung mit konservativen Annahmen.`);
      // Don't throw error, continue with warning
    }
    
    // Use a minimum start value if needed
    const effectiveStartValue = Math.max(startValue, 0.01);
    
    // Calculate growth rate
    const growthRate = calculateGrowthRate(mode, data);
    console.log(`Calculated growth rate: ${growthRate.toFixed(2)}%`);
    
    if (growthRate < 1) {
      warnings.push('Historisches Wachstum sehr niedrig. Ergebnis ist sehr konservativ.');
    }
    
    // Settings with conservative defaults
    const terminalRate = clamp(4.0, 0, 6); // Terminal rate capped at 6%
    const growthYears = 10;
    const terminalYears = 10;
    const tangibleBook = data.metrics?.tangibleBookValuePerShareTTM || 0;
    const includeTBV = false; // Default to false
    
    // Calculate valuation
    const result = calculateFiniteHorizonValuation(
      effectiveStartValue,
      wacc,
      growthRate,
      terminalRate,
      growthYears,
      terminalYears,
      tangibleBook,
      includeTBV
    );
    
    // Current price
    const currentPrice = priceStr ? parseFloat(priceStr) : data.profile.price;
    
    // Margin of safety
    const marginOfSafety = ((result.fairValue - currentPrice) / currentPrice) * 100;
    
    const response: ValuationResponse = {
      ticker: ticker.toUpperCase(),
      price: currentPrice,
      mode,
      fairValuePerShare: result.fairValue,
      marginOfSafetyPct: parseFloat(marginOfSafety.toFixed(2)),
      assumptions: {
        discountRatePct: wacc,
        growthYears,
        growthRatePct: growthRate,
        terminalYears,
        terminalRatePct: terminalRate,
        tangibleBookPerShare: tangibleBook,
        includeTangibleBook: includeTBV,
        predictability: 'medium'
      },
      components: {
        startValuePerShare: parseFloat(effectiveStartValue.toFixed(2)),
        pvPhase1: result.pvPhase1,
        pvPhase2: result.pvPhase2,
        tangibleBookAdded: result.tbvAdded
      },
      asOf: new Date().toISOString().split('T')[0]
    };
    
    // Add warnings to response if any
    if (warnings.length > 0) {
      (response as any).warnings = warnings;
    }
    
    console.log(`Valuation result:`, response);
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Valuation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
