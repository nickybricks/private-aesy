import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '@/context/StockContext';
import { ValuationTab } from '@/components/ValuationTab';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import DataMissingAlert from '@/components/DataMissingAlert';
import LoadingSection from '@/components/LoadingSection';
import ErrorAlert from '@/components/ErrorAlert';
import AppFooter from '@/components/AppFooter';
import { needsCurrencyConversion } from '@/utils/currencyConverter';

const InnererWert: React.FC = () => {
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
            <h1 className="text-3xl font-bold mb-2">Innerer Wert Berechnung</h1>
            <p className="text-muted-foreground">
              DCF-Bewertung und Fair Value Analyse
            </p>
          </div>
          
          {stockInfo && (
            <ValuationTab 
              ticker={stockInfo.ticker}
              currentPrice={stockInfo.price}
            />
          )}
          
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

export default InnererWert;
