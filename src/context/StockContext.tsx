
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StockContextType, StockProviderProps, FinancialMetricsData, OverallRatingData, DCFData, NewsItem, ValuationData, ProfitabilityScores, FinancialStrengthScores, ValuationScores, GrowthScores, QualitativeScores } from './StockContextTypes';
import { PredictabilityResult } from '@/services/PredictabilityStarsService';
import { useStockSearch } from './StockSearchService';
import { fetchStockNews, fetchPressReleases } from '@/api/stockApi';
import { fetchValuation } from '@/services/ValuationService';
import { calculateGrowthScores } from '@/services/GrowthScoresService';
import { calculateQualitativeScores } from '@/services/QualitativeScoresService';
import { supabase } from '@/integrations/supabase/client';
import { shouldConvertCurrency, getExchangeRate } from '@/utils/currencyConverter';

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
  const [financialStrengthScores, setFinancialStrengthScores] = useState<FinancialStrengthScores | null>(null);
  const [valuationScores, setValuationScores] = useState<ValuationScores | null>(null);
  const [growthScores, setGrowthScores] = useState<GrowthScores | null>(null);
  const [qualitativeScores, setQualitativeScores] = useState<QualitativeScores | null>(null);

  useEffect(() => {
    const hasGpt = checkHasGptAvailable();
    setGptAvailable(hasGpt);
  }, []);

  // Calculate qualitative scores when buffettCriteria is available after deep research
  useEffect(() => {
    if (buffettCriteria && deepResearchPerformed) {
      console.log('🧠 Calculating qualitative scores from GPT analysis');
      try {
        const qualScores = calculateQualitativeScores(buffettCriteria);
        console.log('✅ Qualitative scores calculated:', qualScores);
        setQualitativeScores(qualScores);
      } catch (error) {
        console.error('Error calculating qualitative scores:', error);
        setQualitativeScores(null);
      }
    } else if (!deepResearchPerformed) {
      // Reset qualitative scores if not performing deep research
      setQualitativeScores(null);
    }
  }, [buffettCriteria, deepResearchPerformed]);

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
          .then(async (valuation) => {
            console.log('✅ Valuation fetched:', valuation);
            
            // Convert valuation data if needed
            let convertedValuation = valuation;
            if (metricsData?.reportedCurrency && info.currency && 
                shouldConvertCurrency(metricsData.reportedCurrency, info.currency)) {
              console.log(`🔄 Converting valuation data from ${metricsData.reportedCurrency} to ${info.currency}`);
              
              const rate = await getExchangeRate(metricsData.reportedCurrency, info.currency);
              
              if (rate) {
                convertedValuation = {
                  ...valuation,
                  fairValuePerShare: valuation.fairValuePerShare * rate,
                  assumptions: valuation.assumptions ? {
                    ...valuation.assumptions,
                    tangibleBookPerShare: valuation.assumptions.tangibleBookPerShare 
                      ? valuation.assumptions.tangibleBookPerShare * rate 
                      : valuation.assumptions.tangibleBookPerShare
                  } : valuation.assumptions
                };
                console.log(`✅ Valuation data converted. New fairValue: ${convertedValuation.fairValuePerShare}`);
              }
            }
            
            setValuationData(convertedValuation);
            
            // Calculate valuation scores after valuation data is loaded
            if (metricsData && !criticalDataMissing) {
              console.log('🎯 Calculating valuation scores');
              
              // Get latest FCF per share
              const latestFCF = metricsData.historicalData?.freeCashFlow?.[0]?.value || null;
              const fcfPerShare = latestFCF && info.sharesOutstanding 
                ? latestFCF / info.sharesOutstanding 
                : null;
              
              // Get Peter Lynch fair value (placeholder for now)
              const peterLynchFairValue = null;
              
              // Get dividend metrics
              const dividendYield = metricsData.dividendMetrics?.currentDividendPerShare 
                ? (metricsData.dividendMetrics.currentDividendPerShare / info.price) * 100 
                : null;
              
              const payoutRatio = metricsData.dividendMetrics?.currentPayoutRatio || null;
              const dividendStreak = metricsData.dividendMetrics?.dividendStreak || 0;
              const dividendCAGR3Y = metricsData.dividendMetrics?.dividendCAGR3Y || null;
              const dividendCAGR5Y = metricsData.dividendMetrics?.dividendCAGR5Y || null;
              const dividendCAGR10Y = metricsData.dividendMetrics?.dividendCAGR10Y || null;
              
              // Get current P/E
              const currentPE = metricsData.historicalData?.peRatioWeekly?.[metricsData.historicalData.peRatioWeekly.length - 1]?.stockPE || null;
              const industryPE = metricsData.historicalData?.peRatioWeekly?.[metricsData.historicalData.peRatioWeekly.length - 1]?.industryPE || null;
              
              supabase.functions.invoke('calculate-valuation-scores', {
                body: {
                  fairValuePerShare: valuation.fairValuePerShare,
                  currentPrice: info.price,
                  sector: info.sector || 'Default',
                  peterLynchFairValue,
                  currentPE,
                  industryPE,
                  dividendYield,
                  payoutRatio,
                  dividendStreak,
                  dividendCAGR3Y,
                  dividendCAGR5Y,
                  dividendCAGR10Y,
                  bookValuePerShare: valuation.assumptions?.tangibleBookPerShare || null,
                  fcfPerShare,
                  historicalFCF: metricsData.historicalData?.freeCashFlow || [],
                }
              })
                .then(({ data, error }) => {
                  if (error) {
                    console.error('Error calculating valuation scores:', error);
                    return;
                  }
                  console.log('✅ Valuation scores calculated:', data);
                  setValuationScores(data);
                })
                .catch((err) => {
                  console.error('Error calling valuation scores function:', err);
                });
            }
            
            // Calculate Growth Scores
            if (metricsData.historicalData) {
              const growthScoresData = calculateGrowthScores(
                metricsData.historicalData.revenue,
                metricsData.historicalData.ebitda,
                metricsData.historicalData.epsWoNri,
                metricsData.historicalData.freeCashFlow
              );
              
              const formattedGrowthScores: GrowthScores = {
                scores: {
                  revenue: { score: growthScoresData.revenueScore, maxScore: 4 },
                  ebitda: { score: growthScoresData.ebitdaScore, maxScore: 4 },
                  epsWoNri: { score: growthScoresData.epsWoNriScore, maxScore: 6 },
                  fcf: { score: growthScoresData.fcfScore, maxScore: 6 },
                },
                totalScore: growthScoresData.totalScore,
                maxTotalScore: growthScoresData.maxTotalScore
              };
              
              console.log('✅ Growth scores calculated:', formattedGrowthScores);
              setGrowthScores(formattedGrowthScores);
            }
          })
          .catch((err) => {
            console.error('Error fetching valuation (non-critical):', err);
            // Don't set error state, valuation is optional
          });
       }

       // Helper function to calculate median from historical data
       const calculateMedianFromHistorical = (
         currentValue: number | null,
         historicalData?: Array<{ year: string; value: number }>
       ): number | null => {
         if (!historicalData || historicalData.length === 0) {
           return currentValue;
         }
         
         // Determine which timeframe to use (10Y > 5Y > 3Y > current)
         let dataToUse = historicalData;
         if (historicalData.length >= 10) {
           dataToUse = historicalData.slice(-10);
         } else if (historicalData.length >= 5) {
           dataToUse = historicalData.slice(-5);
         } else if (historicalData.length >= 3) {
           dataToUse = historicalData.slice(-3);
         } else {
           return currentValue;
         }
         
         // Calculate median
         const values = dataToUse.map(d => d.value).sort((a, b) => a - b);
         const mid = Math.floor(values.length / 2);
         const median = values.length % 2 === 0 
           ? (values[mid - 1] + values[mid]) / 2 
           : values[mid];
         
         return median;
       };

       // Calculate profitability scores based on industry
       if (info && info.industry && metricsData && !criticalDataMissing) {
         console.log('🎯 Calculating profitability scores for industry:', info.industry);
        
        // Calculate median values for scoring
        const roicMedian = calculateMedianFromHistorical(
          metricsData.roic,
          metricsData.historicalData?.roic
        );
        const operatingMarginMedian = calculateMedianFromHistorical(
          metricsData.operatingMargin,
          metricsData.historicalData?.operatingMargin
        );
        const netMarginMedian = calculateMedianFromHistorical(
          metricsData.netMargin,
          metricsData.historicalData?.netMargin
        );
        const roeMedian = calculateMedianFromHistorical(
          metricsData.roe,
          metricsData.historicalData?.roe
        );
        const roaMedian = calculateMedianFromHistorical(
          metricsData.roa,
          metricsData.historicalData?.roa
        );
        
        console.log('📊 Median values being sent for scoring:', {
          roic: roicMedian,
          operatingMargin: operatingMarginMedian,
          netMargin: netMarginMedian,
          roe: roeMedian,
          roa: roaMedian,
          wacc: metricsData.wacc
        });
        
        // Count profitable years from historical net income
        const historicalNetIncome = metricsData.historicalData?.netIncome || [];
        const profitableYears = historicalNetIncome.filter(item => item.isProfitable).length;
        const totalYears = historicalNetIncome.length;
        
        supabase.functions.invoke('calculate-profitability-scores', {
          body: {
            industry: info.industry,
            roic: roicMedian,
            operatingMargin: operatingMarginMedian,
            netMargin: netMarginMedian,
            roe: roeMedian,
            roa: roaMedian,
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

      // Calculate financial strength scores based on industry
      if (info && info.industry && metricsData && !criticalDataMissing) {
        console.log('🎯 Calculating financial strength scores for industry:', info.industry);
        
        // Calculate median values for financial strength metrics
        const netDebtToEbitdaMedian = calculateMedianFromHistorical(
          metricsData.netDebtToEbitda,
          metricsData.historicalData?.netDebtToEbitda
        );
        const interestCoverageMedian = calculateMedianFromHistorical(
          metricsData.interestCoverage,
          metricsData.historicalData?.interestCoverage
        );
        const currentRatioMedian = calculateMedianFromHistorical(
          metricsData.currentRatio,
          metricsData.historicalData?.currentRatio
        );
        
        // Convert debtToAssets from decimal to percentage if needed
        let debtToAssetsValue = metricsData.debtToAssets;
        if (debtToAssetsValue !== null && debtToAssetsValue < 1) {
          debtToAssetsValue = debtToAssetsValue * 100;
        }
        
        // Calculate median for debtToAssets
        const debtToAssetsMedian = calculateMedianFromHistorical(
          debtToAssetsValue,
          metricsData.historicalData?.debtToAssets?.map(item => ({
            ...item,
            value: item.value < 1 ? item.value * 100 : item.value
          }))
        );
        
        console.log('📊 Median values for financial strength scoring:', {
          netDebtToEbitda: netDebtToEbitdaMedian,
          interestCoverage: interestCoverageMedian,
          debtToAssets: debtToAssetsMedian,
          currentRatio: currentRatioMedian
        });
        
        supabase.functions.invoke('calculate-financial-strength-scores', {
          body: {
            industry: info.industry,
            netDebtToEbitda: netDebtToEbitdaMedian,
            interestCoverage: interestCoverageMedian,
            debtToAssets: debtToAssetsMedian,
            currentRatio: currentRatioMedian,
          }
        })
          .then(({ data, error }) => {
            if (error) {
              console.error('Error calculating financial strength scores:', error);
              return;
            }
            console.log('✅ Financial strength scores calculated:', data);
            setFinancialStrengthScores(data);
          })
          .catch((err) => {
            console.error('Error calling financial strength scores function:', err);
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
      financialStrengthScores,
      valuationScores,
      growthScores,
      qualitativeScores,
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
