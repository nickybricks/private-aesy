
import { useState, useCallback } from 'react';
import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { useToast } from '@/hooks/use-toast';

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

interface StockAnalysisResult {
  isLoading: boolean;
  stockInfo: any;
  buffettCriteria: any;
  financialMetrics: FinancialMetricsData | null;
  overallRating: any;
  error: string | null;
  handleSearch: (ticker: string) => Promise<void>;
}

export const useStockAnalysis = (hasGptApiKey: boolean, setActiveTab: (tab: string) => void): StockAnalysisResult => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [buffettCriteria, setBuffettCriteria] = useState(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetricsData | null>(null);
  const [overallRating, setOverallRating] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (ticker: string) => {
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
      
      const processedMetrics: FinancialMetricsData = {
        eps: metricsData.eps,
        roe: metricsData.roe,
        netMargin: metricsData.netMargin,
        roic: metricsData.roic,
        debtToAssets: metricsData.debtToAssets,
        interestCoverage: metricsData.interestCoverage,
        metrics: [],
        historicalData: {
          revenue: [],
          earnings: [],
          eps: []
        }
      };
      
      if (metricsData.historicalData) {
        processedMetrics.historicalData = metricsData.historicalData;
      }
      
      if (metricsData.metrics && Array.isArray(metricsData.metrics)) {
        processedMetrics.metrics = metricsData.metrics;
      } else {
        const metricsArray: FinancialMetric[] = [];
        
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
            status: metricsData.debtToAssets < 0.3 ? 'pass' : metricsData.debtToAssets < 0.5 ? 'warning' : 'fail'
          });
        }
        
        if (metricsData.interestCoverage !== undefined) {
          metricsArray.push({
            name: 'Zinsdeckungsgrad',
            value: metricsData.interestCoverage || 'N/A',
            formula: 'EBIT / Zinsaufwand',
            explanation: 'Misst die Fähigkeit, Zinszahlungen zu decken',
            threshold: '>5',
            status: metricsData.interestCoverage > 5 ? 'pass' : 
                  (metricsData.interestCoverage > 3 || 
                  (metricsData.interestCoverage === 0 && metricsData.debtToAssets && metricsData.debtToAssets < 0.3)) ? 
                  'warning' : 'fail'
          });
        }
        
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
  }, [hasGptApiKey, setActiveTab, toast]);

  return {
    isLoading,
    stockInfo,
    buffettCriteria,
    financialMetrics,
    overallRating,
    error,
    handleSearch
  };
};
