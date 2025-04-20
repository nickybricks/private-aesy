
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { convertCurrency, shouldConvertCurrency } from '@/utils/currencyConverter';
import { StockInfo } from '@/types/stock';

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Helper function for API requests
const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    // Always use the hardcoded API key
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error(`Fehler beim Abrufen von Daten. Bitte versuchen Sie es später erneut.`);
  }
};

// Get stock quote information
export const fetchStockInfo = async (ticker: string): Promise<StockInfo | null> => {
  try {
    console.log(`Fetching stock info for ${ticker}`);
    
    // Fetch basic stock information
    const [quoteResponse, profileResponse, dcfResponse, keyMetricsResponse] = await Promise.all([
      fetchFromFMP(`/quote/${ticker}`),
      fetchFromFMP(`/profile/${ticker}`),
      fetchFromFMP(`/discounted-cash-flow/${ticker}`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`)
    ]);
    
    if (!quoteResponse || quoteResponse.length === 0) {
      throw new Error(`Keine Daten gefunden für ${ticker}`);
    }
    
    const quote = quoteResponse[0];
    const profile = profileResponse && profileResponse.length > 0 ? profileResponse[0] : null;
    const dcfData = dcfResponse && dcfResponse.length > 0 ? dcfResponse[0] : null;
    const keyMetrics = keyMetricsResponse && keyMetricsResponse.length > 0 ? keyMetricsResponse[0] : null;
    
    const currency = profile?.currency || 'USD';
    console.log(`Stock currency: ${currency}`);
    
    // Extract DCF value and convert if needed
    let intrinsicValue = dcfData?.dcf || null;
    let sharesOutstanding = null;
    
    if (keyMetrics) {
      sharesOutstanding = keyMetrics.sharesOutstanding || null;
      console.log(`Shares outstanding: ${sharesOutstanding}`);
    }
    
    // If we have enterprise value DCF instead of per-share DCF, calculate per-share value
    if (intrinsicValue && sharesOutstanding && intrinsicValue > quote.price * 20) {
      console.log(`DCF appears to be enterprise value (${intrinsicValue}), converting to per-share value`);
      intrinsicValue = intrinsicValue / sharesOutstanding;
      console.log(`DCF per share: ${intrinsicValue}`);
    }
    
    // If DCF currency differs from stock currency, convert it
    const dcfCurrency = dcfData?.currency || 'USD';
    if (intrinsicValue && shouldConvertCurrency(currency, dcfCurrency)) {
      console.log(`Converting DCF from ${dcfCurrency} to ${currency}`);
      intrinsicValue = await convertCurrency(intrinsicValue, dcfCurrency, currency);
      console.log(`Converted DCF: ${intrinsicValue}`);
    }
    
    const stockInfo: StockInfo = {
      name: profile?.companyName || quote.name,
      ticker: ticker,
      price: quote.price || null,
      change: quote.change || null,
      changePercent: quote.changesPercentage || null,
      currency: currency,
      marketCap: quote.marketCap || null,
      intrinsicValue: intrinsicValue,
      sharesOutstanding: sharesOutstanding
    };
    
    console.log('Fetched stock info:', stockInfo);
    return stockInfo;
  } catch (error) {
    console.error(`Error fetching stock info for ${ticker}:`, error);
    throw error;
  }
};

// Analyze stock by Buffett criteria
export const analyzeBuffettCriteria = async (ticker: string) => {
  try {
    // Get all needed data for Buffett analysis
    const [ratios, profile, financials, keyMetrics, balanceSheet] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
      fetchFromFMP(`/profile/${ticker}`),
      fetchFromFMP(`/income-statement/${ticker}?limit=5`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/balance-sheet-statement/${ticker}?limit=1`)
    ]);

    if (!ratios || ratios.length === 0) {
      throw new Error(`Keine ausreichenden Finanzdaten für ${ticker} verfügbar`);
    }

    const currentData = ratios[0];
    const metrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    const balanceSheetData = balanceSheet && balanceSheet.length > 0 ? balanceSheet[0] : null;
    const reportedCurrency = profile && profile.length > 0 ? profile[0].currency : 'USD';

    // Get 5 years of historical data for growth analysis
    let revenueGrowth = null;
    let earningsGrowth = null;
    let debtToEquity = null;

    if (financials && financials.length >= 5) {
      const currentYear = financials[0];
      const fiveYearsAgo = financials[4];
      
      if (currentYear && fiveYearsAgo) {
        const currentRevenue = currentYear.revenue;
        const pastRevenue = fiveYearsAgo.revenue;
        
        if (currentRevenue && pastRevenue && pastRevenue !== 0) {
          const cagr = (Math.pow((currentRevenue / pastRevenue), 1/5) - 1) * 100;
          revenueGrowth = cagr;
        }
        
        const currentEarnings = currentYear.netIncome;
        const pastEarnings = fiveYearsAgo.netIncome;
        
        if (currentEarnings && pastEarnings && pastEarnings !== 0 && pastEarnings > 0) {
          const cagr = (Math.pow((currentEarnings / pastEarnings), 1/5) - 1) * 100;
          earningsGrowth = cagr;
        }
      }
    }

    if (balanceSheetData) {
      const totalDebt = balanceSheetData.totalDebt;
      const shareholderEquity = balanceSheetData.totalStockholdersEquity;
      
      if (totalDebt && shareholderEquity && shareholderEquity !== 0) {
        debtToEquity = totalDebt / shareholderEquity;
      }
    }

    // Buffett Criteria Analysis
    const buffettCriteria = {
      stockName: profile && profile.length > 0 ? profile[0].companyName : ticker,
      stockTicker: ticker,
      sector: profile && profile.length > 0 ? profile[0].sector : 'Unbekannt',
      industry: profile && profile.length > 0 ? profile[0].industry : 'Unbekannt',
      currency: reportedCurrency,
      criteria: [
        {
          name: "Kapitalrendite (ROIC)",
          value: metrics?.roicTTM ? metrics.roicTTM * 100 : null,
          target: "> 12%",
          pass: metrics?.roicTTM ? metrics.roicTTM * 100 > 12 : false,
          importance: "high",
          explanation: "Ein hoher ROIC zeigt, dass das Unternehmen Kapital effizient einsetzt"
        },
        {
          name: "Eigenkapitalrendite (ROE)",
          value: currentData.returnOnEquityTTM * 100,
          target: "> 15%",
          pass: currentData.returnOnEquityTTM * 100 > 15,
          importance: "high",
          explanation: "Eine hohe Eigenkapitalrendite deutet auf ein profitables Unternehmen hin"
        },
        {
          name: "Gewinnmarge",
          value: currentData.netProfitMarginTTM * 100,
          target: "> 10%",
          pass: currentData.netProfitMarginTTM * 100 > 10,
          importance: "high",
          explanation: "Hohe Gewinnmargen sind ein Zeichen für einen Wettbewerbsvorteil"
        },
        {
          name: "Umsatzwachstum (5J)",
          value: revenueGrowth,
          target: "> 5%",
          pass: revenueGrowth !== null ? revenueGrowth > 5 : false,
          importance: "medium",
          explanation: "Konsistentes Umsatzwachstum zeigt die Nachfrage nach den Produkten/Dienstleistungen"
        },
        {
          name: "Gewinnwachstum (5J)",
          value: earningsGrowth,
          target: "> 8%",
          pass: earningsGrowth !== null ? earningsGrowth > 8 : false,
          importance: "medium",
          explanation: "Nachhaltiges Gewinnwachstum ist entscheidend für langfristigen Erfolg"
        },
        {
          name: "KGV (P/E Ratio)",
          value: currentData.priceEarningsRatioTTM,
          target: "< 20",
          pass: currentData.priceEarningsRatioTTM < 20 && currentData.priceEarningsRatioTTM > 0,
          importance: "medium",
          explanation: "Ein niedriges KGV deutet auf eine Unterbewertung hin"
        },
        {
          name: "Schulden zu Eigenkapital",
          value: debtToEquity,
          target: "< 0.5",
          pass: debtToEquity !== null ? debtToEquity < 0.5 : false,
          importance: "medium",
          explanation: "Eine niedrige Verschuldung reduziert finanzielle Risiken"
        },
        {
          name: "Zinsdeckungsgrad",
          value: currentData.interestCoverageTTM,
          target: "> 3",
          pass: currentData.interestCoverageTTM > 3,
          importance: "medium",
          explanation: "Eine hohe Zinsdeckung bedeutet, dass das Unternehmen seine Schulden leicht bedienen kann"
        }
      ]
    };

    return buffettCriteria;
  } catch (error) {
    console.error(`Error analyzing Buffett criteria for ${ticker}:`, error);
    throw error;
  }
};

// Get detailed financial metrics
export const getFinancialMetrics = async (ticker: string) => {
  try {
    // Get all required financial data
    const [ratios, financials, keyMetrics, profile] = await Promise.all([
      fetchFromFMP(`/ratios-ttm/${ticker}`),
      fetchFromFMP(`/income-statement/${ticker}?limit=10`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/profile/${ticker}`)
    ]);

    if (!ratios || ratios.length === 0) {
      throw new Error(`Keine ausreichenden Finanzdaten für ${ticker} verfügbar`);
    }

    const currentRatios = ratios[0];
    const reportedCurrency = profile && profile.length > 0 ? profile[0].currency : 'USD';
    
    // For historical data
    const historicalData = {
      revenue: [],
      earnings: [],
      eps: []
    };

    if (financials && financials.length > 0) {
      // Process last 10 years (or as many as available)
      for (let i = 0; i < Math.min(financials.length, 10); i++) {
        const yearData = financials[i];
        
        if (yearData) {
          const year = yearData.calendarYear;
          
          historicalData.revenue.push({
            year,
            value: yearData.revenue || 0
          });
          
          historicalData.earnings.push({
            year,
            value: yearData.netIncome || 0
          });
          
          historicalData.eps.push({
            year,
            value: yearData.eps || 0
          });
        }
      }
    }

    return {
      eps: currentRatios.netIncomePerShareTTM || 0,
      roe: currentRatios.returnOnEquityTTM || 0,
      netMargin: currentRatios.netProfitMarginTTM || 0,
      roic: keyMetrics && keyMetrics.length > 0 ? keyMetrics[0].roicTTM || 0 : 0,
      debtToAssets: currentRatios.debtRatioTTM || 0,
      interestCoverage: currentRatios.interestCoverageTTM || 0,
      reportedCurrency: reportedCurrency,
      historicalData
    };
  } catch (error) {
    console.error(`Error fetching financial metrics for ${ticker}:`, error);
    throw error;
  }
};

// Get overall rating and valuation analysis
export const getOverallRating = async (ticker: string) => {
  try {
    // Get key data needed for overall rating
    const [quoteData, dcfData, keyMetrics, profile] = await Promise.all([
      fetchFromFMP(`/quote/${ticker}`),
      fetchFromFMP(`/discounted-cash-flow/${ticker}`),
      fetchFromFMP(`/key-metrics-ttm/${ticker}`),
      fetchFromFMP(`/profile/${ticker}`)
    ]);

    const quote = quoteData && quoteData.length > 0 ? quoteData[0] : null;
    const dcf = dcfData && dcfData.length > 0 ? dcfData[0] : null;
    const metrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    const profileData = profile && profile.length > 0 ? profile[0] : null;
    
    if (!quote || !metrics) {
      throw new Error(`Keine ausreichenden Daten für eine Bewertung von ${ticker} verfügbar`);
    }

    const currentPrice = quote.price || 0;
    const stockCurrency = profileData?.currency || 'USD';
    const dcfCurrency = dcf?.currency || 'USD';
    
    // Extract DCF value and convert if needed
    let intrinsicValue = dcf?.dcf || null;
    const sharesOutstanding = metrics?.sharesOutstanding || null;
    
    // If we have enterprise value DCF instead of per-share DCF, calculate per-share value
    if (intrinsicValue && sharesOutstanding && intrinsicValue > currentPrice * 20) {
      console.log(`DCF appears to be enterprise value (${intrinsicValue}), converting to per-share value`);
      intrinsicValue = intrinsicValue / sharesOutstanding;
      console.log(`DCF per share: ${intrinsicValue}`);
    }
    
    // If DCF currency differs from stock currency, convert it
    if (intrinsicValue && shouldConvertCurrency(stockCurrency, dcfCurrency)) {
      console.log(`Converting DCF from ${dcfCurrency} to ${stockCurrency}`);
      intrinsicValue = await convertCurrency(intrinsicValue, dcfCurrency, stockCurrency);
      console.log(`Converted DCF: ${intrinsicValue}`);
    }

    // If intrinsic value is not available or is zero, use a PE-based estimate
    if (!intrinsicValue || intrinsicValue <= 0) {
      const eps = metrics.netIncomePerShareTTM || 0;
      const industryPE = 15; // Default conservative PE
      
      if (eps > 0) {
        intrinsicValue = eps * industryPE;
        console.log(`Using PE-based estimate for intrinsic value: ${intrinsicValue}`);
      } else {
        intrinsicValue = currentPrice * 1.1; // Fallback to slight premium
        console.log(`Using fallback method for intrinsic value: ${intrinsicValue}`);
      }
    }

    // Calculate margin of safety (using percentage below intrinsic value)
    const marginOfSafety = currentPrice > 0 && intrinsicValue > 0 
      ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100 
      : 0;
    
    // Target margin of safety - higher for more volatile businesses
    // Here we're using a simple 30% for demonstration
    const targetMarginOfSafety = 30;
    
    // Best buy price (with desired margin of safety)
    const bestBuyPrice = intrinsicValue * (1 - (targetMarginOfSafety / 100));
    
    // Determine margin of safety status
    let mosStatus = "fail";
    if (marginOfSafety >= targetMarginOfSafety) {
      mosStatus = "pass";
    } else if (marginOfSafety > 0) {
      mosStatus = "warning";
    }
    
    // Calculate Buffett Score (from 0 to 10) based on various factors
    let buffettScore = 0;
    
    // 1. ROIC > 12%
    if (metrics.roicTTM > 0.12) buffettScore += 1;
    
    // 2. ROE > 15% 
    if (metrics.returnOnEquityTTM > 0.15) buffettScore += 1;
    
    // 3. Net Margin > 10%
    if (metrics.netProfitMarginTTM > 0.1) buffettScore += 1;
    
    // 4. Low Debt/Equity
    if (metrics.debtToEquityTTM < 0.5) buffettScore += 1;
    
    // 5. Interest Coverage > 5
    if (metrics.interestCoverageTTM > 5) buffettScore += 1;
    
    // 6. Positive earnings growth
    if (metrics.netIncomeGrowthTTM > 0) buffettScore += 1;
    
    // 7. Positive free cash flow
    if (metrics.freeCashFlowPerShareTTM > 0) buffettScore += 1;
    
    // 8. Below intrinsic value
    if (currentPrice < intrinsicValue) buffettScore += 1;
    
    // 9. Reasonable P/E
    if (metrics.peRatioTTM > 0 && metrics.peRatioTTM < 20) buffettScore += 1;
    
    // 10. Consistent dividend (if applicable) or strong cash position
    if (metrics.dividendYieldTTM > 0.02 || metrics.cashPerShareTTM > currentPrice * 0.1) buffettScore += 1;
    
    // Identify strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    // Add main strengths
    if (metrics.roicTTM > 0.12) strengths.push("Hohe Kapitalrendite (ROIC)");
    if (metrics.netProfitMarginTTM > 0.1) strengths.push("Starke Gewinnmarge");
    if (metrics.debtToEquityTTM < 0.5) strengths.push("Geringe Verschuldung");
    if (metrics.freeCashFlowPerShareTTM > 0) strengths.push("Positiver Free Cash Flow");
    if (marginOfSafety > 20) strengths.push("Deutlich unter dem inneren Wert");
    
    // Add main weaknesses
    if (metrics.roicTTM < 0.08) weaknesses.push("Niedrige Kapitalrendite (ROIC)");
    if (metrics.netProfitMarginTTM < 0.05) weaknesses.push("Schwache Gewinnmarge");
    if (metrics.debtToEquityTTM > 1) weaknesses.push("Hohe Verschuldung");
    if (metrics.freeCashFlowPerShareTTM < 0) weaknesses.push("Negativer Free Cash Flow");
    if (marginOfSafety < 0) weaknesses.push("Über dem geschätzten inneren Wert");
    
    // Overall recommendation
    let recommendation = "";
    if (buffettScore >= 8) {
      recommendation = "Starker Kauf";
    } else if (buffettScore >= 6) {
      recommendation = "Kauf";
    } else if (buffettScore >= 4) {
      recommendation = "Halten";
    } else {
      recommendation = "Verkaufen/Meiden";
    }
    
    // Summary based on Buffett score
    let summary = "";
    if (buffettScore >= 8) {
      summary = `${profileData?.companyName || ticker} ist ein Unternehmen mit starken Fundamentaldaten, das zu einem vernünftigen Preis gehandelt wird. Es entspricht vielen von Warren Buffetts Investitionskriterien.`;
    } else if (buffettScore >= 6) {
      summary = `${profileData?.companyName || ticker} hat solide Fundamentaldaten und wird zu einem akzeptablen Preis gehandelt. Es erfüllt einige wichtige Kriterien für eine Buffett-Investition.`;
    } else if (buffettScore >= 4) {
      summary = `${profileData?.companyName || ticker} erfüllt einige, aber nicht alle wichtigen Kriterien für eine Buffett-Investition. Eine genauere Analyse oder ein günstigerer Preis könnte nötig sein.`;
    } else {
      summary = `${profileData?.companyName || ticker} entspricht derzeit nicht den Hauptkriterien für eine Buffett-Investition. Es gibt entweder Probleme mit den Fundamentaldaten oder der Preis ist zu hoch.`;
    }

    return {
      overall: buffettScore > 7 ? "Ausgezeichnet" : buffettScore > 5 ? "Gut" : buffettScore > 3 ? "Mittelmäßig" : "Schwach",
      buffettScore,
      summary,
      strengths,
      weaknesses,
      recommendation,
      marginOfSafety: {
        value: marginOfSafety,
        status: mosStatus
      },
      intrinsicValue,
      bestBuyPrice,
      currentPrice,
      targetMarginOfSafety,
      currency: stockCurrency
    };
  } catch (error) {
    console.error(`Error generating overall rating for ${ticker}:`, error);
    throw error;
  }
};
