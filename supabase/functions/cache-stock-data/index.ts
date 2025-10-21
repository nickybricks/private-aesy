import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockDataCache {
  symbol: string;
  company_name?: string;
  exchange?: string;
  sector?: string;
  currency?: string;
  raw_data: {
    profile?: any;
    quote?: any;
    incomeStatements?: any[];
    balanceSheets?: any[];
    cashFlows?: any[];
    keyMetrics?: any[];
    ratiosTTM?: any;
  };
  last_updated: string;
}

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

async function fetchFromFMP(endpoint: string, apiKey: string, params: Record<string, string> = {}) {
  const url = new URL(`${FMP_BASE_URL}${endpoint}`);
  url.searchParams.append('apikey', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  return await response.json();
}

function isCacheValid(lastUpdated: string, maxAgeHours: number): boolean {
  const cacheDate = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < maxAgeHours;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fmpApiKey = Deno.env.get('FMP_API_KEY');
    if (!fmpApiKey) {
      throw new Error('FMP_API_KEY not configured');
    }

    const { symbol, forceRefresh = false } = await req.json();

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Processing cache request for ${symbol}, forceRefresh: ${forceRefresh}`);

    // Check if we have cached data
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('stock_data_cache')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') {
      console.error('Cache lookup error:', cacheError);
    }

    let shouldFetchHistorical = true;
    let shouldFetchSemiCurrent = true;
    let rawData: any = cachedData?.raw_data || {};

    // Determine what needs to be fetched based on cache age
    if (cachedData && !forceRefresh) {
      const lastUpdated = cachedData.last_updated;
      
      // Historical data valid for 7 days
      if (isCacheValid(lastUpdated, 24 * 7)) {
        shouldFetchHistorical = false;
        console.log(`Using cached historical data for ${symbol}`);
      }
      
      // Semi-current data valid for 1 day
      if (isCacheValid(lastUpdated, 24)) {
        shouldFetchSemiCurrent = false;
        console.log(`Using cached semi-current data for ${symbol}`);
      }
    }

    // Fetch data based on cache validity
    const fetchPromises: Promise<any>[] = [];

    // Always fetch fresh quote (current price)
    fetchPromises.push(
      fetchFromFMP(`/quote/${symbol}`, fmpApiKey)
        .then(data => ({ key: 'quote', data }))
    );

    if (shouldFetchHistorical) {
      console.log(`Fetching historical data for ${symbol}`);
      fetchPromises.push(
        fetchFromFMP(`/profile/${symbol}`, fmpApiKey)
          .then(data => ({ key: 'profile', data })),
        fetchFromFMP(`/income-statement/${symbol}`, fmpApiKey, { limit: '10' })
          .then(data => ({ key: 'incomeStatements', data })),
        fetchFromFMP(`/balance-sheet-statement/${symbol}`, fmpApiKey, { limit: '10' })
          .then(data => ({ key: 'balanceSheets', data })),
        fetchFromFMP(`/cash-flow-statement/${symbol}`, fmpApiKey, { limit: '10' })
          .then(data => ({ key: 'cashFlows', data })),
        fetchFromFMP(`/key-metrics/${symbol}`, fmpApiKey, { limit: '10' })
          .then(data => ({ key: 'keyMetrics', data }))
      );
    }

    if (shouldFetchSemiCurrent) {
      console.log(`Fetching semi-current data for ${symbol}`);
      fetchPromises.push(
        fetchFromFMP(`/ratios-ttm/${symbol}`, fmpApiKey)
          .then(data => ({ key: 'ratiosTTM', data }))
      );
    }

    // Wait for all fetches to complete
    const results = await Promise.allSettled(fetchPromises);

    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const { key, data } = result.value;
        rawData[key] = data;
      } else if (result.status === 'rejected') {
        console.error(`Failed to fetch data:`, result.reason);
      }
    });

    // Extract basic info from profile or existing cache
    const profile = rawData.profile?.[0] || cachedData?.raw_data?.profile?.[0];
    const quote = rawData.quote?.[0];

    const stockData: Partial<StockDataCache> = {
      symbol,
      company_name: profile?.companyName || cachedData?.company_name,
      exchange: profile?.exchangeShortName || cachedData?.exchange,
      sector: profile?.sector || cachedData?.sector,
      currency: profile?.currency || quote?.currency || cachedData?.currency,
      raw_data: rawData,
    };

    // Upsert to cache
    const { error: upsertError } = await supabaseClient
      .from('stock_data_cache')
      .upsert({
        ...stockData,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'symbol',
      });

    if (upsertError) {
      console.error('Error upserting to cache:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully cached data for ${symbol}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: stockData,
        cached: {
          historical: !shouldFetchHistorical,
          semiCurrent: !shouldFetchSemiCurrent,
          price: false, // Always fresh
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cache-stock-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
