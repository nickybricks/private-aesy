
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
    console.log(`Full API URL: ${DCF_BASE_URL}?symbol=${ticker}&apikey=[REDACTED]`);
    
    // Verbesserte Fehlerbehandlung mit Timeout und detailliertem Logging
    const response = await axios.get(DCF_BASE_URL, {
      params: {
        symbol: ticker,
        apikey: DEFAULT_FMP_API_KEY
      },
      timeout: 10000 // 10s Timeout
    });
    
    // Detailliertere Protokollierung der Antwort
    console.log('Custom DCF API response status:', response.status);
    console.log('Custom DCF API response headers:', response.headers);
    console.log('Custom DCF API response received:', 
      Array.isArray(response.data) 
        ? `Array with ${response.data.length} items` 
        : typeof response.data);
    
    if (response.data && Array.isArray(response.data)) {
      console.log('First item in response (if available):', 
        response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'No items');
    }
    
    // Überprüfen, ob die API-Daten ein Array zurückgegeben hat
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Daten nach Jahren sortieren (neueste zuerst)
      const sortedData = [...response.data].sort((a, b) => b.year - a.year);
      console.log('Sorted DCF data by year (newest first):', sortedData);
      
      // Die FCF-Werte für alle Jahre extrahieren
      const fcfValues = sortedData
        .filter(yearData => yearData.fcf !== undefined && yearData.fcf !== null)
        .map(yearData => ({
          year: yearData.year,
          fcf: yearData.fcf
        }));
      
      console.log('Extracted FCF values for all years:', fcfValues);
      
      // Das letzte Jahr mit vollständigen Daten finden (normalerweise das letzte Prognosejahr)
      const latestCompleteYear = sortedData.find(yearData => 
        yearData.wacc !== undefined && 
        yearData.netDebt !== undefined && 
        yearData.sharesOutstanding !== undefined
      );
      
      if (!latestCompleteYear) {
        console.warn('No year with complete DCF data found');
        console.log('Available fields in the first data item:', 
          sortedData.length > 0 ? Object.keys(sortedData[0]) : 'No data items');
        return null;
      }
      
      console.log('Using data from year', latestCompleteYear.year, 'for complete DCF calculation');
      console.log('Complete year data:', latestCompleteYear);
      
      // Projektionen für die nächsten Jahre extrahieren
      const currentYear = new Date().getFullYear();
      const projectedFcf = fcfValues
        .filter(item => item.year >= currentYear)
        .sort((a, b) => a.year - b.year)  // Nach Jahren sortieren (älteste zuerst)
        .map(item => item.fcf)
        .slice(0, 5);  // Auf 5 Jahre begrenzen
      
      if (projectedFcf.length === 0) {
        console.warn('No projected FCF values found for future years');
        return null;
      }
      
      console.log('Projected FCF for next 5 years:', projectedFcf);
      
      // DCF-Berechnungen durchführen
      const wacc = latestCompleteYear.wacc || 0.09; // Fallback auf 9% wenn nicht vorhanden
      console.log('Using WACC:', wacc);
      
      // Barwertberechnung mit WACC
      const pvProjectedFcf = projectedFcf.map((fcf, index) => {
        return fcf / Math.pow(1 + wacc, index + 1);
      });
      
      console.log('Present value of projected FCFs:', pvProjectedFcf);
      
      const sumPvProjectedFcf = pvProjectedFcf.reduce((sum, pv) => sum + pv, 0);
      
      // Terminal value Berechnung
      const lastFcf = projectedFcf[projectedFcf.length - 1] || 0;
      const growthRate = 0.02; // Annahme: 2% langfristiges Wachstum
      const terminalValue = lastFcf * (1 + growthRate) / (wacc - growthRate);
      const terminalValuePv = terminalValue / Math.pow(1 + wacc, projectedFcf.length);
      
      console.log('Terminal value:', terminalValue);
      console.log('Present value of terminal value:', terminalValuePv);
      
      // Enterprise und Equity Value
      const enterpriseValue = sumPvProjectedFcf + terminalValuePv;
      const netDebt = latestCompleteYear.netDebt || 0;
      const equityValue = enterpriseValue - netDebt;
      
      // Intrinsischer Wert pro Aktie
      const sharesOutstanding = latestCompleteYear.sharesOutstanding || 0;
      const dcfValue = sharesOutstanding > 0 ? equityValue / sharesOutstanding : 0;
      
      // Strukturiertes DCF-Ergebnisobjekt erstellen
      const processedData = {
        ufcf: projectedFcf,
        wacc,
        netDebt,
        dilutedSharesOutstanding: sharesOutstanding,
        presentTerminalValue: terminalValuePv,
        currency: latestCompleteYear.currency || 'USD',
        intrinsicValue: dcfValue,
        pvUfcfs: pvProjectedFcf,
        sumPvUfcfs: sumPvProjectedFcf,
        enterpriseValue,
        equityValue,
        equityValuePerShare: dcfValue  // Für Abwärtskompatibilität
      };
      
      console.log('Final processed DCF data:', processedData);
      debugDCFData(processedData);
      
      return processedData;
    } else {
      console.warn('Custom DCF API did not return an array or returned an empty array');
      console.log('DCF API response type:', typeof response.data);
      console.log('DCF API response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching custom DCF data:', error);
    
    // Erweiterte Fehlerinformationen
    if (axios.isAxiosError(error)) {
      console.error('API request failed with status:', error.response?.status);
      console.error('API request failed with data:', error.response?.data);
      console.error('API request config:', error.config);
    }
    
    // Versuchen wir einen alternativen Ansatz über fallback API
    try {
      console.log(`Attempting fallback API call for DCF data for ${ticker}`);
      const fallbackUrl = `https://financialmodelingprep.com/api/v3/discounted-cash-flow/${ticker}`;
      console.log(`Using fallback URL: ${fallbackUrl}`);
      
      const fallbackResponse = await axios.get(fallbackUrl, {
        params: { apikey: DEFAULT_FMP_API_KEY },
        timeout: 10000
      });
      
      console.log('Fallback API response status:', fallbackResponse.status);
      console.log('Fallback API response data:', fallbackResponse.data);
      
      // Wir versuchen die Daten von der alternativen API zu verarbeiten
      if (fallbackResponse.data && Array.isArray(fallbackResponse.data) && fallbackResponse.data.length > 0) {
        const dcfData = fallbackResponse.data[0];
        console.log('Extracted DCF data from fallback API:', dcfData);
        
        if (dcfData.dcf && dcfData.dcf > 0) {
          // Einfacheres DCF-Objekt aus fallback API erstellen
          return {
            intrinsicValue: dcfData.dcf,
            currency: dcfData.currency || 'USD',
            wacc: 0.09, // Standardwert, da nicht in der API enthalten
            dilutedSharesOutstanding: dcfData.sharesOutstanding || 0,
            netDebt: 0, // Nicht in der API enthalten
            ufcf: [], // Nicht in der API enthalten
            presentTerminalValue: 0, // Nicht in der API enthalten
            pvUfcfs: [], // Nicht in der API enthalten
            sumPvUfcfs: 0, // Nicht in der API enthalten
            enterpriseValue: 0, // Nicht in der API enthalten
            equityValue: 0, // Nicht in der API enthalten
            equityValuePerShare: dcfData.dcf // Für Abwärtskompatibilität
          };
        }
      }
      console.warn('Fallback API call did not return usable DCF data');
    } catch (fallbackError) {
      console.error('Fallback API call also failed:', fallbackError);
    }
    
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
          ufcf: customDcfData.ufcf || [],
          wacc: customDcfData.wacc || 0,
          presentTerminalValue: customDcfData.presentTerminalValue || 0,
          netDebt: customDcfData.netDebt || 0,
          dilutedSharesOutstanding: customDcfData.dilutedSharesOutstanding || 0,
          currency: stockCurrency,
          intrinsicValue: customDcfData.intrinsicValue || 0,
          pvUfcfs: customDcfData.pvUfcfs || [],
          sumPvUfcfs: customDcfData.sumPvUfcfs || 0,
          enterpriseValue: customDcfData.enterpriseValue || 0,
          equityValue: customDcfData.equityValue || 0
        };

        debugDCFData(extractedDcfData);
        
        // Speichere die Aktienanzahl in den Informationen, falls verfügbar
        if (customDcfData.dilutedSharesOutstanding) {
          info = {
            ...info,
            sharesOutstanding: customDcfData.dilutedSharesOutstanding
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
