import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TARGET_CURRENCIES = ['USD', 'EUR']

/**
 * Get exchange rate from database for a specific date (with caching)
 */
async function getExchangeRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string,
  date: string,
  cache: Map<string, number>
): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0

  const cacheKey = `${fromCurrency}-${toCurrency}-${date}`
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }

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

  if (directRate) {
    cache.set(cacheKey, directRate.rate)
    return directRate.rate
  }

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
    const rate = 1 / inverseRate.rate
    cache.set(cacheKey, rate)
    return rate
  }

  // If not found, try to fetch from FMP with 7-day backward fallback
  console.warn(`⚠️ No rate found for ${fromCurrency} to ${toCurrency} on ${date}, searching backwards...`)
  const fmpApiKey = Deno.env.get('FMP_API_KEY')
  const pair = `${fromCurrency}${toCurrency}`
  
  for (let daysBack = 0; daysBack <= 7; daysBack++) {
    const searchDate = new Date(date)
    searchDate.setDate(searchDate.getDate() - daysBack)
    const searchDateStr = searchDate.toISOString().split('T')[0]
    
    try {
      const url = `https://financialmodelingprep.com/api/v3/historical-price-full/forex/${pair}?from=${searchDateStr}&to=${searchDateStr}&apikey=${fmpApiKey}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data: any = await response.json()
        const historical = data?.historical || []
        
        if (historical.length > 0) {
          const rate = Number(historical[0].close || historical[0].adjClose || historical[0].price)
          if (Number.isFinite(rate)) {
            console.log(`  ✓ Found rate for ${pair} on ${searchDateStr} (${daysBack} days back)`)
            await supabase.from('exchange_rates').upsert({
              base_currency: fromCurrency,
              target_currency: toCurrency,
              valid_date: date,
              rate: rate,
              fetched_at: new Date().toISOString(),
              is_fallback: daysBack > 0,
            }, { onConflict: 'base_currency,target_currency,valid_date' })
            cache.set(cacheKey, rate)
            return rate
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching rate from FMP for ${searchDateStr}: ${error}`)
    }
  }

  throw new Error(`Could not find exchange rate for ${fromCurrency} to ${toCurrency} on ${date}`)
}

/**
 * Convert value to multiple currencies (with caching)
 */
async function convertValueToMultipleCurrencies(
  supabase: any,
  value: number | null | undefined,
  fromCurrency: string,
  date: string,
  cache: Map<string, number>
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
        const rate = await getExchangeRate(supabase, fromCurrency, targetCurrency, date, cache)
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
    const body = await req.json().catch(() => ({}))
    
    let testMode = body.testMode || body.testmode || false
    let testSymbol = body.testSymbol || body.testSymbols || null
    if (Array.isArray(testSymbol) && testSymbol.length > 0) {
      testSymbol = testSymbol[0]
    }
    
    if (testSymbol) {
      testMode = true
    }

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

        // Fetch quarterly and annual data
        const [incomeQ, balanceQ, cashflowQ, incomeY, balanceY, cashflowY] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?period=quarter&limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?limit=400&apikey=${fmpApiKey}`).then(r => r.json()),
        ])

        console.log(`  📊 API Data: Income Q=${Array.isArray(incomeQ) ? incomeQ.length : 0}, Balance Q=${Array.isArray(balanceQ) ? balanceQ.length : 0}, Cashflow Q=${Array.isArray(cashflowQ) ? cashflowQ.length : 0}`)
        console.log(`  📊 API Data: Income Y=${Array.isArray(incomeY) ? incomeY.length : 0}, Balance Y=${Array.isArray(balanceY) ? balanceY.length : 0}, Cashflow Y=${Array.isArray(cashflowY) ? cashflowY.length : 0}`)

        // Merge quarterly + annual data
        const allIncome = [...(Array.isArray(incomeQ) ? incomeQ : []), ...(Array.isArray(incomeY) ? incomeY : [])]
        const allBalance = [...(Array.isArray(balanceQ) ? balanceQ : []), ...(Array.isArray(balanceY) ? balanceY : [])]
        const allCashflow = [...(Array.isArray(cashflowQ) ? cashflowQ : []), ...(Array.isArray(cashflowY) ? cashflowY : [])]

        if (allIncome.length === 0) {
          console.warn(`  ⚠️ No financial data found for ${stock.symbol}`)
          continue
        }

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

        // Process and build records for each table
        const incomeRecords = []
        const balanceRecords = []
        const cashflowRecords = []
        
        // Create exchange rate cache for this stock
        const exchangeRateCache = new Map<string, number>()

        for (const [key, data] of dataByDatePeriod) {
          const { income, balance, cashflow, date, period, reportedCurrency } = data

          if (!date) continue

          // Build Income Statement Record
          if (income) {
            const incomeRecord: any = {
              symbol: stock.symbol,
              date,
              period: period,
              reported_currency: reportedCurrency,
              cik: income.cik,
              filing_date: income.filingDate,
              accepted_date: income.acceptedDate,
              fiscal_year: income.fiscalYear,
            }

            // Income Statement fields with currency conversion
            const incomeFields = [
              'revenue', 'costOfRevenue', 'grossProfit', 'researchAndDevelopmentExpenses',
              'generalAndAdministrativeExpenses', 'sellingAndMarketingExpenses',
              'sellingGeneralAndAdministrativeExpenses', 'otherExpenses', 'operatingExpenses',
              'costAndExpenses', 'netInterestIncome', 'interestIncome', 'interestExpense',
              'depreciationAndAmortization', 'ebitda', 'ebit', 'nonOperatingIncomeExcludingInterest',
              'operatingIncome', 'totalOtherIncomeExpensesNet', 'incomeBeforeTax', 'incomeTaxExpense',
              'netIncomeFromContinuingOperations', 'netIncomeFromDiscontinuedOperations',
              'otherAdjustmentsToNetIncome', 'netIncome', 'netIncomeDeductions', 'bottomLineNetIncome'
            ]

            for (const field of incomeFields) {
              const value = income[field]
              const converted = await convertValueToMultipleCurrencies(supabase, value, reportedCurrency, date, exchangeRateCache)
              // Convert camelCase to snake_case and remove leading underscore
              const fieldName = field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
              incomeRecord[`${fieldName}_orig`] = value
              incomeRecord[`${fieldName}_usd`] = converted.USD
              incomeRecord[`${fieldName}_eur`] = converted.EUR
            }

            // Non-currency fields
            incomeRecord.eps = income.eps
            incomeRecord.eps_diluted = income.epsdiluted
            incomeRecord.weighted_average_shs_out = income.weightedAverageShsOut
            incomeRecord.weighted_average_shs_out_dil = income.weightedAverageShsOutDil

            incomeRecords.push(incomeRecord)
          }

          // Build Balance Sheet Record
          if (balance) {
            const balanceRecord: any = {
              symbol: stock.symbol,
              date,
              period: period,
              reported_currency: reportedCurrency,
              cik: balance.cik,
              filing_date: balance.filingDate,
              accepted_date: balance.acceptedDate,
              fiscal_year: balance.fiscalYear,
            }

            // Balance Sheet fields with currency conversion
            const balanceFields = [
              'cashAndCashEquivalents', 'shortTermInvestments', 'cashAndShortTermInvestments',
              'netReceivables', 'accountsReceivables', 'otherReceivables', 'inventory', 'prepaids',
              'otherCurrentAssets', 'totalCurrentAssets', 'propertyPlantEquipmentNet', 'goodwill',
              'intangibleAssets', 'goodwillAndIntangibleAssets', 'longTermInvestments', 'taxAssets',
              'otherNonCurrentAssets', 'totalNonCurrentAssets', 'otherAssets', 'totalAssets',
              'totalPayables', 'accountPayables', 'otherPayables', 'accruedExpenses', 'shortTermDebt',
              'capitalLeaseObligationsCurrent', 'taxPayables', 'deferredRevenue', 'otherCurrentLiabilities',
              'totalCurrentLiabilities', 'longTermDebt', 'capitalLeaseObligationsNonCurrent',
              'deferredRevenueNonCurrent', 'deferredTaxLiabilitiesNonCurrent', 'otherNonCurrentLiabilities',
              'totalNonCurrentLiabilities', 'otherLiabilities', 'capitalLeaseObligations', 'totalLiabilities',
              'treasuryStock', 'preferredStock', 'commonStock', 'retainedEarnings', 'additionalPaidInCapital',
              'accumulatedOtherComprehensiveIncomeLoss', 'otherTotalStockholdersEquity', 'totalStockholdersEquity',
              'totalEquity', 'minorityInterest', 'totalLiabilitiesAndTotalEquity', 'totalInvestments',
              'totalDebt', 'netDebt'
            ]

            for (const field of balanceFields) {
              const value = balance[field]
              const converted = await convertValueToMultipleCurrencies(supabase, value, reportedCurrency, date, exchangeRateCache)
              // Convert camelCase to snake_case and remove leading underscore
              const fieldName = field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
              balanceRecord[`${fieldName}_orig`] = value
              balanceRecord[`${fieldName}_usd`] = converted.USD
              balanceRecord[`${fieldName}_eur`] = converted.EUR
            }

            balanceRecords.push(balanceRecord)
          }

          // Build Cash Flow Statement Record
          if (cashflow) {
            const cashflowRecord: any = {
              symbol: stock.symbol,
              date,
              period: period,
              reported_currency: reportedCurrency,
              cik: cashflow.cik,
              filing_date: cashflow.filingDate,
              accepted_date: cashflow.acceptedDate,
              fiscal_year: cashflow.fiscalYear,
            }

            // Cash Flow fields with currency conversion
            const cashflowFields = [
              'netIncome', 'depreciationAndAmortization', 'deferredIncomeTax', 'stockBasedCompensation',
              'changeInWorkingCapital', 'accountsReceivables', 'inventory', 'accountsPayables',
              'otherWorkingCapital', 'otherNonCashItems', 'netCashProvidedByOperatingActivities',
              'investmentsInPropertyPlantAndEquipment', 'acquisitionsNet', 'purchasesOfInvestments',
              'salesMaturitiesOfInvestments', 'otherInvestingActivities', 'netCashProvidedByInvestingActivities',
              'netDebtIssuance', 'longTermNetDebtIssuance', 'shortTermNetDebtIssuance', 'netStockIssuance',
              'netCommonStockIssuance', 'commonStockIssuance', 'commonStockRepurchased', 'netPreferredStockIssuance',
              'netDividendsPaid', 'commonDividendsPaid', 'preferredDividendsPaid', 'otherFinancingActivities',
              'netCashProvidedByFinancingActivities', 'effectOfForexChangesOnCash', 'netChangeInCash',
              'cashAtEndOfPeriod', 'cashAtBeginningOfPeriod', 'operatingCashFlow', 'capitalExpenditure',
              'freeCashFlow', 'incomeTaxesPaid', 'interestPaid'
            ]

            for (const field of cashflowFields) {
              const value = cashflow[field]
              const converted = await convertValueToMultipleCurrencies(supabase, value, reportedCurrency, date, exchangeRateCache)
              // Convert camelCase to snake_case and remove leading underscore
              const fieldName = field.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')
              cashflowRecord[`${fieldName}_orig`] = value
              cashflowRecord[`${fieldName}_usd`] = converted.USD
              cashflowRecord[`${fieldName}_eur`] = converted.EUR
            }

            cashflowRecords.push(cashflowRecord)
          }
        }

        console.log(`  💾 Inserting: ${incomeRecords.length} income statements, ${balanceRecords.length} balance sheets, ${cashflowRecords.length} cash flow statements`)

        // Insert into three tables in parallel
        const [incomeResult, balanceResult, cashflowResult] = await Promise.all([
          incomeRecords.length > 0 ? supabase
            .from('income_statements')
            .upsert(incomeRecords, { onConflict: 'symbol,date,period' })
            : Promise.resolve({ error: null }),
          balanceRecords.length > 0 ? supabase
            .from('balance_sheets')
            .upsert(balanceRecords, { onConflict: 'symbol,date,period' })
            : Promise.resolve({ error: null }),
          cashflowRecords.length > 0 ? supabase
            .from('cash_flow_statements')
            .upsert(cashflowRecords, { onConflict: 'symbol,date,period' })
            : Promise.resolve({ error: null })
        ])

        if (incomeResult.error) {
          console.error(`  ❌ Error inserting income statements: ${incomeResult.error.message}`)
          errors.push(`${stock.symbol}: Income statements error - ${incomeResult.error.message}`)
        }

        if (balanceResult.error) {
          console.error(`  ❌ Error inserting balance sheets: ${balanceResult.error.message}`)
          errors.push(`${stock.symbol}: Balance sheets error - ${balanceResult.error.message}`)
        }

        if (cashflowResult.error) {
          console.error(`  ❌ Error inserting cash flow statements: ${cashflowResult.error.message}`)
          errors.push(`${stock.symbol}: Cash flow statements error - ${cashflowResult.error.message}`)
        }

        if (!incomeResult.error && !balanceResult.error && !cashflowResult.error) {
          totalInserted += incomeRecords.length + balanceRecords.length + cashflowRecords.length
          totalProcessed++
          console.log(`  ✅ Successfully inserted data for ${stock.symbol}`)
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${stock.symbol}: ${error}`)
        errors.push(`${stock.symbol}: ${error.message || String(error)}`)
      }
    }

    console.log(`\n✅ Import complete: ${totalProcessed}/${stocks.length} stocks processed, ${totalInserted} records inserted`)
    
    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:')
      errors.forEach(err => console.log(`  - ${err}`))
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        total: stocks.length,
        inserted: totalInserted,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully processed ${totalProcessed}/${stocks.length} stocks with ${totalInserted} records inserted`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in import-historical-financials:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
