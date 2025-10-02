import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationRequest {
  ticker: string;
  mode: 'EPS_WO_NRI' | 'FCF' | 'ADJUSTED_DIVIDEND';
}

interface FMPProfile {
  symbol: string;
  price: number;
  mktCap: number;
  beta: number;
}

interface FMPIncomeStatement {
  epsdiluted: number;
  incometaxexpense: number;
  ebit: number;
}

interface FMPCashFlow {
  operatingcashflow: number;
  capitalexpenditure: number;
  dividendspaid: number;
  commonStockRepurchased: number;
}

interface FMPBalanceSheet {
  shorttermdebt: number;
  longtermdebt: number;
  totalassets: number;
  totalliabilities: number;
}

interface FMPKeyMetrics {
  debttoequity: number;
  roic: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, mode }: ValuationRequest = await req.json();

    if (!ticker || !mode) {
      return new Response(
        JSON.stringify({ error: 'INVALID_MODE', details: 'Missing ticker or mode' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get FMP API Key
    const { data: keyData, error: keyError } = await supabaseClient.functions.invoke('get-fmp-key');
    if (keyError || !keyData?.apiKey) {
      throw new Error('Failed to fetch FMP API key');
    }
    const API_KEY = keyData.apiKey;

    // Fetch all required data from FMP
    const [profileRes, incomeRes, cashFlowRes, balanceRes, metricsRes, treasuryRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=annual&limit=5&apikey=${API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?period=annual&limit=5&apikey=${API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?period=quarter&limit=4&apikey=${API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v4/treasury?from=2024-01-01&to=2025-12-31&apikey=${API_KEY}`)
    ]);

    const profile: FMPProfile[] = await profileRes.json();
    const incomeStatements: FMPIncomeStatement[] = await incomeRes.json();
    const cashFlows: FMPCashFlow[] = await cashFlowRes.json();
    const balanceSheets: FMPBalanceSheet[] = await balanceRes.json();
    const metrics: FMPKeyMetrics[] = await metricsRes.json();
    const treasuryData = await treasuryRes.json();

    if (!profile[0] || !incomeStatements[0] || !cashFlows[0] || !balanceSheets[0]) {
      return new Response(
        JSON.stringify({ error: 'INSUFFICIENT_DATA', details: 'Missing core financial data' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentProfile = profile[0];
    const ttmIncome = incomeStatements[0];
    const ttmCashFlow = cashFlows[0];
    const currentMetrics = metrics[0];

    // Calculate shares outstanding (from market cap / price)
    const sharesOutstanding = currentProfile.mktCap / currentProfile.price;
    if (sharesOutstanding <= 0) {
      return new Response(
        JSON.stringify({ error: 'INSUFFICIENT_DATA', details: 'Invalid shares outstanding' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate average debt from last 4 quarters
    const avgDebt4Q = balanceSheets.reduce((sum, bs) => 
      sum + (bs.shorttermdebt + bs.longtermdebt), 0) / balanceSheets.length;

    // Calculate Rd (cost of debt)
    const interestExpense = Math.abs(ttmIncome.ebit - ttmIncome.incometaxexpense);
    const rd = avgDebt4Q > 1 ? Math.max(0, interestExpense / avgDebt4Q) : 0;

    // Tax rate
    const taxRate = Math.min(0.5, Math.max(0, ttmIncome.incometaxexpense / Math.max(1, ttmIncome.ebit)));

    // Risk-free rate (10Y Treasury)
    const rf = treasuryData && treasuryData.length > 0 ? treasuryData[0].year10 / 100 : 0.04;

    // Beta (clamped)
    const beta = Math.min(2.5, Math.max(0.5, currentProfile.beta || 1.0));

    // CAPM: Re = rf + beta * MRP
    const mrp = 0.06; // 6% Market Risk Premium
    const re = rf + beta * mrp;

    // WACC calculation
    const E = currentProfile.mktCap;
    const D = avgDebt4Q;
    const V = E + D;
    const wacc = V > 0 ? (E / V) * re + (D / V) * rd * (1 - taxRate) : re;
    const waccClamped = Math.min(0.12, Math.max(0.08, wacc));

    // Calculate start value per share based on mode
    let startValuePerShare = 0;
    let growthRate = 0.08; // Default 8%

    if (mode === 'EPS_WO_NRI') {
      startValuePerShare = ttmIncome.epsdiluted;
      // Calculate 5Y CAGR of EPS if available
      if (incomeStatements.length >= 5) {
        const oldEPS = incomeStatements[4].epsdiluted;
        if (oldEPS > 0 && startValuePerShare > 0) {
          growthRate = Math.pow(startValuePerShare / oldEPS, 1 / 5) - 1;
        }
      }
    } else if (mode === 'FCF') {
      const fcfTTM = ttmCashFlow.operatingcashflow - Math.abs(ttmCashFlow.capitalexpenditure);
      startValuePerShare = fcfTTM / sharesOutstanding;
      
      // If TTM FCF is negative, try 3Y median
      if (startValuePerShare <= 0 && cashFlows.length >= 3) {
        const fcfValues = cashFlows.slice(0, 3).map(cf => 
          (cf.operatingcashflow - Math.abs(cf.capitalexpenditure)) / sharesOutstanding
        );
        fcfValues.sort((a, b) => a - b);
        const median = fcfValues[1];
        if (median > 0) {
          startValuePerShare = median;
        }
      }

      // Calculate 5Y CAGR of FCF if available
      if (cashFlows.length >= 5) {
        const oldFCF = (cashFlows[4].operatingcashflow - Math.abs(cashFlows[4].capitalexpenditure)) / sharesOutstanding;
        if (oldFCF > 0 && startValuePerShare > 0) {
          growthRate = Math.pow(startValuePerShare / oldFCF, 1 / 5) - 1;
        }
      }
    } else if (mode === 'ADJUSTED_DIVIDEND') {
      const divPerShare = Math.abs(ttmCashFlow.dividendspaid) / sharesOutstanding;
      const buybackPerShare = Math.abs(ttmCashFlow.commonStockRepurchased) / sharesOutstanding;
      startValuePerShare = divPerShare + buybackPerShare;

      // Calculate 5Y CAGR of adjusted dividend if available
      if (cashFlows.length >= 5) {
        const oldDiv = Math.abs(cashFlows[4].dividendspaid) / sharesOutstanding;
        const oldBuyback = Math.abs(cashFlows[4].commonStockRepurchased) / sharesOutstanding;
        const oldTotal = oldDiv + oldBuyback;
        if (oldTotal > 0 && startValuePerShare > 0) {
          growthRate = Math.pow(startValuePerShare / oldTotal, 1 / 5) - 1;
        }
      }
    }

    // Clamp growth rate
    growthRate = Math.min(0.15, Math.max(0, growthRate));

    if (startValuePerShare <= 0) {
      return new Response(
        JSON.stringify({ error: 'INSUFFICIENT_DATA', details: `No positive ${mode} value found` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate Fair Value using 2-phase model
    const growthYears = 10;
    const terminalYears = 10;
    const terminalRate = 0.04;

    let pvPhase1 = 0;
    let currentValue = startValuePerShare;

    // Phase 1: Growth years
    for (let t = 1; t <= growthYears; t++) {
      currentValue = currentValue * (1 + growthRate);
      pvPhase1 += currentValue / Math.pow(1 + waccClamped, t);
    }

    // Phase 2: Terminal years
    let pvPhase2 = 0;
    for (let t = 1; t <= terminalYears; t++) {
      currentValue = currentValue * (1 + terminalRate);
      pvPhase2 += currentValue / Math.pow(1 + waccClamped, growthYears + t);
    }

    // Calculate Tangible Book Value per share
    const tangibleAssets = balanceSheets[0].totalassets - balanceSheets[0].totalliabilities;
    const tangibleBookPerShare = tangibleAssets / sharesOutstanding;
    const includeTangibleBook = false; // Default to false
    const tangibleBookAdded = includeTangibleBook && tangibleBookPerShare > 0 ? tangibleBookPerShare : 0;

    const fairValuePerShare = pvPhase1 + pvPhase2 + tangibleBookAdded;
    const marginOfSafetyPct = ((fairValuePerShare - currentProfile.price) / currentProfile.price) * 100;

    // Determine predictability based on ROIC consistency
    let predictability: 'low' | 'medium' | 'high' = 'medium';
    if (currentMetrics?.roic > 0.15) {
      predictability = 'high';
    } else if (currentMetrics?.roic < 0.05) {
      predictability = 'low';
    }

    const response = {
      ticker: ticker.toUpperCase(),
      price: currentProfile.price,
      mode,
      fairValuePerShare: Math.round(fairValuePerShare * 100) / 100,
      marginOfSafetyPct: Math.round(marginOfSafetyPct * 100) / 100,
      assumptions: {
        discountRatePct: Math.round(waccClamped * 1000) / 10,
        growthYears,
        growthRatePct: Math.round(growthRate * 1000) / 10,
        terminalYears,
        terminalRatePct: Math.round(terminalRate * 1000) / 10,
        tangibleBookPerShare: Math.round(tangibleBookPerShare * 100) / 100,
        includeTangibleBook,
        predictability
      },
      components: {
        startValuePerShare: Math.round(startValuePerShare * 100) / 100,
        pvPhase1: Math.round(pvPhase1 * 100) / 100,
        pvPhase2: Math.round(pvPhase2 * 100) / 100,
        tangibleBookAdded: Math.round(tangibleBookAdded * 100) / 100
      },
      asOf: new Date().toISOString().split('T')[0]
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Valuation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'API_ERROR', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
