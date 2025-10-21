import { supabase } from '@/integrations/supabase/client';
import { getStocksByMarket } from './quantAnalyzerApi';

export interface CachedAnalysisResult {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: string;
  price: number;
  currency: string;
  buffettScore: number;
  criteria: any;
  intrinsicValue: number | null;
  marginOfSafety: number | null;
  lastAnalysisDate: string;
}

export interface CacheStats {
  totalStocks: number;
  cachedStocks: number;
  freshStocks: number;
  cacheHitRate: number;
  lastUpdated: string | null;
}

/**
 * Check if a cached analysis exists and is recent (< 24 hours)
 */
export async function getCachedAnalysis(
  marketId: string,
  maxAgeHours: number = 24
): Promise<CachedAnalysisResult[] | null> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const { data, error } = await supabase
      .from('stock_analysis_cache')
      .select('*')
      .eq('market_id', marketId)
      .gte('last_updated', cutoffDate.toISOString())
      .order('buffett_score', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching cached analysis:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map(row => row.analysis_result as unknown as CachedAnalysisResult);
  } catch (error) {
    console.error('Error in getCachedAnalysis:', error);
    return null;
  }
}

/**
 * Get cache statistics for a market
 */
export async function getCacheStats(marketId: string): Promise<CacheStats | null> {
  try {
    const { data, error } = await supabase
      .from('stock_analysis_cache')
      .select('last_updated')
      .eq('market_id', marketId);

    if (error) {
      console.error('Error fetching cache stats:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalStocks: 0,
        cachedStocks: 0,
        freshStocks: 0,
        cacheHitRate: 0,
        lastUpdated: null,
      };
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const freshStocks = data.filter(row => 
      new Date(row.last_updated) > oneDayAgo
    ).length;

    const lastUpdated = data.reduce((latest, row) => {
      const rowDate = new Date(row.last_updated);
      return !latest || rowDate > new Date(latest) ? row.last_updated : latest;
    }, null as string | null);

    return {
      totalStocks: data.length,
      cachedStocks: data.length,
      freshStocks,
      cacheHitRate: data.length > 0 ? (freshStocks / data.length) * 100 : 0,
      lastUpdated,
    };
  } catch (error) {
    console.error('Error in getCacheStats:', error);
    return null;
  }
}

/**
 * Update prices for cached stocks
 */
export async function updateCachedPrices(
  symbols: string[],
  onProgress?: (progress: number, operation: string) => void
): Promise<void> {
  const batchSize = 100;
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const progress = Math.round((i / symbols.length) * 100);
    
    if (onProgress) {
      onProgress(progress, `Aktualisiere Preise (${i + 1}-${Math.min(i + batchSize, symbols.length)} von ${symbols.length})...`);
    }

    // Call cache-stock-data for each symbol to update prices
    const promises = batch.map(symbol =>
      supabase.functions.invoke('cache-stock-data', {
        body: { symbol, forceRefresh: false }
      }).catch(err => {
        console.error(`Error updating price for ${symbol}:`, err);
        return null;
      })
    );

    await Promise.all(promises);

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (onProgress) {
    onProgress(100, 'Preise aktualisiert');
  }
}

/**
 * Analyze market with intelligent caching
 */
export async function analyzeMarketWithCache(
  marketId: string,
  limit: number = 1000,
  sector?: string,
  onProgress?: (progress: number, operation: string) => void
): Promise<CachedAnalysisResult[]> {
  try {
    // Step 1: Check if we have recent cached analysis
    if (onProgress) onProgress(5, 'Prüfe Cache...');
    
    const cachedResults = await getCachedAnalysis(marketId, 24);
    
    if (cachedResults && cachedResults.length > 0) {
      console.log(`Found ${cachedResults.length} cached results for ${marketId}`);
      
      // Update prices for cached results
      if (onProgress) onProgress(10, 'Aktualisiere Preise für gecachte Aktien...');
      const symbols = cachedResults.map(r => r.symbol);
      await updateCachedPrices(symbols, (p, op) => {
        if (onProgress) onProgress(10 + (p * 0.2), op);
      });

      // Re-fetch updated analysis
      if (onProgress) onProgress(30, 'Lade aktualisierte Daten...');
      const updatedResults = await getCachedAnalysis(marketId, 24);
      
      if (onProgress) onProgress(100, 'Fertig');
      return updatedResults || cachedResults;
    }

    // Step 2: No cache available, perform full analysis
    if (onProgress) onProgress(10, 'Lade Aktienliste...');
    
    const stocks = await getStocksByMarket(marketId);
    
    if (!stocks || stocks.length === 0) {
      throw new Error('Keine Aktien für diesen Markt gefunden');
    }

    let filteredStocks = stocks;
    if (sector && sector !== 'all') {
      filteredStocks = stocks.filter(s => s.sector === sector);
    }

    const stocksToAnalyze = filteredStocks.slice(0, limit);
    console.log(`Analyzing ${stocksToAnalyze.length} stocks for ${marketId}`);

    // Step 3: Cache stock data in batches
    const batchSize = 100;
    const totalBatches = Math.ceil(stocksToAnalyze.length / batchSize);
    
    for (let i = 0; i < stocksToAnalyze.length; i += batchSize) {
      const batch = stocksToAnalyze.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const progress = 10 + Math.round((i / stocksToAnalyze.length) * 60);
      
      if (onProgress) {
        onProgress(
          progress,
          `Lade Daten für Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, stocksToAnalyze.length)} von ${stocksToAnalyze.length})...`
        );
      }

      // Cache data for each stock in batch
      const cachePromises = batch.map(stock =>
        supabase.functions.invoke('cache-stock-data', {
          body: { symbol: stock.symbol, forceRefresh: false }
        }).catch(err => {
          console.error(`Error caching ${stock.symbol}:`, err);
          return null;
        })
      );

      await Promise.all(cachePromises);

      // Rate limiting: wait 60 seconds between batches
      if (i + batchSize < stocksToAnalyze.length) {
        if (onProgress) {
          onProgress(progress, `Warte 60 Sekunden (API Rate Limit)...`);
        }
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }

    // Step 4: Analyze all stocks
    if (onProgress) onProgress(70, 'Analysiere Aktien...');
    
    const symbols = stocksToAnalyze.map(s => s.symbol);
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
      'batch-analyze-stocks',
      {
        body: {
          symbols,
          marketId,
          forceRefresh: false,
        }
      }
    );

    if (analysisError) {
      throw new Error(`Analyse fehlgeschlagen: ${analysisError.message}`);
    }

    if (!analysisData || !analysisData.results) {
      throw new Error('Keine Analyseergebnisse erhalten');
    }

    if (onProgress) onProgress(100, 'Analyse abgeschlossen');

    return analysisData.results as CachedAnalysisResult[];
  } catch (error) {
    console.error('Error in analyzeMarketWithCache:', error);
    throw error;
  }
}

/**
 * Clear cache for a specific market
 */
export async function clearMarketCache(marketId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('stock_analysis_cache')
      .delete()
      .eq('market_id', marketId);

    if (error) {
      throw error;
    }

    console.log(`Cache cleared for market ${marketId}`);
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
}
