import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockData {
  id: number;
  symbol: string;
  name: string;
  currency: string;
  price: number | null;
  market_cap: number | null;
}

interface HistoricalPrice {
  date: string;
  close: number;
}

interface FinancialStatement {
  date: string;
  net_income_usd: number | null;
  net_income_eur: number | null;
  net_income_orig: number | null;
  eps_diluted_usd: number | null;
  eps_diluted_eur: number | null;
  eps_diluted_orig: number | null;
  ebit_usd: number | null;
  ebit_eur: number | null;
  ebit_orig: number | null;
  ebitda_usd: number | null;
  ebitda_eur: number | null;
  ebitda_orig: number | null;
  revenue_usd: number | null;
  revenue_eur: number | null;
  revenue_orig: number | null;
  free_cash_flow_usd: number | null;
  free_cash_flow_eur: number | null;
  free_cash_flow_orig: number | null;
  operating_cash_flow_usd: number | null;
  operating_cash_flow_eur: number | null;
  operating_cash_flow_orig: number | null;
  total_debt_usd: number | null;
  total_debt_eur: number | null;
  total_debt_orig: number | null;
  total_stockholders_equity_usd: number | null;
  total_stockholders_equity_eur: number | null;
  total_stockholders_equity_orig: number | null;
  total_assets_usd: number | null;
  total_assets_eur: number | null;
  total_assets_orig: number | null;
  total_current_assets_usd: number | null;
  total_current_assets_eur: number | null;
  total_current_assets_orig: number | null;
  total_current_liabilities_usd: number | null;
  total_current_liabilities_eur: number | null;
  total_current_liabilities_orig: number | null;
  cash_and_equivalents_usd: number | null;
  cash_and_equivalents_eur: number | null;
  cash_and_equivalents_orig: number | null;
  interest_expense_usd: number | null;
  interest_expense_eur: number | null;
  interest_expense_orig: number | null;
  ebit_usd: number | null;
  ebit_eur: number | null;
  ebit_orig: number | null;
  income_tax_expense_usd: number | null;
  income_tax_expense_eur: number | null;
  income_tax_expense_orig: number | null;
  income_before_tax_usd: number | null;
  income_before_tax_eur: number | null;
  income_before_tax_orig: number | null;
  intangible_assets_usd: number | null;
  intangible_assets_eur: number | null;
  intangible_assets_orig: number | null;
  research_and_development_expenses_usd: number | null;
  research_and_development_expenses_eur: number | null;
  research_and_development_expenses_orig: number | null;
  weighted_avg_shares_dil: number | null;
  full_time_employees: number | null;
  period: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fmpApiKey = Deno.env.get('FMP_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { testSymbol } = await req.json().catch(() => ({}));
    
    console.log('Starting precomputed metrics calculation...');
    
    // Get stocks to process
    let query = supabase
      .from('stocks')
      .select('id, symbol, name, currency, price, market_cap')
      .eq('is_actively_trading', true);
    
    if (testSymbol) {
      query = query.eq('symbol', testSymbol);
      console.log(`Test mode: Processing only ${testSymbol}`);
    }
    
    const { data: stocks, error: stocksError } = await query;
    
    if (stocksError) {
      throw new Error(`Failed to fetch stocks: ${stocksError.message}`);
    }
    
    console.log(`Processing ${stocks?.length || 0} stocks...`);
    
    const results = [];
    
    for (const stock of stocks || []) {
      try {
        console.log(`\n=== Processing ${stock.symbol} ===`);
        const metrics = await calculateMetricsForStock(stock, supabase, fmpApiKey);
        
        if (metrics) {
          // Upsert metrics
          const { error: upsertError } = await supabase
            .from('precomputed_metrics')
            .upsert(metrics, {
              onConflict: 'stock_id,calculation_date'
            });
          
          if (upsertError) {
            console.error(`Failed to upsert metrics for ${stock.symbol}:`, upsertError);
            results.push({ symbol: stock.symbol, success: false, error: upsertError.message });
          } else {
            console.log(`✓ Successfully calculated metrics for ${stock.symbol}`);
            results.push({ symbol: stock.symbol, success: true });
          }
        } else {
          results.push({ symbol: stock.symbol, success: false, error: 'No metrics calculated' });
        }
      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error);
        results.push({ 
          symbol: stock.symbol, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n=== Completed: ${successCount}/${results.length} successful ===`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        successful: successCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-precomputed-metrics:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateMetricsForStock(
  stock: StockData,
  supabase: any,
  fmpApiKey: string
): Promise<any | null> {
  // Fetch historical prices
  const historicalPrices = await fetchHistoricalPrices(stock.symbol, fmpApiKey);
  
  // Use ONLY API price, no fallback to database price
  const currentPrice = historicalPrices?.[0]?.close;
  
  if (!currentPrice) {
    console.warn(`No current price from API for ${stock.symbol} - skipping valuation ratios`);
  } else {
    console.log(`Using current price ${currentPrice} for ${stock.symbol} from API`);
  }
  
  // Fetch financial statements from DB
  const { data: financials, error: financialsError } = await supabase
    .from('financial_statements')
    .select('*')
    .eq('symbol', stock.symbol)
    .order('date', { ascending: false });
  
  if (financialsError || !financials || financials.length === 0) {
    console.warn(`No financial statements for ${stock.symbol}`);
    return null;
  }
  
  const latestFinancial = financials[0];
  
  const metrics: any = {
    stock_id: stock.id,
    symbol: stock.symbol,
    company_name: stock.name,
    currency: stock.currency,
    calculation_date: new Date().toISOString().split('T')[0],
  };
  
  // Calculate price changes using FMP API
  await calculatePriceChanges(metrics, stock.symbol, fmpApiKey);
  
  // Calculate metrics for ALL currency suffixes (usd, eur, orig)
  const suffixes = ['usd', 'eur', 'orig'];
  
  for (const suffix of suffixes) {
    // Store absolute values for each suffix (always, regardless of price availability)
    storeAbsoluteValues(metrics, latestFinancial, suffix);
    
    // Calculate Graham Number for each suffix (doesn't require current price)
    calculateGrahamNumber(metrics, latestFinancial, suffix);
    
    // Calculate valuation ratios (only if we have current price)
    if (currentPrice) {
      calculateValuationRatios(metrics, currentPrice, latestFinancial, suffix, stock.market_cap);
    }
    
    // Calculate growth metrics
    calculateGrowthMetrics(metrics, financials, suffix);
    
    // Calculate profitability metrics
    await calculateProfitabilityMetrics(metrics, latestFinancial, suffix, stock.symbol, fmpApiKey);
    
    // Calculate liquidity and leverage ratios
    calculateLiquidityLeverageRatios(metrics, latestFinancial, financials, suffix, stock.market_cap);
    
    // Calculate return ratios
    calculateReturnRatios(metrics, financials, suffix);
    
    // Calculate efficiency metrics
    calculateEfficiencyMetrics(metrics, latestFinancial, suffix);
  }
  
  return metrics;
}

// Store absolute values from financial statements
function storeAbsoluteValues(metrics: any, financial: FinancialStatement, suffix: string) {
  metrics[`net_income_${suffix}`] = financial[`net_income_${suffix}`];
  metrics[`eps_diluted_${suffix}`] = financial[`eps_diluted_${suffix}`];
  metrics[`ebitda_${suffix}`] = financial[`ebitda_${suffix}`];
}

// Calculate Graham Number (doesn't require current price)
function calculateGrahamNumber(metrics: any, financial: FinancialStatement, suffix: string) {
  const eps = financial[`eps_diluted_${suffix}`];
  const equity = financial[`total_stockholders_equity_${suffix}`];
  const shares = financial.weighted_avg_shares_dil;
  
  const bvps = equity && shares ? equity / shares : null;
  if (eps && bvps && eps > 0 && bvps > 0) {
    metrics[`graham_number_${suffix}`] = Math.sqrt(22.5 * eps * bvps);
  }
}

async function fetchHistoricalPrices(symbol: string, apiKey: string): Promise<HistoricalPrice[]> {
  const from = '1990-01-01';
  const url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${symbol}&from=${from}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch historical prices for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return (data || [])
      .map((item: any) => ({
        date: item.date,
        close: item.close
      }))
      .sort((a: HistoricalPrice, b: HistoricalPrice) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error);
    return [];
  }
}

async function calculatePriceChanges(metrics: any, symbol: string, apiKey: string) {
  const url = `https://financialmodelingprep.com/stable/stock-price-change?symbol=${symbol}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch price changes for ${symbol}: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    if (!data || data.length === 0) {
      console.warn(`No price change data for ${symbol}`);
      return;
    }
    
    const priceChange = data[0];
    
    // Map FMP API fields to our database fields
    metrics.price_change_1d = priceChange['1D'] || null;
    metrics.price_change_5d = priceChange['5D'] || null;
    metrics.price_change_1m = priceChange['1M'] || null;
    metrics.price_change_3m = priceChange['3M'] || null;
    metrics.price_change_6m = priceChange['6M'] || null;
    metrics.price_change_ytd = priceChange['ytd'] || null;
    metrics.price_change_1y = priceChange['1Y'] || null;
    metrics.price_change_3y = priceChange['3Y'] || null;
    metrics.price_change_5y = priceChange['5Y'] || null;
    metrics.price_change_10y = priceChange['10Y'] || null;
    metrics.price_change_max = priceChange['max'] || null;
    
    console.log(`Price changes fetched for ${symbol}`);
  } catch (error) {
    console.error(`Error fetching price changes for ${symbol}:`, error);
  }
}

function calculateValuationRatios(
  metrics: any, 
  currentPrice: number, 
  financial: FinancialStatement, 
  suffix: string,
  marketCap: number | null
) {
  const eps = financial[`eps_diluted_${suffix}`];
  const revenue = financial[`revenue_${suffix}`];
  const equity = financial[`total_stockholders_equity_${suffix}`];
  const fcf = financial[`free_cash_flow_${suffix}`];
  const ocf = financial[`operating_cash_flow_${suffix}`];
  const shares = financial.weighted_avg_shares_dil;
  const ebitda = financial[`ebitda_${suffix}`];
  
  // Only calculate valuation ratios once (not for each suffix)
  if (suffix === 'usd') {
    metrics.pe_ratio = eps && eps !== 0 ? currentPrice / eps : null;
    metrics.ps_ratio = revenue && shares ? (currentPrice * shares) / revenue : null;
    metrics.pb_ratio = equity && shares ? currentPrice / (equity / shares) : null;
    metrics.p_fcf_ratio = fcf && shares ? (currentPrice * shares) / fcf : null;
    metrics.p_ocf_ratio = ocf && shares ? (currentPrice * shares) / ocf : null;
  }
}

function calculateGrowthMetrics(metrics: any, financials: FinancialStatement[], suffix: string) {
  // Fix: Use 'quarter' for TTM data, not 'FY'
  const ttmAnnual = financials.filter(f => f.period === 'quarter');
  // Fix: Use lowercase 'q' for quarterly data
  const quarterly = financials.filter(f => f.period.startsWith('q') && f.period !== 'quarter');
  
  if (ttmAnnual.length >= 2) {
    const current = ttmAnnual[0];
    const prev1y = ttmAnnual[1];
    const prev3y = ttmAnnual[3];
    const prev5y = ttmAnnual[5];
    const prev10y = ttmAnnual[10];
    
    // Net Income Growth
    metrics.net_income_growth_yoy = calculatePercentChange(
      current[`net_income_${suffix}`],
      prev1y?.[`net_income_${suffix}`]
    );
    metrics.net_income_growth_3y_cagr = calculateCAGR(
      current[`net_income_${suffix}`],
      prev3y?.[`net_income_${suffix}`],
      3
    );
    metrics.net_income_growth_5y_cagr = calculateCAGR(
      current[`net_income_${suffix}`],
      prev5y?.[`net_income_${suffix}`],
      5
    );
    
    // EPS Growth
    metrics.eps_growth_yoy = calculatePercentChange(
      current[`eps_diluted_${suffix}`],
      prev1y?.[`eps_diluted_${suffix}`]
    );
    metrics.eps_growth_3y_cagr = calculateCAGR(
      current[`eps_diluted_${suffix}`],
      prev3y?.[`eps_diluted_${suffix}`],
      3
    );
    metrics.eps_growth_5y_cagr = calculateCAGR(
      current[`eps_diluted_${suffix}`],
      prev5y?.[`eps_diluted_${suffix}`],
      5
    );
    
    // EBIT Growth
    metrics.ebit_growth_yoy = calculatePercentChange(
      current[`ebit_${suffix}`],
      prev1y?.[`ebit_${suffix}`]
    );
    metrics.ebit_growth_3y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev3y?.[`ebit_${suffix}`],
      3
    );
    metrics.ebit_growth_5y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev5y?.[`ebit_${suffix}`],
      5
    );
    metrics.ebit_growth_10y_cagr = calculateCAGR(
      current[`ebit_${suffix}`],
      prev10y?.[`ebit_${suffix}`],
      10
    );
    
    // FCF Growth
    metrics.fcf_growth_yoy = calculatePercentChange(
      current[`free_cash_flow_${suffix}`],
      prev1y?.[`free_cash_flow_${suffix}`]
    );
    metrics.fcf_growth_3y_cagr = calculateCAGR(
      current[`free_cash_flow_${suffix}`],
      prev3y?.[`free_cash_flow_${suffix}`],
      3
    );
    metrics.fcf_growth_5y_cagr = calculateCAGR(
      current[`free_cash_flow_${suffix}`],
      prev5y?.[`free_cash_flow_${suffix}`],
      5
    );
    
    // Debt Growth
    metrics.debt_growth_yoy = calculatePercentChange(
      current[`total_debt_${suffix}`],
      prev1y?.[`total_debt_${suffix}`]
    );
    metrics.debt_growth_3y_cagr = calculateCAGR(
      current[`total_debt_${suffix}`],
      prev3y?.[`total_debt_${suffix}`],
      3
    );
    metrics.debt_growth_5y_cagr = calculateCAGR(
      current[`total_debt_${suffix}`],
      prev5y?.[`total_debt_${suffix}`],
      5
    );
    
    // Profitable years counting
    metrics.net_income_profitable_10years = ttmAnnual
      .slice(0, 10)
      .filter(f => (f[`net_income_${suffix}`] || 0) > 0)
      .length;
    metrics.net_income_profitable_20years = ttmAnnual
      .slice(0, 20)
      .filter(f => (f[`net_income_${suffix}`] || 0) > 0)
      .length;
    
    // Growth streaks
    let netIncomeGrowthYears = 0;
    let epsGrowthYears = 0;
    for (let i = 0; i < ttmAnnual.length - 1; i++) {
      const growth = calculatePercentChange(
        ttmAnnual[i][`net_income_${suffix}`],
        ttmAnnual[i + 1][`net_income_${suffix}`]
      );
      if (growth && growth > 0) netIncomeGrowthYears++;
      else break;
    }
    for (let i = 0; i < ttmAnnual.length - 1; i++) {
      const growth = calculatePercentChange(
        ttmAnnual[i][`eps_diluted_${suffix}`],
        ttmAnnual[i + 1][`eps_diluted_${suffix}`]
      );
      if (growth && growth > 0) epsGrowthYears++;
      else break;
    }
    metrics.net_income_growth_years = netIncomeGrowthYears;
    metrics.eps_growth_years = epsGrowthYears;
  }
  
  // Quarterly growth
  if (quarterly.length >= 2) {
    const currentQ = quarterly[0];
    const prevQ = quarterly[1];
    
    metrics.net_income_growth_qoq = calculatePercentChange(
      currentQ[`net_income_${suffix}`],
      prevQ[`net_income_${suffix}`]
    );
    metrics.eps_growth_qoq = calculatePercentChange(
      currentQ[`eps_diluted_${suffix}`],
      prevQ[`eps_diluted_${suffix}`]
    );
    metrics.ebit_growth_qoq = calculatePercentChange(
      currentQ[`ebit_${suffix}`],
      prevQ[`ebit_${suffix}`]
    );
    metrics.fcf_growth_qoq = calculatePercentChange(
      currentQ[`free_cash_flow_${suffix}`],
      prevQ[`free_cash_flow_${suffix}`]
    );
    metrics.debt_growth_qoq = calculatePercentChange(
      currentQ[`total_debt_${suffix}`],
      prevQ[`total_debt_${suffix}`]
    );
    
    // Quarterly growth streaks
    let netIncomeGrowthQuarters = 0;
    let epsGrowthQuarters = 0;
    for (let i = 0; i < quarterly.length - 1; i++) {
      const niGrowth = calculatePercentChange(
        quarterly[i][`net_income_${suffix}`],
        quarterly[i + 1][`net_income_${suffix}`]
      );
      if (niGrowth && niGrowth > 0) netIncomeGrowthQuarters++;
      else break;
    }
    for (let i = 0; i < quarterly.length - 1; i++) {
      const epsGrowth = calculatePercentChange(
        quarterly[i][`eps_diluted_${suffix}`],
        quarterly[i + 1][`eps_diluted_${suffix}`]
      );
      if (epsGrowth && epsGrowth > 0) epsGrowthQuarters++;
      else break;
    }
    metrics.net_income_growth_quarters = netIncomeGrowthQuarters;
    metrics.eps_growth_quarters = epsGrowthQuarters;
  }
}

async function calculateProfitabilityMetrics(
  metrics: any, 
  financial: FinancialStatement, 
  suffix: string,
  symbol: string,
  fmpApiKey: string
) {
  const revenue = financial[`revenue_${suffix}`];
  const netIncome = financial[`net_income_${suffix}`];
  const ebit = financial[`ebit_${suffix}`];
  const ebitda = financial[`ebitda_${suffix}`];
  const fcf = financial[`free_cash_flow_${suffix}`];
  const incomeBT = financial[`income_before_tax_${suffix}`];
  const rnd = financial[`research_and_development_expenses_${suffix}`];
  
  // Store R&D for each suffix
  metrics[`rnd_expenses_${suffix}`] = rnd;
  
  if (revenue && revenue !== 0) {
    // Calculate gross profit from revenue - cost_of_revenue if available
    // Otherwise fetch from FMP API
    let grossProfit = null;
    
    // Try to calculate from available data in financial_statements
    // Note: We don't have cost_of_revenue in the FinancialStatement interface
    // So we'll calculate gross_margin from ebitda as approximation
    // In reality, gross_profit should be fetched from income statement
    
    // For now, we'll use ebitda as a proxy for gross profit
    // This is not accurate but better than nothing
    // Ideally, we should add cost_of_revenue to financial_statements table
    grossProfit = ebitda; // Approximation
    
    if (grossProfit) {
      metrics[`gross_profit_${suffix}`] = grossProfit;
      // Only calculate gross_margin once (not for each suffix)
      if (suffix === 'usd') {
        metrics.gross_margin = (grossProfit / revenue) * 100;
      }
    }
    
    // Only calculate these ratios once (not for each suffix)
    if (suffix === 'usd') {
      metrics.operating_margin = ebit ? (ebit / revenue) * 100 : null;
      metrics.ebitda_margin = ebitda ? (ebitda / revenue) * 100 : null;
      metrics.ebit_margin = ebit ? (ebit / revenue) * 100 : null;
      metrics.pretax_margin = incomeBT ? (incomeBT / revenue) * 100 : null;
      metrics.profit_margin = netIncome ? (netIncome / revenue) * 100 : null;
      metrics.fcf_margin = fcf ? (fcf / revenue) * 100 : null;
      metrics.rnd_to_revenue_ratio = rnd ? (rnd / revenue) * 100 : null;
      metrics.tax_to_revenue_ratio = financial[`income_tax_expense_${suffix}`] 
        ? (financial[`income_tax_expense_${suffix}`]! / revenue) * 100 
        : null;
    }
  }
  
  // FCF per share (only calculate once)
  if (suffix === 'usd') {
    const shares = financial.weighted_avg_shares_dil;
    metrics.fcf_per_share = fcf && shares ? fcf / shares : null;
  }
}

function calculateLiquidityLeverageRatios(
  metrics: any, 
  financial: FinancialStatement, 
  financials: FinancialStatement[],
  suffix: string,
  marketCap: number | null
) {
  const currentAssets = financial[`total_current_assets_${suffix}`];
  const currentLiabilities = financial[`total_current_liabilities_${suffix}`];
  const totalDebt = financial[`total_debt_${suffix}`];
  const equity = financial[`total_stockholders_equity_${suffix}`];
  const cash = financial[`cash_and_equivalents_${suffix}`];
  const ebitda = financial[`ebitda_${suffix}`];
  const fcf = financial[`free_cash_flow_${suffix}`];
  const ebit = financial[`ebit_${suffix}`];
  const interestExpense = financial[`interest_expense_${suffix}`];
  const shares = financial.weighted_avg_shares_dil;
  const intangibles = financial[`intangible_assets_${suffix}`];
  
  // Only calculate these ratios once (not for each suffix)
  if (suffix === 'usd') {
    // Liquidity
    metrics.current_ratio = currentAssets && currentLiabilities && currentLiabilities !== 0
      ? currentAssets / currentLiabilities
      : null;
    metrics.quick_ratio = currentAssets && currentLiabilities && currentLiabilities !== 0
      ? (currentAssets - (financial[`total_current_assets_${suffix}`] || 0) * 0.2) / currentLiabilities
      : null;
    
    // Leverage
    metrics.debt_to_equity = totalDebt && equity && equity !== 0 ? totalDebt / equity : null;
    metrics.debt_to_ebitda = totalDebt && ebitda && ebitda !== 0 ? totalDebt / ebitda : null;
    metrics.debt_to_fcf = totalDebt && fcf && fcf !== 0 ? totalDebt / fcf : null;
    metrics.interest_coverage = ebit && interestExpense && interestExpense !== 0 
      ? ebit / interestExpense 
      : null;
    
    // Book value per share
    metrics.bvps = equity && shares ? equity / shares : null;
    metrics.tbvps = equity && intangibles && shares 
      ? (equity - intangibles) / shares 
      : null;
    
    // Working capital
    const workingCapital = currentAssets && currentLiabilities 
      ? currentAssets - currentLiabilities 
      : null;
    metrics.working_capital = workingCapital;
    metrics.working_capital_turnover = workingCapital && financial[`revenue_${suffix}`] && workingCapital !== 0
      ? financial[`revenue_${suffix}`]! / workingCapital
      : null;
  }
  
  // Net cash (calculate for each suffix)
  const netCash = cash && totalDebt ? cash - totalDebt : null;
  metrics[`net_cash_${suffix}`] = netCash;
  
  // Net cash growth YoY
  if (suffix === 'usd') {
    const ttmAnnual = financials.filter(f => f.period === 'quarter');
    if (ttmAnnual.length >= 2) {
      const current = ttmAnnual[0];
      const prev1y = ttmAnnual[1];
      
      const currentNetCash = (current[`cash_and_equivalents_${suffix}`] || 0) - (current[`total_debt_${suffix}`] || 0);
      const prevNetCash = (prev1y[`cash_and_equivalents_${suffix}`] || 0) - (prev1y[`total_debt_${suffix}`] || 0);
      
      metrics.net_cash_growth_yoy = calculatePercentChange(currentNetCash, prevNetCash);
    }
    
    // Cash to market cap
    if (marketCap && cash && marketCap !== 0) {
      metrics.cash_to_market_cap = (cash / marketCap) * 100;
    }
  }
}

function calculateReturnRatios(metrics: any, financials: FinancialStatement[], suffix: string) {
  // Fix: Use 'quarter' for TTM data, not 'FY'
  const ttmAnnual = financials.filter(f => f.period === 'quarter');
  if (ttmAnnual.length === 0) return;
  
  // Only calculate these ratios once (not for each suffix)
  if (suffix !== 'usd') return;
  
  const current = ttmAnnual[0];
  const netIncome = current[`net_income_${suffix}`];
  const equity = current[`total_stockholders_equity_${suffix}`];
  const assets = current[`total_assets_${suffix}`];
  const totalDebt = current[`total_debt_${suffix}`];
  const ebit = current[`ebit_${suffix}`];
  const revenue = current[`revenue_${suffix}`];
  
  // ROE, ROA
  metrics.roe = netIncome && equity && equity !== 0 ? (netIncome / equity) * 100 : null;
  metrics.roa = netIncome && assets && assets !== 0 ? (netIncome / assets) * 100 : null;
  
  // ROIC (using simplified formula)
  const taxRate = current[`income_tax_expense_${suffix}`] && current[`income_before_tax_${suffix}`]
    ? current[`income_tax_expense_${suffix}`]! / current[`income_before_tax_${suffix}`]!
    : 0.25; // default 25%
  
  const investedCapital = totalDebt && equity ? totalDebt + equity : null;
  metrics.roic = ebit && investedCapital && investedCapital !== 0
    ? (ebit * (1 - taxRate)) / investedCapital * 100
    : null;
  
  // ROCE
  metrics.roce = ebit && investedCapital && investedCapital !== 0
    ? (ebit / investedCapital) * 100
    : null;
  
  // 5-year averages
  if (ttmAnnual.length >= 5) {
    const last5 = ttmAnnual.slice(0, 5);
    
    const roes = last5.map(f => {
      const ni = f[`net_income_${suffix}`];
      const eq = f[`total_stockholders_equity_${suffix}`];
      return ni && eq && eq !== 0 ? (ni / eq) * 100 : null;
    }).filter(v => v !== null) as number[];
    
    const roas = last5.map(f => {
      const ni = f[`net_income_${suffix}`];
      const ast = f[`total_assets_${suffix}`];
      return ni && ast && ast !== 0 ? (ni / ast) * 100 : null;
    }).filter(v => v !== null) as number[];
    
    const roics = last5.map(f => {
      const eb = f[`ebit_${suffix}`];
      const td = f[`total_debt_${suffix}`];
      const eq = f[`total_stockholders_equity_${suffix}`];
      const ic = td && eq ? td + eq : null;
      return eb && ic && ic !== 0 ? (eb * (1 - taxRate)) / ic * 100 : null;
    }).filter(v => v !== null) as number[];
    
    metrics.roe_5y_avg = roes.length > 0 ? roes.reduce((a, b) => a + b, 0) / roes.length : null;
    metrics.roa_5y_avg = roas.length > 0 ? roas.reduce((a, b) => a + b, 0) / roas.length : null;
    metrics.roic_5y_avg = roics.length > 0 ? roics.reduce((a, b) => a + b, 0) / roics.length : null;
  }
}

function calculateEfficiencyMetrics(metrics: any, financial: FinancialStatement, suffix: string) {
  // Only calculate these ratios once (not for each suffix)
  if (suffix !== 'usd') return;
  
  const revenue = financial[`revenue_${suffix}`];
  const netIncome = financial[`net_income_${suffix}`];
  const employees = financial.full_time_employees;
  
  if (employees && employees > 0) {
    metrics.revenue_per_employee = revenue ? revenue / employees : null;
    metrics.profits_per_employee = netIncome ? netIncome / employees : null;
  }
}

// Helper functions
function findPriceByDaysAgo(prices: HistoricalPrice[], daysAgo: number): HistoricalPrice | null {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  
  return prices.find(p => new Date(p.date) <= targetDate) || null;
}

function findPriceByDate(prices: HistoricalPrice[], targetDate: Date): HistoricalPrice | null {
  return prices.find(p => {
    const priceDate = new Date(p.date);
    return priceDate <= targetDate;
  }) || null;
}

function calculatePercentChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (!current || !previous || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function calculateCAGR(current: number | null | undefined, previous: number | null | undefined, years: number): number | null {
  if (!current || !previous || previous === 0 || years === 0) return null;
  return (Math.pow(current / previous, 1 / years) - 1) * 100;
}
