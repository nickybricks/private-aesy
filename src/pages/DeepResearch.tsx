import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '@/context/StockContext';
import RatingSection from '@/components/RatingSection';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
import { needsCurrencyConversion } from '@/utils/currencyConverter';

const DeepResearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    isLoading,
    handleSearch,
    gptAvailable,
    stockInfo,
  } = useStock();
  
  const processedRef = useRef<string | null>(null);

  // Check for ticker parameter in URL and trigger search
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const requestKey = `${ticker}-new`;
    
    if (isLoading || processedRef.current === requestKey) {
      return;
    }
    
    if (ticker) {
      processedRef.current = requestKey;
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
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Deep-Research</h1>
            <p className="text-muted-foreground">
              Detaillierte KI-gestützte Analyse nach Buffett-Kriterien
            </p>
          </div>
          
          <RatingSection />
          <CriteriaTabsSection />
          
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

export default DeepResearch;
