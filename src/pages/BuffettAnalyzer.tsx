
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
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
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
import { PERatioCard } from '@/components/metrics/PERatioCard';
import { DividendYieldCard } from '@/components/metrics/DividendYieldCard';
import { PeterLynchDiscountCard } from '@/components/metrics/PeterLynchDiscountCard';
import { PriceToBookCard } from '@/components/metrics/PriceToBookCard';
import { PriceToCashFlowCard } from '@/components/metrics/PriceToCashFlowCard';
import { PriceToMedianPSChart } from '@/components/metrics/PriceToMedianPSChart';
import { RevenueGrowthCard } from '@/components/metrics/RevenueGrowthCard';
import { EbitdaGrowthCard } from '@/components/metrics/EbitdaGrowthCard';
import { EpsWoNriGrowthCard } from '@/components/metrics/EpsWoNriGrowthCard';
import { FcfGrowthCard } from '@/components/metrics/FcfGrowthCard';
import { QualitativeAnalysisTab } from '@/components/QualitativeAnalysisTab';

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
    financialStrengthScores,
    valuationData,
    valuationScores,
    growthScores,
    qualitativeScores,
    stockCurrency,
    deepResearchPerformed,
    setValuationCardScore
  } = useStock();
  const { toast } = useToast();

  // Track what has been processed to prevent duplicate actions
  const processedRef = useRef<string | null>(null);

  // Check for ticker parameter in URL and trigger search
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const loadAnalysisId = searchParams.get('loadAnalysis');
    
    // Create unique key for this request
    const requestKey = `${ticker}-${loadAnalysisId || 'new'}`;
    
    // Don't proceed if already processing this request or currently loading
    if (isLoading || processedRef.current === requestKey) {
      return;
    }
    
    if (ticker) {
      processedRef.current = requestKey;
      console.log('Performing search for ticker:', ticker);
      handleSearch(ticker);
    }
  }, [searchParams, isLoading]);
  
  return (
    <main className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          <div className="p-3 sm:p-4 md:p-6 w-full max-w-screen-xl mx-auto">
            
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
            
            {/* Hidden Score Pre-Loaders - Calculate scores immediately */}
            {stockInfo && financialMetrics && (
              <div className="hidden" aria-hidden="true">
                <PriceToMedianPSChart
                  ticker={stockInfo.ticker}
                  currentPrice={stockInfo.price}
                  sector={stockInfo.sector}
                  currency={stockInfo.currency}
                  onDiscountCalculated={(discount, score) => {
                    console.log('🎯 Pre-loader: P/S Score berechnet', { discount, score });
                    setValuationCardScore('priceToMedianPS', score, 4);
                  }}
                />
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
                        displayCurrency={stockInfo.currency}
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
                        currentValue={financialMetrics?.netDebtToEbitda ?? financialMetrics?.metrics?.find(m => m.name === 'Net Debt to EBITDA')?.value ?? null}
                        historicalData={financialMetrics?.historicalData?.netDebtToEbitda}
                        preset={financialStrengthScores?.preset}
                        scoreFromBackend={financialStrengthScores?.scores?.netDebtToEbitda}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="valuation" className="mt-4 sm:mt-6">
                    <div className="space-y-4">
              {/* Price to Median P/S Chart - positioned at the top */}
              <PriceToMedianPSChart
                ticker={stockInfo.ticker}
                currentPrice={stockInfo.price}
                sector={stockInfo.sector}
                currency={stockInfo.currency}
                onDiscountCalculated={(discount, score) => {
                  setValuationCardScore('priceToMedianPS', score, 4);
                }}
              />
              
              {/* Peter Lynch Discount Card */}
              <PeterLynchDiscountCard
                ticker={stockInfo.ticker}
                currentPrice={stockInfo.price}
                currency={stockInfo.currency}
                sector={stockInfo.sector}
              />
              
              <PERatioCard
                currentPrice={stockInfo.price}
                historicalPE={financialMetrics?.historicalData?.peRatio}
                weeklyPE={financialMetrics?.historicalData?.peRatioWeekly}
                currentStockPE={
                  financialMetrics?.historicalData?.peRatio
                    ?.find(pe => pe.year.includes('TTM'))?.value
                }
                currentIndustryPE={
                  financialMetrics?.historicalData?.industryPE?.[
                    financialMetrics.historicalData.industryPE.length - 1
                  ]?.value
                }
                industry={stockInfo.industry}
                onScoreChange={(score, max) => setValuationCardScore('peRatio', score, max)}
              />
              
              {/* Dividend Yield Card - positioned after P/E Ratio Chart */}
              {financialMetrics?.dividendMetrics && (
                <DividendYieldCard
                  currentPrice={stockInfo.price}
                  currentDividendPerShare={financialMetrics.dividendMetrics.currentDividendPerShare}
                  historicalDividends={financialMetrics.historicalData?.dividend || []}
                  payoutRatioFCFHistory={financialMetrics.historicalData?.payoutRatioFCF || []}
                  payoutRatioEPSHistory={financialMetrics.historicalData?.payoutRatioEPS || []}
                  dividendStreak={financialMetrics.dividendMetrics.dividendStreak}
                  dividendCAGR3Y={financialMetrics.dividendMetrics.dividendCAGR3Y}
                  dividendCAGR5Y={financialMetrics.dividendMetrics.dividendCAGR5Y}
                  dividendCAGR10Y={financialMetrics.dividendMetrics.dividendCAGR10Y}
                  onScoreChange={(score, max) => setValuationCardScore('dividendYield', score, max)}
                />
              )}
              
              {/* Price to Book Card */}
              {valuationData?.assumptions?.tangibleBookPerShare && (
                <PriceToBookCard
                  currentPrice={stockInfo.price}
                  bookValuePerShare={financialMetrics?.bookValuePerShare || valuationData.assumptions.tangibleBookPerShare}
                  historicalPrices={financialMetrics?.historicalData?.peRatioWeekly?.map(pe => {
                    const eps = financialMetrics.eps || 1;
                    const price = pe.stockPE * (typeof eps === 'number' ? eps : 1);
                    return {
                      date: pe.date,
                      close: price > 0 ? price : stockInfo.price
                    };
                  }) || []}
                  historicalBookValue={[]}
                  currency={stockInfo.currency}
                  sector={stockInfo.sector}
                />
              )}
              
              {/* Price to Cash Flow Card - positioned below P/B */}
              {financialMetrics?.historicalData?.freeCashFlow && 
               financialMetrics.historicalData.freeCashFlow.length > 0 && 
               financialMetrics?.historicalData?.peRatioWeekly && 
               financialMetrics.historicalData.peRatioWeekly.length > 0 && (
                <PriceToCashFlowCard
                  currentPrice={stockInfo.price}
                  fcfPerShare={
                    stockInfo.sharesOutstanding && financialMetrics.historicalData.freeCashFlow[0]?.value
                      ? financialMetrics.historicalData.freeCashFlow[0].value / stockInfo.sharesOutstanding
                      : null
                  }
                  historicalPrices={financialMetrics?.historicalData?.peRatioWeekly?.map(pe => {
                    const eps = financialMetrics.eps || 1;
                    const price = pe.stockPE * (typeof eps === 'number' ? eps : 1);
                    return {
                      date: pe.date,
                      close: price > 0 ? price : stockInfo.price
                    };
                  }) || []}
                  historicalFCF={financialMetrics.historicalData.freeCashFlow}
                  sharesOutstanding={stockInfo.sharesOutstanding}
                  currency={stockInfo.currency}
                  sector={stockInfo.sector}
                 />
               )}
                     </div>
                   </TabsContent>
                  
                  <TabsContent value="growth-rank" className="mt-4 sm:mt-6">
                    <div className="space-y-6">
                      {financialMetrics?.historicalData?.revenue && (
                        <RevenueGrowthCard 
                          historicalRevenue={financialMetrics.historicalData.revenue}
                        />
                      )}
                      
                      {financialMetrics?.historicalData?.ebitda && (
                        <EbitdaGrowthCard 
                          historicalEbitda={financialMetrics.historicalData.ebitda}
                        />
                      )}
                      
                      {financialMetrics?.historicalData?.epsWoNri && (
                        <EpsWoNriGrowthCard 
                          historicalEpsWoNri={financialMetrics.historicalData.epsWoNri}
                        />
                      )}
                      
                      {financialMetrics?.historicalData?.freeCashFlow && (
                        <FcfGrowthCard 
                          historicalFcf={financialMetrics.historicalData.freeCashFlow}
                        />
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ai-analysis" className="mt-4 sm:mt-6">
                    {qualitativeScores && deepResearchPerformed ? (
                      <QualitativeAnalysisTab qualitativeScores={qualitativeScores} />
                    ) : (
                      <Card className="p-6">
                        <h2 className="text-2xl font-semibold mb-4">Qualitative KI Analyse</h2>
                        <p className="text-muted-foreground">
                          Deep-Research erforderlich. Bitte führen Sie zuerst eine KI-Analyse durch, 
                          um die 8 qualitativen Buffett-Kriterien zu bewerten.
                        </p>
                      </Card>
                    )}
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
