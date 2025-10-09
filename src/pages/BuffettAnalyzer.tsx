
import React from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockHeader from '@/components/StockHeader';
import StockHeaderWithScore from '@/components/StockHeaderWithScore';
import StockChart from '@/components/StockChart';
import { StockProvider, useStock } from '@/context/StockContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import NewsSection from '@/components/NewsSection';
import { Card } from '@/components/ui/card';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import RatingSection from '@/components/RatingSection';
import PeterLynchSection from '@/components/PeterLynchSection';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useToast } from '@/hooks/use-toast';
import { needsCurrencyConversion } from '@/utils/currencyConverter';
import { ValuationTab } from '@/components/ValuationTab';
import { ROECard } from '@/components/metrics/ROECard';
import { ROICCard } from '@/components/metrics/ROICCard';
import { OperatingMarginCard } from '@/components/metrics/OperatingMarginCard';
import { NetMarginCard } from '@/components/metrics/NetMarginCard';
import { ROACard } from '@/components/metrics/ROACard';
import { YearsOfProfitabilityCard } from '@/components/metrics/YearsOfProfitabilityCard';
import { DebtToAssetsCard } from '@/components/metrics/DebtToAssetsCard';
import { InterestCoverageCard } from '@/components/metrics/InterestCoverageCard';
import { CurrentRatioCard } from '@/components/metrics/CurrentRatioCard';
import { NetDebtToEbitdaCard } from '@/components/metrics/NetDebtToEbitdaCard';

const IndexContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('news');
  const {
    isLoading,
    handleSearch,
    loadSavedAnalysis,
    gptAvailable,
    stockInfo,
    overallRating,
    newsItems,
    pressReleases,
    financialMetrics,
    profitabilityScores,
    financialStrengthScores
  } = useStock();
  const { analyses, loading: analysesLoading } = useSavedAnalyses();
  const { toast } = useToast();

  // Track what has been processed to prevent duplicate actions
  const processedRef = useRef<string | null>(null);

  // Check for ticker parameter in URL and trigger search
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const loadAnalysisId = searchParams.get('loadAnalysis');
    
    // Create unique key for this request
    const requestKey = `${ticker}-${loadAnalysisId || 'new'}`;
    
    // Don't proceed if analyses are still loading, already processing this request, or currently loading
    if (analysesLoading || isLoading || processedRef.current === requestKey) {
      return;
    }
    
    if (ticker) {
      processedRef.current = requestKey;
      
      if (loadAnalysisId) {
        // Load saved analysis instead of performing new search
        console.log('Searching for saved analysis with ID:', loadAnalysisId);
        console.log('Available analyses:', analyses.map(a => a.id));
        
        const savedAnalysis = analyses.find(analysis => analysis.id === loadAnalysisId);
        if (savedAnalysis) {
          console.log('Found saved analysis, loading:', savedAnalysis.title);
          loadSavedAnalysis(savedAnalysis.analysis_data);
          toast({
            title: "Analyse geladen",
            description: `${savedAnalysis.title} wurde erfolgreich geladen.`
          });
        } else {
          console.log('Saved analysis not found, performing new search');
          handleSearch(ticker);
        }
      } else {
        console.log('No loadAnalysis parameter, performing new search');
        handleSearch(ticker);
      }
    }
  }, [searchParams, isLoading, analysesLoading, analyses]);
  
  return (
    <main className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          <div className="p-3 sm:p-4 md:p-6 w-full">
            
            <KiAvailabilityAlert gptAvailable={gptAvailable} />
            
            {stockInfo && stockInfo.currency && stockInfo.reportedCurrency && 
             needsCurrencyConversion(stockInfo.reportedCurrency, stockInfo.currency) && (
              <CurrencyAlert 
                reportedCurrency={stockInfo.reportedCurrency} 
                stockCurrency={stockInfo.currency} 
              />
            )}
            
            <ErrorAlert />
            
            {/* Stock Header with Score and Stock Chart Grid */}
            {stockInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] items-start gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                {/* Stock Header with Score Section */}
                <StockHeaderWithScore onTabChange={setActiveTab} />
                
                {/* Stock Chart Section */}
                <Card className="p-3 sm:p-4 md:p-5">
                  <StockChart 
                    symbol={stockInfo.ticker}
                    currency={stockInfo.currency}
                    intrinsicValue={overallRating?.intrinsicValue ?? null}
                    companyImage={stockInfo.image}
                    companyName={stockInfo.name}
                  />
                </Card>
              </div>
            )}
            
            {/* Tab Navigation */}
            {stockInfo && (
              <div className="mb-6 sm:mb-8 -mx-3 sm:mx-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="relative">
                    {/* Fade indicator am rechten Rand auf Mobil */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />
                    <TabsList className="w-full justify-start h-11 sm:h-12 bg-transparent border-b border-border rounded-none p-0 pl-3 sm:pl-0 overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-hide"
                    style={{ 
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <TabsTrigger 
                      value="news" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      News
                    </TabsTrigger>
                    <TabsTrigger 
                      value="profitability" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      1. Profitabilität
                    </TabsTrigger>
                    <TabsTrigger 
                      value="financial-strength" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      2. Finanzielle Stärke
                    </TabsTrigger>
                    <TabsTrigger 
                      value="valuation" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      3. Bewertung / Innerer Wert
                    </TabsTrigger>
                    <TabsTrigger 
                      value="growth-rank" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      4. Growth Rank
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ai-analysis" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      5. Qual. KI Analyse
                    </TabsTrigger>
                    <TabsTrigger 
                      value="statistics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      Deep-Research
                    </TabsTrigger>
                    <TabsTrigger 
                      value="metrics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      Innerer Wert
                    </TabsTrigger>
                    <TabsTrigger 
                      value="peter-lynch" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap text-sm flex-shrink-0 grow-0 basis-auto w-auto max-w-max"
                    >
                      Peter Lynch
                    </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="news" className="mt-4 sm:mt-6">
                    <NewsSection 
                      newsItems={newsItems} 
                      pressReleases={pressReleases}
                    />
                  </TabsContent>
                  
                  <TabsContent value="profitability" className="mt-4 sm:mt-6">
                    <div className="space-y-4">
                      <ROECard 
                        currentValue={financialMetrics?.roe ?? null}
                        historicalData={financialMetrics?.historicalData?.roe}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.roe}
                      />
                      <ROICCard 
                        currentValue={financialMetrics?.roic ?? null}
                        historicalData={financialMetrics?.historicalData?.roic}
                        wacc={financialMetrics?.wacc}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.roic}
                      />
                      <OperatingMarginCard 
                        currentValue={financialMetrics?.operatingMargin ?? null}
                        historicalData={financialMetrics?.historicalData?.operatingMargin}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.operatingMargin}
                      />
                      <NetMarginCard 
                        currentValue={financialMetrics?.netMargin ?? null}
                        historicalData={financialMetrics?.historicalData?.netMargin}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.netMargin}
                      />
                      <ROACard 
                        currentValue={financialMetrics?.roa ?? null}
                        historicalData={financialMetrics?.historicalData?.roa}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.roa}
                      />
                      <YearsOfProfitabilityCard 
                        historicalNetIncome={financialMetrics?.historicalData?.netIncome}
                        preset={profitabilityScores?.preset}
                        scoreFromBackend={profitabilityScores?.scores?.years}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="financial-strength" className="mt-4 sm:mt-6">
                    <div className="space-y-4">
                      <DebtToAssetsCard 
                        currentValue={financialMetrics?.debtToAssets ?? null}
                        historicalData={financialMetrics?.historicalData?.debtToAssets}
                        preset={financialStrengthScores?.preset}
                        scoreFromBackend={financialStrengthScores?.scores?.debtToAssets}
                      />
                      <InterestCoverageCard 
                        currentValue={financialMetrics?.interestCoverage ?? null}
                        historicalData={financialMetrics?.historicalData?.interestCoverage}
                        preset={financialStrengthScores?.preset}
                        scoreFromBackend={financialStrengthScores?.scores?.interestCoverage}
                      />
                      <CurrentRatioCard 
                        currentValue={financialMetrics?.currentRatio ?? financialMetrics?.metrics?.find(m => m.name === 'Current Ratio')?.value ?? null}
                        historicalData={financialMetrics?.historicalData?.currentRatio}
                        preset={financialStrengthScores?.preset}
                        scoreFromBackend={financialStrengthScores?.scores?.currentRatio}
                      />
                      <NetDebtToEbitdaCard 
                        currentValue={
                          financialMetrics?.netDebtToEbitda 
                          ?? financialMetrics?.metrics?.find(m => m.name === 'Net Debt to EBITDA' || m.name === 'Net Debt/EBITDA' || m.name === 'Net Debt / EBITDA')?.value 
                          ?? financialMetrics?.historicalData?.netDebtToEbitda?.[financialMetrics?.historicalData?.netDebtToEbitda?.length - 1]?.value 
                          ?? null
                        }
                        historicalData={financialMetrics?.historicalData?.netDebtToEbitda}
                        preset={financialStrengthScores?.preset}
                        scoreFromBackend={financialStrengthScores?.scores?.netDebtToEbitda}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="valuation" className="mt-4 sm:mt-6">
                    <Card className="p-6">
                      <h2 className="text-2xl font-semibold mb-4">Bewertung / Innerer Wert</h2>
                      <p className="text-muted-foreground">Inhalt folgt...</p>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="growth-rank" className="mt-4 sm:mt-6">
                    <Card className="p-6">
                      <h2 className="text-2xl font-semibold mb-4">Growth Rank</h2>
                      <p className="text-muted-foreground">Inhalt folgt...</p>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="ai-analysis" className="mt-4 sm:mt-6">
                    <Card className="p-6">
                      <h2 className="text-2xl font-semibold mb-4">Qualitative KI Analyse</h2>
                      <p className="text-muted-foreground">Inhalt folgt...</p>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="statistics" className="mt-4 sm:mt-6">
                    <RatingSection />
                    <CriteriaTabsSection />
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="mt-4 sm:mt-6">
                    <ValuationTab 
                      ticker={stockInfo.ticker}
                      currentPrice={stockInfo.price}
                    />
                  </TabsContent>
                  
                  <TabsContent value="peter-lynch" className="mt-4 sm:mt-6">
                    <PeterLynchSection />
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {!stockInfo && <RatingSection />}
            
            <LoadingSection />
            
            {!isLoading && (
              <>
                <DataMissingAlert />
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-border mt-12">
            <div className="w-full">
              <AppFooter />
            </div>
          </div>
        </div>
      </main>
  );
};

const Index: React.FC = () => {
  return <IndexContent />;
};

export default Index;
