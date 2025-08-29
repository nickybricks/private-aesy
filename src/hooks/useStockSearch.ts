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
    const excludePatterns = [
      /ETF/i, /FUND/i, /INDEX/i, /REIT/i, /ADR/i, /GDR/i,
      /WARRANT/i, /BOND/i, /NOTE/i, /CERTIFICATE/i,
      /FUTURE/i, /OPTION/i, /SWAP/i
    ];
    
    const name = item.name.toLowerCase();
    const symbol = item.symbol.toLowerCase();
    
    return !excludePatterns.some(pattern => 
      pattern.test(name) || pattern.test(symbol)
    );
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
      
      // Filter only stocks (exclude ETFs, funds, etc.)
      const stocksOnly = searchData.filter(isStock);
      
      if (stocksOnly.length === 0) {
        setSearchResults([]);
        return;
      }
      
      // Get current quotes for the found stocks
      const symbols = stocksOnly.slice(0, 10).map(stock => stock.symbol).join(',');
      const quoteResponse = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols}?apikey=${apiKey}`
      );
      
      if (!quoteResponse.ok) {
        throw new Error('Failed to get stock quotes');
      }
      
      const quoteData: FMPQuote[] = await quoteResponse.json();
      
      // Combine search and quote data
      const results: StockSearchResult[] = stocksOnly
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
          };
        })
        .filter(stock => stock.price > 0) // Only include stocks with valid prices
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