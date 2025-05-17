import React, { useState, useEffect } from 'react';
import StockSearch from '@/components/StockSearch';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import Navigation from '@/components/Navigation';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  convertCurrency, 
  shouldConvertCurrency, 
  needsCurrencyConversion 
} from '@/utils/currencyConverter';

interface HistoricalDataItem {
  year: string;
  value: number;
  originalValue?: number;
  originalCurrency?: string;
}

interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
  reportedCurrency?: string;
  metrics?: Array<{
    name: string;
    value: any;
    formula: string;
    explanation: string;
    threshold: string;
    status: "pass" | "warning" | "fail";
    originalValue?: any;
    originalCurrency?: string;
    isPercentage: boolean;
    isMultiplier: boolean;
  }>;
  historicalData?: {
    revenue: HistoricalDataItem[];
    earnings: HistoricalDataItem[];
    eps: HistoricalDataItem[];
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
  originalIntrinsicValue?: number | null;
  originalBestBuyPrice?: number | null;
  originalPrice?: number | null;
  originalCurrency?: string;
}

interface DCFData {
  ufcf?: number[] | number; // Can be either an array of yearly UFCFs or a single number
  wacc?: number;
  presentTerminalValue?: number;
  netDebt?: number;
  dilutedSharesOutstanding?: number;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState<OverallRatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gptAvailable, setGptAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [stockCurrency, setStockCurrency] = useState<string>('USD'); // Changed default from EUR to USD
  const [hasCriticalDataMissing, setHasCriticalDataMissing] = useState(false);
  const [dcfData, setDcfData] = useState<DCFData | null>(null); // New state for DCF data

  useEffect(() => {
    setGptAvailable(hasOpenAiApiKey());
    
    if (hasOpenAiApiKey()) {
      setActiveTab('gpt');
    }
  }, []);

  useEffect(() => {
    if (stockInfo) {
      const criticalMissing = 
        !stockInfo || 
        stockInfo.price === null || 
        stockInfo.price === 0 || 
        stockInfo.marketCap === null || 
        stockInfo.marketCap === 0;
      
      setHasCriticalDataMissing(criticalMissing);
    }
  }, [stockInfo]);

  const convertFinancialMetrics = async (metrics: any, reportedCurrency: string, stockPriceCurrency: string) => {
    if (!metrics || !reportedCurrency || !stockPriceCurrency) return metrics;
    
    if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
      console.log(`No conversion needed: both stock price and metrics are in ${stockPriceCurrency}`);
      return metrics;
    }
    
    if (Array.isArray(metrics)) {
      const convertedMetrics = await Promise.all(metrics.map(async metric => {
        if (
          typeof metric.value !== 'number' || 
          isNaN(metric.value) || 
          metric.isPercentage ||
          metric.isMultiplier
        ) {
          return metric;
        }
        
        try {
          const originalValue = metric.value;
          const convertedValue = await convertCurrency(metric.value, reportedCurrency, stockPriceCurrency);
          
          return {
            ...metric,
            value: convertedValue,
            originalValue: originalValue,
            originalCurrency: reportedCurrency
          };
        } catch (error) {
          console.error(`Error converting ${metric.name}:`, error);
          return metric;
        }
      }));

      return convertedMetrics;
    }
    
    return metrics;
  };

  const convertHistoricalData = async (historicalData: any, reportedCurrency: string, stockPriceCurrency: string) => {
    if (!historicalData || !reportedCurrency || !stockPriceCurrency) return historicalData;
    
    if (!shouldConvertCurrency(stockPriceCurrency, reportedCurrency)) {
      console.log(`No historical data conversion needed: both stock price and data are in ${stockPriceCurrency}`);
      return historicalData;
    }
    
    try {
      const convertedData = {
        revenue: historicalData.revenue ? await Promise.all(historicalData.revenue.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : [],
        earnings: historicalData.earnings ? await Promise.all(historicalData.earnings.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : [],
        eps: historicalData.eps ? await Promise.all(historicalData.eps.map(async (item: any) => ({
          ...item,
          originalValue: item.value,
          originalCurrency: reportedCurrency,
          value: await convertCurrency(item.value, reportedCurrency, stockPriceCurrency)
        }))) : []
      };

      return convertedData;
    } catch (error) {
      console.error('Error converting historical data:', error);
      return historicalData;
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
      setHasCriticalDataMissing(false);
      setDcfData(null); // Reset DCF data
      
      const info = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      setStockInfo(info);
      
      if (info && info.currency) {
        setStockCurrency(info.currency);
        console.log(`Stock price currency: ${info.currency}`);
      } else {
        // Default to USD if no currency information is available
        setStockCurrency('USD');
        console.log('No currency information available, defaulting to USD');
      }
      
      const criticalDataMissing = 
        !info || 
        info.price === null || 
        info.price === 0 || 
        info.marketCap === null || 
        info.marketCap === 0;
      
      setHasCriticalDataMissing(criticalDataMissing);
      
      if (!criticalDataMissing) {
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
        
        // Create mock DCF data for demonstration purposes
        // In a real application, this would come from your API
        const mockDcfData: DCFData = {
          ufcf: [
            info.freeCashFlow || 1000000000, // If available, use actual FCF
            (info.freeCashFlow || 1000000000) * 1.15, // Grow by 15% yearly
            (info.freeCashFlow || 1000000000) * 1.15 * 1.15,
            (info.freeCashFlow || 1000000000) * 1.15 * 1.15 * 1.15,
            (info.freeCashFlow || 1000000000) * 1.15 * 1.15 * 1.15 * 1.15
          ],
          wacc: 9.5, // 9.5%
          presentTerminalValue: (info.freeCashFlow || 1000000000) * 15, // Simplified terminal value
          netDebt: info.totalDebt - (info.cashAndCashEquivalents || 0),
          dilutedSharesOutstanding: info.sharesOutstanding || 1000000000
        };
        
        setDcfData(mockDcfData);
        
        const priceCurrency = info?.currency || 'USD'; // Default to USD instead of EUR
        const reportedCurrency = rawMetricsData?.reportedCurrency || priceCurrency;
        
        console.log(`Price currency: ${priceCurrency}, Reported financial data currency: ${reportedCurrency}`);
        
        const metricsData: FinancialMetricsData = {
          ...rawMetricsData,
          metrics: [
            { 
              name: 'Gewinn pro Aktie (EPS)', 
              value: rawMetricsData.eps, 
              formula: 'Nettogewinn / Anzahl Aktien', 
              explanation: 'Zeigt den Unternehmensgewinn pro Aktie', 
              threshold: '> 0, wachsend', 
              status: rawMetricsData.eps > 0 ? 'positive' as 'pass' : 'negative' as 'fail',
              isPercentage: false,
              isMultiplier: false
            },
            { 
              name: 'Eigenkapitalrendite (ROE)', 
              value: rawMetricsData.roe * 100, 
              formula: 'Nettogewinn / Eigenkapital', 
              explanation: 'Zeigt die Effizienz des eingesetzten Kapitals', 
              threshold: '> 15%', 
              status: rawMetricsData.roe * 100 > 15 ? 'positive' as 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Nettomarge', 
              value: rawMetricsData.netMargin * 100, 
              formula: 'Nettogewinn / Umsatz', 
              explanation: 'Zeigt die Profitabilität', 
              threshold: '> 10%', 
              status: rawMetricsData.netMargin * 100 > 10 ? 'positive' as 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Kapitalrendite (ROIC)', 
              value: rawMetricsData.roic * 100, 
              formula: 'NOPAT / Investiertes Kapital', 
              explanation: 'Zeigt die Effizienz aller Investments', 
              threshold: '> 10%', 
              status: rawMetricsData.roic * 100 > 10 ? 'positive' as 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Schulden zu Vermögen', 
              value: rawMetricsData.debtToAssets * 100, 
              formula: 'Gesamtschulden / Gesamtvermögen', 
              explanation: 'Zeigt die Verschuldungsquote', 
              threshold: '< 50%', 
              status: rawMetricsData.debtToAssets * 100 < 50 ? 'positive' as 'pass' : 'warning',
              isPercentage: true,
              isMultiplier: false
            },
            { 
              name: 'Zinsdeckungsgrad', 
              value: rawMetricsData.interestCoverage, 
              formula: 'EBIT / Zinsaufwand', 
              explanation: 'Zeigt die Fähigkeit, Zinsen zu decken', 
              threshold: '> 5', 
              status: rawMetricsData.interestCoverage > 5 ? 'positive' as 'pass' : 'warning',
              isPercentage: false,
              isMultiplier: true
            },
          ],
          historicalData: rawMetricsData.historicalData || {
            revenue: [],
            earnings: [],
            eps: []
          },
          reportedCurrency: reportedCurrency
        };
        
        if (metricsData) {
          if (metricsData.metrics) {
            if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
              metricsData.metrics = await convertFinancialMetrics(metricsData.metrics, reportedCurrency, priceCurrency);
            }
          }
          
          if (metricsData.historicalData) {
            if (shouldConvertCurrency(priceCurrency, reportedCurrency)) {
              metricsData.historicalData = await convertHistoricalData(metricsData.historicalData, reportedCurrency, priceCurrency);
            }
          }
        }
        
        if (rating) {
          try {
            const updatedRating = { ...rating };
            const ratingCurrency = rating.currency || reportedCurrency;
            
            console.log(`Rating original currency: ${ratingCurrency}, Target currency: ${priceCurrency}`);
            console.log(`Original intrinsic value: ${updatedRating.intrinsicValue} ${ratingCurrency}`);
            
            if (shouldConvertCurrency(priceCurrency, ratingCurrency)) {
              console.log(`Converting rating values from ${ratingCurrency} to ${priceCurrency}`);
              
              if (updatedRating.intrinsicValue !== null && updatedRating.intrinsicValue !== undefined) {
                updatedRating.originalIntrinsicValue = updatedRating.intrinsicValue;
                
                updatedRating.intrinsicValue = await convertCurrency(
                  updatedRating.intrinsicValue, 
                  ratingCurrency, 
                  priceCurrency
                );
                
                console.log(`Converted intrinsic value: ${updatedRating.intrinsicValue} ${priceCurrency}`);
              }
              
              if (updatedRating.intrinsicValue !== null && 
                  updatedRating.intrinsicValue !== undefined && 
                  updatedRating.targetMarginOfSafety !== undefined) {
                  
                if (updatedRating.bestBuyPrice !== null && updatedRating.bestBuyPrice !== undefined) {
                  updatedRating.originalBestBuyPrice = updatedRating.bestBuyPrice;
                }
                
                updatedRating.bestBuyPrice = updatedRating.intrinsicValue * 
                  (1 - (updatedRating.targetMarginOfSafety / 100));
                
                console.log(`Recalculated best buy price: ${updatedRating.bestBuyPrice} ${priceCurrency}`);
              }
              
              if (updatedRating.intrinsicValue !== null && 
                  updatedRating.intrinsicValue !== undefined && 
                  updatedRating.currentPrice !== null && 
                  updatedRating.currentPrice !== undefined) {
                
                if (updatedRating.currentPrice) {
                  updatedRating.originalPrice = updatedRating.currentPrice;
                  
                  console.log(`Current price already in ${priceCurrency}: ${updatedRating.currentPrice}`);
                }
                
                if (updatedRating.intrinsicValue > 0) {
                  updatedRating.marginOfSafety = {
                    value: ((updatedRating.intrinsicValue - updatedRating.currentPrice) / 
                      updatedRating.intrinsicValue) * 100,
                    status: updatedRating.marginOfSafety?.status || 'fail'
                  };
                  
                  console.log(`Recalculated margin of safety: ${updatedRating.marginOfSafety.value}%`);
                }
              }
              
              if (ratingCurrency !== priceCurrency) {
                updatedRating.originalCurrency = ratingCurrency;
                updatedRating.currency = priceCurrency;
              }
            } else {
              console.log(`No rating conversion needed: both stock price and rating are in ${priceCurrency}`);
            }
            
            if (info && info.price !== null && info.price !== undefined) {
              updatedRating.currentPrice = info.price;
              console.log(`Using stock price from info: ${updatedRating.currentPrice} ${priceCurrency}`);
            }
            
            setOverallRating(updatedRating);
          } catch (error) {
            console.error('Error converting rating values:', error);
            setOverallRating(rating);
          }
        } else {
          setOverallRating(rating);
        }
        
        setBuffettCriteria(criteria);
        setFinancialMetrics(metricsData);
        
        toast({
          title: "Analyse abgeschlossen",
          description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
        });
      } else {
        toast({
          title: "Analyse nicht möglich",
          description: `Für ${info.name} liegen nicht ausreichend Daten für eine Buffett-Analyse vor.`,
          variant: "destructive",
        });
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
      
      <Navigation />
      
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
      
      {stockInfo && stockInfo.currency && stockInfo.reportedCurrency && needsCurrencyConversion(stockInfo.reportedCurrency, stockInfo.currency) && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">Währungsumrechnung</AlertTitle>
          <AlertDescription className="text-yellow-600">
            Wenn Finanzkennzahlen (z. B. Umsatz, FCF, EBIT) in einer anderen Währung angegeben sind als die Kurswährung der Aktie, werden diese intern auf die Kurswährung umgerechnet.
          </AlertDescription>
        </Alert>
      )}
      
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
          {!hasCriticalDataMissing && buffettCriteria && (
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
                    <BuffettCriteriaGPT 
                      criteria={buffettCriteria} 
                      stockPrice={stockInfo?.price} 
                      currency={stockCurrency}
                      dcfData={dcfData}
                    />
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
          
          {!hasCriticalDataMissing && financialMetrics && (
            <div className="mb-10">
              <FinancialMetrics 
                metrics={financialMetrics.metrics} 
                historicalData={financialMetrics.historicalData} 
                currency={stockCurrency}
              />
            </div>
          )}
          
          {!hasCriticalDataMissing && overallRating && (
            <div className="mb-10">
              <OverallRating 
                rating={{
                  ...overallRating,
                  originalCurrency: needsCurrencyConversion(stockCurrency, overallRating.currency) ? overallRating.currency : undefined
                } as OverallRatingData} 
              />
            </div>
          )}
          
          {hasCriticalDataMissing && stockInfo && (
            <div className="mb-10">
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-700">Buffett-Analyse nicht möglich</AlertTitle>
                <AlertDescription className="text-red-600">
                  <p className="mb-3">
                    Für {stockInfo.ticker} liegen aktuell nicht genügend Daten für eine vollständige Bewertung vor.
                    Die Buffett-Analyse benötigt mindestens einen aktuellen Kurs und Marktkapitalisierung.
                  </p>
                  <p>
                    Bitte wählen Sie ein anderes Symbol mit vollständigeren Daten, um eine aussagekräftige Analyse nach Warren Buffetts Kriterien zu erhalten.
                  </p>
                </AlertDescription>
              </Alert>
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
