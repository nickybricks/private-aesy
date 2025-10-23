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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fetching latest exchange rates from fxratesapi.com...')
    
    // Basis-Währung: USD
    const apiUrl = 'https://api.fxratesapi.com/latest?base=USD'
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`fxratesapi returned ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success || !data.rates) {
      throw new Error('Invalid API response')
    }

    console.log(`Received ${Object.keys(data.rates).length} exchange rates`)
    
    // Batch-Update in DB
    const rates = data.rates
    const updates = Object.entries(rates).map(([currency, rate]) => ({
      base_currency: 'USD',
      target_currency: currency as string,
      rate: Number(rate),
      fetched_at: new Date().toISOString(),
      is_fallback: false
    }))

    // Upsert (insert or update)
    const { error: upsertError } = await supabase
      .from('exchange_rates')
      .upsert(updates, { 
        onConflict: 'base_currency,target_currency',
        ignoreDuplicates: false 
      })

    if (upsertError) {
      throw upsertError
    }

    console.log(`✅ Successfully updated ${updates.length} exchange rates`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updates.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
