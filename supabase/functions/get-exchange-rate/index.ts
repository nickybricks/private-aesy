import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let fromCurrency = url.searchParams.get('from') || undefined
    let toCurrency = url.searchParams.get('to') || undefined

    // Support JSON body for POST/PUT (supabase.functions.invoke sends JSON)
    if ((!fromCurrency || !toCurrency) && (req.method === 'POST' || req.method === 'PUT')) {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        try {
          const body = await req.json()
          if (body && typeof body === 'object') {
            if (!fromCurrency && (body as any).from) fromCurrency = String((body as any).from)
            if (!toCurrency && (body as any).to) toCurrency = String((body as any).to)
          }
        } catch (_) {
          // Ignore JSON parse error, will handle missing params below
        }
      }
    }

    if (!fromCurrency || !toCurrency) {
      return new Response(
        JSON.stringify({ error: 'Missing from or to currency parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Same currency
    if (fromCurrency === toCurrency) {
      return new Response(
        JSON.stringify({ rate: 1.0, source: 'same_currency' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const FMP_API_KEY = Deno.env.get('FMP_API_KEY') || 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y'
    
    // Construct currency pair symbol for FMP API
    // FMP uses format like "EURUSD" for EUR to USD
    const currencyPair = `${fromCurrency}${toCurrency}`
    
    console.log(`Fetching exchange rate from FMP API: ${currencyPair}`)
    
    // Fetch current rate from FMP API
    const fmpUrl = `https://financialmodelingprep.com/stable/quote-short?symbol=${currencyPair}&apikey=${FMP_API_KEY}`
    const response = await fetch(fmpUrl)
    
    if (!response.ok) {
      throw new Error(`FMP API returned ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0 || !data[0].price) {
      throw new Error('Invalid FMP API response or no rate available')
    }
    
    const rate = Number(data[0].price)
    
    console.log(`Exchange rate ${fromCurrency} → ${toCurrency}: ${rate} (source: FMP API)`)

    return new Response(
      JSON.stringify({ 
        rate, 
        source: 'fmp_api',
        from: fromCurrency,
        to: toCurrency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting exchange rate:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
