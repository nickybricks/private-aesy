import { useState } from 'react';

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

export const useStockSearch = () => {
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchStocks = async (query: string) => {
    setIsSearching(true);
    
    try {
      // TODO: Integrate with real stock API
      // Recommended APIs:
      // - Alpha Vantage: https://www.alphavantage.co/
      // - Financial Modeling Prep: https://financialmodelingprep.com/
      // - Twelve Data: https://twelvedata.com/
      // - Polygon.io: https://polygon.io/
      
      // Example API call structure:
      // const response = await fetch(`https://api.example.com/search?q=${query}&apikey=${API_KEY}`);
      // const data = await response.json();
      // const results = data.results.map(item => ({
      //   symbol: item.symbol,
      //   name: item.name,
      //   exchange: item.exchange,
      //   currency: item.currency,
      //   price: item.price,
      //   changePercent: item.changePercent,
      //   isin: item.isin
      // }));
      // setSearchResults(results);
      
      // For now, return empty results until API is integrated
      setSearchResults([]);
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