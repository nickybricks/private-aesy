import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PopulateRequest {
  ticker: string;
  forceRefresh?: boolean;
  maxQuarters?: number;
}

interface QuarterData {
  date: string;
  period: string;
  calendarYear: number;
  reportedCurrency: string;
  fillingDate: string;
  
  // Income Statement
  netIncome?: number;
  revenue?: number;
  ebit?: number;
  ebitda?: number;
  eps?: number;
  epsdiluted?: number;
  interestExpense?: number;
  incomeBeforeTax?: number;
  incomeTaxExpense?: number;
  unusualItems?: number;
  goodwillImpairment?: number;
  impairmentOfAssets?: number;
  restructuringCharges?: number;
  depreciationAndAmortization?: number;
  
  // Balance Sheet
  totalEquity?: number;
  totalAssets?: number;
  totalCurrentAssets?: number;
  totalDebt?: number;
  shortTermDebt?: number;
  longTermDebt?: number;
  totalCurrentLiabilities?: number;
  cashAndCashEquivalents?: number;
  
  // Cash Flow
  operatingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditure?: number;
  commonStockRepurchased?: number;
  commonStockIssued?: number;
  dividendsPaid?: number;
  
  // Shares
  weightedAverageShsOutDil?: number;
  
  // Raw data
  rawIncome?: any;
  rawBalance?: any;
  rawCashflow?: any;
}

async function getFMPKey(): Promise<string> {
  const FMP_API_KEY = Deno.env.get('FMP_API_KEY');
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }
  return FMP_API_KEY;
}

// Helper to get historical FX rate
async function getHistoricalFxRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string,
  date: string,
  apiKey: string
): Promise<number> {
  // 1. Try from exchange_rates table
  const { data } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', fromCurrency)
    .eq('target_currency', toCurrency)
    .lte('created_at', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (data?.rate) {
    console.log(`Found FX rate from cache: ${fromCurrency}${toCurrency} = ${data.rate}`);
    return data.rate;
  }
  
  // 2. Fallback: FMP Historical Forex
  try {
    const fxUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${fromCurrency}${toCurrency}?from=${date}&to=${date}&apikey=${apiKey}`;
    const fxRes = await fetch(fxUrl);
    const fxData = await fxRes.json();
    
    if (fxData?.historical?.[0]?.close) {
      console.log(`Found FX rate from FMP: ${fromCurrency}${toCurrency} = ${fxData.historical[0].close}`);
      return fxData.historical[0].close;
    }
  } catch (err) {
    console.warn(`Failed to fetch historical FX rate: ${err.message}`);
  }
  
  // 3. Use 1.0 as fallback (same currency or error)
  console.warn(`Using 1.0 for FX rate ${fromCurrency}${toCurrency} on ${date}`);
  return 1.0;
}

// Helper to get quarter-end stock price
async function getQuarterEndPrice(
  ticker: string,
  fiscalDate: string,
  apiKey: string
): Promise<{ price: number | null; priceDate: string | null }> {
  try {
    const startDate = new Date(fiscalDate);
    startDate.setDate(startDate.getDate() - 5);
    
    const endDate = new Date(fiscalDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}&apikey=${apiKey}`;
    const res = await fetch(url);
    const priceData = await res.json();
    
    const prices = priceData.historical?.filter((p: any) => p.date <= fiscalDate) || [];
    if (prices.length === 0) {
      console.warn(`No price data found for ${ticker} near ${fiscalDate}`);
      return { price: null, priceDate: null };
    }
    
    prices.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { price: prices[0].close, priceDate: prices[0].date };
  } catch (err) {
    console.error(`Error fetching quarter-end price: ${err.message}`);
    return { price: null, priceDate: null };
  }
}

// Calculate EPS w/o NRI (simplified version)
function calculateEpsWoNri(quarter: QuarterData): number | null {
  const niCont = quarter.netIncome || 0;
  const preTax = quarter.incomeBeforeTax || 0;
  const tax = quarter.incomeTaxExpense || 0;
  const shares = quarter.weightedAverageShsOutDil || 0;
  
  if (shares <= 0) return null;
  
  // Calculate tax rate
  const taxRate = (preTax > 0 && tax > 0) ? Math.min(Math.max(tax / preTax, 0), 0.5) : 0.21;
  
  // Get unusuals (pretax)
  const unusualPretax = (quarter.unusualItems || 0) + 
                        (quarter.goodwillImpairment || 0) + 
                        (quarter.impairmentOfAssets || 0) +
                        (quarter.restructuringCharges || 0);
  
  const unusualAfterTax = unusualPretax * (1 - taxRate);
  
  // Calculate NI w/o NRI
  const niWoNri = niCont - unusualAfterTax;
  
  return niWoNri / shares;
}

// Assess data quality
function assessDataQuality(quarter: QuarterData): { score: number; missingFields: string[] } {
  const criticalFields = [
    'revenue', 'netIncome', 'totalAssets', 'totalEquity', 
    'operatingCashFlow', 'ebitda', 'eps', 'weightedAverageShsOutDil'
  ];
  
  const importantFields = [
    'freeCashFlow', 'capitalExpenditure', 'totalDebt', 'totalCurrentAssets', 
    'totalCurrentLiabilities', 'ebit', 'interestExpense'
  ];
  
  const missingCritical = criticalFields.filter(f => 
    !(quarter as any)[f] && (quarter as any)[f] !== 0
  );
  const missingImportant = importantFields.filter(f => 
    !(quarter as any)[f] && (quarter as any)[f] !== 0
  );
  
  const score = 100 - (missingCritical.length * 20) - (missingImportant.length * 5);
  
  return {
    score: Math.max(0, score),
    missingFields: [...missingCritical, ...missingImportant]
  };
}

// Merge financial data by fiscal date
function mergeByFiscalDate(income: any[], balance: any[], cashflow: any[]): QuarterData[] {
  const quarterMap = new Map<string, QuarterData>();
  
  // Process income statements
  for (const i of income) {
    const date = i.date;
    if (!quarterMap.has(date)) {
      quarterMap.set(date, {
        date,
        period: i.period || 'Q1',
        calendarYear: i.calendarYear || new Date(date).getFullYear(),
        reportedCurrency: i.reportedCurrency || 'USD',
        fillingDate: i.fillingDate || date,
        rawIncome: i
      });
    }
    const q = quarterMap.get(date)!;
    q.netIncome = i.netIncome;
    q.revenue = i.revenue;
    q.ebit = i.operatingIncome;
    q.ebitda = i.ebitda;
    q.eps = i.eps;
    q.epsdiluted = i.epsdiluted;
    q.interestExpense = i.interestExpense;
    q.incomeBeforeTax = i.incomeBeforeTax;
    q.incomeTaxExpense = i.incomeTaxExpense;
    q.weightedAverageShsOutDil = i.weightedAverageShsOutDil;
    q.depreciationAndAmortization = i.depreciationAndAmortization;
    
    // Non-recurring items
    q.unusualItems = i.otherNonOperatingIncomeExpenses;
    q.goodwillImpairment = 0;
    q.impairmentOfAssets = 0;
    q.restructuringCharges = 0;
  }
  
  // Process balance sheets
  for (const b of balance) {
    const date = b.date;
    if (!quarterMap.has(date)) continue;
    const q = quarterMap.get(date)!;
    q.totalEquity = b.totalStockholdersEquity;
    q.totalAssets = b.totalAssets;
    q.totalCurrentAssets = b.totalCurrentAssets;
    q.totalDebt = b.totalDebt;
    q.shortTermDebt = b.shortTermDebt;
    q.longTermDebt = b.longTermDebt;
    q.totalCurrentLiabilities = b.totalCurrentLiabilities;
    q.cashAndCashEquivalents = b.cashAndCashEquivalents;
    q.rawBalance = b;
  }
  
  // Process cash flow statements
  for (const c of cashflow) {
    const date = c.date;
    if (!quarterMap.has(date)) continue;
    const q = quarterMap.get(date)!;
    q.operatingCashFlow = c.operatingCashFlow;
    q.freeCashFlow = c.freeCashFlow;
    q.capitalExpenditure = c.capitalExpenditure;
    q.commonStockRepurchased = c.commonStockRepurchased;
    q.commonStockIssued = c.commonStockIssued;
    q.dividendsPaid = c.dividendsPaid;
    q.rawCashflow = c;
  }
  
  return Array.from(quarterMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { ticker, forceRefresh = false, maxQuarters = 120 }: PopulateRequest = await req.json();
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing ticker parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Populate request: ${ticker}, forceRefresh=${forceRefresh}, maxQuarters=${maxQuarters}`);
    
    // Check if data is fresh
    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from('financial_data_quarterly')
        .select('updated_at')
        .eq('symbol', ticker.toUpperCase())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        const hoursSinceUpdate = (Date.now() - new Date(existing.updated_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          console.log(`Data is fresh (${hoursSinceUpdate.toFixed(1)}h old), skipping`);
          return new Response(
            JSON.stringify({ cached: true, message: 'Data is fresh', ticker: ticker.toUpperCase() }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    const apiKey = await getFMPKey();
    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
    
    // Fetch financial data
    console.log('Fetching financial data from FMP...');
    const [incomeRes, balanceRes, cashflowRes, profileRes] = await Promise.all([
      fetch(`${FMP_BASE}/income-statement/${ticker}?period=quarter&limit=${maxQuarters}&apikey=${apiKey}`),
      fetch(`${FMP_BASE}/balance-sheet-statement/${ticker}?period=quarter&limit=${maxQuarters}&apikey=${apiKey}`),
      fetch(`${FMP_BASE}/cash-flow-statement/${ticker}?period=quarter&limit=${maxQuarters}&apikey=${apiKey}`),
      fetch(`${FMP_BASE}/profile/${ticker}?apikey=${apiKey}`)
    ]);
    
    if (!incomeRes.ok || !balanceRes.ok || !cashflowRes.ok || !profileRes.ok) {
      throw new Error('Failed to fetch financial data from FMP');
    }
    
    const [incomeData, balanceData, cashflowData, profileData] = await Promise.all([
      incomeRes.json(),
      balanceRes.json(),
      cashflowRes.json(),
      profileRes.json()
    ]);
    
    if (!Array.isArray(incomeData) || incomeData.length === 0) {
      throw new Error('No income statement data found');
    }
    
    console.log(`Fetched ${incomeData.length} quarters of data`);
    
    // Merge data by fiscal date
    const quarters = mergeByFiscalDate(incomeData, balanceData, cashflowData);
    
    console.log(`Merged into ${quarters.length} quarters`);
    
    // Process each quarter
    const recordsToUpsert = [];
    
    for (const q of quarters) {
      // Get FX rate
      const fxRate = await getHistoricalFxRate(
        supabase,
        q.reportedCurrency,
        'USD',
        q.date,
        apiKey
      );
      
      // Calculate EPS w/o NRI
      const epsWoNri = calculateEpsWoNri(q);
      
      // Calculate smoothed tax rate (simplified - just use current quarter)
      const taxRate = (q.incomeBeforeTax && q.incomeTaxExpense && q.incomeBeforeTax > 0)
        ? Math.min(Math.max(q.incomeTaxExpense / q.incomeBeforeTax, 0), 0.5)
        : 0.21;
      
      // Calculate NOPAT
      const nopat = q.ebit ? q.ebit * (1 - taxRate) : null;
      
      // Calculate Invested Capital (simplified)
      const investedCapital = q.totalAssets && q.cashAndCashEquivalents && q.totalCurrentLiabilities
        ? q.totalAssets - q.cashAndCashEquivalents - q.totalCurrentLiabilities
        : null;
      
      // Get quarter-end price
      const { price, priceDate } = await getQuarterEndPrice(ticker, q.date, apiKey);
      
      // Assess data quality
      const { score, missingFields } = assessDataQuality(q);
      
      // Book value per share
      const bookValuePerShare = (q.totalEquity && q.weightedAverageShsOutDil && q.weightedAverageShsOutDil > 0)
        ? q.totalEquity / q.weightedAverageShsOutDil
        : null;
      
      // Dividend per share
      const dividendPerShare = (q.dividendsPaid && q.weightedAverageShsOutDil && q.weightedAverageShsOutDil > 0)
        ? Math.abs(q.dividendsPaid) / q.weightedAverageShsOutDil
        : null;
      
      recordsToUpsert.push({
        symbol: ticker.toUpperCase(),
        fiscal_date: q.date,
        calendar_year: q.calendarYear,
        period: q.period,
        is_ttm: false,
        reported_currency: q.reportedCurrency,
        fx_rate_to_usd: fxRate,
        
        // Income Statement
        net_income: q.netIncome,
        revenue: q.revenue,
        ebit: q.ebit,
        ebitda: q.ebitda,
        eps: q.eps,
        eps_diluted: q.epsdiluted,
        eps_wo_nri: epsWoNri,
        interest_expense: q.interestExpense,
        income_before_tax: q.incomeBeforeTax,
        income_tax_expense: q.incomeTaxExpense,
        unusual_items: q.unusualItems,
        goodwill_impairment: q.goodwillImpairment,
        impairment_of_assets: q.impairmentOfAssets,
        restructuring_charges: q.restructuringCharges,
        
        // Balance Sheet
        total_equity: q.totalEquity,
        total_assets: q.totalAssets,
        current_assets: q.totalCurrentAssets,
        total_debt: q.totalDebt,
        short_term_debt: q.shortTermDebt,
        long_term_debt: q.longTermDebt,
        current_liabilities: q.totalCurrentLiabilities,
        cash_and_equivalents: q.cashAndCashEquivalents,
        book_value_per_share: bookValuePerShare,
        
        // Cash Flow
        operating_cash_flow: q.operatingCashFlow,
        free_cash_flow: q.freeCashFlow,
        capex: q.capitalExpenditure,
        
        // Shares
        weighted_avg_shares_diluted: q.weightedAverageShsOutDil,
        dividend_per_share: dividendPerShare,
        
        // Market
        stock_price_close: price,
        stock_price_date: priceDate,
        
        // Calculated
        tax_rate: taxRate,
        nopat: nopat,
        invested_capital: investedCapital,
        wacc: null,
        
        // Quality
        data_quality_score: score,
        missing_fields: missingFields,
        fmp_filing_date: q.fillingDate,
        
        // Raw
        raw_data_income: q.rawIncome,
        raw_data_balance: q.rawBalance,
        raw_data_cashflow: q.rawCashflow,
        raw_data_profile: profileData[0]
      });
    }
    
    // Upsert all records
    console.log(`Upserting ${recordsToUpsert.length} records...`);
    const { error: upsertError } = await supabase
      .from('financial_data_quarterly')
      .upsert(recordsToUpsert, { onConflict: 'symbol,fiscal_date,is_ttm' });
    
    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }
    
    // Calculate and upsert TTM data
    const last4 = quarters.slice(0, 4);
    if (last4.length === 4) {
      console.log('Calculating TTM data...');
      
      const sum = (arr: any[], field: string) => 
        arr.reduce((acc, item) => acc + (item[field] || 0), 0);
      
      const ttmEpsWoNri = sum(last4, 'epsWoNri');
      const ttmTaxRate = sum(last4, 'incomeTaxExpense') / sum(last4, 'incomeBeforeTax');
      const ttmNetIncome = sum(last4, 'netIncome');
      
      const ttmRecord = {
        symbol: ticker.toUpperCase(),
        fiscal_date: last4[0].date,
        calendar_year: last4[0].calendarYear,
        period: 'TTM',
        is_ttm: true,
        reported_currency: last4[0].reportedCurrency,
        fx_rate_to_usd: last4[0].rawBalance?.fxRate || 1.0,
        
        // Flows: Sum
        net_income: ttmNetIncome,
        revenue: sum(last4, 'revenue'),
        ebit: sum(last4, 'ebit'),
        ebitda: sum(last4, 'ebitda'),
        eps_wo_nri: ttmEpsWoNri,
        operating_cash_flow: sum(last4, 'operatingCashFlow'),
        free_cash_flow: sum(last4, 'freeCashFlow'),
        capex: sum(last4, 'capitalExpenditure'),
        interest_expense: sum(last4, 'interestExpense'),
        income_before_tax: sum(last4, 'incomeBeforeTax'),
        income_tax_expense: sum(last4, 'incomeTaxExpense'),
        
        // Stocks: Latest
        total_equity: last4[0].totalEquity,
        total_assets: last4[0].totalAssets,
        current_assets: last4[0].totalCurrentAssets,
        total_debt: last4[0].totalDebt,
        cash_and_equivalents: last4[0].cashAndCashEquivalents,
        current_liabilities: last4[0].totalCurrentLiabilities,
        weighted_avg_shares_diluted: last4[0].weightedAverageShsOutDil,
        
        // EPS: Recalculate
        eps: ttmNetIncome / (last4[0].weightedAverageShsOutDil || 1),
        eps_diluted: ttmNetIncome / (last4[0].weightedAverageShsOutDil || 1),
        
        // Market
        stock_price_close: last4[0].rawBalance?.price,
        stock_price_date: last4[0].rawBalance?.priceDate,
        
        // Calculated
        tax_rate: ttmTaxRate,
        nopat: sum(last4, 'ebit') * (1 - ttmTaxRate),
        invested_capital: last4[0].rawBalance?.investedCapital,
        
        // Quality
        data_quality_score: Math.round(last4.reduce((acc, q) => acc + (assessDataQuality(q).score || 0), 0) / 4),
        missing_fields: [...new Set(last4.flatMap(q => assessDataQuality(q).missingFields))],
        
        // Raw
        raw_data_income: last4[0].rawIncome,
        raw_data_balance: last4[0].rawBalance,
        raw_data_cashflow: last4[0].rawCashflow,
        raw_data_profile: profileData[0]
      };
      
      const { error: ttmError } = await supabase
        .from('financial_data_quarterly')
        .upsert(ttmRecord, { onConflict: 'symbol,fiscal_date,is_ttm' });
      
      if (ttmError) {
        console.error('TTM upsert error:', ttmError);
      } else {
        console.log('TTM data upserted successfully');
      }
    }
    
    console.log(`Successfully populated ${recordsToUpsert.length} quarters for ${ticker}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        ticker: ticker.toUpperCase(),
        quartersPopulated: recordsToUpsert.length,
        ttmCalculated: last4.length === 4
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in populate-financial-data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
