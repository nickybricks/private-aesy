import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change?: number;
  changePercent?: number;
  isin?: string;
  assetType?: string;
}

interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

export const useStockSearch = () => {
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getFMPApiKey = async () => {
    const { data, error } = await supabase.functions.invoke('get-fmp-key');
    if (error) throw error;
    return data.apiKey;
  };

  const isStock = (item: FMPSearchResult): boolean => {
    // Now we accept all types of securities, but we'll categorize them
    return true;
  };

  const getAssetType = (item: FMPSearchResult): string => {
    const name = item.name.toLowerCase();
    const symbol = item.symbol.toLowerCase();
    
    if (/etf/i.test(name) || /etf/i.test(symbol)) return 'ETF';
    if (/fund/i.test(name) || /fund/i.test(symbol)) return 'Fonds';
    if (/reit/i.test(name) || /reit/i.test(symbol)) return 'REIT';
    if (/adr/i.test(name) || /adr/i.test(symbol)) return 'ADR';
    if (/gdr/i.test(name) || /gdr/i.test(symbol)) return 'GDR';
    if (/warrant/i.test(name) || /warrant/i.test(symbol)) return 'Warrant';
    if (/bond/i.test(name) || /note/i.test(name)) return 'Anleihe';
    if (/certificate/i.test(name)) return 'Zertifikat';
    if (/future/i.test(name)) return 'Future';
    if (/option/i.test(name)) return 'Option';
    
    return 'Aktie';
  };

  const searchStocks = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const apiKey = await getFMPApiKey();
      
      // Search for stocks using FMP API
      const searchResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=20&apikey=${apiKey}`
      );
      
      if (!searchResponse.ok) {
        throw new Error('Failed to search stocks');
      }
      
      const searchData: FMPSearchResult[] = await searchResponse.json();
      
      // Include all securities (stocks, ETFs, funds, etc.)
      const allSecurities = searchData;
      
      if (allSecurities.length === 0) {
        setSearchResults([]);
        return;
      }
      
      // Get current quotes for the found securities
      const symbols = allSecurities.slice(0, 10).map(stock => stock.symbol).join(',');
      const quoteResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${apiKey}`
      );
      
      if (!quoteResponse.ok) {
        throw new Error('Failed to get stock quotes');
      }
      
      const quoteData: FMPQuote[] = await quoteResponse.json();
      
      // Combine search and quote data
      const results: StockSearchResult[] = allSecurities
        .map(stock => {
          const quote = quoteData.find(q => q.symbol === stock.symbol);
          return {
            symbol: stock.symbol,
            name: stock.name,
            exchange: stock.exchangeShortName || stock.stockExchange || '',
            currency: stock.currency || 'USD',
            price: quote?.price || 0,
            change: quote?.change,
            changePercent: quote?.changesPercentage,
            assetType: getAssetType(stock),
          };
        })
        .filter(stock => stock.price > 0) // Only include securities with valid prices
        .slice(0, 10);
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchStocks,
    searchResults,
    isSearching
  };
};