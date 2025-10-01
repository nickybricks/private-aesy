import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStock } from '@/context/StockContext';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyzerHeader } from '@/components/analyzer/AnalyzerHeader';
import { OverviewTab } from '@/components/analyzer/OverviewTab';
import { FinancialsTab } from '@/components/analyzer/FinancialsTab';
import { PeterLynchTab } from '@/components/analyzer/PeterLynchTab';
import { BuffettTab } from '@/components/analyzer/BuffettTab';
import { NewsTab } from '@/components/analyzer/NewsTab';
import KiAvailabilityAlert from '@/components/KiAvailabilityAlert';
import CurrencyAlert from '@/components/CurrencyAlert';
import ErrorAlert from '@/components/ErrorAlert';
import LoadingSection from '@/components/LoadingSection';
import DataMissingAlert from '@/components/DataMissingAlert';
import AppFooter from '@/components/AppFooter';
import { SaveAnalysisButton } from '@/components/SaveAnalysisButton';
import { needsCurrencyConversion } from '@/utils/currencyConverter';

const IndexContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const { 
    isLoading,
    handleSearch,
    loadSavedAnalysis,
    gptAvailable,
    stockInfo,
    buffettCriteria
  } = useStock();
  const { analyses, loading: analysesLoading } = useSavedAnalyses();
  const { toast } = useToast();

  const processedRef = useRef<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', value);
      return newParams;
    });
  };

  // Handle ticker search
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    const loadAnalysisId = searchParams.get('loadAnalysis');
    
    const requestKey = `${ticker}-${loadAnalysisId || 'new'}`;
    
    if (analysesLoading || isLoading || processedRef.current === requestKey) {
      return;
    }
    
    if (ticker) {
      processedRef.current = requestKey;
      
      if (loadAnalysisId) {
        const savedAnalysis = analyses.find(analysis => analysis.id === loadAnalysisId);
        if (savedAnalysis) {
          loadSavedAnalysis(savedAnalysis.analysis_data);
          toast({
            title: "Analyse geladen",
            description: `${savedAnalysis.title} wurde erfolgreich geladen.`
          });
        } else {
          handleSearch(ticker);
        }
      } else {
        handleSearch(ticker);
      }
    }
  }, [searchParams, isLoading, analysesLoading, analyses]);

  const handleAddToWatchlist = () => {
    toast({
      title: "Watchlist Feature",
      description: "Diese Funktion wird bald verfügbar sein."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AnalyzerHeader
        ticker={stockInfo?.ticker}
        companyName={stockInfo?.companyName}
        exchange={stockInfo?.exchange || 'NASDAQ'}
        currency={stockInfo?.currency}
        onAddToWatchlist={handleAddToWatchlist}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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

        {/* Loading State */}
        {isLoading && <LoadingSection />}

        {/* Content */}
        {!isLoading && stockInfo && (
          <>
            {/* Action Bar */}
            <div className="flex justify-end mb-6">
              <SaveAnalysisButton />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="glass w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="flex-1 sm:flex-initial">
                  Übersicht
                </TabsTrigger>
                <TabsTrigger value="financials" className="flex-1 sm:flex-initial">
                  Finanzkennzahlen
                </TabsTrigger>
                <TabsTrigger value="peter-lynch" className="flex-1 sm:flex-initial">
                  Peter Lynch Chart
                </TabsTrigger>
                <TabsTrigger value="buffett" className="flex-1 sm:flex-initial">
                  Buffett-Kriterien KI-Analyse
                </TabsTrigger>
                <TabsTrigger value="news" className="flex-1 sm:flex-initial">
                  News
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <OverviewTab />
              </TabsContent>

              <TabsContent value="financials" className="space-y-6">
                <FinancialsTab />
              </TabsContent>

              <TabsContent value="peter-lynch" className="space-y-6">
                <PeterLynchTab />
              </TabsContent>

              <TabsContent value="buffett" className="space-y-6">
                <BuffettTab />
              </TabsContent>

              <TabsContent value="news" className="space-y-6">
                <NewsTab />
              </TabsContent>
            </Tabs>

            <DataMissingAlert />
          </>
        )}
      </main>

      {/* Footer */}
      <div className="border-t border-border mt-12">
        <AppFooter />
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  return <IndexContent />;
};

export default Index;
