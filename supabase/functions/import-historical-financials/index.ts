import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TARGET_CURRENCIES = ['USD', 'GBP', 'JPY', 'AUD', 'CNY', 'MXN', 'DKK']

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
      gbp: null,
      jpy: null,
      aud: null,
      cny: null,
      mxn: null,
      dkk: null,
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
            
            // Revenue with all currencies
            revenue_orig: revenue.orig,
            revenue_usd: revenue.usd,
            revenue_gbp: revenue.gbp,
            revenue_jpy: revenue.jpy,
            revenue_aud: revenue.aud,
            revenue_cny: revenue.cny,
            revenue_mxn: revenue.mxn,
            revenue_dkk: revenue.dkk,
            
            // EBITDA
            ebitda_orig: ebitda.orig,
            ebitda_usd: ebitda.usd,
            ebitda_gbp: ebitda.gbp,
            ebitda_jpy: ebitda.jpy,
            ebitda_aud: ebitda.aud,
            ebitda_cny: ebitda.cny,
            ebitda_mxn: ebitda.mxn,
            ebitda_dkk: ebitda.dkk,
            
            // EBIT
            ebit_orig: ebit.orig,
            ebit_usd: ebit.usd,
            ebit_gbp: ebit.gbp,
            ebit_jpy: ebit.jpy,
            ebit_aud: ebit.aud,
            ebit_cny: ebit.cny,
            ebit_mxn: ebit.mxn,
            ebit_dkk: ebit.dkk,
            
            // Net Income
            net_income_orig: netIncome.orig,
            net_income_usd: netIncome.usd,
            net_income_gbp: netIncome.gbp,
            net_income_jpy: netIncome.jpy,
            net_income_aud: netIncome.aud,
            net_income_cny: netIncome.cny,
            net_income_mxn: netIncome.mxn,
            net_income_dkk: netIncome.dkk,
            
            // EPS Diluted
            eps_diluted_orig: epsDiluted.orig,
            eps_diluted_usd: epsDiluted.usd,
            eps_diluted_gbp: epsDiluted.gbp,
            eps_diluted_jpy: epsDiluted.jpy,
            eps_diluted_aud: epsDiluted.aud,
            eps_diluted_cny: epsDiluted.cny,
            eps_diluted_mxn: epsDiluted.mxn,
            eps_diluted_dkk: epsDiluted.dkk,
            
            // Shares
            weighted_avg_shares_dil: data.weightedAverageShsOutDil,
            
            // Total Current Assets
            total_current_assets_orig: totalCurrentAssets.orig,
            total_current_assets_usd: totalCurrentAssets.usd,
            total_current_assets_gbp: totalCurrentAssets.gbp,
            total_current_assets_jpy: totalCurrentAssets.jpy,
            total_current_assets_aud: totalCurrentAssets.aud,
            total_current_assets_cny: totalCurrentAssets.cny,
            total_current_assets_mxn: totalCurrentAssets.mxn,
            total_current_assets_dkk: totalCurrentAssets.dkk,
            
            // Total Assets
            total_assets_orig: totalAssets.orig,
            total_assets_usd: totalAssets.usd,
            total_assets_gbp: totalAssets.gbp,
            total_assets_jpy: totalAssets.jpy,
            total_assets_aud: totalAssets.aud,
            total_assets_cny: totalAssets.cny,
            total_assets_mxn: totalAssets.mxn,
            total_assets_dkk: totalAssets.dkk,
            
            // Total Current Liabilities
            total_current_liabilities_orig: totalCurrentLiabilities.orig,
            total_current_liabilities_usd: totalCurrentLiabilities.usd,
            total_current_liabilities_gbp: totalCurrentLiabilities.gbp,
            total_current_liabilities_jpy: totalCurrentLiabilities.jpy,
            total_current_liabilities_aud: totalCurrentLiabilities.aud,
            total_current_liabilities_cny: totalCurrentLiabilities.cny,
            total_current_liabilities_mxn: totalCurrentLiabilities.mxn,
            total_current_liabilities_dkk: totalCurrentLiabilities.dkk,
            
            // Total Debt
            total_debt_orig: totalDebt.orig,
            total_debt_usd: totalDebt.usd,
            total_debt_gbp: totalDebt.gbp,
            total_debt_jpy: totalDebt.jpy,
            total_debt_aud: totalDebt.aud,
            total_debt_cny: totalDebt.cny,
            total_debt_mxn: totalDebt.mxn,
            total_debt_dkk: totalDebt.dkk,
            
            // Total Stockholders Equity
            total_stockholders_equity_orig: totalStockholdersEquity.orig,
            total_stockholders_equity_usd: totalStockholdersEquity.usd,
            total_stockholders_equity_gbp: totalStockholdersEquity.gbp,
            total_stockholders_equity_jpy: totalStockholdersEquity.jpy,
            total_stockholders_equity_aud: totalStockholdersEquity.aud,
            total_stockholders_equity_cny: totalStockholdersEquity.cny,
            total_stockholders_equity_mxn: totalStockholdersEquity.mxn,
            total_stockholders_equity_dkk: totalStockholdersEquity.dkk,
            
            // Cash and Equivalents
            cash_and_equivalents_orig: cashAndEquivalents.orig,
            cash_and_equivalents_usd: cashAndEquivalents.usd,
            cash_and_equivalents_gbp: cashAndEquivalents.gbp,
            cash_and_equivalents_jpy: cashAndEquivalents.jpy,
            cash_and_equivalents_aud: cashAndEquivalents.aud,
            cash_and_equivalents_cny: cashAndEquivalents.cny,
            cash_and_equivalents_mxn: cashAndEquivalents.mxn,
            cash_and_equivalents_dkk: cashAndEquivalents.dkk,
            
            // Interest Expense
            interest_expense_orig: interestExpense.orig,
            interest_expense_usd: interestExpense.usd,
            interest_expense_gbp: interestExpense.gbp,
            interest_expense_jpy: interestExpense.jpy,
            interest_expense_aud: interestExpense.aud,
            interest_expense_cny: interestExpense.cny,
            interest_expense_mxn: interestExpense.mxn,
            interest_expense_dkk: interestExpense.dkk,
            
            // Operating Cash Flow
            operating_cash_flow_orig: operatingCashFlow.orig,
            operating_cash_flow_usd: operatingCashFlow.usd,
            operating_cash_flow_gbp: operatingCashFlow.gbp,
            operating_cash_flow_jpy: operatingCashFlow.jpy,
            operating_cash_flow_aud: operatingCashFlow.aud,
            operating_cash_flow_cny: operatingCashFlow.cny,
            operating_cash_flow_mxn: operatingCashFlow.mxn,
            operating_cash_flow_dkk: operatingCashFlow.dkk,
            
            // Capital Expenditure
            capital_expenditure_orig: capex.orig,
            capital_expenditure_usd: capex.usd,
            capital_expenditure_gbp: capex.gbp,
            capital_expenditure_jpy: capex.jpy,
            capital_expenditure_aud: capex.aud,
            capital_expenditure_cny: capex.cny,
            capital_expenditure_mxn: capex.mxn,
            capital_expenditure_dkk: capex.dkk,
            
            // Free Cash Flow
            free_cash_flow_orig: freeCashFlow.orig,
            free_cash_flow_usd: freeCashFlow.usd,
            free_cash_flow_gbp: freeCashFlow.gbp,
            free_cash_flow_jpy: freeCashFlow.jpy,
            free_cash_flow_aud: freeCashFlow.aud,
            free_cash_flow_cny: freeCashFlow.cny,
            free_cash_flow_mxn: freeCashFlow.mxn,
            free_cash_flow_dkk: freeCashFlow.dkk,
            
            // Dividends Paid
            dividends_paid_orig: dividendsPaid.orig,
            dividends_paid_usd: dividendsPaid.usd,
            dividends_paid_gbp: dividendsPaid.gbp,
            dividends_paid_jpy: dividendsPaid.jpy,
            dividends_paid_aud: dividendsPaid.aud,
            dividends_paid_cny: dividendsPaid.cny,
            dividends_paid_mxn: dividendsPaid.mxn,
            dividends_paid_dkk: dividendsPaid.dkk,
            
            // Other Adjustments
            other_adjustments_net_income_orig: otherAdjustments.orig,
            other_adjustments_net_income_usd: otherAdjustments.usd,
            other_adjustments_net_income_gbp: otherAdjustments.gbp,
            other_adjustments_net_income_jpy: otherAdjustments.jpy,
            other_adjustments_net_income_aud: otherAdjustments.aud,
            other_adjustments_net_income_cny: otherAdjustments.cny,
            other_adjustments_net_income_mxn: otherAdjustments.mxn,
            other_adjustments_net_income_dkk: otherAdjustments.dkk,
            
            // Income Tax Expense
            income_tax_expense_orig: incomeTaxExpense.orig,
            income_tax_expense_usd: incomeTaxExpense.usd,
            income_tax_expense_gbp: incomeTaxExpense.gbp,
            income_tax_expense_jpy: incomeTaxExpense.jpy,
            income_tax_expense_aud: incomeTaxExpense.aud,
            income_tax_expense_cny: incomeTaxExpense.cny,
            income_tax_expense_mxn: incomeTaxExpense.mxn,
            income_tax_expense_dkk: incomeTaxExpense.dkk,
            
            // Income Before Tax
            income_before_tax_orig: incomeBeforeTax.orig,
            income_before_tax_usd: incomeBeforeTax.usd,
            income_before_tax_gbp: incomeBeforeTax.gbp,
            income_before_tax_jpy: incomeBeforeTax.jpy,
            income_before_tax_aud: incomeBeforeTax.aud,
            income_before_tax_cny: incomeBeforeTax.cny,
            income_before_tax_mxn: incomeBeforeTax.mxn,
            income_before_tax_dkk: incomeBeforeTax.dkk,
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
