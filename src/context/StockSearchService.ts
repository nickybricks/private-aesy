import { fetchStockInfo, analyzeBuffettCriteria, getFinancialMetrics, getOverallRating } from '@/api/stockApi';
import { hasOpenAiApiKey } from '@/api/openaiApi';
import { useToast } from '@/hooks/use-toast';
import { shouldConvertCurrency, debugDCFData } from '@/utils/currencyConverter';
import { processFinancialMetrics } from './StockDataProcessor';
import { convertFinancialMetrics, convertHistoricalData, convertRatingValues } from './CurrencyService';
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { StockInfo } from '@/types/stock';

// Konstante für den direkten DCF-Endpunkt
const DCF_BASE_URL = 'https://financialmodelingprep.com/stable/custom-discounted-cash-flow';

// Hilfsfunktion zum Abrufen der DCF-Daten
const fetchCustomDCF = async (ticker: string) => {
  try {
    console.log(`Fetching custom DCF data for ${ticker} from ${DCF_BASE_URL}`);
    const response = await axios.get(DCF_BASE_URL, {
      params: {
        symbol: ticker,
        apikey: DEFAULT_FMP_API_KEY
      }
    });
    
    console.log('Custom DCF API response received:', response.data);
    
    // Überprüfen, ob die API-Daten ein Array zurückgegeben hat
    if (Array.isArray(response.data) && response.data.length > 0) {
      const dcfData = response.data[0]; // Nehme das erste Element
      console.log('Processing DCF data from array:', dcfData);
      
      // Extrahiere die jährlichen Daten und verarbeite sie
      if (dcfData.fcfAnnual && Array.isArray(dcfData.fcfAnnual)) {
        console.log('Found annual FCF data:', dcfData.fcfAnnual);
        
        // Projektionen für die nächsten 5 Jahre extrahieren
        const projectedFcf = dcfData.fcfAnnual
          .filter(annual => annual.year >= new Date().getFullYear())
          .map(annual => annual.fcf)
          .slice(0, 5); // Begrenzen auf 5 Jahre
        
        // Barwertberechnung mit WACC
        const wacc = dcfData.wacc || 0.09; // Fallback auf 9% wenn nicht vorhanden
        const pvProjectedFcf = projectedFcf.map((fcf, index) => {
          return fcf / Math.pow(1 + wacc, index + 1);
        });
        
        const sumPvProjectedFcf = pvProjectedFcf.reduce((sum, pv) => sum + pv, 0);
        
        // Terminal value Berechnung
        const lastFcf = projectedFcf[projectedFcf.length - 1] || 0;
        const growthRate = 0.02; // Annahme: 2% langfristiges Wachstum
        const terminalValue = lastFcf * (1 + growthRate) / (wacc - growthRate);
        const terminalValuePv = terminalValue / Math.pow(1 + wacc, projectedFcf.length);
        
        // Enterprise und Equity Value
        const enterpriseValue = sumPvProjectedFcf + terminalValuePv;
        const netDebt = dcfData.netDebt || 0;
        const equityValue = enterpriseValue - netDebt;
        
        // Intrinsischer Wert pro Aktie
        const sharesOutstanding = dcfData.sharesOutstanding || 0;
        const dcfValue = sharesOutstanding > 0 ? equityValue / sharesOutstanding : 0;
        
        const processedData = {
          projectedFcf,
          projectedFcfPv: pvProjectedFcf,
          wacc,
          terminalValuePv,
          netDebt,
          sharesOutstanding,
          dcfValue,
          sumPvProjectedFcf,
          enterpriseValue,
          equityValue
        };
        
        console.log('Processed DCF data:', processedData);
        return processedData;
      }
    }
    
    console.log('Returning original DCF data format');
    return response.data;
  } catch (error) {
    console.error('Error fetching custom DCF data:', error);
    return null;
  }
};

export const useStockSearch = () => {
  const { toast } = useToast();
  
  const checkHasGptAvailable = (): boolean => {
    return hasOpenAiApiKey();
  };

  const checkCriticalDataMissing = (info: any): boolean => {
    if (!info) return true;
    
    return (
      info.price === null || 
      info.price === 0 || 
      info.marketCap === null || 
      info.marketCap === 0
    );
  };

  const searchStockInfo = async (ticker: string) => {
    try {
      let info: StockInfo = await fetchStockInfo(ticker);
      console.log('Stock Info:', JSON.stringify(info, null, 2));
      
      const stockCurrency = info && info.currency ? info.currency : 'USD';
      console.log(`Stock price currency: ${stockCurrency}`);
      
      const criticalDataMissing = checkCriticalDataMissing(info);
      
      if (criticalDataMissing) {
        toast({
          title: "Analyse nicht möglich",
          description: `Für ${info.name} liegen nicht ausreichend Daten für eine Buffett-Analyse vor.`,
          variant: "destructive",
        });
        return { info, stockCurrency, criticalDataMissing, criteria: null, metricsData: null, rating: null, dcfData: null };
      }
      
      toast({
        title: "Analyse läuft",
        description: `Analysiere ${info.name} (${info.ticker}) nach Warren Buffett's Kriterien...`,
      });
      
      // Parallele Ausführung aller API-Aufrufe, einschließlich des neuen DCF-Aufrufs
      const [criteria, rawMetricsData, rating, customDcfData] = await Promise.all([
        analyzeBuffettCriteria(ticker),
        getFinancialMetrics(ticker),
        getOverallRating(ticker),
        fetchCustomDCF(ticker)
      ]);
      
      console.log('Buffett Criteria:', JSON.stringify(criteria, null, 2));
      console.log('Financial Metrics:', JSON.stringify(rawMetricsData, null, 2));
      console.log('Overall Rating:', JSON.stringify(rating, null, 2));
      console.log('Custom DCF Data:', JSON.stringify(customDcfData, null, 2));
      
      const priceCurrency = info?.currency || 'USD';
      const reportedCurrency = rawMetricsData?.reportedCurrency || priceCurrency;
      
      console.log(`Price currency: ${priceCurrency}, Reported financial data currency: ${reportedCurrency}`);
      
      let metricsData = processFinancialMetrics(rawMetricsData, reportedCurrency, priceCurrency);
      
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
      
      // Initialize the rating with required properties
      let updatedRating = null;
      let extractedDcfData = null;

      // Verarbeite das neue benutzerdefinierte DCF-Ergebnis, wenn verfügbar
      if (customDcfData) {
        console.log('Using custom DCF data from direct API call');
        // Formatiere die Daten in das benötigte Format
        extractedDcfData = {
          ufcf: customDcfData.projectedFcf || [],
          wacc: customDcfData.wacc || 0,
          presentTerminalValue: customDcfData.terminalValuePv || 0,
          netDebt: customDcfData.netDebt || 0,
          dilutedSharesOutstanding: customDcfData.sharesOutstanding || 0,
          currency: stockCurrency,
          intrinsicValue: customDcfData.dcfValue || 0,
          pvUfcfs: customDcfData.projectedFcfPv || [],
          sumPvUfcfs: customDcfData.sumPvProjectedFcf || 0,
          enterpriseValue: customDcfData.enterpriseValue || 0,
          equityValue: customDcfData.equityValue || 0
        };

        debugDCFData(extractedDcfData);
        
        // Speichere die Aktienanzahl in den Informationen, falls verfügbar
        if (customDcfData.sharesOutstanding) {
          info = {
            ...info,
            sharesOutstanding: customDcfData.sharesOutstanding
          };
        }
      } else if (rating) {
        // Fallback zu den DCF-Daten aus dem Rating, wenn vorhanden
        console.log('Falling back to DCF data from rating response');
        const ratingAny = rating as any;
        if (ratingAny && typeof ratingAny === 'object' && 'dcfData' in ratingAny) {
          extractedDcfData = ratingAny.dcfData;
          console.log('DCF Data found in API response.');
          
          // Debug the full DCF data structure using our new utility
          debugDCFData(extractedDcfData);
          
          // Prüfe explizit, ob equityValuePerShare vorhanden ist und logge es
          if (extractedDcfData.equityValuePerShare !== undefined) {
            console.log(`DCF equityValuePerShare (this should be used as intrinsicValue): ${extractedDcfData.equityValuePerShare}`);
          }
          
          // Prüfe explizit die intrinsicValue aus dem DCF
          if (extractedDcfData.intrinsicValue !== undefined) {
            console.log(`DCF intrinsicValue: ${extractedDcfData.intrinsicValue}`);
          } else if (extractedDcfData.equityValuePerShare !== undefined) {
            // Wenn intrinsicValue nicht existiert, aber equityValuePerShare ja, verwende diese
            extractedDcfData.intrinsicValue = extractedDcfData.equityValuePerShare;
            console.log(`Setting intrinsicValue to equityValuePerShare: ${extractedDcfData.intrinsicValue}`);
          }
        } else {
          console.warn('DCF ERROR: No DCF data found in API response');
        }
      }
      
      if (rating) {
        updatedRating = {
          ...rating,
          originalIntrinsicValue: rating.originalIntrinsicValue || null,
          originalBestBuyPrice: rating.originalBestBuyPrice || null,
          originalPrice: rating.originalPrice || null,
          reportedCurrency: reportedCurrency,
          dcfData: extractedDcfData
        };
        
        // WICHTIG: Setze den intrinsischen Wert aus den DCF-Daten, wenn verfügbar
        if (extractedDcfData && extractedDcfData.intrinsicValue !== undefined) {
          console.log(`Setting rating.intrinsicValue directly from DCF data: ${extractedDcfData.intrinsicValue}`);
          updatedRating.intrinsicValue = extractedDcfData.intrinsicValue;
          
          // Create enhanced info object with intrinsicValue
          const enhancedInfo = {
            ...info,
            intrinsicValue: extractedDcfData.intrinsicValue
          };
          
          // Replace the info object with the enhanced version
          info = enhancedInfo;
          console.log(`Updated info with DCF intrinsicValue: ${extractedDcfData.intrinsicValue}`);
        }
        
        const ratingCurrency = updatedRating.currency || reportedCurrency;
        updatedRating = await convertRatingValues(updatedRating, ratingCurrency, priceCurrency);
        
        if (info && info.price !== null && info.price !== undefined) {
          updatedRating.currentPrice = info.price;
          console.log(`Using stock price from info: ${updatedRating.currentPrice} ${priceCurrency}`);
        }
      }
      
      toast({
        title: "Analyse abgeschlossen",
        description: `Die Analyse für ${info.name} wurde erfolgreich durchgeführt.`,
      });
      
      // Logge die endgültigen Werte für Debugging
      console.log(`Final intrinsicValue in rating: ${updatedRating?.intrinsicValue}`);
      if (info && 'intrinsicValue' in info) {
        console.log(`Final intrinsicValue in info: ${info.intrinsicValue}`);
      }
      console.log(`Final intrinsicValue in dcfData: ${extractedDcfData?.intrinsicValue}`);
      
      return { 
        info, 
        stockCurrency, 
        criticalDataMissing, 
        criteria, 
        metricsData, 
        rating: updatedRating,
        dcfData: extractedDcfData
      };
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
      
      toast({
        title: "Fehler",
        description: enhancedErrorMessage,
        variant: "destructive",
      });
      
      throw new Error(enhancedErrorMessage);
    }
  };

  return {
    checkHasGptAvailable,
    checkCriticalDataMissing,
    searchStockInfo
  };
};
