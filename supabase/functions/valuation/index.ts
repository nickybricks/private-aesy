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
  diagnostics?: {
    cfo_ttm?: number;
    capex_ttm?: number;
    fcf_ttm?: number;
    fcf_ps_q?: number[];
    fcf_ps_ttm?: number;
    diluted_shares_q?: number[];
    units?: { cashflow: string };
    suspicious_units?: boolean;
    shares_mismatch?: boolean;
  };
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
  
  console.log(`WACC calculation: E=${E.toFixed(2)}, D=${D.toFixed(2)}, Re=${(Re * 100).toFixed(2)}%, Rd=${(Rd * 100).toFixed(2)}%, Tax=${(taxRate * 100).toFixed(2)}%, WACC=${clampedWacc.toFixed(2)}%`);
  
  return parseFloat(clampedWacc.toFixed(2));
}

// Calculate EPS w/o NRI (quarterly adjusted)
async function calculateEpsWoNri(ticker: string): Promise<number> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) throw new Error('FMP_API_KEY not configured');

  const res = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=quarter&limit=40&apikey=${FMP_API_KEY}`);
  if (!res.ok) return 0;
  
  const quarters = await res.json();
  if (!Array.isArray(quarters) || quarters.length < 4) return 0;

  // Calculate EPS w/o NRI for last 4 quarters (TTM)
  let ttmEpsWoNri = 0;
  for (let i = 0; i < 4; i++) {
    const q = quarters[i];
    
    // Get tax rate
    const preTax = q.incomeBeforeTax || 0;
    const tax = q.incomeTaxExpense || 0;
    const taxRate = (preTax > 0 && tax > 0) ? Math.min(Math.max(tax / preTax, 0), 0.5) : 0.21;
    
    // Get NI continuing ops
    const niCont = q.netIncomeFromContinuingOperations || q.netIncome || 0;
    
    // Get unusuals (pretax)
    const unusualPretax = (q.unusualItems || 0) + (q.goodwillImpairment || 0) + (q.impairmentOfGoodwillAndIntangibleAssets || 0);
    const unusualAfterTax = unusualPretax * (1 - taxRate);
    
    // Calculate NI w/o NRI
    const niWoNri = niCont - unusualAfterTax;
    
    // Get diluted shares
    const shares = q.weightedAverageShsOutDil || 0;
    if (shares <= 0) continue;
    
    // Add quarterly EPS w/o NRI
    ttmEpsWoNri += niWoNri / shares;
  }
  
  return ttmEpsWoNri;
}

// Calculate FCF per Share (quarterly adjusted) with diagnostics
async function calculateFcfPerShare(ticker: string, profile: any): Promise<{
  fcfPerShareTtm: number;
  diagnostics: {
    cfo_ttm: number;
    capex_ttm: number;
    fcf_ttm: number;
    fcf_ps_q: number[];
    fcf_ps_ttm: number;
    diluted_shares_q: number[];
    units: { cashflow: string };
    suspicious_units: boolean;
    shares_mismatch: boolean;
  };
}> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) throw new Error('FMP_API_KEY not configured');

  // Fetch quarterly cash flow statements
  const res = await fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=quarter&limit=40&apikey=${FMP_API_KEY}`);
  if (!res.ok) {
    throw new Error('Failed to fetch quarterly cash flow data');
  }
  
  const quarters = await res.json();
  if (!Array.isArray(quarters) || quarters.length < 4) {
    throw new Error('Not enough quarterly cash flow data');
  }

  // Get annual data for shares mismatch check
  const annualRes = await fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=annual&limit=1&apikey=${FMP_API_KEY}`);
  const annualData = annualRes.ok ? await annualRes.json() : [];
  const annualShares = annualData[0]?.weightedAverageShsOutDil || 0;

  const fcfPsQuarters: number[] = [];
  const dilutedSharesQuarters: number[] = [];
  let cfoTtm = 0;
  let capexTtm = 0;
  let fcfTtm = 0;
  
  // Detect units - check if values are in millions
  const firstCfo = Math.abs(quarters[0]?.operatingCashFlow || 0);
  const firstPrice = profile.price || 100;
  const unitsAreMillion = firstCfo > 0 && firstCfo < firstPrice * 1000;
  const unitsLabel = unitsAreMillion ? "USDm" : "USD";
  const unitMultiplier = unitsAreMillion ? 1e6 : 1;

  // Calculate quarterly FCF per share for last 4 quarters
  for (let i = 0; i < 4; i++) {
    const q = quarters[i];
    
    // Get CFO (operating cash flow)
    let cfo = q.operatingCashFlow || 0;
    
    // Get CapEx (capital expenditures) - handle negative values
    let capex = q.capitalExpenditure || 0;
    // CapEx is usually negative in cash flow statement, make it positive
    if (capex > 0) {
      capex = -capex;
    }
    capex = Math.abs(capex);
    
    // Calculate quarterly FCF
    const fcfQ = (cfo * unitMultiplier) - (capex * unitMultiplier);
    
    // Get diluted weighted average shares for this quarter
    const shares = q.weightedAverageShsOutDil || 0;
    
    if (shares <= 0) {
      console.warn(`Quarter ${i}: No diluted shares data, skipping`);
      continue;
    }
    
    // Calculate FCF per share for this quarter
    const fcfPsQ = fcfQ / shares;
    fcfPsQuarters.push(parseFloat(fcfPsQ.toFixed(2)));
    dilutedSharesQuarters.push(shares);
    
    // Accumulate for TTM
    cfoTtm += cfo * unitMultiplier;
    capexTtm += capex * unitMultiplier;
    fcfTtm += fcfQ;
  }

  // TTM FCF per share is the sum of quarterly FCF per share
  const fcfPerShareTtm = fcfPsQuarters.reduce((sum, v) => sum + v, 0);

  // Sanity checks
  let suspiciousUnits = false;
  let sharesMismatch = false;

  // Check 1: If |fcfPerShareTtm| > price * 2, units are probably wrong
  if (Math.abs(fcfPerShareTtm) > firstPrice * 2) {
    suspiciousUnits = true;
    console.warn(`Suspicious units detected: FCF/Share TTM (${fcfPerShareTtm}) > Price * 2 (${firstPrice * 2})`);
  }

  // Check 2: If FCF_TTM / (Revenue or Market Cap) > 80%, suspicious
  const marketCap = profile.mktCap || 0;
  if (marketCap > 0 && Math.abs(fcfTtm) / marketCap > 0.8) {
    suspiciousUnits = true;
    console.warn(`Suspicious units: FCF_TTM / Market Cap > 80%`);
  }

  // Check 3: Shares mismatch - average quarterly shares should be close to annual
  if (annualShares > 0) {
    const avgQuarterlyShares = dilutedSharesQuarters.reduce((a, b) => a + b, 0) / Math.max(1, dilutedSharesQuarters.length);
    const diff = Math.abs(avgQuarterlyShares - annualShares) / annualShares;
    if (diff > 0.05) {
      sharesMismatch = true;
      console.warn(`Shares mismatch: Quarterly avg (${avgQuarterlyShares}) vs Annual (${annualShares}), diff: ${(diff * 100).toFixed(1)}%`);
    }
  }

  console.log(`FCF per Share (quarterly TTM): ${fcfPerShareTtm.toFixed(2)}`);
  console.log(`CFO TTM: ${cfoTtm.toFixed(2)}, CapEx TTM: ${capexTtm.toFixed(2)}, FCF TTM: ${fcfTtm.toFixed(2)}`);
  console.log(`Quarterly FCF/Share: [${fcfPsQuarters.join(', ')}]`);

  return {
    fcfPerShareTtm,
    diagnostics: {
      cfo_ttm: parseFloat(cfoTtm.toFixed(2)),
      capex_ttm: parseFloat(capexTtm.toFixed(2)),
      fcf_ttm: parseFloat(fcfTtm.toFixed(2)),
      fcf_ps_q: fcfPsQuarters,
      fcf_ps_ttm: parseFloat(fcfPerShareTtm.toFixed(2)),
      diluted_shares_q: dilutedSharesQuarters,
      units: { cashflow: unitsLabel },
      suspicious_units: suspiciousUnits,
      shares_mismatch: sharesMismatch
    }
  };
}

// Calculate historical FCF per Share growth rate (10Y CAGR from annuals)
async function calculateFcfPerShareGrowthRate(ticker: string, profile: any): Promise<number> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) throw new Error('FMP_API_KEY not configured');

  // Fetch annual cash flow statements
  const res = await fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=annual&limit=11&apikey=${FMP_API_KEY}`);
  if (!res.ok) return 0;
  
  const annuals = await res.json();
  if (!Array.isArray(annuals) || annuals.length < 4) return 0;

  // Detect units
  const firstCfo = Math.abs(annuals[0]?.operatingCashFlow || 0);
  const firstPrice = profile.price || 100;
  const unitsAreMillion = firstCfo > 0 && firstCfo < firstPrice * 1000;
  const unitMultiplier = unitsAreMillion ? 1e6 : 1;

  // Calculate FCF per share for each year
  const fcfPsValues: number[] = [];
  
  for (const year of annuals) {
    const cfo = (year.operatingCashFlow || 0) * unitMultiplier;
    let capex = year.capitalExpenditure || 0;
    if (capex > 0) capex = -capex;
    capex = Math.abs(capex) * unitMultiplier;
    
    const shares = year.weightedAverageShsOutDil || 0;
    if (shares <= 0) continue;
    
    const fcfPs = (cfo - capex) / shares;
    if (fcfPs > 0) {
      fcfPsValues.push(fcfPs);
    }
  }

  // Try 10Y CAGR first
  if (fcfPsValues.length >= 11) {
    const startFcf = fcfPsValues[10];
    const endFcf = fcfPsValues[0];
    const cagr = (Math.pow(endFcf / startFcf, 1 / 10) - 1) * 100;
    console.log(`Using 10Y FCF/Share CAGR: ${cagr.toFixed(2)}%`);
    return parseFloat(cagr.toFixed(2));
  }
  
  // Fallback to 5Y CAGR
  if (fcfPsValues.length >= 6) {
    const startFcf = fcfPsValues[5];
    const endFcf = fcfPsValues[0];
    const cagr = (Math.pow(endFcf / startFcf, 1 / 5) - 1) * 100;
    console.log(`Using 5Y FCF/Share CAGR: ${cagr.toFixed(2)}%`);
    return parseFloat(cagr.toFixed(2));
  }
  
  // Fallback to 3Y CAGR
  if (fcfPsValues.length >= 4) {
    const startFcf = fcfPsValues[3];
    const endFcf = fcfPsValues[0];
    const cagr = (Math.pow(endFcf / startFcf, 1 / 3) - 1) * 100;
    console.log(`Using 3Y FCF/Share CAGR: ${cagr.toFixed(2)}%`);
    return parseFloat(cagr.toFixed(2));
  }
  
  // Default
  console.log('Not enough FCF/Share data for CAGR, using 0% default');
  return 0;
}

// Calculate starting value based on mode with smoothing
function calculateStartValue(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  const profile = data.profile;
  const metrics = data.metrics;
  
  const sharesOutstanding = profile.sharesOutstanding || 1;
  
  if (mode === 'EPS_WO_NRI') {
    // This will be calculated separately using quarterly data
    return 0; // Placeholder, will be replaced in main function
  }
  
  if (mode === 'FCF_PER_SHARE') {
    // This will be calculated separately using quarterly data
    return 0; // Placeholder, will be replaced in main function
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

// Calculate historical growth rate (10Y CAGR preferred, fallback to 5Y, then 3Y)
function calculateGrowthRate(mode: BasisMode, data: any): number {
  const income = data.income;
  const cashFlow = data.cashFlow;
  
  if (mode === 'EPS_WO_NRI') {
    // Get EPS values for up to 11 years (10Y CAGR needs 11 data points)
    const epsValues = income.slice(0, 11)
      .map((i: any) => i.eps || i.epsdiluted || 0)
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (epsValues.length >= 11) {
      const startEps = epsValues[10];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 10) - 1) * 100;
      console.log(`Using 10Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (epsValues.length >= 6) {
      const startEps = epsValues[5];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 5) - 1) * 100;
      console.log(`Using 5Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (epsValues.length >= 4) {
      const startEps = epsValues[3];
      const endEps = epsValues[0];
      const cagr = (Math.pow(endEps / startEps, 1 / 3) - 1) * 100;
      console.log(`Using 3Y EPS CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough EPS data for CAGR, using 5% default');
    return 5;
  }
  
  if (mode === 'FCF_PER_SHARE') {
    const profile = data.profile;
    const sharesOutstanding = profile.sharesOutstanding || 1;
    const fcfValues = cashFlow.slice(0, 11)
      .map((cf: any) => (cf.freeCashFlow || 0) / sharesOutstanding)
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (fcfValues.length >= 11) {
      const startFcf = fcfValues[10];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 10) - 1) * 100;
      console.log(`Using 10Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (fcfValues.length >= 6) {
      const startFcf = fcfValues[5];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 5) - 1) * 100;
      console.log(`Using 5Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (fcfValues.length >= 4) {
      const startFcf = fcfValues[3];
      const endFcf = fcfValues[0];
      const cagr = (Math.pow(endFcf / startFcf, 1 / 3) - 1) * 100;
      console.log(`Using 3Y FCF CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough FCF data for CAGR, using 4% default');
    return 4;
  }
  
  if (mode === 'ADJUSTED_DIVIDEND') {
    // Calculate historical dividend growth using same approach
    const metrics = data.metrics;
    const currentDivPerShare = metrics?.dividendPerShareTTM || 0;
    
    // Get historical dividends from income statements
    const divValues = income.slice(0, 11)
      .map((i: any) => {
        const shares = data.profile.sharesOutstanding || 1;
        return (i.dividendsPaid ? Math.abs(i.dividendsPaid) / shares : 0);
      })
      .filter((v: number) => v > 0);
    
    // Try 10Y CAGR first
    if (divValues.length >= 11 && currentDivPerShare > 0) {
      const startDiv = divValues[10];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 10) - 1) * 100;
      console.log(`Using 10Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 5Y CAGR
    if (divValues.length >= 6 && currentDivPerShare > 0) {
      const startDiv = divValues[5];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 5) - 1) * 100;
      console.log(`Using 5Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // Fallback to 3Y CAGR
    if (divValues.length >= 4 && currentDivPerShare > 0) {
      const startDiv = divValues[3];
      const endDiv = currentDivPerShare;
      const cagr = (Math.pow(endDiv / startDiv, 1 / 3) - 1) * 100;
      console.log(`Using 3Y Dividend CAGR: ${cagr.toFixed(2)}%`);
      return parseFloat(cagr.toFixed(2));
    }
    
    // If not enough data, return conservative default
    console.log('Not enough Dividend data for CAGR, using 5% default');
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
    let startValue = calculateStartValue(mode, data);
    let fcfDiagnostics: any = undefined;
    let growthRate = 0;
    
    // For EPS_WO_NRI, use quarterly calculation
    if (mode === 'EPS_WO_NRI') {
      startValue = await calculateEpsWoNri(ticker);
      console.log(`EPS w/o NRI (TTM): ${startValue.toFixed(2)}`);
      growthRate = calculateGrowthRate(mode, data);
    } else if (mode === 'FCF_PER_SHARE') {
      // Use new FCF per share calculation with diagnostics
      const fcfResult = await calculateFcfPerShare(ticker, data.profile);
      startValue = fcfResult.fcfPerShareTtm;
      fcfDiagnostics = fcfResult.diagnostics;
      
      // If negative TTM but we have positive 3Y median from annuals, use that
      if (startValue <= 0) {
        const annualFcfData = data.cashFlow.slice(0, 3);
        const fcfPsAnnual = annualFcfData.map((cf: any) => {
          const cfo = cf.operatingCashFlow || 0;
          let capex = cf.capitalExpenditure || 0;
          if (capex > 0) capex = -capex;
          capex = Math.abs(capex);
          const shares = cf.weightedAverageShsOutDil || 1;
          return (cfo - capex) / shares;
        }).filter((v: number) => v > 0);
        
        if (fcfPsAnnual.length >= 2) {
          startValue = median(fcfPsAnnual);
          console.log(`Using 3Y median FCF/Share instead of negative TTM: ${startValue.toFixed(2)}`);
        }
      }
      
      console.log(`FCF per Share (TTM): ${startValue.toFixed(2)}`);
      
      // Calculate growth rate using FCF per share annuals
      growthRate = await calculateFcfPerShareGrowthRate(ticker, data.profile);
    } else {
      growthRate = calculateGrowthRate(mode, data);
    }
    
    console.log(`Start value for mode ${mode}: ${startValue.toFixed(2)}`);
    console.log(`Calculated growth rate: ${growthRate.toFixed(2)}%`);
    
    // Warnings array for data quality issues
    const warnings: string[] = [];
    
    if (startValue <= 0) {
      warnings.push(`Keine ausreichenden Daten für Modus ${mode}. Berechnung mit konservativen Annahmen.`);
      // Don't throw error, continue with warning
    }
    
    // Check for suspicious units warning
    if (fcfDiagnostics?.suspicious_units) {
      warnings.push('Einheiten prüfen (vermutlich Mio ↔ $ vertauscht).');
    }
    
    if (fcfDiagnostics?.shares_mismatch) {
      warnings.push('Abweichung zwischen quartalsweisen und jährlichen Aktienzahlen.');
    }
    
    // Use a minimum start value if needed
    const effectiveStartValue = Math.max(startValue, 0.01);
    
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
    
    // Margin of safety (MoS = (Fair Value - Price) / Fair Value × 100%)
    const marginOfSafety = ((result.fairValue - currentPrice) / result.fairValue) * 100;
    
    const response: ValuationResponse = {
      ticker: ticker.toUpperCase(),
      price: currentPrice,
      mode,
      fairValuePerShare: parseFloat(result.fairValue.toFixed(2)),
      marginOfSafetyPct: parseFloat(marginOfSafety.toFixed(2)),
      assumptions: {
        discountRatePct: parseFloat(wacc.toFixed(2)),
        growthYears,
        growthRatePct: parseFloat(growthRate.toFixed(2)),
        terminalYears,
        terminalRatePct: parseFloat(terminalRate.toFixed(2)),
        tangibleBookPerShare: parseFloat(tangibleBook.toFixed(2)),
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
    
    // Add diagnostics for FCF mode
    if (fcfDiagnostics) {
      response.diagnostics = fcfDiagnostics;
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
