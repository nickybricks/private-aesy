
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockContextType, StockProviderProps, FinancialMetricsData, OverallRatingData, DCFData } from './StockContextTypes';
import { useStockSearch } from './StockSearchService';

// Define a more specific interface for stockInfo
interface StockInfo {
  name: any;
  ticker: any;
  price: any;
  change: any;
  changePercent: any;
  currency: any;
  marketCap: any;
  intrinsicValue?: number | null;
  sharesOutstanding?: number | null;
  reportedCurrency?: string;
  originalCurrency?: string;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: StockProviderProps) {
  const { checkHasGptAvailable, searchStockInfo } = useStockSearch();
  
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState<OverallRatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gptAvailable, setGptAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [stockCurrency, setStockCurrency] = useState<string>('USD');
  const [hasCriticalDataMissing, setHasCriticalDataMissing] = useState(false);
  const [dcfData, setDcfData] = useState<DCFData | undefined>(undefined);

  useEffect(() => {
    const hasGpt = checkHasGptAvailable();
    setGptAvailable(hasGpt);
    
    if (hasGpt) {
      setActiveTab('gpt');
    }
  }, []);

  const handleSearch = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      setHasCriticalDataMissing(false);
      setDcfData(undefined);
      
      console.log(`Starting stock search for ticker: ${ticker}`);
      
      const { 
        info, 
        stockCurrency: currency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating,
        dcfData: newDcfData
      } = await searchStockInfo(ticker);
      
      console.log(`Search complete for ${ticker}, processing results...`);
      console.log(`DCF data received:`, newDcfData ? 'YES' : 'NO');
      
      // Wenn die dcfData einen intrinsicValue enthält, aktualisiere diesen in den stockInfo-Daten
      if (newDcfData && newDcfData.intrinsicValue !== undefined) {
        if (info) {
          // Ensure intrinsicValue exists on info object
          const updatedInfo = {
            ...info,
            intrinsicValue: newDcfData.intrinsicValue
          };
          setStockInfo(updatedInfo);
          console.log(`Updated stockInfo.intrinsicValue with dcfData.intrinsicValue: ${newDcfData.intrinsicValue}`);
        }
      } else {
        setStockInfo(info);
        console.log('No DCF data with intrinsicValue available to update stockInfo');
      }
      
      setStockCurrency(currency);
      setHasCriticalDataMissing(criticalDataMissing);
      setDcfData(newDcfData);
      
      console.log(`Setting DCF data in context:`, newDcfData);
      
      if (!criticalDataMissing) {
        if (gptAvailable) {
          setActiveTab('gpt');
        }
        
        setBuffettCriteria(criteria);
        setFinancialMetrics(metricsData);
        setOverallRating(rating);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error(`Stock search error: ${errorMessage}`, error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StockContext.Provider value={{
      isLoading,
      error,
      stockInfo,
      buffettCriteria,
      financialMetrics,
      overallRating,
      gptAvailable,
      activeTab,
      stockCurrency,
      hasCriticalDataMissing,
      dcfData,
      setActiveTab,
      handleSearch
    }}>
      {children}
    </StockContext.Provider>
  );
}

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
