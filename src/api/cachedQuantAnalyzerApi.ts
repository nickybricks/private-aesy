import { supabase } from '@/integrations/supabase/client';
import { 
  analyzeStockByBuffettCriteria, 
  QuantAnalysisResult,
  getStocksByMarket,
  marketOptions 
} from './quantAnalyzerApi';
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Cache freshness threshold (24 hours)
const CACHE_FRESHNESS_HOURS = 24;

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if cache entry is fresh
const isCacheFresh = (lastUpdated: string): boolean => {
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);
  return hoursSinceUpdate < CACHE_FRESHNESS_HOURS;
};

// Get cached analysis for a market
export const getCachedAnalysis = async (marketId: string): Promise<QuantAnalysisResult[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_analysis_cache')
      .select('*')
      .eq('market_id', marketId) as any;

    if (error) {
      console.error('Error fetching cached analysis:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      ...row.analysis_result,
      _cacheMetadata: {
        lastUpdated: row.last_updated,
        isFresh: isCacheFresh(row.last_updated)
      }
    }));
  } catch (error) {
    console.error('Error in getCachedAnalysis:', error);
    return [];
  }
};

// Update only the price for a cached stock
const updateCachedPrice = async (symbol: string, marketId: string): Promise<QuantAnalysisResult | null> => {
  try {
    // Fetch fresh quote
    const response = await axios.get(`${BASE_URL}/quote/${symbol}`, {
      params: { apikey: DEFAULT_FMP_API_KEY }
    });
    
    const quoteData = response.data?.[0];
    if (!quoteData) return null;

    // Get existing cache entry
    const { data: existing } = await supabase
      .from('stock_analysis_cache')
      .select('*')
      .eq('symbol', symbol)
      .eq('market_id', marketId)
      .single() as any;

    if (!existing) return null;

    const updatedAnalysis = {
      ...existing.analysis_result,
      price: quoteData.price,
      change: quoteData.change,
      changesPercentage: quoteData.changesPercentage
    };

    // Recalculate margin of safety with new price
    if (updatedAnalysis.intrinsicValue && quoteData.price > 0) {
      updatedAnalysis.marginOfSafety = 
        ((updatedAnalysis.intrinsicValue - quoteData.price) / quoteData.price) * 100;
    }

    // Update cache
    await supabase
      .from('stock_analysis_cache')
      .update({
        analysis_result: updatedAnalysis,
        last_updated: new Date().toISOString()
      } as any)
      .eq('symbol', symbol)
      .eq('market_id', marketId);

    return updatedAnalysis;
  } catch (error) {
    console.error(`Error updating price for ${symbol}:`, error);
    return null;
  }
};

// Save analysis to cache
const saveToCache = async (
  symbol: string, 
  marketId: string, 
  analysis: QuantAnalysisResult
): Promise<void> => {
  try {
    await supabase
      .from('stock_analysis_cache')
      .upsert({
        symbol,
        market_id: marketId,
        buffett_score: analysis.buffettScore,
        analysis_result: analysis,
        last_updated: new Date().toISOString()
      } as any);
  } catch (error) {
    console.error(`Error saving to cache for ${symbol}:`, error);
  }
};

// Main analysis function with transparent caching
export const analyzeMarketWithCache = async (
  marketId: string,
  limit: number = 1000,
  onProgress?: (progress: number, currentOperation: string) => void
): Promise<QuantAnalysisResult[]> => {
  try {
    const marketOption = marketOptions.find(option => option.id === marketId);
    const marketName = marketOption ? marketOption.name : marketId;

    // Get all stocks for the market
    const marketStocks = await getStocksByMarket(marketId);
    const stocksToAnalyze = marketStocks.slice(0, limit);

    console.log(`Analyzing ${stocksToAnalyze.length} stocks from ${marketName} with cache`);

    // Get cached entries
    const cachedEntries = await getCachedAnalysis(marketId);
    const cachedMap = new Map(cachedEntries.map(entry => [entry.symbol, entry]));

    const results: QuantAnalysisResult[] = [];
    const stocksNeedingFullAnalysis: any[] = [];
    const stocksNeedingPriceUpdate: any[] = [];

    // Categorize stocks
    for (const stock of stocksToAnalyze) {
      const cached = cachedMap.get(stock.symbol);
      if (!cached) {
        stocksNeedingFullAnalysis.push(stock);
      } else if (!isCacheFresh((cached as any)._cacheMetadata?.lastUpdated)) {
        stocksNeedingPriceUpdate.push(stock);
        results.push(cached); // Use cached temporarily
      } else {
        results.push(cached); // Fresh cache
      }
    }

    console.log(`Cache status: ${results.length - stocksNeedingPriceUpdate.length} fresh, ${stocksNeedingPriceUpdate.length} need price update, ${stocksNeedingFullAnalysis.length} need full analysis`);

    // Process stocks needing full analysis in batches
    const batchSize = 100;
    const totalBatches = Math.ceil(stocksNeedingFullAnalysis.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, stocksNeedingFullAnalysis.length);
      const batch = stocksNeedingFullAnalysis.slice(startIndex, endIndex);

      if (onProgress) {
        const progress = Math.round((batchIndex / (totalBatches + 1)) * 100);
        onProgress(progress, `Vollanalyse: Batch ${batchIndex + 1}/${totalBatches} (${batch.length} Aktien)...`);
      }

      for (const stock of batch) {
        try {
          const analysis = await analyzeStockByBuffettCriteria(stock.symbol);
          if (analysis) {
            results.push(analysis);
            await saveToCache(stock.symbol, marketId, analysis);
          }
        } catch (error) {
          console.error(`Error analyzing ${stock.symbol}:`, error);
        }
      }

      if (batchIndex < totalBatches - 1) {
        console.log(`Waiting 60 seconds before next batch...`);
        if (onProgress) {
          onProgress(
            Math.round((batchIndex / (totalBatches + 1)) * 100),
            `Warte 60 Sekunden vor Batch ${batchIndex + 2}/${totalBatches}...`
          );
        }
        await sleep(60000);
      }
    }

    // Update prices for stale cached entries (much faster)
    if (stocksNeedingPriceUpdate.length > 0) {
      if (onProgress) {
        onProgress(95, `Aktualisiere Preise für ${stocksNeedingPriceUpdate.length} Aktien...`);
      }

      const priceUpdateBatchSize = 50; // Faster since we're only fetching quotes
      for (let i = 0; i < stocksNeedingPriceUpdate.length; i += priceUpdateBatchSize) {
        const batch = stocksNeedingPriceUpdate.slice(i, i + priceUpdateBatchSize);
        
        await Promise.all(
          batch.map(async (stock) => {
            const updated = await updateCachedPrice(stock.symbol, marketId);
            if (updated) {
              const index = results.findIndex(r => r.symbol === stock.symbol);
              if (index !== -1) {
                results[index] = updated;
              }
            }
          })
        );

        if (i + priceUpdateBatchSize < stocksNeedingPriceUpdate.length) {
          await sleep(5000); // Short delay between price batches
        }
      }
    }

    if (onProgress) {
      onProgress(100, `Analyse abgeschlossen: ${results.length} Aktien`);
    }

    return results.sort((a, b) => b.buffettScore - a.buffettScore);
  } catch (error) {
    console.error('Error in analyzeMarketWithCache:', error);
    throw error;
  }
};

// Get all cached stocks for screener (instant)
export const getAllCachedStocks = async (): Promise<QuantAnalysisResult[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_analysis_cache')
      .select('*')
      .order('buffett_score', { ascending: false }) as any;

    if (error) {
      console.error('Error fetching all cached stocks:', error);
      return [];
    }

    return (data || []).map((row: any) => row.analysis_result);
  } catch (error) {
    console.error('Error in getAllCachedStocks:', error);
    return [];
  }
};

// Get cache statistics
export const getCacheStats = async () => {
  try {
    const { data, error } = await supabase
      .from('stock_analysis_cache')
      .select('market_id, last_updated') as any;

    if (error) return null;

    const now = Date.now();
    const fresh = data?.filter((row: any) => isCacheFresh(row.last_updated)).length || 0;
    const total = data?.length || 0;
    const stale = total - fresh;

    const marketCounts = data?.reduce((acc: any, row: any) => {
      acc[row.market_id] = (acc[row.market_id] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      fresh,
      stale,
      hitRate: total > 0 ? (fresh / total) * 100 : 0,
      byMarket: marketCounts
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

// Clear cache for a specific market
export const clearMarketCache = async (marketId: string): Promise<void> => {
  try {
    await supabase
      .from('stock_analysis_cache')
      .delete()
      .eq('market_id', marketId) as any;
    
    console.log(`Cache cleared for market: ${marketId}`);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};
