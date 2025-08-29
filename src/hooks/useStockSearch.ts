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
      // Simulierte API-Abfrage - hier würdest du eine echte Stock-API verwenden
      // Beispiele für verschiedene APIs:
      // - Alpha Vantage
      // - Financial Modeling Prep
      // - Yahoo Finance API
      // - Twelve Data
      // - Polygon.io
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuliere API-Delay
      
      // Mock-Daten basierend auf der Suchanfrage
      const mockResults: StockSearchResult[] = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
          currency: 'USD',
          price: 175.25,
          changePercent: 1.25,
          isin: 'US0378331005'
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          exchange: 'NASDAQ',
          currency: 'USD',
          price: 342.50,
          changePercent: -0.85,
          isin: 'US5949181045'
        },
        {
          symbol: 'SAP',
          name: 'SAP SE',
          exchange: 'XETRA',
          currency: 'EUR',
          price: 125.40,
          changePercent: 0.65,
          isin: 'DE0007164600'
        },
        {
          symbol: 'ASML',
          name: 'ASML Holding N.V.',
          exchange: 'NASDAQ',
          currency: 'USD',
          price: 650.80,
          changePercent: 2.15,
          isin: 'NL0010273215'
        }
      ].filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.isin?.includes(query.toUpperCase())
      );
      
      setSearchResults(mockResults);
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