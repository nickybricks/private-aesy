
import React from 'react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import LeftNavigation from '@/components/LeftNavigation';
import { StockProvider, useStock } from '@/context/StockContext';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import MetricsSection from '@/components/MetricsSection';
import RatingSection from '@/components/RatingSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

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

  // Track which ticker has been analyzed to prevent duplicate analysis
  const analyzedTicker = useRef<string | null>(null);

  // Check for ticker parameter in URL and trigger search
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const loadAnalysisId = searchParams.get('loadAnalysis');
    
    if (ticker && ticker !== analyzedTicker.current && !isLoading) {
      analyzedTicker.current = ticker;
      
      if (loadAnalysisId) {
        // Load saved analysis
        // This is handled by the SavedAnalyses page navigation
        handleSearch(ticker);
      } else {
        handleSearch(ticker);
      }
    }
  }, [searchParams, isLoading]); // Nur searchParams und isLoading als Dependencies
  
  return (
    <main className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          {/* Main Content Area */}
          <div className="p-8 w-full">{/* Tool Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
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
            
            {stockInfo && (
              <StockHeader stockInfo={stockInfo} />
            )}
            
            <LoadingSection />
            
            {!isLoading && (
              <>
                <MetricsSection />
                <CriteriaTabsSection />
                <RatingSection />
                
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
  return (
    <StockProvider>
      <IndexContent />
    </StockProvider>
  );
};

export default Index;
