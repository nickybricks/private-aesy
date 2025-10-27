import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PopulateProfileRequest {
  ticker: string;
  forceRefresh?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { ticker, forceRefresh = false }: PopulateProfileRequest = await req.json();
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing ticker parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Populating company profile for ${ticker}, forceRefresh=${forceRefresh}`);
    
    // Check if we already have fresh data (less than 24 hours old)
    if (!forceRefresh) {
      const { data: existing } = await supabase
        .from('company_profiles')
        .select('last_updated')
        .eq('symbol', ticker.toUpperCase())
        .single();
      
      if (existing) {
        const hoursSinceUpdate = (Date.now() - new Date(existing.last_updated).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          console.log(`Fresh data exists (${hoursSinceUpdate.toFixed(1)}h old), skipping fetch`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Using cached data',
              hoursSinceUpdate: hoursSinceUpdate.toFixed(1)
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }
    
    // Get FMP API key
    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured');
    }
    
    // Fetch company profile from FMP
    console.log(`Fetching profile data from FMP for ${ticker}...`);
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${ticker.toUpperCase()}?apikey=${fmpApiKey}`;
    const profileResponse = await fetch(profileUrl);
    
    if (!profileResponse.ok) {
      throw new Error(`FMP API error: ${profileResponse.status} ${profileResponse.statusText}`);
    }
    
    const profileData = await profileResponse.json();
    
    if (!profileData || profileData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No profile data found for ticker' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const profile = profileData[0];
    console.log(`Fetched profile data for ${profile.companyName}`);
    
    // Prepare company profile record
    const profileRecord = {
      symbol: ticker.toUpperCase(),
      company_name: profile.companyName,
      exchange: profile.exchange || profile.exchangeShortName,
      currency: profile.currency,
      country: profile.country,
      sector: profile.sector,
      industry: profile.industry,
      ceo: profile.ceo,
      full_time_employees: profile.fullTimeEmployees,
      website: profile.website,
      description: profile.description,
      ipo_date: profile.ipoDate || null,
      isin: profile.isin,
      cusip: profile.cusip,
      shares_outstanding: profile.sharesOutstanding,
      float_shares: profile.floatShares,
      beta: profile.beta,
      market_cap: profile.mktCap,
      current_price: profile.price,
      raw_profile_data: profile,
      last_updated: new Date().toISOString()
    };
    
    // Upsert company profile
    console.log(`Upserting company profile for ${ticker}...`);
    const { error: upsertError } = await supabase
      .from('company_profiles')
      .upsert(profileRecord, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      });
    
    if (upsertError) {
      console.error('Error upserting company profile:', upsertError);
      throw upsertError;
    }
    
    console.log(`✅ Successfully populated company profile for ${ticker}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        ticker: ticker.toUpperCase(),
        companyName: profile.companyName,
        employees: profile.fullTimeEmployees,
        sharesOutstanding: profile.sharesOutstanding,
        marketCap: profile.mktCap
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in populate-company-profile:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
