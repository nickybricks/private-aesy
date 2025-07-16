import React from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import { StockProvider, useStock } from '@/context/StockContext';
import GptAvailabilityAlert from '@/components/GptAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import MetricsSection from '@/components/MetricsSection';
import RatingSection from '@/components/RatingSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';

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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Tool Header */}
          <div className="apple-content-card p-8">
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Buffett Benchmark Tool
            </h1>
            <p className="text-muted-foreground text-lg">
              Bewerte Aktien nach Warren Buffetts bewährten Investmentprinzipien
            </p>
          </div>
          
          {/* Stock Search */}
          <div className="apple-content-card p-6">
            <StockSearch onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {isLoading && <LoadingSection />}

          {stockInfo && !isLoading && (
            <div className="space-y-6">
              <div className="apple-content-card p-6">
                <StockHeader stockInfo={stockInfo} />
              </div>

              {stockInfo.error && (
                <div className="apple-content-card p-6 border-red-200 bg-red-50">
                  <ErrorAlert />
                </div>
              )}

              {!stockInfo.error && (
                <>
                  <GptAvailabilityAlert gptAvailable={gptAvailable} />
                  <CurrencyAlert reportedCurrency={stockInfo.reportedCurrency} stockCurrency={stockInfo.stockCurrency} />
                  <DataMissingAlert />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="apple-content-card p-6">
                      <MetricsSection />
                    </div>
                    <div className="apple-content-card p-6">
                      <RatingSection />
                    </div>
                  </div>
                  
                  <div className="apple-content-card p-6">
                    <CriteriaTabsSection />
                  </div>
                </>
              )}
            </div>
          )}
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