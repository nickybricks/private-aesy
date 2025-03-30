
import React, { useState } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [overallRating, setOverallRating] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Reset all states
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      
      // Fetch stock info
      const info = await fetchStockInfo(ticker);
      setStockInfo(info);
      
      // Show toast notification
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      // Run all data fetching in parallel for speed
      const [criteria, metrics, rating] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      setBuffettCriteria(criteria);
      setFinancialMetrics(metrics);
      setOverallRating(rating);
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
    } catch (error) {
      console.error('Error searching for stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(errorMessage);
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buffett Benchmark Tool</h1>
        <p className="text-buffett-subtext">
          Analysieren Sie Aktien nach Warren Buffetts Investmentprinzipien
        </p>
      </header>
      
      <StockSearch onSearch={handleSearch} isLoading={isLoading} />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Fehler bei der Datenabfrage</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              {error.includes('API-Key') ? (
                <>
                  Bitte stellen Sie sicher, dass ein gültiger API-Schlüssel verwendet wird. 
                  Die Financial Modeling Prep API benötigt einen gültigen API-Schlüssel, den Sie
                  unter <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="underline">financialmodelingprep.com</a> kostenlos erhalten können.
                </>
              ) : (
                'Bitte überprüfen Sie das eingegebene Aktiensymbol oder versuchen Sie es später erneut.'
              )}
            </p>
          </AlertDescription>
        </Alert>
      )}
      
      {stockInfo && (
        <StockHeader stockInfo={stockInfo} />
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-buffett-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <p className="mt-4 text-lg">Analysiere Aktie nach Warren Buffett's Kriterien...</p>
            <p className="text-buffett-subtext mt-2">Dies kann einige Momente dauern</p>
          </div>
        </div>
      ) : (
        <>
          {buffettCriteria && (
            <div className="mb-10">
              <BuffettCriteria criteria={buffettCriteria} />
            </div>
          )}
          
          {financialMetrics && (
            <div className="mb-10">
              <FinancialMetrics 
                metrics={financialMetrics.metrics} 
                historicalData={financialMetrics.historicalData} 
              />
            </div>
          )}
          
          {overallRating && (
            <div className="mb-10">
              <OverallRating rating={overallRating} />
            </div>
          )}
        </>
      )}
      
      <footer className="mt-12 pt-8 border-t border-gray-200 text-buffett-subtext text-sm text-center">
        <p className="mb-2">
          Buffett Benchmark Tool - Analysieren Sie Aktien nach Warren Buffetts Investmentprinzipien
        </p>
        <p className="mb-2">
          Dieses Tool verwendet die Financial Modeling Prep API zur Datenabfrage in Echtzeit.
        </p>
        <p>
          Dieses Tool bietet keine Anlageberatung. Alle Analysen dienen nur zu Informationszwecken.
        </p>
      </footer>
    </div>
  );
};

export default Index;
