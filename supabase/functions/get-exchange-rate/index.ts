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
    const targetDate = url.searchParams.get('date') || undefined // Optional date parameter (YYYY-MM-DD)

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

    fromCurrency = fromCurrency.toUpperCase()
    toCurrency = toCurrency.toUpperCase()

    // Same currency shortcut
    if (fromCurrency === toCurrency) {
      return new Response(
        JSON.stringify({ rate: 1.0, source: 'same_currency', from: fromCurrency, to: toCurrency }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase client (service role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helper: get latest rate for a specific date or most recent
    const getLatestRate = async (base: string, target: string): Promise<number | null> => {
      const dateToUse = targetDate || new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate, valid_date')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .lte('valid_date', dateToUse)
        .order('valid_date', { ascending: false })
        .limit(1)
      
      if (error) {
        console.warn('DB rate query error', { base, target, date: dateToUse, error })
        return null
      }
      if (data && data.length > 0) return Number(data[0].rate)
      return null
    }

    // Try to resolve from DB via direct, reciprocal, or bridge using USD/EUR
    const tryResolveFromDB = async (from: string, to: string): Promise<{ rate: number; source: string } | null> => {
      // 1) direct
      const direct = await getLatestRate(from, to)
      if (direct) return { rate: direct, source: 'exchange_rates_db_direct' }
      // 2) reciprocal
      const reciprocal = await getLatestRate(to, from)
      if (reciprocal) return { rate: 1 / reciprocal, source: 'exchange_rates_db_reciprocal' }
      // 3) USD bridge
      const usdToFrom = await getLatestRate('USD', from)
      const usdToTo = await getLatestRate('USD', to)
      if (usdToFrom && usdToTo) {
        // USD->FROM means units of FROM per 1 USD
        // FROM->USD = 1 / (USD->FROM)
        // FROM->TO = (FROM->USD) * (USD->TO)
        return { rate: (1 / usdToFrom) * usdToTo, source: 'exchange_rates_db_usd_bridge' }
      }
      // 4) EUR bridge
      const eurToFrom = await getLatestRate('EUR', from)
      const eurToTo = await getLatestRate('EUR', to)
      if (eurToFrom && eurToTo) {
        return { rate: (1 / eurToFrom) * eurToTo, source: 'exchange_rates_db_eur_bridge' }
      }
      return null
    }

    const dbResult = await tryResolveFromDB(fromCurrency, toCurrency)
    if (dbResult) {
      console.log(`Exchange rate ${fromCurrency} → ${toCurrency}: ${dbResult.rate} (source: ${dbResult.source})`)
      return new Response(
        JSON.stringify({ rate: dbResult.rate, source: dbResult.source, from: fromCurrency, to: toCurrency }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fallback: FMP API (only if DB could not resolve)
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY')
    const currencyPair = `${fromCurrency}${toCurrency}`
    const fmpUrl = `https://financialmodelingprep.com/stable/quote-short?symbol=${currencyPair}&apikey=${FMP_API_KEY}`
    console.log(`Fetching exchange rate from FMP API: ${currencyPair}`)

    const response = await fetch(fmpUrl)
    if (!response.ok) {
      const msg = `FMP API returned ${response.status}`
      console.warn(msg)
      return new Response(
        JSON.stringify({ error: msg, from: fromCurrency, to: toCurrency }),
        { status: response.status === 429 ? 429 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0 || !data[0].price) {
      const msg = 'Invalid FMP API response or no rate available'
      console.warn(msg)
      return new Response(
        JSON.stringify({ error: msg, from: fromCurrency, to: toCurrency }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rate = Number(data[0].price)
    console.log(`Exchange rate ${fromCurrency} → ${toCurrency}: ${rate} (source: fmp_api)`)

    return new Response(
      JSON.stringify({ rate, source: 'fmp_api', from: fromCurrency, to: toCurrency }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error getting exchange rate:', error)
    const message = (error as Error)?.message ?? 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})