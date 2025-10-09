
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockContextType, StockProviderProps, FinancialMetricsData, OverallRatingData, DCFData, NewsItem, ValuationData, ProfitabilityScores } from './StockContextTypes';
import { PredictabilityResult } from '@/services/PredictabilityStarsService';
import { useStockSearch } from './StockSearchService';
import { fetchStockNews, fetchPressReleases } from '@/api/stockApi';
import { fetchValuation } from '@/services/ValuationService';
import { supabase } from '@/integrations/supabase/client';

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
  const [predictabilityStars, setPredictabilityStars] = useState<PredictabilityResult | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [pressReleases, setPressReleases] = useState<NewsItem[]>([]);
  const [valuationData, setValuationData] = useState<ValuationData | undefined>(undefined);
  const [deepResearchPerformed, setDeepResearchPerformed] = useState(false);
  const [profitabilityScores, setProfitabilityScores] = useState<ProfitabilityScores | null>(null);

  useEffect(() => {
    const hasGpt = checkHasGptAvailable();
    setGptAvailable(hasGpt);
  }, []);

  const handleSearch = async (ticker: string, enableDeepResearch = false) => {
    console.log('🔍 handleSearch called with:', { ticker, enableDeepResearch });
    
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
      setPredictabilityStars(null);
      setNewsItems([]);
      setPressReleases([]);
      setValuationData(undefined);
      setDeepResearchPerformed(enableDeepResearch);
      
      const {
        info, 
        stockCurrency: currency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating,
        dcfData: newDcfData,
        predictabilityStars: newPredictabilityStars
      } = await searchStockInfo(ticker, enableDeepResearch);
      
      console.log('✅ Analysis completed. Results received:', {
        hasInfo: !!info,
        hasCriteria: !!criteria,
        hasMetrics: !!metricsData,
        hasRating: !!rating,
        enableDeepResearch
      });

      // Fetch news after we have company info (for NewsAPI integration)
      const companyName = info?.name || ticker;
      const newsPromise = fetchStockNews(ticker, companyName).catch(err => {
        console.error('Error fetching news:', err);
        return [];
      });
      const pressPromise = fetchPressReleases(ticker, companyName).catch(err => {
        console.error('Error fetching press releases:', err);
        return [];
      });
      
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
        // Set active tab based on whether deep research was performed
        setActiveTab(enableDeepResearch ? 'gpt' : 'standard');
        
        setBuffettCriteria(criteria);
        setFinancialMetrics(metricsData);
        setOverallRating(rating);
        setDcfData(newDcfData);
        
        // Only set predictability stars if it's actually a PredictabilityResult
        if (newPredictabilityStars && typeof newPredictabilityStars === 'object' && 'stars' in newPredictabilityStars) {
          setPredictabilityStars(newPredictabilityStars as PredictabilityResult);
        } else {
          setPredictabilityStars(null);
        }
      }
      
      // Wait for news to load
      const [news, press] = await Promise.all([newsPromise, pressPromise]);
      console.log('✅ News fetched:', { news: news.length, press: press.length });
      setNewsItems(news);
      setPressReleases(press);
      
      // Fetch valuation data in background (non-blocking)
      if (info && info.price) {
        fetchValuation(ticker, 'EPS_WO_NRI', info.price)
          .then((valuation) => {
            console.log('✅ Valuation fetched:', valuation);
            setValuationData(valuation);
          })
          .catch((err) => {
            console.error('Error fetching valuation (non-critical):', err);
            // Don't set error state, valuation is optional
          });
      }

      // Calculate profitability scores based on industry
      if (info && info.industry && metricsData && !criticalDataMissing) {
        console.log('🎯 Calculating profitability scores for industry:', info.industry);
        console.log('📊 Metrics being sent:', {
          roic: metricsData.roic,
          operatingMargin: metricsData.operatingMargin,
          netMargin: metricsData.netMargin,
          roe: metricsData.roe,
          roa: metricsData.roa,
          wacc: metricsData.wacc
        });
        
        // Count profitable years from historical net income
        const historicalNetIncome = metricsData.historicalData?.netIncome || [];
        const profitableYears = historicalNetIncome.filter(item => item.isProfitable).length;
        const totalYears = historicalNetIncome.length;
        
        supabase.functions.invoke('calculate-profitability-scores', {
          body: {
            industry: info.industry,
            roic: metricsData.roic,
            operatingMargin: metricsData.operatingMargin,
            netMargin: metricsData.netMargin,
            roe: metricsData.roe,
            roa: metricsData.roa,
            wacc: metricsData.wacc,
            profitableYears,
            totalYears,
          }
        })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error calculating profitability scores:', error);
              return;
            }
            console.log('✅ Profitability scores calculated:', data);
            setProfitabilityScores(data);
          })
          .catch((err) => {
            console.error('Error calling profitability scores function:', err);
          });
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

  const loadSavedAnalysis = (analysisData: any) => {
    try {
      setStockInfo(analysisData.stockInfo);
      setBuffettCriteria(analysisData.buffettCriteria);
      setFinancialMetrics(analysisData.financialMetrics);
      setOverallRating(analysisData.overallRating);
      setDcfData(analysisData.dcfData);
      setPredictabilityStars(analysisData.predictabilityStars);
      setStockCurrency(analysisData.stockInfo?.currency || 'EUR');
      setValuationData(analysisData.valuationData);
      setDeepResearchPerformed(analysisData.deepResearchPerformed || false);
      // Set active tab based on whether deep research was performed
      setActiveTab(analysisData.deepResearchPerformed ? 'gpt' : 'standard');
      setError(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading saved analysis:', error);
      setError('Fehler beim Laden der gespeicherten Analyse');
    }
  };

  const triggerDeepResearch = async (ticker: string) => {
    console.log('🔬 triggerDeepResearch called for:', ticker);
    await handleSearch(ticker, true);
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
      valuationData,
      predictabilityStars,
      newsItems,
      pressReleases,
      deepResearchPerformed,
      profitabilityScores,
      setActiveTab,
      setLoadingProgress,
      handleSearch,
      loadSavedAnalysis,
      triggerDeepResearch
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
