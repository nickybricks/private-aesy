
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
  dcfData?: DCFData;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: StockProviderProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { checkHasGptAvailable, searchStockInfo } = useStockSearch(setLoadingProgress);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
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
    setLoadingProgress(0);
    setLoadingStartTime(Date.now());
    setError(null);
    
    try {
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      setHasCriticalDataMissing(false);
      setDcfData(undefined);
      
      const { 
        info, 
        stockCurrency: currency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating,
        dcfData: newDcfData
      } = await searchStockInfo(ticker);
      
      // Wenn die dcfData einen intrinsicValue enthält, aktualisiere diesen in den stockInfo-Daten
      if (newDcfData && newDcfData.intrinsicValue !== undefined) {
        if (info) {
          // Ensure intrinsicValue exists on info object and add dcfData
          const updatedInfo = {
            ...info,
            intrinsicValue: newDcfData.intrinsicValue,
            dcfData: newDcfData
          };
          setStockInfo(updatedInfo);
          console.log(`Updated stockInfo.intrinsicValue with dcfData.intrinsicValue: ${newDcfData.intrinsicValue}`);
        }
      } else {
        // Even if there's no intrinsicValue, still add dcfData to stockInfo if available
        const updatedInfo = info ? {
          ...info,
          dcfData: newDcfData
        } : info;
        setStockInfo(updatedInfo);
      }
      
      setStockCurrency(currency);
      setHasCriticalDataMissing(criticalDataMissing);
      
      if (!criticalDataMissing) {
        if (gptAvailable) {
          setActiveTab('gpt');
        }
        
        setBuffettCriteria(criteria);
        setFinancialMetrics(metricsData);
        setOverallRating(rating);
        setDcfData(newDcfData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStartTime(null);
    }
  };

  return (
    <StockContext.Provider value={{
      isLoading,
      loadingProgress,
      loadingStartTime,
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
      setLoadingProgress,
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
