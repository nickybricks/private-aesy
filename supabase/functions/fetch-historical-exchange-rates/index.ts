import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Target currencies for historical data
const TARGET_CURRENCIES = [
  'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'CNY', 'KRW', 'SEK', 'NOK', 'NZD',
  'INR', 'BRL', 'ZAR', 'MXN', 'SGD', 'HKD', 'TRY', 'ILS', 'DKK', 'PLN'
]

const BASE_CURRENCIES = ['USD', 'EUR']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fmpApiKey = Deno.env.get('FMP_API_KEY')
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured')
    }

    console.log('Starting historical exchange rate fetch for 30 years...')
    
    const fromDate = '1995-01-01'
    const toDate = '2025-12-31'
    let totalUpdates = 0
    const errors: string[] = []

    // Fetch for each base currency
    for (const baseCurrency of BASE_CURRENCIES) {
      console.log(`\n📊 Fetching ${baseCurrency}-based rates...`)
      
      for (const targetCurrency of TARGET_CURRENCIES) {
        const pair = `${baseCurrency}${targetCurrency}`
        console.log(`  → Fetching ${pair}...`)
        
        try {
          const primaryUrl = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${pair}&from=${fromDate}&to=${toDate}&apikey=${fmpApiKey}`
          console.log(`    🔗 Fetching: ${primaryUrl}`)
          let response = await fetch(primaryUrl)

          if (!response.ok) {
            console.warn(`    ⚠️ Primary endpoint failed for ${pair} (${response.status}). Falling back...`)
            const fallbackUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/forex/${pair}?from=${fromDate}&to=${toDate}&apikey=${fmpApiKey}`
            response = await fetch(fallbackUrl)
          }

          if (!response.ok) {
            const errorMsg = `FMP API error for ${pair}: ${response.status}`
            console.error(errorMsg)
            errors.push(errorMsg)
            continue
          }

          const data: any = await response.json()

          const historical = Array.isArray(data?.historical)
            ? data.historical
            : Array.isArray(data)
              ? data
              : Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data?.historicalStockList?.[0]?.historical)
                  ? data.historicalStockList[0].historical
                  : []

          if (!Array.isArray(historical) || historical.length === 0) {
            console.warn(`    ⚠️ No historical data for ${pair}`)
            continue
          }

          console.log(`    ✓ Received ${historical.length} days for ${pair}`)
          
          // Prepare batch updates
          const updates = historical
            .map((day: any) => ({
              base_currency: baseCurrency,
              target_currency: targetCurrency,
              valid_date: day.date || day.dateTime || day.datetime,
              rate: Number(day.close ?? day.adjClose ?? day.price ?? day.value),
              fetched_at: new Date().toISOString(),
              is_fallback: false,
            }))
            .filter((u: any) => u.valid_date && Number.isFinite(u.rate))

          // Upsert in batches of 1000
          const batchSize = 1000
          for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize)
            const { error: upsertError } = await supabase
              .from('exchange_rates')
              .upsert(batch, { 
                onConflict: 'base_currency,target_currency,valid_date',
                ignoreDuplicates: false 
              })

            if (upsertError) {
              console.error(`    ❌ Error upserting batch for ${pair}:`, upsertError.message)
              errors.push(`${pair}: ${upsertError.message}`)
            } else {
              totalUpdates += batch.length
            }
          }

          // Fill missing days with carry-forward
          await fillMissingDays(supabase, baseCurrency, targetCurrency, fromDate, toDate)
          
          // Rate limit: 750 calls/minute = 80ms delay minimum
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error: any) {
          const errorMsg = `Error processing ${pair}: ${error?.message || 'Unknown error'}`
          console.error(`    ❌ ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
    }

    console.log(`\n✅ Historical fetch complete: ${totalUpdates} rates updated`)
    if (errors.length > 0) {
      console.log(`⚠️ Encountered ${errors.length} errors`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalUpdates, 
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Fatal error fetching historical exchange rates:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Fill missing days using carry-forward from the last available rate
 */
async function fillMissingDays(
  supabase: any,
  baseCurrency: string,
  targetCurrency: string,
  fromDate: string,
  toDate: string
) {
  try {
    // Get all existing dates for this pair
    const { data: existingRates, error: fetchError } = await supabase
      .from('exchange_rates')
      .select('valid_date, rate')
      .eq('base_currency', baseCurrency)
      .eq('target_currency', targetCurrency)
      .gte('valid_date', fromDate)
      .lte('valid_date', toDate)
      .order('valid_date', { ascending: true })

    if (fetchError || !existingRates || existingRates.length === 0) {
      return
    }

    // Create a map of existing dates
    const existingDateMap = new Map(
      existingRates.map((r: any) => [r.valid_date, r.rate])
    )

    // Generate all dates in range
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const allDates: string[] = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0])
    }

    // Find missing dates and fill with carry-forward
    const fillUps: any[] = []
    let lastKnownRate = existingRates[0].rate

    for (const date of allDates) {
      if (existingDateMap.has(date)) {
        lastKnownRate = existingDateMap.get(date)
      } else {
        fillUps.push({
          base_currency: baseCurrency,
          target_currency: targetCurrency,
          valid_date: date,
          rate: lastKnownRate,
          fetched_at: new Date().toISOString(),
          is_fallback: true,
        })
      }
    }

    if (fillUps.length > 0) {
      console.log(`    📝 Filling ${fillUps.length} missing days for ${baseCurrency}${targetCurrency}`)
      
      // Insert in batches
      const batchSize = 1000
      for (let i = 0; i < fillUps.length; i += batchSize) {
        const batch = fillUps.slice(i, i + batchSize)
        await supabase
          .from('exchange_rates')
          .upsert(batch, { 
            onConflict: 'base_currency,target_currency,valid_date',
            ignoreDuplicates: false 
          })
      }
    }
  } catch (error: any) {
    console.error(`Error filling missing days for ${baseCurrency}${targetCurrency}:`, error.message)
  }
}
