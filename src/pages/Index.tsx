
import React from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import LeftNavigation from '@/components/LeftNavigation';
import { StockProvider, useStock } from '@/context/StockContext';
import GptAvailabilityAlert from '@/components/GptAvailabilityAlert';
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
  const { 
    isLoading,
    handleSearch,
    gptAvailable,
    stockInfo
  } = useStock();
  
  return (
    <main className="flex-1 overflow-auto bg-background">
        <div className="h-full">
          {/* Main Content Area */}
          <div className="p-8 max-w-7xl mx-auto">{/* Tool Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Buffett Benchmark Tool
              </h1>
              <p className="text-muted-foreground">
                Bewerte Aktien nach Warren Buffetts bewährten Investmentprinzipien
              </p>
            </div>
            
            <GptAvailabilityAlert gptAvailable={gptAvailable} />
            
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
            <div className="max-w-7xl mx-auto">
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
