import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Target currencies for historical data
const TARGET_CURRENCIES = [
  'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'CNY', 'KRW', 'SEK', 'NOK', 'NZD',
  'INR', 'BRL', 'ZAR', 'MXN', 'SGD', 'HKD', 'TRY', 'ILS', 'DKK', 'PLN',
  'USD'  // EUR<->USD conversion
]

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

    console.log('Starting EUR-based historical exchange rate fetch from 1980...')
    
    const fromDate = '1980-01-01'
    const toDate = '2025-12-31'
    let totalUpdates = 0
    const errors: string[] = []

    console.log(`\n📊 Fetching EUR-based rates...`)
    
    for (const targetCurrency of TARGET_CURRENCIES) {
      const pair = `EUR${targetCurrency}`
      
      console.log(`  → Fetching ${pair}...`)
      
      try {
        const url = `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${pair}&from=${fromDate}&to=${toDate}&apikey=${fmpApiKey}`
        console.log(`    🔗 Fetching: ${url}`)
        const response = await fetch(url)

        if (!response.ok) {
          const errorMsg = `FMP API error for ${pair}: ${response.status}`
          console.error(errorMsg)
          errors.push(errorMsg)
          continue
        }

        const data: any = await response.json()
        const historical = Array.isArray(data) ? data : []

        if (!Array.isArray(historical) || historical.length === 0) {
          console.warn(`    ⚠️ No historical data for ${pair}`)
          console.log(`    API Response (first 300 chars):`, JSON.stringify(data).slice(0, 300))
          continue
        }

        console.log(`    ✓ Received ${historical.length} days for ${pair}`)
        
        // Prepare batch updates
        const updates = historical
          .map((day: any) => ({
            base_currency: 'EUR',
            target_currency: targetCurrency,
            valid_date: day.date,
            rate: Number(day.price),
            fetched_at: new Date().toISOString(),
            is_fallback: false,
          }))
          .filter((u: any) => u.valid_date && Number.isFinite(u.rate))

        // Upsert in batches of 2000
        const batchSize = 2000
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

        console.log(`    ✓ Inserted ${updates.length} trading days for ${pair}`)
        
        // Rate limit: 750 calls/minute = 80ms delay minimum
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        const errorMsg = `Error processing ${pair}: ${error?.message || 'Unknown error'}`
        console.error(`    ❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    console.log(`\n✅ EUR historical fetch complete: ${totalUpdates} rates updated`)
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
    console.error('Fatal error fetching EUR historical exchange rates:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
