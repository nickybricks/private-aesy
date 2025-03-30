
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
import { 
  hasOpenAiApiKey, 
  analyzeBusinessModel, 
  analyzeEconomicMoat, 
  analyzeManagementQuality, 
  analyzeLongTermProspects,
  analyzeCyclicalBehavior,
  analyzeOneTimeEffects,
  analyzeTurnaround,
  analyzeRationalBehavior
} from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Konfiguration für Mock-Daten-Modus
const USE_MOCK_DATA = true; // Sollte mit der Konfiguration in stockApi.ts übereinstimmen

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGptLoading, setIsGptLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [overallRating, setOverallRating] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGptApiKey, setHasGptApiKey] = useState(hasOpenAiApiKey());
  const [activeTab, setActiveTab] = useState('standard');

  useEffect(() => {
    const savedKey = localStorage.getItem('fmp_api_key');
    setHasApiKey(!!savedKey || USE_MOCK_DATA);
    
    // Zeige einen Toast, wenn Mock-Daten verwendet werden
    if (USE_MOCK_DATA) {
      toast({
        title: "Mock-Daten aktiviert",
        description: "Die Anwendung verwendet Beispieldaten. Die API wird nicht aufgerufen.",
      });
    }
  }, [toast]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedKey = localStorage.getItem('fmp_api_key');
      setHasApiKey(!!savedKey || USE_MOCK_DATA);
    };

    window.addEventListener('storage', handleStorageChange);
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'fmp_api_key') {
        setHasApiKey(!!value || USE_MOCK_DATA);
      }
    };
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const runGptAnalysis = async () => {
    if (!stockInfo || !buffettCriteria) return;
    
    setIsGptLoading(true);
    try {
      toast({
        title: "GPT-Analyse läuft",
        description: `Analysiere ${stockInfo.name} mit GPT. Dies kann einen Moment dauern...`,
      });

      const updatedCriteria = JSON.parse(JSON.stringify(buffettCriteria));
      
      const [
        businessModelAnalysis,
        economicMoatAnalysis,
        managementAnalysis,
        longTermAnalysis,
        cyclicalAnalysis,
        oneTimeEffectAnalysis,
        turnaroundAnalysis,
        rationalBehaviorAnalysis
      ] = await Promise.all([
        analyzeBusinessModel(stockInfo.name, stockInfo.industry || 'Unknown', stockInfo.description || ''),
        analyzeEconomicMoat(
          stockInfo.name, 
          stockInfo.industry || 'Unknown', 
          financialMetrics?.metrics?.grossMargin || 0, 
          financialMetrics?.metrics?.operatingMargin || 0, 
          financialMetrics?.metrics?.roic || 0
        ),
        analyzeManagementQuality(stockInfo.name, stockInfo.ceo || ''),
        analyzeLongTermProspects(stockInfo.name, stockInfo.industry || 'Unknown', stockInfo.sector || 'Unknown'),
        analyzeCyclicalBehavior(stockInfo.name, stockInfo.industry || 'Unknown'),
        analyzeOneTimeEffects(stockInfo.name, stockInfo.industry || 'Unknown'),
        analyzeTurnaround(stockInfo.name, stockInfo.industry || 'Unknown'),
        analyzeRationalBehavior(stockInfo.name, stockInfo.industry || 'Unknown')
      ]);
      
      updatedCriteria.businessModel.gptAnalysis = businessModelAnalysis;
      updatedCriteria.economicMoat.gptAnalysis = economicMoatAnalysis;
      updatedCriteria.management.gptAnalysis = managementAnalysis;
      updatedCriteria.longTermOutlook.gptAnalysis = longTermAnalysis;
      updatedCriteria.cyclicalBehavior.gptAnalysis = cyclicalAnalysis;
      updatedCriteria.oneTimeEffects.gptAnalysis = oneTimeEffectAnalysis;
      updatedCriteria.turnaround.gptAnalysis = turnaroundAnalysis;
      updatedCriteria.rationalBehavior.gptAnalysis = rationalBehaviorAnalysis;
      
      setBuffettCriteria(updatedCriteria);
      
      toast({
        title: "GPT-Analyse abgeschlossen",
        description: `Die GPT-Analyse für ${stockInfo.name} wurde erfolgreich durchgeführt.`,
      });
      
      setActiveTab('gpt');
    } catch (error) {
      console.error('Error running GPT analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler bei der GPT-Analyse';
      
      toast({
        title: "GPT-Analysefehler",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGptLoading(false);
    }
  };

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
      
      const [criteria, metrics, rating] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(metrics, null, 2));
      console.log('Overall Rating:', JSON.stringify(rating, null, 2));
      
      setBuffettCriteria(criteria);
      setFinancialMetrics(metrics);
      setOverallRating(rating);
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
      
      if (hasGptApiKey) {
        await runGptAnalysis();
      }
    } catch (error) {
      console.error('Error searching for stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      let enhancedErrorMessage = errorMessage;
      if(errorMessage.includes("Keine Daten gefunden für")) {
        const searchedTicker = ticker.toUpperCase();
        
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
      
      {USE_MOCK_DATA && (
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>Mock-Daten-Modus aktiviert</AlertTitle>
          <AlertDescription>
            Die Anwendung verwendet Beispieldaten für Apple (AAPL) und Microsoft (MSFT).
            Es werden keine API-Calls an den Financial Modeling Prep Service gesendet.
          </AlertDescription>
        </Alert>
      )}
      
      {!hasApiKey && !USE_MOCK_DATA && (
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
      
      {!hasGptApiKey && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4 bg-indigo-50 border-indigo-200">
            <InfoIcon className="h-4 w-4 text-indigo-500" />
            <AlertTitle>GPT-Funktionalität aktivieren</AlertTitle>
            <AlertDescription>
              Für eine erweiterte Analyse mit GPT-4 benötigen Sie einen OpenAI API-Key.
              Mit GPT erhalten Sie tiefere Einblicke zu allen 11 Buffett-Kriterien.
            </AlertDescription>
          </Alert>
          
          <OpenAiKeyInput />
        </div>
      )}
      
      <StockSearch onSearch={handleSearch} isLoading={isLoading} disabled={!hasApiKey && !USE_MOCK_DATA} />
      
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
      
      {isLoading || isGptLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-buffett-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <p className="mt-4 text-lg">
              {isGptLoading ? 'Führe GPT-Analyse durch...' : 'Analysiere Aktie nach Warren Buffett\'s Kriterien...'}
            </p>
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
                  <TabsTrigger value="gpt" disabled={!hasGptApiKey || !buffettCriteria.businessModel.gptAnalysis}>
                    GPT-Analyse (11 Kriterien)
                    {hasGptApiKey && !buffettCriteria.businessModel.gptAnalysis && !isGptLoading && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          runGptAnalysis();
                        }}
                        className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Starten
                      </button>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="standard">
                  <BuffettCriteria criteria={buffettCriteria} />
                </TabsContent>
                <TabsContent value="gpt">
                  <BuffettCriteriaGPT criteria={buffettCriteria} />
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
          {USE_MOCK_DATA 
            ? "Diese Demo-Version verwendet vordefinierte Beispieldaten statt echter API-Aufrufe."
            : "Dieses Tool verwendet die Financial Modeling Prep API zur Datenabfrage in Echtzeit."}
        </p>
        <p>
          Dieses Tool bietet keine Anlageberatung. Alle Analysen dienen nur zu Informationszwecken.
        </p>
      </footer>
    </div>
  );
};

export default Index;
