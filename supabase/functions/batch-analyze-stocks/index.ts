import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  symbols: string[];
  marketId: string;
  forceRefresh?: boolean;
}

// Helper functions for calculations
function safeValue(value: any): number | null {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

function calculate5YearCAGR(values: number[]): number | null {
  if (values.length < 2) return null;
  const filtered = values.filter(v => v !== null && v > 0);
  if (filtered.length < 2) return null;
  
  const startValue = filtered[filtered.length - 1];
  const endValue = filtered[0];
  const years = filtered.length - 1;
  
  if (startValue <= 0) return null;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

function analyzeStock(rawData: any): any {
  const profile = rawData.profile?.[0];
  const quote = rawData.quote?.[0];
  const incomeStatements = rawData.incomeStatements || [];
  const balanceSheets = rawData.balanceSheets || [];
  const cashFlows = rawData.cashFlows || [];
  const keyMetrics = rawData.keyMetrics || [];
  const ratiosTTM = rawData.ratiosTTM?.[0];

  if (!profile || !quote) {
    return null;
  }

  let buffettScore = 0;
  const criteria: any = {};

  // 1. Years of Profitability
  const profitableYears = incomeStatements.slice(0, 10).filter((stmt: any) => 
    safeValue(stmt.netIncome) && safeValue(stmt.netIncome)! > 0
  ).length;
  criteria.yearsOfProfitability = {
    value: profitableYears,
    pass: profitableYears >= 7,
  };
  if (criteria.yearsOfProfitability.pass) buffettScore++;

  // 2. P/E Ratio
  const peRatio = safeValue(quote.pe) || safeValue(ratiosTTM?.priceEarningsRatio);
  criteria.peRatio = {
    value: peRatio,
    pass: peRatio !== null && peRatio > 0 && peRatio <= 15,
  };
  if (criteria.peRatio.pass) buffettScore++;

  // 3. ROIC
  const roic = safeValue(keyMetrics[0]?.roic) || safeValue(ratiosTTM?.returnOnInvestedCapital);
  criteria.roic = {
    value: roic ? roic * 100 : null,
    pass: roic !== null && roic >= 0.15,
  };
  if (criteria.roic.pass) buffettScore++;

  // 4. ROE
  const roe = safeValue(keyMetrics[0]?.roe) || safeValue(ratiosTTM?.returnOnEquity);
  criteria.roe = {
    value: roe ? roe * 100 : null,
    pass: roe !== null && roe >= 0.15,
  };
  if (criteria.roe.pass) buffettScore++;

  // 5. Dividend Yield
  const dividendYield = safeValue(quote.dividendYield) || safeValue(keyMetrics[0]?.dividendYield);
  criteria.dividendYield = {
    value: dividendYield ? dividendYield * 100 : null,
    pass: dividendYield !== null && dividendYield > 0,
  };
  if (criteria.dividendYield.pass) buffettScore++;

  // 6. EPS Growth
  const epsValues = incomeStatements.slice(0, 6).map((stmt: any) => 
    safeValue(stmt.eps) || safeValue(stmt.epsdiluted)
  ).filter((v: any) => v !== null);
  const epsGrowth = calculate5YearCAGR(epsValues);
  criteria.epsGrowth = {
    value: epsGrowth,
    pass: epsGrowth !== null && epsGrowth >= 7,
  };
  if (criteria.epsGrowth.pass) buffettScore++;

  // 7. Revenue Growth
  const revenueValues = incomeStatements.slice(0, 6).map((stmt: any) => 
    safeValue(stmt.revenue)
  ).filter((v: any) => v !== null);
  const revenueGrowth = calculate5YearCAGR(revenueValues);
  criteria.revenueGrowth = {
    value: revenueGrowth,
    pass: revenueGrowth !== null && revenueGrowth >= 5,
  };
  if (criteria.revenueGrowth.pass) buffettScore++;

  // 8. Net Debt to EBITDA
  const latestBalance = balanceSheets[0];
  const latestIncome = incomeStatements[0];
  const totalDebt = safeValue(latestBalance?.totalDebt);
  const cashAndEquivalents = safeValue(latestBalance?.cashAndCashEquivalents);
  const ebitda = safeValue(latestIncome?.operatingIncome);
  
  let netDebtToEbitda = null;
  if (totalDebt !== null && cashAndEquivalents !== null && ebitda !== null && ebitda > 0) {
    const netDebt = totalDebt - cashAndEquivalents;
    netDebtToEbitda = netDebt / ebitda;
  }
  criteria.netDebtToEbitda = {
    value: netDebtToEbitda,
    pass: netDebtToEbitda !== null && netDebtToEbitda < 3,
  };
  if (criteria.netDebtToEbitda.pass) buffettScore++;

  // 9. Net Margin
  const netMargin = safeValue(keyMetrics[0]?.netProfitMargin) || safeValue(ratiosTTM?.netProfitMargin);
  criteria.netMargin = {
    value: netMargin ? netMargin * 100 : null,
    pass: netMargin !== null && netMargin >= 0.10,
  };
  if (criteria.netMargin.pass) buffettScore++;

  // Calculate Intrinsic Value (simplified)
  const eps = safeValue(incomeStatements[0]?.epsdiluted);
  const bookValue = safeValue(keyMetrics[0]?.bookValuePerShare);
  let intrinsicValue = null;
  let marginOfSafety = null;

  if (eps && bookValue && eps > 0 && bookValue > 0) {
    const grahamNumber = Math.sqrt(22.5 * eps * bookValue);
    intrinsicValue = grahamNumber;
    if (quote.price > 0) {
      marginOfSafety = ((intrinsicValue - quote.price) / intrinsicValue) * 100;
    }
  }

  return {
    symbol: profile.symbol,
    companyName: profile.companyName,
    sector: profile.sector,
    exchange: profile.exchangeShortName,
    price: quote.price,
    currency: profile.currency,
    buffettScore,
    criteria,
    intrinsicValue,
    marginOfSafety,
    lastAnalysisDate: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { symbols, marketId, forceRefresh = false }: AnalysisRequest = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      throw new Error('Symbols array is required');
    }

    if (!marketId) {
      throw new Error('Market ID is required');
    }

    console.log(`Batch analyzing ${symbols.length} stocks for market ${marketId}`);

    const results = [];

    for (const symbol of symbols) {
      try {
        // Fetch cached data
        const { data: cachedData, error: cacheError } = await supabaseClient
          .from('stock_data_cache')
          .select('*')
          .eq('symbol', symbol)
          .single();

        if (cacheError && cacheError.code !== 'PGRST116') {
          console.error(`Error fetching cache for ${symbol}:`, cacheError);
          continue;
        }

        if (!cachedData || !cachedData.raw_data) {
          console.log(`No cached data for ${symbol}, skipping`);
          continue;
        }

        // Analyze the stock
        const analysisResult = analyzeStock(cachedData.raw_data);
        
        if (!analysisResult) {
          console.log(`Failed to analyze ${symbol}`);
          continue;
        }

        // Save to analysis cache
        const { error: upsertError } = await supabaseClient
          .from('stock_analysis_cache')
          .upsert({
            symbol,
            market_id: marketId,
            buffett_score: analysisResult.buffettScore,
            analysis_result: analysisResult,
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'symbol,market_id',
          });

        if (upsertError) {
          console.error(`Error saving analysis for ${symbol}:`, upsertError);
        } else {
          results.push(analysisResult);
        }
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
      }
    }

    console.log(`Successfully analyzed ${results.length}/${symbols.length} stocks`);

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: results.length,
        total: symbols.length,
        results: results.sort((a, b) => (b.buffettScore || 0) - (a.buffettScore || 0)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in batch-analyze-stocks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
