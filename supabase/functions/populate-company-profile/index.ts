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
    
    // Fetch company profile and key metrics from FMP
    console.log(`Fetching profile and key metrics data from FMP for ${ticker}...`);
    const [profileResponse, keyMetricsResponse] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker.toUpperCase()}?apikey=${fmpApiKey}`),
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker.toUpperCase()}?apikey=${fmpApiKey}`)
    ]);
    
    if (!profileResponse.ok) {
      throw new Error(`FMP API error: ${profileResponse.status} ${profileResponse.statusText}`);
    }
    
    const [profileData, keyMetricsData] = await Promise.all([
      profileResponse.json(),
      keyMetricsResponse.ok ? keyMetricsResponse.json() : null
    ]);
    
    if (!profileData || profileData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No profile data found for ticker' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const profile = profileData[0];
    const keyMetrics = keyMetricsData?.[0];
    console.log(`Fetched profile data for ${profile.companyName}`);
    
    // Get shares outstanding from key metrics if not in profile
    const sharesOutstanding = profile.sharesOutstanding || keyMetrics?.numberOfShares || null;
    
    // Calculate float shares if we have shares outstanding and institutional holdings
    // Note: FMP doesn't directly provide float, so we'll leave it null for now
    // It can be calculated as: shares_outstanding * (1 - insider_ownership_percentage)
    const floatShares = profile.floatShares || null;
    
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
      shares_outstanding: sharesOutstanding,
      float_shares: floatShares,
      beta: profile.beta,
      market_cap: profile.mktCap,
      current_price: profile.price,
      raw_profile_data: { profile, keyMetrics },
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
        sharesOutstanding: sharesOutstanding,
        floatShares: floatShares,
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
