
import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import ApiKeyInput from '@/components/ApiKeyInput';
import Navigation from '@/components/Navigation';
import { 
  fetchStockInfo, 
  analyzeBuffettCriteria, 
  getFinancialMetrics, 
  getOverallRating 
} from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  analyzeCurrencyData, 
  normalizeFinancialMetrics, 
  getCurrencyConversionInfo 
} from '@/helpers/currencyConverter';

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState(null);
  const [overallRating, setOverallRating] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [gptAvailable, setGptAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [currencyInfo, setCurrencyInfo] = useState<ReturnType<typeof analyzeCurrencyData> | null>(null);

  useEffect(() => {
    setGptAvailable(hasOpenAiApiKey());
    
    if (hasOpenAiApiKey()) {
      setActiveTab('gpt');
    }
  }, []);

  const handleSearch = async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    setCurrencyInfo(null);
    
    try {
      setStockInfo(null);
      setBuffettCriteria(null);
      setFinancialMetrics(null);
      setOverallRating(null);
      
      const info = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      setStockInfo(info);
      
      // Detect currency and analyze if conversion is needed
      const detectedCurrencyInfo = analyzeCurrencyData(info);
      console.log('Currency analysis:', detectedCurrencyInfo);
      setCurrencyInfo(detectedCurrencyInfo);
      
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      if (gptAvailable) {
        setActiveTab('gpt');
      }
      
      // Fetch all required data
      const [criteria, metrics, ratingData] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(metrics, null, 2));
      console.log('Overall Rating:', JSON.stringify(ratingData, null, 2));
      
      // Apply currency normalization if needed
      let normalizedMetrics = metrics;
      let normalizedRating = ratingData;
      
      if (detectedCurrencyInfo.conversionNeeded) {
        normalizedMetrics = normalizeFinancialMetrics(metrics, detectedCurrencyInfo);
        console.log('Normalized Metrics:', JSON.stringify(normalizedMetrics, null, 2));
        
        // Add currency information to rating data
        if (ratingData) {
          normalizedRating = {
            ...ratingData,
            // Add currency information only if it exists in the type
            currency: detectedCurrencyInfo.targetCurrency
          };
          
          // Normalize intrinsic value and best buy price if needed
          if (detectedCurrencyInfo.conversionRate && detectedCurrencyInfo.originalCurrency !== 'EUR') {
            if (normalizedRating.intrinsicValue) {
              normalizedRating.intrinsicValue = normalizedRating.intrinsicValue / detectedCurrencyInfo.conversionRate;
            }
            
            if (normalizedRating.bestBuyPrice) {
              normalizedRating.bestBuyPrice = normalizedRating.bestBuyPrice / detectedCurrencyInfo.conversionRate;
            }
            
            // Adjust current price if needed
            if (normalizedRating.currentPrice) {
              normalizedRating.currentPrice = normalizedRating.currentPrice / detectedCurrencyInfo.conversionRate;
            }
            
            console.log('Normalized Rating:', JSON.stringify(normalizedRating, null, 2));
          }
        }
        
        // Show toast about currency conversion
        const conversionInfo = getCurrencyConversionInfo(detectedCurrencyInfo);
        if (conversionInfo) {
          toast({
            title: "Währungsumrechnung aktiviert",
            description: conversionInfo,
            variant: "default",
          });
        }
      }
      
      setBuffettCriteria(criteria);
      setFinancialMetrics(normalizedMetrics);
      setOverallRating(normalizedRating);
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
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
      
      <Navigation />
      
      {!gptAvailable && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <InfoIcon className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-700">OpenAI API-Key konfiguriert</AlertTitle>
            <AlertDescription className="text-yellow-600">
              Der OpenAI API-Key in der Datei <code className="bg-yellow-100 px-1 py-0.5 rounded">src/api/openaiApi.ts</code> ist bereits konfiguriert.
              Die erweiterte GPT-Analyse kann dennoch aus technischen Gründen nicht verfügbar sein.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <StockSearch onSearch={handleSearch} isLoading={isLoading} disabled={false} />
      
      {currencyInfo && currencyInfo.conversionNeeded && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <InfoIcon className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">Währungsumrechnung aktiviert</AlertTitle>
          <AlertDescription className="text-yellow-600">
            Die Finanzdaten für diese Aktie sind in {currencyInfo.originalCurrency}, wurden aber automatisch in {currencyInfo.targetCurrency} umgerechnet.
            {currencyInfo.conversionRate && (
              <p className="mt-1">
                Verwendeter Wechselkurs: 1 {currencyInfo.targetCurrency} = {currencyInfo.conversionRate} {currencyInfo.originalCurrency}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Fehler bei der Datenabfrage</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Bitte überprüfen Sie das eingegebene Aktiensymbol oder versuchen Sie es später erneut.
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
                  <TabsTrigger value="gpt" disabled={!gptAvailable}>
                    {gptAvailable ? 'GPT-Analyse (11 Kriterien)' : 'GPT-Analyse (Nicht verfügbar)'}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="standard">
                  <BuffettCriteria criteria={buffettCriteria} />
                </TabsContent>
                <TabsContent value="gpt">
                  {gptAvailable ? (
                    <BuffettCriteriaGPT criteria={buffettCriteria} />
                  ) : (
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>GPT-Analyse nicht verfügbar</AlertTitle>
                      <AlertDescription>
                        Bitte konfigurieren Sie Ihren OpenAI API-Key in der Datei src/api/openaiApi.ts, um Zugang zur erweiterten GPT-Analyse zu erhalten.
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
                currencyInfo={currencyInfo}
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
