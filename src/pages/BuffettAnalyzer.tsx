
import React from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockHeader from '@/components/StockHeader';
import StockQuoteHeader from '@/components/StockQuoteHeader';
import StockChart from '@/components/StockChart';
import { StockProvider, useStock } from '@/context/StockContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewsSection from '@/components/NewsSection';
import { Card } from '@/components/ui/card';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import RatingSection from '@/components/RatingSection';
import MetricsSection from '@/components/MetricsSection';
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

const IndexContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { 
    isLoading,
    handleSearch,
    loadSavedAnalysis,
    gptAvailable,
    stockInfo,
    overallRating,
    newsItems,
    pressReleases
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
            
            {/* Stock Quote Header and Chart Grid */}
            {stockInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4">
                {/* Stock Quote Section */}
                <StockQuoteHeader />
                
                {/* Stock Chart Section */}
                <Card className="p-3 sm:p-4 md:p-5">
                  <StockChart 
                    symbol={stockInfo.ticker}
                    currency={stockInfo.currency}
                    intrinsicValue={overallRating?.intrinsicValue ?? null}
                  />
                </Card>
              </div>
            )}
            
            {/* Tab Navigation */}
            {stockInfo && (
              <div className="mb-6 sm:mb-8 -mx-3 sm:mx-0">
                <Tabs defaultValue="news" className="w-full">
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
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
                    >
                      News
                    </TabsTrigger>
                    <TabsTrigger 
                      value="financials" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
                    >
                      Finanzkennzahlen
                    </TabsTrigger>
                    <TabsTrigger 
                      value="statistics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
                    >
                      Deep-Research
                    </TabsTrigger>
                    <TabsTrigger 
                      value="metrics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
                    >
                      Innerer Wert
                    </TabsTrigger>
                    <TabsTrigger 
                      value="peter-lynch" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 md:px-6 whitespace-nowrap flex-shrink-0 text-sm"
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
                  
                  <TabsContent value="financials" className="mt-4 sm:mt-6">
                    <MetricsSection />
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
