
import React from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockHeader from '@/components/StockHeader';
import StockQuoteHeader from '@/components/StockQuoteHeader';
import StockChart from '@/components/StockChart';
import { StockProvider, useStock } from '@/context/StockContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import RatingSection from '@/components/RatingSection';
import MetricsSection from '@/components/MetricsSection';
import PeterLynchSection from '@/components/PeterLynchSection';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import PredictabilityStarsSection from '@/components/PredictabilityStarsSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useToast } from '@/hooks/use-toast';

import { needsCurrencyConversion } from '@/utils/currencyConverter';

const IndexContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { 
    isLoading,
    handleSearch,
    loadSavedAnalysis,
    gptAvailable,
    stockInfo,
    overallRating
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
          <div className="p-6 w-full">
            
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Stock Quote Section */}
                <StockQuoteHeader />
                
                {/* Stock Chart Section */}
                <Card className="p-6 h-full">
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
              <div className="mb-8">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none p-0">
                    <TabsTrigger 
                      value="overview" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="financials" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Financials
                    </TabsTrigger>
                    <TabsTrigger 
                      value="forecast" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Forecast
                    </TabsTrigger>
                    <TabsTrigger 
                      value="statistics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Statistics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="metrics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Metrics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dividends" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Dividends
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      History
                    </TabsTrigger>
                    <TabsTrigger 
                      value="profile" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chart" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6"
                    >
                      Chart
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-6">
                    <RatingSection />
                    <PredictabilityStarsSection />
                    <StockHeader stockInfo={stockInfo} />
                  </TabsContent>
                  
                  <TabsContent value="financials" className="mt-6">
                    <div className="text-muted-foreground">Financials content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="forecast" className="mt-6">
                    <div className="text-muted-foreground">Forecast content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="statistics" className="mt-6">
                    <div className="text-muted-foreground">Statistics content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="mt-6">
                    <div className="text-muted-foreground">Metrics content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="dividends" className="mt-6">
                    <div className="text-muted-foreground">Dividends content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-6">
                    <div className="text-muted-foreground">History content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="profile" className="mt-6">
                    <div className="text-muted-foreground">Profile content coming soon...</div>
                  </TabsContent>
                  
                  <TabsContent value="chart" className="mt-6">
                    <div className="text-muted-foreground">Chart content coming soon...</div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {!stockInfo && <RatingSection />}
            
            <LoadingSection />
            
            {!isLoading && (
              <>
                <MetricsSection />
                <PeterLynchSection />
                <CriteriaTabsSection />
                
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
