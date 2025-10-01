
import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '@/context/StockContext';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import RatingSection from '@/components/RatingSection';
import MetricsSection from '@/components/MetricsSection';
import PeterLynchSection from '@/components/PeterLynchSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useToast } from '@/hooks/use-toast';
import { needsCurrencyConversion } from '@/utils/currencyConverter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddToWatchlistButton } from '@/components/AddToWatchlistButton';
import { SaveAnalysisButton } from '@/components/SaveAnalysisButton';
import OverviewTab from '@/components/OverviewTab';
import BuffettAnalysisTab from '@/components/BuffettAnalysisTab';
import { BookmarkPlus } from 'lucide-react';

const IndexContent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    isLoading,
    handleSearch,
    loadSavedAnalysis,
    gptAvailable,
    stockInfo,
    buffettCriteria,
    financialMetrics,
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
          {/* Alerts */}
          <div className="space-y-4 mb-6">
            <KiAvailabilityAlert gptAvailable={gptAvailable} />
            
            {stockInfo && stockInfo.currency && stockInfo.reportedCurrency && 
             needsCurrencyConversion(stockInfo.reportedCurrency, stockInfo.currency) && (
              <CurrencyAlert 
                reportedCurrency={stockInfo.reportedCurrency} 
                stockCurrency={stockInfo.currency} 
              />
            )}
            
            <ErrorAlert />
          </div>

          {/* Stock Header with Actions */}
          {stockInfo && (
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{stockInfo.name}</h1>
                  <p className="text-muted-foreground mt-1">
                    {stockInfo.ticker} • {stockInfo.price ? `${stockInfo.price.toFixed(2)} ${stockInfo.currency}` : 'N/A'}
                  </p>
                </div>
                
                {/* Action Buttons - only show when analysis is complete */}
                {buffettCriteria && financialMetrics && overallRating && !isLoading && (
                  <div className="flex items-center gap-2">
                    <SaveAnalysisButton />
                    <AddToWatchlistButton
                      stockInfo={stockInfo}
                      buffettCriteria={buffettCriteria}
                      financialMetrics={financialMetrics}
                      overallRating={overallRating}
                    />
                  </div>
                )}
              </div>

              {/* Overall Rating Badge */}
              <RatingSection />
            </div>
          )}
          
          <LoadingSection />
          
          {/* Tab Navigation */}
          {!isLoading && stockInfo && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="financials">Finanzkennzahlen</TabsTrigger>
                <TabsTrigger value="peter-lynch">Peter Lynch Chart</TabsTrigger>
                <TabsTrigger value="buffett">Buffett-Kriterien KI-Analyse</TabsTrigger>
                <TabsTrigger value="news" disabled>
                  News <span className="ml-1 text-xs text-muted-foreground">(bald)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <OverviewTab />
              </TabsContent>

              <TabsContent value="financials" className="mt-0">
                <MetricsSection />
              </TabsContent>

              <TabsContent value="peter-lynch" className="mt-0">
                <PeterLynchSection />
              </TabsContent>

              <TabsContent value="buffett" className="mt-0">
                <BuffettAnalysisTab />
              </TabsContent>

              <TabsContent value="news" className="mt-0">
                <div className="text-center py-12 text-muted-foreground">
                  <p>News-Integration kommt bald...</p>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DataMissingAlert />
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
