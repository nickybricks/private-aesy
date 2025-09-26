
import React from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import LeftNavigation from '@/components/LeftNavigation';
import { StockProvider, useStock } from '@/context/StockContext';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import RatingSection from '@/components/RatingSection';
import MetricsSection from '@/components/MetricsSection';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import PredictabilityStarsSection from '@/components/PredictabilityStarsSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppHeader from '@/components/AppHeader';
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
    stockInfo
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
          {/* Main Content Area */}
      <div className="p-6 w-full">{/* Tool Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Aesy
          </h1>
        </div>
            
            <KiAvailabilityAlert gptAvailable={gptAvailable} />
            
            {stockInfo && stockInfo.currency && stockInfo.reportedCurrency && 
             needsCurrencyConversion(stockInfo.reportedCurrency, stockInfo.currency) && (
              <CurrencyAlert 
                reportedCurrency={stockInfo.reportedCurrency} 
                stockCurrency={stockInfo.currency} 
              />
            )}
            
            <StockSearch onSearch={handleSearch} isLoading={isLoading} />
            
            <ErrorAlert />
            
            <RatingSection />
            
            <PredictabilityStarsSection />
            
            {stockInfo && (
              <StockHeader stockInfo={stockInfo} />
            )}
            
            <LoadingSection />
            
            {!isLoading && (
              <>
                <MetricsSection />
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
