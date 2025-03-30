
import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import ApiKeyInput from '@/components/ApiKeyInput';
import OpenAiKeyInput from '@/components/OpenAiKeyInput';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define interfaces for better type safety
interface FinancialMetric {
  name: string;
  value: number | string;
  formula: string;
  explanation: string;
  threshold: string;
  status: 'pass' | 'warning' | 'fail';
}

interface HistoricalData {
  revenue: { year: string; value: number }[];
  earnings: { year: string; value: number }[];
  eps: { year: string; value: number }[];
}

// Updated interface to match what the API returns
interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
  metrics: FinancialMetric[];
  historicalData: HistoricalData;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGptApiKey, setHasGptApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');

  useEffect(() => {
    const savedKey = localStorage.getItem('fmp_api_key');
    setHasApiKey(!!savedKey);
    
    const openAiKey = localStorage.getItem('openai_api_key');
    setHasGptApiKey(!!openAiKey);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedKey = localStorage.getItem('fmp_api_key');
      setHasApiKey(!!savedKey);
      
      const openAiKey = localStorage.getItem('openai_api_key');
      setHasGptApiKey(!!openAiKey);
    };

    window.addEventListener('storage', handleStorageChange);
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'fmp_api_key') {
        setHasApiKey(!!value);
      } else if (key === 'openai_api_key') {
        setHasGptApiKey(!!value);
      }
    };
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const handleSearch = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      
      const info = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      setStockInfo(info);
      
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      // Wenn GPT verfügbar ist, entsprechenden Tab aktivieren
      if (hasGptApiKey) {
        setActiveTab('gpt');
      }
      
      const [criteria, metricsData, rating] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(metricsData, null, 2));
      console.log('Overall Rating:', JSON.stringify(rating, null, 2));
      
      setBuffettCriteria(criteria);
      
      // Initialize metrics object with proper structure, ensuring all required properties exist
      const processedMetrics: FinancialMetricsData = {
        eps: metricsData.eps,
        roe: metricsData.roe,
        netMargin: metricsData.netMargin,
        roic: metricsData.roic,
        debtToAssets: metricsData.debtToAssets,
        interestCoverage: metricsData.interestCoverage,
        // Initialize empty arrays for metrics and historicalData
        metrics: [],
        historicalData: {
          revenue: [],
          earnings: [],
          eps: []
        }
      };
      
      // If we have historical data in the API response, use it
      if (metricsData.historicalData) {
        processedMetrics.historicalData = metricsData.historicalData;
      }
      
      // If we already have metrics in the API response, use them
      if (metricsData.metrics && Array.isArray(metricsData.metrics)) {
        processedMetrics.metrics = metricsData.metrics;
      } else {
        // Otherwise create metrics array from financial data
        console.log('Creating metrics array from financial data');
        const metricsArray: FinancialMetric[] = [];
        
        // Add financial metrics based on properties from metrics object
        if (metricsData.eps !== undefined) {
          metricsArray.push({
            name: 'Gewinn pro Aktie (EPS)',
            value: metricsData.eps || 'N/A',
            formula: 'Nettogewinn / Anzahl der Aktien',
            explanation: 'Zeigt den Gewinn pro ausstehender Aktie',
            threshold: 'Stetig steigend (>5% pro Jahr)',
            status: metricsData.eps > 0 ? 'pass' : 'fail'
          });
        }
        
        if (metricsData.roe !== undefined) {
          metricsArray.push({
            name: 'Eigenkapitalrendite (ROE)',
            value: metricsData.roe ? `${(metricsData.roe * 100).toFixed(2)}%` : 'N/A',
            formula: 'Nettogewinn / Eigenkapital',
            explanation: 'Misst die Effizienz der Eigenkapitalnutzung',
            threshold: '>15%',
            status: metricsData.roe > 0.15 ? 'pass' : metricsData.roe > 0.10 ? 'warning' : 'fail'
          });
        }
        
        if (metricsData.netMargin !== undefined) {
          metricsArray.push({
            name: 'Nettomarge',
            value: metricsData.netMargin ? `${(metricsData.netMargin * 100).toFixed(2)}%` : 'N/A',
            formula: 'Nettogewinn / Umsatz',
            explanation: 'Zeigt den Anteil des Umsatzes, der als Gewinn verbleibt',
            threshold: '>10%',
            status: metricsData.netMargin > 0.10 ? 'pass' : metricsData.netMargin > 0.05 ? 'warning' : 'fail'
          });
        }
        
        if (metricsData.roic !== undefined) {
          metricsArray.push({
            name: 'ROIC',
            value: metricsData.roic ? `${(metricsData.roic * 100).toFixed(2)}%` : 'N/A',
            formula: 'NOPAT / Investiertes Kapital',
            explanation: 'Misst die Rendite auf das investierte Kapital',
            threshold: '>15%',
            status: metricsData.roic > 0.15 ? 'pass' : metricsData.roic > 0.10 ? 'warning' : 'fail'
          });
        }
        
        if (metricsData.debtToAssets !== undefined) {
          metricsArray.push({
            name: 'Schulden zu Vermögen',
            value: metricsData.debtToAssets ? `${(metricsData.debtToAssets * 100).toFixed(2)}%` : 'N/A',
            formula: 'Gesamtschulden / Gesamtvermögen',
            explanation: 'Zeigt den Anteil der Schulden am Gesamtvermögen',
            threshold: '<50%',
            status: metricsData.debtToAssets < 0.5 ? 'pass' : metricsData.debtToAssets < 0.7 ? 'warning' : 'fail'
          });
        }
        
        if (metricsData.interestCoverage !== undefined) {
          metricsArray.push({
            name: 'Zinsdeckungsgrad',
            value: metricsData.interestCoverage || 'N/A',
            formula: 'EBIT / Zinsaufwand',
            explanation: 'Misst die Fähigkeit, Zinszahlungen zu decken',
            threshold: '>5',
            status: metricsData.interestCoverage > 5 ? 'pass' : metricsData.interestCoverage > 3 ? 'warning' : 'fail'
          });
        }
        
        // Update metrics to have an array of metrics objects
        processedMetrics.metrics = metricsArray;
      }
      
      setFinancialMetrics(processedMetrics);
      setOverallRating(rating);
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
    } catch (error) {
      console.error('Error searching for stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      // Verbesserte Fehlermeldung mit Vorschlägen für häufige Fehler
      let enhancedErrorMessage = errorMessage;
      if(errorMessage.includes("Keine Daten gefunden für")) {
        const searchedTicker = ticker.toUpperCase();
        
        // Häufige Fehler korrigieren
        if(searchedTicker === "APPL") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meinten Sie vielleicht AAPL (Apple)?`;
        } else if(searchedTicker === "GOOGL" || searchedTicker === "GOOG") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Versuchen Sie es mit GOOGL oder GOOG (Alphabet/Google).`;
        } else if(searchedTicker === "FB") {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Meta (ehemals Facebook) wird jetzt als META gehandelt.`;
        } else {
          enhancedErrorMessage = `Keine Daten gefunden für ${searchedTicker}. Bitte überprüfen Sie das Aktiensymbol.`;
        }
      }
      
      setError(enhancedErrorMessage);
      toast({
        title: "Fehler",
        description: enhancedErrorMessage,
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
      
      {!hasApiKey && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>API-Key erforderlich</AlertTitle>
            <AlertDescription>
              Um das Buffett Benchmark Tool nutzen zu können, benötigen Sie einen API-Key von Financial Modeling Prep.
              Bitte konfigurieren Sie Ihren API-Key unten.
            </AlertDescription>
          </Alert>
          
          <ApiKeyInput />
        </div>
      )}
      
      {hasApiKey && !hasGptApiKey && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>GPT-Integration (optional)</AlertTitle>
            <AlertDescription>
              Für eine erweiterte Analyse aller 11 Buffett-Kriterien empfehlen wir die Integration mit OpenAI GPT.
              Dies ermöglicht tiefere Einblicke zu den qualitativen Aspekten wie Geschäftsmodell, Management und langfristige Perspektiven.
            </AlertDescription>
          </Alert>
          
          <OpenAiKeyInput />
        </div>
      )}
      
      <StockSearch onSearch={handleSearch} isLoading={isLoading} disabled={!hasApiKey} />
      
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="standard">Standard-Analyse</TabsTrigger>
                  <TabsTrigger value="gpt" disabled={!hasGptApiKey}>
                    {hasGptApiKey ? 'GPT-Analyse (11 Kriterien)' : 'GPT-Analyse (Nicht verfügbar)'}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="standard">
                  <BuffettCriteria criteria={buffettCriteria} />
                </TabsContent>
                <TabsContent value="gpt">
                  {hasGptApiKey ? (
                    <BuffettCriteriaGPT criteria={buffettCriteria} />
                  ) : (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>GPT-Analyse nicht verfügbar</AlertTitle>
                      <AlertDescription>
                        Bitte konfigurieren Sie Ihren OpenAI API-Key, um Zugang zur erweiterten GPT-Analyse zu erhalten.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
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
