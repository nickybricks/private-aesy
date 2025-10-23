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
    const fromCurrency = url.searchParams.get('from')
    const toCurrency = url.searchParams.get('to')

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Approach: Convert both currencies to USD as intermediate
    // from → USD → to
    
    let rate = 1.0
    let source = 'database'

    if (fromCurrency !== 'USD') {
      // Get USD/from rate
      const { data: fromData, error: fromError } = await supabase
        .from('exchange_rates')
        .select('rate, fetched_at, is_fallback')
        .eq('base_currency', 'USD')
        .eq('target_currency', fromCurrency)
        .maybeSingle()

      if (fromError || !fromData) {
        console.error(`No exchange rate found for USD → ${fromCurrency}`, fromError)
        return new Response(
          JSON.stringify({ error: `No exchange rate found for USD → ${fromCurrency}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Rate from → USD = 1 / (USD → from)
      rate = 1 / Number(fromData.rate)
      
      if (fromData.is_fallback) {
        source = 'fallback'
      }
    }

    if (toCurrency !== 'USD') {
      // Get USD/to rate
      const { data: toData, error: toError } = await supabase
        .from('exchange_rates')
        .select('rate, fetched_at, is_fallback')
        .eq('base_currency', 'USD')
        .eq('target_currency', toCurrency)
        .maybeSingle()

      if (toError || !toData) {
        console.error(`No exchange rate found for USD → ${toCurrency}`, toError)
        return new Response(
          JSON.stringify({ error: `No exchange rate found for USD → ${toCurrency}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Final rate = (from → USD) * (USD → to)
      rate = rate * Number(toData.rate)
      
      if (toData.is_fallback && source !== 'fallback') {
        source = 'fallback'
      }
    }

    console.log(`Exchange rate ${fromCurrency} → ${toCurrency}: ${rate} (source: ${source})`)

    return new Response(
      JSON.stringify({ 
        rate, 
        source,
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
