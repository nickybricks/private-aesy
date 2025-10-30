import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StockListItem {
  symbol: string
  name: string
  exchange: string
  exchangeShortName: string
  price?: number
  type?: string
}

interface StockProfile {
  symbol: string
  companyName: string
  sector: string
  industry: string
  country: string
  exchange: string
  currency: string
  mktCap?: number
  isin?: string
  website?: string
  description?: string
  ceo?: string
  fullTimeEmployees?: number
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  image?: string
  ipoDate?: string
  isEtf?: boolean
  isActivelyTrading?: boolean
  isAdr?: boolean
  isFund?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { testMode = false, testSymbols = [] } = await req.json()
    
    const FMP_API_KEY = Deno.env.get('FMP_API_KEY') || 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y'
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting stock metadata import (testMode: ${testMode})`)

    let symbols: string[] = []
    
    if (testMode && testSymbols.length > 0) {
      // Test mode with provided symbols
      symbols = testSymbols
      console.log(`Test mode: Using ${symbols.length} test symbols`)
    } else {
      // Fetch full stock list from FMP API
      console.log('Fetching stock list from FMP API...')
      const listUrl = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${FMP_API_KEY}`
      const listResponse = await fetch(listUrl)
      
      if (!listResponse.ok) {
        throw new Error(`FMP API stock list failed: ${listResponse.status}`)
      }
      
      const stockList: StockListItem[] = await listResponse.json()
      console.log(`Received ${stockList.length} stocks from API`)
      
      // Filter for US stocks (NASDAQ or NYSE)
      const filteredStocks = stockList.filter(stock => 
        stock.type === 'stock' &&
        (stock.exchangeShortName === 'NASDAQ' || stock.exchangeShortName === 'NYSE')
      )
      
      symbols = filteredStocks.map(s => s.symbol)
      console.log(`Filtered to ${symbols.length} US stocks (NASDAQ/NYSE)`)
    }

    // Process in batches
    const BATCH_SIZE = 1000
    const PROFILE_BATCH_SIZE = 100 // Fetch profiles in smaller batches to respect rate limits
    const DELAY_MS = 1000 // 1 second delay between profile batches
    
    let totalProcessed = 0
    let totalInserted = 0
    let totalUpdated = 0
    let totalErrors = 0

    // Process symbols in profile batches first
    for (let i = 0; i < symbols.length; i += PROFILE_BATCH_SIZE) {
      const profileBatch = symbols.slice(i, i + PROFILE_BATCH_SIZE)
      console.log(`Fetching profiles for batch ${Math.floor(i / PROFILE_BATCH_SIZE) + 1} (${profileBatch.length} symbols)`)
      
      const stockData: any[] = []
      
      // Fetch profiles for this batch
      for (const symbol of profileBatch) {
        try {
          const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
          const profileResponse = await fetch(profileUrl)
          
          if (!profileResponse.ok) {
            console.warn(`Failed to fetch profile for ${symbol}: ${profileResponse.status}`)
            totalErrors++
            continue
          }
          
          const profiles: StockProfile[] = await profileResponse.json()
          
          if (!profiles || profiles.length === 0) {
            console.warn(`No profile data for ${symbol}`)
            totalErrors++
            continue
          }
          
          const profile = profiles[0]
          
          stockData.push({
            symbol: profile.symbol,
            name: profile.companyName || null,
            sector: profile.sector || null,
            industry: profile.industry || null,
            country: profile.country || null,
            exchange: profile.exchange || null,
            currency: profile.currency || null,
            market_cap: profile.mktCap || null,
            isin: profile.isin || null,
            website: profile.website || null,
            description: profile.description || null,
            ceo: profile.ceo || null,
            full_time_employees: profile.fullTimeEmployees || null,
            phone: profile.phone || null,
            address: profile.address || null,
            city: profile.city || null,
            state: profile.state || null,
            zip: profile.zip || null,
            image: profile.image || null,
            ipo_date: profile.ipoDate || null,
            is_etf: profile.isEtf || false,
            is_actively_trading: profile.isActivelyTrading !== false,
            is_adr: profile.isAdr || false,
            is_fund: profile.isFund || false,
            last_updated: new Date().toISOString()
          })
          
          totalProcessed++
          
          // Small delay to avoid rate limiting on individual requests
          if (profileBatch.indexOf(symbol) % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          
        } catch (error) {
          console.error(`Error processing ${symbol}:`, error.message)
          totalErrors++
        }
      }
      
      // Insert/update in database batches of 1000
      for (let j = 0; j < stockData.length; j += BATCH_SIZE) {
        const dbBatch = stockData.slice(j, j + BATCH_SIZE)
        
        try {
          const { data, error } = await supabase
            .from('stocks')
            .upsert(dbBatch, { 
              onConflict: 'symbol',
              ignoreDuplicates: false 
            })
            .select()
          
          if (error) {
            console.error(`Database batch error:`, error)
            totalErrors += dbBatch.length
          } else {
            const inserted = data?.length || 0
            totalInserted += inserted
            console.log(`Inserted/updated ${inserted} stocks in database`)
          }
        } catch (error) {
          console.error(`Database batch exception:`, error.message)
          totalErrors += dbBatch.length
        }
      }
      
      // Delay between profile batches to respect rate limits
      if (i + PROFILE_BATCH_SIZE < symbols.length) {
        console.log(`Waiting ${DELAY_MS}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }

    // Verify data for test mode
    let verificationResults = null
    if (testMode && testSymbols.length > 0) {
      console.log('Verifying inserted data...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('stocks')
        .select('*')
        .in('symbol', testSymbols)
      
      if (!verifyError) {
        verificationResults = verifyData
        console.log(`Verification: Found ${verifyData?.length} records`)
      }
    }

    const summary = {
      success: true,
      totalProcessed,
      totalInserted,
      totalUpdated,
      totalErrors,
      testMode,
      verificationResults
    }

    console.log('Import completed:', summary)

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Import failed:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
