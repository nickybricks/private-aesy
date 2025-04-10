
import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import ApiKeyInput from '@/components/ApiKeyInput';
import Navigation from '@/components/Navigation';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { convertCurrency, needsCurrencyConversion } from '@/utils/currencyConverter';

// Define types for our data structures
interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
  metrics?: Array<{
    name: string;
    value: any;
    formula: string;
    explanation: string;
    threshold: string;
    status: string;
    originalValue?: any;
    originalCurrency?: string;
  }>;
  historicalData?: {
    revenue: any[];
    earnings: any[];
    eps: any[];
  };
}

interface OverallRatingData {
  overall: any;
  summary: any;
  strengths: any[];
  weaknesses: any[];
  recommendation: any;
  buffettScore: number;
  marginOfSafety: { value: number; status: "pass" | "warning" | "fail"; };
  bestBuyPrice: number;
  currentPrice: any;
  currency: any;
  intrinsicValue: any;
  targetMarginOfSafety: number;
  originalIntrinsicValue?: number;
  originalBestBuyPrice?: number;
  originalPrice?: number;
  originalCurrency?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState<OverallRatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [gptAvailable, setGptAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [stockCurrency, setStockCurrency] = useState<string>('EUR');

  useEffect(() => {
    const savedKey = localStorage.getItem('fmp_api_key');
    setHasApiKey(!!savedKey);
    
    setGptAvailable(hasOpenAiApiKey());
    
    if (hasOpenAiApiKey()) {
      setActiveTab('gpt');
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedKey = localStorage.getItem('fmp_api_key');
      setHasApiKey(!!savedKey);
      setGptAvailable(hasOpenAiApiKey());
    };

    window.addEventListener('storage', handleStorageChange);
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'fmp_api_key') {
        setHasApiKey(!!value);
      }
    };
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const convertFinancialMetrics = (metrics: any, currency: string) => {
    if (!metrics || !currency) return metrics;
    
    // Early return if no conversion needed
    if (!needsCurrencyConversion(currency)) return metrics;
    
    // If metrics is an array (FinancialMetric[])
    if (Array.isArray(metrics)) {
      return metrics.map(metric => {
        // Skip non-numeric values or metrics that don't need currency conversion
        if (
          typeof metric.value !== 'number' || 
          isNaN(metric.value) || 
          metric.name.includes('Ratio') || 
          metric.name.includes('Rate') ||
          metric.name.includes('Marge') ||
          metric.name.includes('%')
        ) {
          return metric;
        }
        
        // Store original values
        const originalValue = metric.value;
        
        // Convert the value to EUR
        const convertedValue = convertCurrency(metric.value, currency, 'EUR');
        
        return {
          ...metric,
          value: convertedValue,
          originalValue: originalValue,
          originalCurrency: currency
        };
      });
    }
    
    // For non-array financial metrics
    return metrics;
  };

  const convertHistoricalData = (historicalData: any, currency: string) => {
    if (!historicalData || !currency || !needsCurrencyConversion(currency)) return historicalData;
    
    return {
      revenue: historicalData.revenue ? historicalData.revenue.map((item: any) => ({
        ...item,
        originalValue: item.value,
        value: convertCurrency(item.value, currency, 'EUR')
      })) : [],
      earnings: historicalData.earnings ? historicalData.earnings.map((item: any) => ({
        ...item,
        originalValue: item.value,
        value: convertCurrency(item.value, currency, 'EUR')
      })) : [],
      eps: historicalData.eps ? historicalData.eps.map((item: any) => ({
        ...item,
        originalValue: item.value,
        value: convertCurrency(item.value, currency, 'EUR')
      })) : []
    };
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
      
      // Store the stock's currency
      if (info && info.currency) {
        setStockCurrency(info.currency);
        console.log(`Stock currency: ${info.currency}`);
      } else {
        setStockCurrency('EUR');
        console.log('No currency information available, defaulting to EUR');
      }
      
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      if (gptAvailable) {
        setActiveTab('gpt');
      }
      
      const [criteria, rawMetricsData, rating] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(rawMetricsData, null, 2));
      console.log('Overall Rating:', JSON.stringify(rating, null, 2));
      
      // Set currency from stock info if available
      const stockCurrency = info?.currency || 'EUR';
      
      // Prepare metrics data structure for FinancialMetrics component
      const metricsData: FinancialMetricsData = {
        ...rawMetricsData,
        metrics: [
          { name: 'Gewinn pro Aktie (EPS)', value: rawMetricsData.eps, formula: 'Nettogewinn / Anzahl Aktien', explanation: 'Zeigt den Unternehmensgewinn pro Aktie', threshold: '> 0, wachsend', status: rawMetricsData.eps > 0 ? 'positive' : 'negative' },
          { name: 'Eigenkapitalrendite (ROE)', value: rawMetricsData.roe * 100, formula: 'Nettogewinn / Eigenkapital', explanation: 'Zeigt die Effizienz des eingesetzten Kapitals', threshold: '> 15%', status: rawMetricsData.roe * 100 > 15 ? 'positive' : 'warning' },
          { name: 'Nettomarge', value: rawMetricsData.netMargin * 100, formula: 'Nettogewinn / Umsatz', explanation: 'Zeigt die Profitabilität', threshold: '> 10%', status: rawMetricsData.netMargin * 100 > 10 ? 'positive' : 'warning' },
          { name: 'Kapitalrendite (ROIC)', value: rawMetricsData.roic * 100, formula: 'NOPAT / Investiertes Kapital', explanation: 'Zeigt die Effizienz aller Investments', threshold: '> 10%', status: rawMetricsData.roic * 100 > 10 ? 'positive' : 'warning' },
          { name: 'Schulden zu Vermögen', value: rawMetricsData.debtToAssets * 100, formula: 'Gesamtschulden / Gesamtvermögen', explanation: 'Zeigt die Verschuldungsquote', threshold: '< 50%', status: rawMetricsData.debtToAssets * 100 < 50 ? 'positive' : 'warning' },
          { name: 'Zinsdeckungsgrad', value: rawMetricsData.interestCoverage, formula: 'EBIT / Zinsaufwand', explanation: 'Zeigt die Fähigkeit, Zinsen zu decken', threshold: '> 5', status: rawMetricsData.interestCoverage > 5 ? 'positive' : 'warning' },
        ],
        historicalData: {
          revenue: [],
          earnings: [],
          eps: []
        }
      };
      
      // Convert financial metrics if needed
      if (metricsData) {
        // Convert metrics array data
        if (metricsData.metrics) {
          metricsData.metrics = convertFinancialMetrics(metricsData.metrics, stockCurrency);
        }
        
        // Convert historical data
        if (metricsData.historicalData) {
          metricsData.historicalData = convertHistoricalData(metricsData.historicalData, stockCurrency);
        }
      }
      
      // Adjust overall rating values for currency
      if (rating && needsCurrencyConversion(stockCurrency)) {
        const updatedRating: OverallRatingData = { ...rating };
        
        if (updatedRating.intrinsicValue) {
          updatedRating.originalIntrinsicValue = updatedRating.intrinsicValue;
          updatedRating.intrinsicValue = convertCurrency(updatedRating.intrinsicValue, stockCurrency, 'EUR');
        }
        if (updatedRating.bestBuyPrice) {
          updatedRating.originalBestBuyPrice = updatedRating.bestBuyPrice;
          updatedRating.bestBuyPrice = convertCurrency(updatedRating.bestBuyPrice, stockCurrency, 'EUR');
        }
        if (updatedRating.currentPrice) {
          updatedRating.originalPrice = updatedRating.currentPrice;
          updatedRating.currentPrice = convertCurrency(updatedRating.currentPrice, stockCurrency, 'EUR');
        }
        
        // Update currency to indicate conversion
        if (updatedRating.currency !== 'EUR') {
          updatedRating.originalCurrency = updatedRating.currency;
          updatedRating.currency = 'EUR';
        }
        
        setOverallRating(updatedRating);
      } else {
        setOverallRating(rating);
      }
      
      setBuffettCriteria(criteria);
      setFinancialMetrics(metricsData);
      
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
      
      {!gptAvailable && (
        <div className="mb-8 animate-fade-in">
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <InfoIcon className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-700">OpenAI API-Key konfigurieren</AlertTitle>
            <AlertDescription className="text-yellow-600">
              Der OpenAI API-Key in der Datei <code className="bg-yellow-100 px-1 py-0.5 rounded">src/api/openaiApi.ts</code> ist noch nicht konfiguriert.
              Bitte öffnen Sie die Datei und ersetzen Sie den Platzhalter 'IHR-OPENAI-API-KEY-HIER' mit Ihrem tatsächlichen OpenAI API-Key.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {stockInfo && stockInfo.currency && needsCurrencyConversion(stockInfo.currency) && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">Währungsumrechnung aktiviert</AlertTitle>
          <AlertDescription className="text-yellow-600">
            Die Daten dieser Aktie werden in <strong>{stockInfo.currency}</strong> angegeben. 
            Für eine korrekte Analyse werden alle finanziellen Kennzahlen automatisch in EUR umgerechnet.
            Die Originalwerte werden zur Transparenz ebenfalls angezeigt.
          </AlertDescription>
        </Alert>
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
                currency={stockCurrency}
              />
            </div>
          )}
          
          {overallRating && (
            <div className="mb-10">
              <OverallRating 
                rating={{
                  ...overallRating,
                  // Add original currency information if available
                  originalCurrency: needsCurrencyConversion(stockCurrency) ? stockCurrency : undefined
                }} 
              />
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
