import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TARGET_CURRENCIES = ['USD', 'EUR']

async function getExchangeRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string,
  date: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0

  // Try to get historical rate from exchange_rates table
  const { data: rateData } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', fromCurrency)
    .eq('target_currency', toCurrency)
    .lte('fetched_at', date)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rateData?.rate) {
    return Number(rateData.rate)
  }

  // Fallback: Try to get the inverse rate
  const { data: inverseRate } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', toCurrency)
    .eq('target_currency', fromCurrency)
    .lte('fetched_at', date)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inverseRate?.rate) {
    return 1.0 / Number(inverseRate.rate)
  }

  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency} on ${date}, using 1.0`)
  return 1.0
}

async function convertValueToMultipleCurrencies(
  supabase: any,
  value: number | null | undefined,
  fromCurrency: string,
  date: string
): Promise<Record<string, number | null>> {
  if (!value || value === null) {
    return {
      orig: null,
      usd: null,
      eur: null,
    }
  }

  const result: Record<string, number | null> = { orig: value }

  for (const currency of TARGET_CURRENCIES) {
    const rate = await getExchangeRate(supabase, fromCurrency, currency, date)
    result[currency.toLowerCase()] = value * rate
  }

  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { testMode = false, testSymbol = null } = await req.json()
    
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
    if (!FMP_API_KEY) {
      throw new Error('FMP_API_KEY not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting historical financial data import (testMode: ${testMode}, testSymbol: ${testSymbol})`)

    // Get stocks to process
    let stocksQuery = supabase.from('stocks').select('id, symbol')
    
    if (testMode && testSymbol) {
      stocksQuery = stocksQuery.eq('symbol', testSymbol)
    }

    const { data: stocks, error: stocksError } = await stocksQuery

    if (stocksError) {
      throw new Error(`Failed to fetch stocks: ${stocksError.message}`)
    }

    if (!stocks || stocks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No stocks found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log(`Processing ${stocks.length} stocks`)

    let totalProcessed = 0
    let totalInserted = 0
    let totalErrors = 0

    // Process each stock
    for (const stock of stocks) {
      try {
        console.log(`Processing ${stock.symbol}...`)

        // Fetch quarterly data from FMP
        const [incomeQuarterly, balanceQuarterly, cashflowQuarterly] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?period=quarter&limit=400&apikey=${FMP_API_KEY}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?period=quarter&limit=400&apikey=${FMP_API_KEY}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?period=quarter&limit=400&apikey=${FMP_API_KEY}`).then(r => r.json())
        ])

        // Fetch TTM data from FMP
        const [incomeTTM, balanceTTM, cashflowTTM] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${stock.symbol}?period=ttm&limit=1&apikey=${FMP_API_KEY}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${stock.symbol}?period=ttm&limit=1&apikey=${FMP_API_KEY}`).then(r => r.json()),
          fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${stock.symbol}?period=ttm&limit=1&apikey=${FMP_API_KEY}`).then(r => r.json())
        ])

        // Combine quarterly and TTM data
        const allIncome = [...(Array.isArray(incomeQuarterly) ? incomeQuarterly : []), ...(Array.isArray(incomeTTM) ? incomeTTM : [])]
        const allBalance = [...(Array.isArray(balanceQuarterly) ? balanceQuarterly : []), ...(Array.isArray(balanceTTM) ? balanceTTM : [])]
        const allCashflow = [...(Array.isArray(cashflowQuarterly) ? cashflowQuarterly : []), ...(Array.isArray(cashflowTTM) ? cashflowTTM : [])]

        // Merge data by date and period
        const dataByKey = new Map<string, any>()

        allIncome.forEach((item: any) => {
          const period = item.period === 'FY' ? 'ttm' : 'quarter'
          const key = `${item.date}_${period}`
          if (!dataByKey.has(key)) {
            dataByKey.set(key, { date: item.date, period, reportedCurrency: item.reportedCurrency || 'USD' })
          }
          const data = dataByKey.get(key)
          Object.assign(data, {
            revenue: item.revenue,
            ebitda: item.ebitda,
            operatingIncome: item.operatingIncome,
            netIncome: item.netIncome,
            epsdiluted: item.epsdiluted,
            weightedAverageShsOutDil: item.weightedAverageShsOutDil,
            interestExpense: item.interestExpense,
            incomeTaxExpense: item.incomeTaxExpense,
            incomeBeforeTax: item.incomeBeforeTax,
            otherNonOperatingIncomeExpenses: item.otherNonOperatingIncomeExpenses
          })
        })

        allBalance.forEach((item: any) => {
          const period = item.period === 'FY' ? 'ttm' : 'quarter'
          const key = `${item.date}_${period}`
          if (!dataByKey.has(key)) {
            dataByKey.set(key, { date: item.date, period, reportedCurrency: item.reportedCurrency || 'USD' })
          }
          const data = dataByKey.get(key)
          Object.assign(data, {
            totalCurrentAssets: item.totalCurrentAssets,
            totalAssets: item.totalAssets,
            totalCurrentLiabilities: item.totalCurrentLiabilities,
            totalDebt: item.totalDebt,
            totalStockholdersEquity: item.totalStockholdersEquity,
            cashAndCashEquivalents: item.cashAndCashEquivalents
          })
        })

        allCashflow.forEach((item: any) => {
          const period = item.period === 'FY' ? 'ttm' : 'quarter'
          const key = `${item.date}_${period}`
          if (!dataByKey.has(key)) {
            dataByKey.set(key, { date: item.date, period, reportedCurrency: item.reportedCurrency || 'USD' })
          }
          const data = dataByKey.get(key)
          Object.assign(data, {
            operatingCashFlow: item.operatingCashFlow,
            capitalExpenditure: item.capitalExpenditure,
            freeCashFlow: item.freeCashFlow,
            dividendsPaid: item.dividendsPaid || item.commonStockDividendsPaid
          })
        })

        const rowsToInsert = []

        // Process each merged record
        for (const [key, data] of dataByKey) {
          const reportedCurrency = data.reportedCurrency || 'USD'
          const date = data.date
          const period = data.period

          // Convert all monetary values to multiple currencies
          const revenue = await convertValueToMultipleCurrencies(supabase, data.revenue, reportedCurrency, date)
          const ebitda = await convertValueToMultipleCurrencies(supabase, data.ebitda, reportedCurrency, date)
          const ebit = await convertValueToMultipleCurrencies(supabase, data.operatingIncome, reportedCurrency, date)
          const netIncome = await convertValueToMultipleCurrencies(supabase, data.netIncome, reportedCurrency, date)
          const epsDiluted = await convertValueToMultipleCurrencies(supabase, data.epsdiluted, reportedCurrency, date)
          const totalCurrentAssets = await convertValueToMultipleCurrencies(supabase, data.totalCurrentAssets, reportedCurrency, date)
          const totalAssets = await convertValueToMultipleCurrencies(supabase, data.totalAssets, reportedCurrency, date)
          const totalCurrentLiabilities = await convertValueToMultipleCurrencies(supabase, data.totalCurrentLiabilities, reportedCurrency, date)
          const totalDebt = await convertValueToMultipleCurrencies(supabase, data.totalDebt, reportedCurrency, date)
          const totalStockholdersEquity = await convertValueToMultipleCurrencies(supabase, data.totalStockholdersEquity, reportedCurrency, date)
          const cashAndEquivalents = await convertValueToMultipleCurrencies(supabase, data.cashAndCashEquivalents, reportedCurrency, date)
          const interestExpense = await convertValueToMultipleCurrencies(supabase, data.interestExpense, reportedCurrency, date)
          const operatingCashFlow = await convertValueToMultipleCurrencies(supabase, data.operatingCashFlow, reportedCurrency, date)
          const capex = await convertValueToMultipleCurrencies(supabase, data.capitalExpenditure, reportedCurrency, date)
          const freeCashFlow = await convertValueToMultipleCurrencies(supabase, data.freeCashFlow, reportedCurrency, date)
          const dividendsPaid = await convertValueToMultipleCurrencies(supabase, data.dividendsPaid, reportedCurrency, date)
          const otherAdjustments = await convertValueToMultipleCurrencies(supabase, data.otherNonOperatingIncomeExpenses, reportedCurrency, date)
          const incomeTaxExpense = await convertValueToMultipleCurrencies(supabase, data.incomeTaxExpense, reportedCurrency, date)
          const incomeBeforeTax = await convertValueToMultipleCurrencies(supabase, data.incomeBeforeTax, reportedCurrency, date)

          const row = {
            stock_id: stock.id,
            date,
            period,
            reported_currency: reportedCurrency,
            
            // Revenue
            revenue_orig: revenue.orig,
            revenue_usd: revenue.usd,
            revenue_eur: revenue.eur,
            
            // EBITDA
            ebitda_orig: ebitda.orig,
            ebitda_usd: ebitda.usd,
            ebitda_eur: ebitda.eur,
            
            // EBIT
            ebit_orig: ebit.orig,
            ebit_usd: ebit.usd,
            ebit_eur: ebit.eur,
            
            // Net Income
            net_income_orig: netIncome.orig,
            net_income_usd: netIncome.usd,
            net_income_eur: netIncome.eur,
            
            // EPS Diluted
            eps_diluted_orig: epsDiluted.orig,
            eps_diluted_usd: epsDiluted.usd,
            eps_diluted_eur: epsDiluted.eur,
            
            // Shares
            weighted_avg_shares_dil: data.weightedAverageShsOutDil,
            
            // Total Current Assets
            total_current_assets_orig: totalCurrentAssets.orig,
            total_current_assets_usd: totalCurrentAssets.usd,
            total_current_assets_eur: totalCurrentAssets.eur,
            
            // Total Assets
            total_assets_orig: totalAssets.orig,
            total_assets_usd: totalAssets.usd,
            total_assets_eur: totalAssets.eur,
            
            // Total Current Liabilities
            total_current_liabilities_orig: totalCurrentLiabilities.orig,
            total_current_liabilities_usd: totalCurrentLiabilities.usd,
            total_current_liabilities_eur: totalCurrentLiabilities.eur,
            
            // Total Debt
            total_debt_orig: totalDebt.orig,
            total_debt_usd: totalDebt.usd,
            total_debt_eur: totalDebt.eur,
            
            // Total Stockholders Equity
            total_stockholders_equity_orig: totalStockholdersEquity.orig,
            total_stockholders_equity_usd: totalStockholdersEquity.usd,
            total_stockholders_equity_eur: totalStockholdersEquity.eur,
            
            // Cash and Equivalents
            cash_and_equivalents_orig: cashAndEquivalents.orig,
            cash_and_equivalents_usd: cashAndEquivalents.usd,
            cash_and_equivalents_eur: cashAndEquivalents.eur,
            
            // Interest Expense
            interest_expense_orig: interestExpense.orig,
            interest_expense_usd: interestExpense.usd,
            interest_expense_eur: interestExpense.eur,
            
            // Operating Cash Flow
            operating_cash_flow_orig: operatingCashFlow.orig,
            operating_cash_flow_usd: operatingCashFlow.usd,
            operating_cash_flow_eur: operatingCashFlow.eur,
            
            // Capital Expenditure
            capital_expenditure_orig: capex.orig,
            capital_expenditure_usd: capex.usd,
            capital_expenditure_eur: capex.eur,
            
            // Free Cash Flow
            free_cash_flow_orig: freeCashFlow.orig,
            free_cash_flow_usd: freeCashFlow.usd,
            free_cash_flow_eur: freeCashFlow.eur,
            
            // Dividends Paid
            dividends_paid_orig: dividendsPaid.orig,
            dividends_paid_usd: dividendsPaid.usd,
            dividends_paid_eur: dividendsPaid.eur,
            
            // Other Adjustments
            other_adjustments_net_income_orig: otherAdjustments.orig,
            other_adjustments_net_income_usd: otherAdjustments.usd,
            other_adjustments_net_income_eur: otherAdjustments.eur,
            
            // Income Tax Expense
            income_tax_expense_orig: incomeTaxExpense.orig,
            income_tax_expense_usd: incomeTaxExpense.usd,
            income_tax_expense_eur: incomeTaxExpense.eur,
            
            // Income Before Tax
            income_before_tax_orig: incomeBeforeTax.orig,
            income_before_tax_usd: incomeBeforeTax.usd,
            income_before_tax_eur: incomeBeforeTax.eur,
          }

          rowsToInsert.push(row)
        }

        // Insert in batches of 100 with ON CONFLICT DO NOTHING
        const BATCH_SIZE = 100
        for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
          const batch = rowsToInsert.slice(i, i + BATCH_SIZE)
          
          const { error: insertError } = await supabase
            .from('financial_statements')
            .upsert(batch, {
              onConflict: 'stock_id,date,period',
              ignoreDuplicates: true
            })

          if (insertError) {
            console.error(`Error inserting batch for ${stock.symbol}:`, insertError)
            totalErrors++
          } else {
            totalInserted += batch.length
          }
        }

        totalProcessed++
        console.log(`✓ Processed ${stock.symbol}: ${rowsToInsert.length} records`)

        // Rate limiting: wait 100ms between stocks, longer every 10 stocks
        if (totalProcessed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (error) {
        console.error(`Error processing ${stock.symbol}:`, error)
        totalErrors++
      }
    }

    const summary = {
      success: true,
      totalProcessed,
      totalInserted,
      totalErrors,
      testMode,
      testSymbol
    }

    console.log('Import completed:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Import failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
