
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { convertCurrency, shouldConvertCurrency } from '@/utils/currencyConverter';

interface HistoricalDataItem {
  year: string;
  value: number;
  originalValue?: number;
  originalCurrency?: string;
}

interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
  reportedCurrency?: string;
  metrics?: Array<{
    name: string;
    value: any;
    formula: string;
    explanation: string;
    threshold: string;
    status: "pass" | "warning" | "fail";
    originalValue?: any;
    originalCurrency?: string;
    isPercentage: boolean;
    isMultiplier: boolean;
  }>;
  historicalData?: {
    revenue: HistoricalDataItem[];
    earnings: HistoricalDataItem[];
    eps: HistoricalDataItem[];
  };
}

interface OverallRatingData {
  overall: any;
  summary: any;
  strengths: any[];
  weaknesses: any[];
  recommendation: any;
  buffettScore: number;
  marginOfSafety: { value: number; status: "pass" | "warning" | "fail"; };
  bestBuyPrice: number;
  currentPrice: any;
  currency: any;
  intrinsicValue: any;
  targetMarginOfSafety: number;
  originalIntrinsicValue?: number | null;
  originalBestBuyPrice?: number | null;
  originalPrice?: number | null;
  originalCurrency?: string;
}

interface StockContextType {
  isLoading: boolean;
  error: string | null;
  stockInfo: any;
  buffettCriteria: any;
  financialMetrics: FinancialMetricsData | null;
  overallRating: OverallRatingData | null;
  gptAvailable: boolean;
  activeTab: string;
  stockCurrency: string;
  hasCriticalDataMissing: boolean;
  setActiveTab: (tab: string) => void;
  handleSearch: (ticker: string) => Promise<void>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState<OverallRatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gptAvailable, setGptAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [stockCurrency, setStockCurrency] = useState<string>('USD');
  const [hasCriticalDataMissing, setHasCriticalDataMissing] = useState(false);

  useEffect(() => {
    setGptAvailable(hasOpenAiApiKey());
    
    if (hasOpenAiApiKey()) {
      setActiveTab('gpt');
    }
  }, []);

  useEffect(() => {
    if (stockInfo) {
      const criticalMissing = 
        !stockInfo || 
        stockInfo.price === null || 
        stockInfo.price === 0 || 
        stockInfo.marketCap === null || 
        stockInfo.marketCap === 0;
      
      setHasCriticalDataMissing(criticalMissing);
    }
  }, [stockInfo]);

  const convertFinancialMetrics = async (metrics: any, reportedCurrency: string, stockPriceCurrency: string) => {
    if (!metrics || !reportedCurrency || !stockPriceCurrency) return metrics;
    
    if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
      console.log(`No conversion needed: both stock price and metrics are in ${stockPriceCurrency}`);
      return metrics;
    }
    
    if (Array.isArray(metrics)) {
      const convertedMetrics = await Promise.all(metrics.map(async metric => {
        if (
          typeof metric.value !== 'number' || 
          isNaN(metric.value) || 
          metric.isPercentage ||
          metric.isMultiplier
        ) {
          return metric;
        }
        
        try {
          const originalValue = metric.value;
          const convertedValue = await convertCurrency(metric.value, reportedCurrency, stockPriceCurrency);
          
          return {
            ...metric,
            value: convertedValue,
            originalValue: originalValue,
            originalCurrency: reportedCurrency
          };
        } catch (error) {
          console.error(`Error converting ${metric.name}:`, error);
          return metric;
        }
      }));

      return convertedMetrics;
    }
    
    return metrics;
  };

  const convertHistoricalData = async (historicalData: any, reportedCurrency: string, stockPriceCurrency: string) => {
    if (!historicalData || !reportedCurrency || !stockPriceCurrency) return historicalData;
    
    if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
      console.log(`No historical data conversion needed: both stock price and data are in ${stockPriceCurrency}`);
      return historicalData;
    }
    
    try {
      const convertedData = {
        revenue: historicalData.revenue ? await Promise.all(historicalData.revenue.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : [],
        earnings: historicalData.earnings ? await Promise.all(historicalData.earnings.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : [],
        eps: historicalData.eps ? await Promise.all(historicalData.eps.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : []
      };

      return convertedData;
    } catch (error) {
      console.error('Error converting historical data:', error);
      return historicalData;
    }
  };

  const handleSearch = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      setHasCriticalDataMissing(false);
      
      const info = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      setStockInfo(info);
      
      if (info && info.currency) {
        setStockCurrency(info.currency);
        console.log(`Stock price currency: ${info.currency}`);
      } else {
        setStockCurrency('USD');
        console.log('No currency information available, defaulting to USD');
      }
      
      const criticalDataMissing = 
        !info || 
        info.price === null || 
        info.price === 0 || 
        info.marketCap === null || 
        info.marketCap === 0;
      
      setHasCriticalDataMissing(criticalDataMissing);
      
      if (!criticalDataMissing) {
        toast({
          title: "Analyse läuft",
          description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
        });
        
        if (gptAvailable) {
          setActiveTab('gpt');
        }
        
        const [criteria, rawMetricsData, rating] = await Promise.all([
          analyzeBuffettCriteria(ticker),
          getFinancialMetrics(ticker),
          getOverallRating(ticker)
        ]);
        
        console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
        console.log('Financial Metrics:', JSON.stringify(rawMetricsData, null, 2));
        console.log('Overall Rating:', JSON.stringify(rating, null, 2));
        
        const priceCurrency = info?.currency || 'USD';
        const reportedCurrency = rawMetricsData?.reportedCurrency || priceCurrency;
        
        console.log(`Price currency: ${priceCurrency}, Reported financial data currency: ${reportedCurrency}`);
        
        const metricsData: FinancialMetricsData = {
          ...rawMetricsData,
          metrics: [
            { 
              name: 'Gewinn pro Aktie (EPS)', 
              value: rawMetricsData.eps, 
              formula: 'Nettogewinn / Anzahl Aktien', 
              explanation: 'Zeigt den Unternehmensgewinn pro Aktie', 
              threshold: '> 0, wachsend', 
              status: rawMetricsData.eps > 0 ? 'pass' : 'fail',
              isPercentage: false,
              isMultiplier: false
            },
            { 
              name: 'Eigenkapitalrendite (ROE)', 
              value: rawMetricsData.roe * 100, 
              formula: 'Nettogewinn / Eigenkapital', 
              explanation: 'Zeigt die Effizienz des eingesetzten Kapitals', 
              threshold: '> 15%', 
              status: rawMetricsData.roe * 100 > 15 ? 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Nettomarge', 
              value: rawMetricsData.netMargin * 100, 
              formula: 'Nettogewinn / Umsatz', 
              explanation: 'Zeigt die Profitabilität', 
              threshold: '> 10%', 
              status: rawMetricsData.netMargin * 100 > 10 ? 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Kapitalrendite (ROIC)', 
              value: rawMetricsData.roic * 100, 
              formula: 'NOPAT / Investiertes Kapital', 
              explanation: 'Zeigt die Effizienz aller Investments', 
              threshold: '> 10%', 
              status: rawMetricsData.roic * 100 > 10 ? 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Schulden zu Vermögen', 
              value: rawMetricsData.debtToAssets * 100, 
              formula: 'Gesamtschulden / Gesamtvermögen', 
              explanation: 'Zeigt die Verschuldungsquote', 
              threshold: '< 50%', 
              status: rawMetricsData.debtToAssets * 100 < 50 ? 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Zinsdeckungsgrad', 
              value: rawMetricsData.interestCoverage, 
              formula: 'EBIT / Zinsaufwand', 
              explanation: 'Zeigt die Fähigkeit, Zinsen zu decken', 
              threshold: '> 5', 
              status: rawMetricsData.interestCoverage > 5 ? 'pass' : 'warning',
              isPercentage: false,
              isMultiplier: true
            },
          ],
          historicalData: rawMetricsData.historicalData || {
            revenue: [],
            earnings: [],
            eps: []
          },
          reportedCurrency: reportedCurrency
        };
        
        if (metricsData) {
          if (metricsData.metrics) {
            if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
              metricsData.metrics = await convertFinancialMetrics(metricsData.metrics, reportedCurrency, priceCurrency);
            }
          }
          
          if (metricsData.historicalData) {
            if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
              metricsData.historicalData = await convertHistoricalData(metricsData.historicalData, reportedCurrency, priceCurrency);
            }
          }
        }
        
        if (rating) {
          try {
            const updatedRating = { ...rating };
            const ratingCurrency = rating.currency || reportedCurrency;
            
            console.log(`Rating original currency: ${ratingCurrency}, Target currency: ${priceCurrency}`);
            console.log(`Original intrinsic value: ${updatedRating.intrinsicValue} ${ratingCurrency}`);
            
            if (shouldConvertCurrency(priceCurrency, ratingCurrency)) {
              console.log(`Converting rating values from ${ratingCurrency} to ${priceCurrency}`);
              
              if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined) {
                updatedRating.originalIntrinsicValue = updatedRating.intrinsicValue;
                
                updatedRating.intrinsicValue = await convertCurrency(
                  updatedRating.intrinsicValue, 
                  ratingCurrency, 
                  priceCurrency
                );
                
                console.log(`Converted intrinsic value: ${updatedRating.intrinsicValue} ${priceCurrency}`);
              }
              
              if (updatedRating.intrinsicValue !== null && 
                  updatedRating.intrinsicValue !== undefined && 
                  updatedRating.targetMarginOfSafety !== undefined) {
                  
                if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined) {
                  updatedRating.originalBestBuyPrice = updatedRating.bestBuyPrice;
                }
                
                updatedRating.bestBuyPrice = updatedRating.intrinsicValue * 
                  (1 - (updatedRating.targetMarginOfSafety / 100));
                
                console.log(`Recalculated best buy price: ${updatedRating.bestBuyPrice} ${priceCurrency}`);
              }
              
              if (updatedRating.intrinsicValue !== null && 
                  updatedRating.intrinsicValue !== undefined && 
                  updatedRating.currentPrice !== null && 
                  updatedRating.currentPrice !== undefined) {
                
                if (updatedRating.currentPrice) {
                  updatedRating.originalPrice = updatedRating.currentPrice;
                  
                  console.log(`Current price already in ${priceCurrency}: ${updatedRating.currentPrice}`);
                }
                
                if (updatedRating.intrinsicValue > 0) {
                  updatedRating.marginOfSafety = {
                    value: ((updatedRating.intrinsicValue - updatedRating.currentPrice) / 
                      updatedRating.intrinsicValue) * 100,
                    status: updatedRating.marginOfSafety?.status || 'fail'
                  };
                  
                  console.log(`Recalculated margin of safety: ${updatedRating.marginOfSafety.value}%`);
                }
              }
              
              if (ratingCurrency !== priceCurrency) {
                updatedRating.originalCurrency = ratingCurrency;
                updatedRating.currency = priceCurrency;
              }
            } else {
              console.log(`No rating conversion needed: both stock price and rating are in ${priceCurrency}`);
            }
            
            if (info && info.price !== null && info.price !== undefined) {
              updatedRating.currentPrice = info.price;
              console.log(`Using stock price from info: ${updatedRating.currentPrice} ${priceCurrency}`);
            }
            
            setOverallRating(updatedRating);
          } catch (error) {
            console.error('Error converting rating values:', error);
            setOverallRating(rating);
          }
        } else {
          setOverallRating(rating);
        }
        
        setBuffettCriteria(criteria);
        setFinancialMetrics(metricsData);
        
        toast({
          title: "Analyse abgeschlossen",
          description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
        });
      } else {
        toast({
          title: "Analyse nicht möglich",
          description: `Für ${info.name} liegen nicht ausreichend Daten für eine Buffett-Analyse vor.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching for stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      let enhancedErrorMessage = errorMessage;
      if(errorMessage.includes("Keine Daten gefunden für")) {
        const searchedTicker = ticker.toUpperCase();
        
        if(searchedTicker === "APPL") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meinten Sie vielleicht AAPL (Apple)?`;
        } else if(searchedTicker === "GOOGL" || searchedTicker === "GOOG") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Versuchen Sie es mit GOOGL oder GOOG (Alphabet/Google).`;
        } else if(searchedTicker === "FB") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meta (ehemals Facebook) wird jetzt als META gehandelt.`;
        } else {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Bitte überprüfen Sie das Aktiensymbol.`;
        }
      }
      
      setError(enhancedErrorMessage);
      toast({
        title: "Fehler",
        description: enhancedErrorMessage,
        variant: "destructive",
      });
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
