import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TARGET_CURRENCIES = ['USD', 'EUR']

/**
 * Get exchange rate from database for a specific date
 */
async function getExchangeRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string,
  date: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0

  // Try direct rate
  const { data: directRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', fromCurrency)
    .eq('target_currency', toCurrency)
    .lte('valid_date', date)
    .order('valid_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (directRate) return directRate.rate

  // Try inverse rate
  const { data: inverseRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', toCurrency)
    .eq('target_currency', fromCurrency)
    .lte('valid_date', date)
    .order('valid_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inverseRate && inverseRate.rate !== 0) {
    return 1 / inverseRate.rate
  }

  // If not found, try to fetch from FMP with 7-day backward fallback
  console.warn(`⚠️ No rate found for ${fromCurrency} to ${toCurrency} on ${date}, searching backwards...`)
  const fmpApiKey = Deno.env.get('FMP_API_KEY')
  const pair = `${fromCurrency}${toCurrency}`
  
  // Try the exact date and up to 7 days back (for weekends/holidays)
  for (let daysBack = 0; daysBack <= 7; daysBack++) {
    const searchDate = new Date(date)
    searchDate.setDate(searchDate.getDate() - daysBack)
    const searchDateStr = searchDate.toISOString().split('T')[0]
    
    try {
      // Use correct FMP API endpoint
      const url = `https://financialmodelingprep.com/api/v3/historical-price-full/forex/${pair}?from=${searchDateStr}&to=${searchDateStr}&apikey=${fmpApiKey}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data: any = await response.json()
        const historical = data?.historical || []
        
        if (historical.length > 0) {
          const rate = Number(historical[0].close || historical[0].adjClose || historical[0].price)
          if (Number.isFinite(rate)) {
            console.log(`  ✓ Found rate for ${pair} on ${searchDateStr} (${daysBack} days back)`)
            // Store in database with original date
            await supabase.from('exchange_rates').upsert({
              base_currency: fromCurrency,
              target_currency: toCurrency,
              valid_date: date,
              rate: rate,
              fetched_at: new Date().toISOString(),
              is_fallback: daysBack > 0,
            }, { onConflict: 'base_currency,target_currency,valid_date' })
            return rate
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching rate from FMP for ${searchDateStr}: ${error}`)
    }
  }

  throw new Error(`Could not find exchange rate for ${fromCurrency} to ${toCurrency} on ${date} (searched 7 days back)`)
}

/**
 * Convert value to multiple currencies
 */
async function convertValueToMultipleCurrencies(
  supabase: any,
  value: number | null | undefined,
  fromCurrency: string,
  date: string
): Promise<Record<string, number | null>> {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { USD: null, EUR: null }
  }

  const result: Record<string, number | null> = {}

  for (const targetCurrency of TARGET_CURRENCIES) {
    try {
      if (fromCurrency === targetCurrency) {
        result[targetCurrency] = value
      } else {
        const rate = await getExchangeRate(supabase, fromCurrency, targetCurrency, date)
        result[targetCurrency] = value * rate
      }
    } catch (error) {
      console.error(`Failed to convert ${fromCurrency} to ${targetCurrency}: ${error}`)
      result[targetCurrency] = null
    }
  }

  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { testMode = false, testSymbol = null } = await req.json().catch(() => ({}))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fmpApiKey = Deno.env.get('FMP_API_KEY')
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured')
    }

    console.log('Starting historical financial data import...')
    console.log(testMode ? `TEST MODE: Processing only ${testSymbol || 'first stock'}` : 'Processing all stocks')

    // Get stocks to process
    let query = supabase
      .from('stocks')
      .select('symbol, currency, name')
      .order('symbol')

    if (testMode && testSymbol) {
      query = query.eq('symbol', testSymbol)
    } else if (testMode) {
      query = query.limit(1)
    }

    const { data: stocks, error: stocksError } = await query

    if (stocksError) {
      throw new Error(`Error fetching stocks: ${stocksError.message}`)
    }

    if (!stocks || stocks.length === 0) {
      throw new Error('No stocks found to process')
    }

    console.log(`📊 Processing ${stocks.length} stock(s)...`)

    let totalProcessed = 0
    let totalInserted = 0
    const errors: string[] = []

    for (const stock of stocks) {
      console.log(`\n🔍 Processing ${stock.symbol} (${stock.currency || 'USD'})...`)

      try {
        const stockCurrency = stock.currency || 'USD'

        // Fetch quarterly data
        const [incomeQ, balanceQ, cashflowQ] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
        ])

        // Fetch TTM data
        const [incomeTTM, balanceTTM, cashflowTTM] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?period=ttm&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?period=ttm&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?period=ttm&apikey=${fmpApiKey}`).then(r => r.json()),
        ])

        // Fetch company profile for beta and market cap
        const profileResponse = await fetch(`https://financialmodelingprep.com/api/v3/profile/${stock.symbol}?apikey=${fmpApiKey}`)
        const profileData = await profileResponse.json()
        const companyProfile = Array.isArray(profileData) ? profileData[0] : profileData
        const beta = companyProfile?.beta || null
        const marketCap = companyProfile?.mktCap || null

        // Merge all data
        const allIncome = [...(Array.isArray(incomeQ) ? incomeQ : []), ...(Array.isArray(incomeTTM) ? incomeTTM : [])]
        const allBalance = [...(Array.isArray(balanceQ) ? balanceQ : []), ...(Array.isArray(balanceTTM) ? balanceTTM : [])]
        const allCashflow = [...(Array.isArray(cashflowQ) ? cashflowQ : []), ...(Array.isArray(cashflowTTM) ? cashflowTTM : [])]

        if (allIncome.length === 0) {
          console.warn(`  ⚠️ No financial data found for ${stock.symbol}`)
          continue
        }

        console.log(`  ✓ Fetched ${allIncome.length} income statements, ${allBalance.length} balance sheets, ${allCashflow.length} cash flows`)

        // Group by date and period
        const dataByDatePeriod = new Map<string, any>()

        for (const income of allIncome) {
          const key = `${income.date}_${income.period}`
          if (!dataByDatePeriod.has(key)) {
            dataByDatePeriod.set(key, { date: income.date, period: income.period })
          }
          const entry = dataByDatePeriod.get(key)
          entry.income = income
          entry.reportedCurrency = income.reportedCurrency || stockCurrency
        }

        for (const balance of allBalance) {
          const key = `${balance.date}_${balance.period}`
          if (!dataByDatePeriod.has(key)) {
            dataByDatePeriod.set(key, { date: balance.date, period: balance.period })
          }
          const entry = dataByDatePeriod.get(key)
          entry.balance = balance
          if (!entry.reportedCurrency) {
            entry.reportedCurrency = balance.reportedCurrency || stockCurrency
          }
        }

        for (const cashflow of allCashflow) {
          const key = `${cashflow.date}_${cashflow.period}`
          if (!dataByDatePeriod.has(key)) {
            dataByDatePeriod.set(key, { date: cashflow.date, period: cashflow.period })
          }
          const entry = dataByDatePeriod.get(key)
          entry.cashflow = cashflow
          if (!entry.reportedCurrency) {
            entry.reportedCurrency = cashflow.reportedCurrency || stockCurrency
          }
        }

        console.log(`  📝 Merged ${dataByDatePeriod.size} unique date/period combinations`)

        // Process and insert data
        const records = []

        for (const [key, data] of dataByDatePeriod) {
          const { income, balance, cashflow, date, period, reportedCurrency } = data

          if (!date) continue

          // Extract original values
          const revenue_orig = income?.revenue
          const ebitda_orig = income?.ebitda
          const ebit_orig = income?.operatingIncome
          const net_income_orig = income?.netIncome
          const eps_diluted_orig = income?.epsdiluted
          const weighted_avg_shares_dil = income?.weightedAverageShsOutDil
          const interest_expense_orig = income?.interestExpense
          const income_tax_expense_orig = income?.incomeTaxExpense
          const income_before_tax_orig = income?.incomeBeforeTax
          const other_adjustments_net_income_orig = income?.otherAdjustmentsToNetIncome
          const research_and_development_expenses_orig = income?.researchAndDevelopmentExpenses
          const total_other_income_expenses_net_orig = income?.totalOtherIncomeExpensesNet

          const total_current_assets_orig = balance?.totalCurrentAssets
          const total_assets_orig = balance?.totalAssets
          const total_current_liabilities_orig = balance?.totalCurrentLiabilities
          const total_debt_orig = balance?.totalDebt
          const total_stockholders_equity_orig = balance?.totalStockholdersEquity
          const cash_and_equivalents_orig = balance?.cashAndCashEquivalents

          const operating_cash_flow_orig = cashflow?.operatingCashFlow
          const capital_expenditure_orig = cashflow?.capitalExpenditure
          const free_cash_flow_orig = cashflow?.freeCashFlow
          const dividends_paid_orig = cashflow?.commonStockDividendsPaid || cashflow?.dividendsPaid

          // Convert all values to USD and EUR
          const revenue_converted = await convertValueToMultipleCurrencies(supabase, revenue_orig, reportedCurrency, date)
          const ebitda_converted = await convertValueToMultipleCurrencies(supabase, ebitda_orig, reportedCurrency, date)
          const ebit_converted = await convertValueToMultipleCurrencies(supabase, ebit_orig, reportedCurrency, date)
          const net_income_converted = await convertValueToMultipleCurrencies(supabase, net_income_orig, reportedCurrency, date)
          const eps_diluted_converted = await convertValueToMultipleCurrencies(supabase, eps_diluted_orig, reportedCurrency, date)
          const total_current_assets_converted = await convertValueToMultipleCurrencies(supabase, total_current_assets_orig, reportedCurrency, date)
          const total_assets_converted = await convertValueToMultipleCurrencies(supabase, total_assets_orig, reportedCurrency, date)
          const total_current_liabilities_converted = await convertValueToMultipleCurrencies(supabase, total_current_liabilities_orig, reportedCurrency, date)
          const total_debt_converted = await convertValueToMultipleCurrencies(supabase, total_debt_orig, reportedCurrency, date)
          const total_stockholders_equity_converted = await convertValueToMultipleCurrencies(supabase, total_stockholders_equity_orig, reportedCurrency, date)
          const cash_and_equivalents_converted = await convertValueToMultipleCurrencies(supabase, cash_and_equivalents_orig, reportedCurrency, date)
          const interest_expense_converted = await convertValueToMultipleCurrencies(supabase, interest_expense_orig, reportedCurrency, date)
          const operating_cash_flow_converted = await convertValueToMultipleCurrencies(supabase, operating_cash_flow_orig, reportedCurrency, date)
          const capital_expenditure_converted = await convertValueToMultipleCurrencies(supabase, capital_expenditure_orig, reportedCurrency, date)
          const free_cash_flow_converted = await convertValueToMultipleCurrencies(supabase, free_cash_flow_orig, reportedCurrency, date)
          const dividends_paid_converted = await convertValueToMultipleCurrencies(supabase, dividends_paid_orig, reportedCurrency, date)
          const other_adjustments_converted = await convertValueToMultipleCurrencies(supabase, other_adjustments_net_income_orig, reportedCurrency, date)
          const income_tax_expense_converted = await convertValueToMultipleCurrencies(supabase, income_tax_expense_orig, reportedCurrency, date)
          const income_before_tax_converted = await convertValueToMultipleCurrencies(supabase, income_before_tax_orig, reportedCurrency, date)
          const research_and_development_expenses_converted = await convertValueToMultipleCurrencies(supabase, research_and_development_expenses_orig, reportedCurrency, date)
          const total_other_income_expenses_net_converted = await convertValueToMultipleCurrencies(supabase, total_other_income_expenses_net_orig, reportedCurrency, date)

          const record = {
            stock_id: null, // We'll rely on symbol lookup in queries
            date,
            period: period === 'FY' ? 'quarter' : period.toLowerCase(), // Normalize period
            reported_currency: reportedCurrency,

            // Original values
            revenue_orig,
            ebitda_orig,
            ebit_orig,
            net_income_orig,
            eps_diluted_orig,
            total_current_assets_orig,
            total_assets_orig,
            total_current_liabilities_orig,
            total_debt_orig,
            total_stockholders_equity_orig,
            cash_and_equivalents_orig,
            interest_expense_orig,
            operating_cash_flow_orig,
            capital_expenditure_orig,
            free_cash_flow_orig,
            dividends_paid_orig,
            other_adjustments_net_income_orig,
            income_tax_expense_orig,
            income_before_tax_orig,
            research_and_development_expenses_orig,
            total_other_income_expenses_net_orig,

            // USD converted values
            revenue_usd: revenue_converted.USD,
            ebitda_usd: ebitda_converted.USD,
            ebit_usd: ebit_converted.USD,
            net_income_usd: net_income_converted.USD,
            eps_diluted_usd: eps_diluted_converted.USD,
            total_current_assets_usd: total_current_assets_converted.USD,
            total_assets_usd: total_assets_converted.USD,
            total_current_liabilities_usd: total_current_liabilities_converted.USD,
            total_debt_usd: total_debt_converted.USD,
            total_stockholders_equity_usd: total_stockholders_equity_converted.USD,
            cash_and_equivalents_usd: cash_and_equivalents_converted.USD,
            interest_expense_usd: interest_expense_converted.USD,
            operating_cash_flow_usd: operating_cash_flow_converted.USD,
            capital_expenditure_usd: capital_expenditure_converted.USD,
            free_cash_flow_usd: free_cash_flow_converted.USD,
            dividends_paid_usd: dividends_paid_converted.USD,
            other_adjustments_net_income_usd: other_adjustments_converted.USD,
            income_tax_expense_usd: income_tax_expense_converted.USD,
            income_before_tax_usd: income_before_tax_converted.USD,
            research_and_development_expenses_usd: research_and_development_expenses_converted.USD,
            total_other_income_expenses_net_usd: total_other_income_expenses_net_converted.USD,

            // EUR converted values
            revenue_eur: revenue_converted.EUR,
            ebitda_eur: ebitda_converted.EUR,
            ebit_eur: ebit_converted.EUR,
            net_income_eur: net_income_converted.EUR,
            eps_diluted_eur: eps_diluted_converted.EUR,
            total_current_assets_eur: total_current_assets_converted.EUR,
            total_assets_eur: total_assets_converted.EUR,
            total_current_liabilities_eur: total_current_liabilities_converted.EUR,
            total_debt_eur: total_debt_converted.EUR,
            total_stockholders_equity_eur: total_stockholders_equity_converted.EUR,
            cash_and_equivalents_eur: cash_and_equivalents_converted.EUR,
            interest_expense_eur: interest_expense_converted.EUR,
            operating_cash_flow_eur: operating_cash_flow_converted.EUR,
            capital_expenditure_eur: capital_expenditure_converted.EUR,
            free_cash_flow_eur: free_cash_flow_converted.EUR,
            dividends_paid_eur: dividends_paid_converted.EUR,
            other_adjustments_net_income_eur: other_adjustments_converted.EUR,
            income_tax_expense_eur: income_tax_expense_converted.EUR,
            income_before_tax_eur: income_before_tax_converted.EUR,
            research_and_development_expenses_eur: research_and_development_expenses_converted.EUR,
            total_other_income_expenses_net_eur: total_other_income_expenses_net_converted.EUR,

            // Additional fields
            weighted_avg_shares_dil,
            revenue: revenue_converted.USD, // Default to USD for backward compatibility
            ebitda: ebitda_converted.USD,
            ebit: ebit_converted.USD,
            net_income: net_income_converted.USD,
            eps_diluted: eps_diluted_converted.USD,
            total_current_assets: total_current_assets_converted.USD,
            total_assets: total_assets_converted.USD,
            total_current_liabilities: total_current_liabilities_converted.USD,
            total_debt: total_debt_converted.USD,
            total_stockholders_equity: total_stockholders_equity_converted.USD,
            cash_and_equivalents: cash_and_equivalents_converted.USD,
            interest_expense: interest_expense_converted.USD,
            operating_cash_flow: operating_cash_flow_converted.USD,
            capital_expenditure: capital_expenditure_converted.USD,
            free_cash_flow: free_cash_flow_converted.USD,
            dividends_paid: dividends_paid_converted.USD,
            other_adjustments_net_income: other_adjustments_converted.USD,
            income_tax_expense: income_tax_expense_converted.USD,
            income_before_tax: income_before_tax_converted.USD,

            // Company metrics
            beta,
            market_cap: marketCap,
          }

          records.push(record)
        }

        // Insert in batches of 100
        const batchSize = 100
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize)
          const { error: insertError } = await supabase
            .from('financial_statements')
            .upsert(batch, { 
              onConflict: 'date,period',
              ignoreDuplicates: true 
            })

          if (insertError) {
            console.error(`  ❌ Error inserting batch for ${stock.symbol}:`, insertError.message)
            errors.push(`${stock.symbol}: ${insertError.message}`)
          } else {
            totalInserted += batch.length
          }
        }

        console.log(`  ✅ Processed ${records.length} records for ${stock.symbol}`)
        totalProcessed++

        // Rate limit: 750 calls/minute = 80ms per call, but we make 6 calls per stock
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        const errorMsg = `Error processing ${stock.symbol}: ${error?.message || 'Unknown error'}`
        console.error(`  ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`\n✅ Import complete: ${totalProcessed} stocks processed, ${totalInserted} records inserted`)
    if (errors.length > 0) {
      console.log(`⚠️ Encountered ${errors.length} errors`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        totalInserted,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Fatal error importing historical financials:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
