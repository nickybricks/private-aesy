
import React, { useState } from 'react';
import StockSearch from '@/components/StockSearch';
import PageHeader from '@/components/PageHeader';
import PageFooter from '@/components/PageFooter';
import ApiKeyWarnings from '@/components/ApiKeyWarnings';
import ErrorDisplay from '@/components/ErrorDisplay';
import AnalysisLoader from '@/components/AnalysisLoader';
import AnalysisResults from '@/components/AnalysisResults';
import InitializingLoader from '@/components/InitializingLoader';
import { useApiKeyCheck } from '@/hooks/useApiKeyCheck';
import { useStockAnalysis } from '@/hooks/useStockAnalysis';

const Index = () => {
  const [activeTab, setActiveTab] = useState('standard');
  const { hasApiKey, hasGptApiKey, apiKeyCheckCompleted } = useApiKeyCheck();
  const { 
    isLoading, 
    stockInfo, 
    buffettCriteria, 
    financialMetrics, 
    overallRating, 
    error, 
    handleSearch 
  } = useStockAnalysis(hasGptApiKey, setActiveTab);

  if (!apiKeyCheckCompleted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-screen-xl">
        <PageHeader />
        <InitializingLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <PageHeader />
      
      <ApiKeyWarnings 
        hasApiKey={hasApiKey} 
        hasGptApiKey={hasGptApiKey} 
      />
      
      <StockSearch 
        onSearch={handleSearch} 
        isLoading={isLoading} 
        disabled={!hasApiKey} 
      />
      
      <ErrorDisplay error={error} />
      
      {isLoading ? (
        <AnalysisLoader />
      ) : (
        <>
          {stockInfo && (
            <AnalysisResults
              stockInfo={stockInfo}
              buffettCriteria={buffettCriteria}
              financialMetrics={financialMetrics}
              overallRating={overallRating}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasGptApiKey={hasGptApiKey}
            />
          )}
        </>
      )}
      
      <PageFooter />
    </div>
  );
};

export default Index;
