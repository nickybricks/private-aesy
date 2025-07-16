
import React from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import Navigation from '@/components/Navigation';
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
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <AppHeader />
      
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
      
      <AppFooter />
    </div>
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
