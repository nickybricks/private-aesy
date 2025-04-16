
// Import necessary modules
import axios from 'axios';

// Base API setup
const API_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';

// API fetch functions
const fetchStockQuote = async (ticker: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quote/${ticker}?apikey=${API_KEY}`);
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    throw new Error(`Keine Daten gefunden für ${ticker}`);
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
};

const fetchIncomeStatements = async (ticker: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/income-statement/${ticker}?limit=10&apikey=${API_KEY}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    throw new Error(`Keine Einkommensdaten gefunden für ${ticker}`);
  } catch (error) {
    console.error('Error fetching income statements:', error);
    throw error;
  }
};

const fetchBalanceSheets = async (ticker: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/balance-sheet-statement/${ticker}?limit=10&apikey=${API_KEY}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    throw new Error(`Keine Bilanzdaten gefunden für ${ticker}`);
  } catch (error) {
    console.error('Error fetching balance sheets:', error);
    throw error;
  }
};

const fetchCashFlowStatements = async (ticker: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cash-flow-statement/${ticker}?limit=10&apikey=${API_KEY}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    throw new Error(`Keine Cashflow-Daten gefunden für ${ticker}`);
  } catch (error) {
    console.error('Error fetching cash flow statements:', error);
    throw error;
  }
};

const fetchKeyMetrics = async (ticker: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/key-metrics/${ticker}?limit=10&apikey=${API_KEY}`);
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    return []; // Key metrics might not be available for all stocks
  } catch (error) {
    console.error('Error fetching key metrics:', error);
    return []; // Return empty array as this is not critical
  }
};

// Function to fetch general stock information
export const fetchStockInfo = async (ticker: string) => {
  try {
    const quoteData = await fetchStockQuote(ticker);
    
    return {
      ticker: quoteData.symbol,
      name: quoteData.name,
      price: quoteData.price,
      change: quoteData.change,
      changePercent: quoteData.changesPercentage,
      marketCap: quoteData.marketCap,
      volume: quoteData.volume,
      avgVolume: quoteData.avgVolume,
      exchange: quoteData.exchange,
      currency: quoteData.currency || 'USD',
      pe: quoteData.pe,
      eps: quoteData.eps
    };
  } catch (error) {
    console.error('Error fetching stock info:', error);
    throw error;
  }
};

// Function to analyze stock against Buffett's criteria
export const analyzeBuffettCriteria = async (ticker: string) => {
  try {
    // Fetch necessary data for analysis
    const [quoteData, incomeStatements, balanceSheets, keyMetrics] = await Promise.all([
      fetchStockQuote(ticker),
      fetchIncomeStatements(ticker),
      fetchBalanceSheets(ticker),
      fetchKeyMetrics(ticker)
    ]);
    
    // Basic validation
    if (!incomeStatements || incomeStatements.length < 5) {
      throw new Error(`Nicht genügend historische Daten für ${ticker} verfügbar`);
    }
    
    // Extract and analyze key metrics
    const latest = incomeStatements[0];
    const fiveYearsAgo = incomeStatements.length >= 5 ? incomeStatements[4] : null;
    
    // Calculate revenue growth
    const revenueGrowth = fiveYearsAgo ? 
      (latest.revenue - fiveYearsAgo.revenue) / fiveYearsAgo.revenue : 0;
    
    // Calculate earnings growth
    const earningsGrowth = fiveYearsAgo && fiveYearsAgo.netIncome > 0 ? 
      (latest.netIncome - fiveYearsAgo.netIncome) / fiveYearsAgo.netIncome : 0;
    
    // Get debt levels
    const debt = balanceSheets[0].totalDebt || 0;
    const assets = balanceSheets[0].totalAssets || 1; // Prevent division by zero
    
    // Buffett criteria
    return {
      understandableBusiness: {
        status: "neutral" as "pass" | "warning" | "fail",
        reason: "Manuell zu bewerten: Ist das Geschäftsmodell verständlich und stabil?"
      },
      consistentOperatingHistory: {
        status: incomeStatements.every(s => s.netIncome > 0) ? "pass" as "pass" : "fail" as "fail",
        reason: incomeStatements.every(s => s.netIncome > 0) ? 
          "Das Unternehmen war in den letzten Jahren durchgehend profitabel." : 
          "Das Unternehmen hatte in den letzten Jahren Verluste."
      },
      favorableGrowthProspects: {
        status: revenueGrowth > 0.25 ? "pass" as "pass" : "warning" as "warning",
        reason: revenueGrowth > 0.25 ? 
          `Starkes Umsatzwachstum von ${(revenueGrowth * 100).toFixed(1)}% über 5 Jahre.` : 
          `Moderates Umsatzwachstum von ${(revenueGrowth * 100).toFixed(1)}% über 5 Jahre.`
      },
      goodROE: {
        status: latest.returnOnEquity > 0.15 ? "pass" as "pass" : "warning" as "warning",
        reason: latest.returnOnEquity > 0.15 ? 
          `Hohe Eigenkapitalrendite von ${(latest.returnOnEquity * 100).toFixed(1)}%.` : 
          `Eigenkapitalrendite von ${(latest.returnOnEquity * 100).toFixed(1)}% ist unter Buffetts Zielwert von 15%.`
      },
      lowDebt: {
        status: debt / assets < 0.5 ? "pass" as "pass" : "fail" as "fail",
        reason: debt / assets < 0.5 ? 
          `Niedrige Verschuldung: ${((debt / assets) * 100).toFixed(1)}% der Bilanzsumme.` : 
          `Hohe Verschuldung: ${((debt / assets) * 100).toFixed(1)}% der Bilanzsumme.`
      },
      stableEarnings: {
        status: earningsGrowth > 0 ? "pass" as "pass" : "fail" as "fail",
        reason: earningsGrowth > 0 ? 
          `Gewinnwachstum von ${(earningsGrowth * 100).toFixed(1)}% über 5 Jahre.` : 
          `Rückläufige Gewinne über 5 Jahre (${(earningsGrowth * 100).toFixed(1)}%).`
      }
    };
  } catch (error) {
    console.error('Error analyzing Buffett criteria:', error);
    throw error;
  }
};

export const getFinancialMetrics = async (ticker: string) => {
  try {
    const [quoteData, incomeStatements, balanceSheets, cashFlowStatements, keyMetrics] = await Promise.all([
      fetchStockQuote(ticker),
      fetchIncomeStatements(ticker),
      fetchBalanceSheets(ticker),
      fetchCashFlowStatements(ticker),
      fetchKeyMetrics(ticker)
    ]);
    
    // Check if we have data
    if (!incomeStatements || incomeStatements.length === 0 ||
        !balanceSheets || balanceSheets.length === 0 ||
        !cashFlowStatements || cashFlowStatements.length === 0) {
      console.error('Missing financial statements for', ticker);
      throw new Error(`Keine ausreichenden Finanzdaten für ${ticker} verfügbar`);
    }
    
    // Get the latest statements
    const latestIncomeStatement = incomeStatements[0];
    const latestBalanceSheet = balanceSheets[0];
    const latestCashFlowStatement = cashFlowStatements[0];
    const latestKeyMetrics = keyMetrics && keyMetrics.length > 0 ? keyMetrics[0] : null;
    
    // Calculate financial metrics
    let eps = 0;
    let roe = 0;
    let netMargin = 0;
    let roic = 0;
    let debtToAssets = 0;
    let interestCoverage = 0;
    let fcf = 0; // Add Free Cash Flow variable
    
    // EPS
    if (latestIncomeStatement && latestIncomeStatement.eps) {
      eps = latestIncomeStatement.eps;
    } else if (latestKeyMetrics && latestKeyMetrics.eps) {
      eps = latestKeyMetrics.eps;
    }
    
    // ROE (Return on Equity)
    if (latestIncomeStatement && latestBalanceSheet) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const shareholderEquity = latestBalanceSheet.totalStockholdersEquity || 0;
      
      if (shareholderEquity !== 0) {
        roe = netIncome / shareholderEquity;
      }
    }
    
    // Net Margin
    if (latestIncomeStatement) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const revenue = latestIncomeStatement.revenue || 0;
      
      if (revenue !== 0) {
        netMargin = netIncome / revenue;
      }
    }
    
    // ROIC (Return on Invested Capital)
    if (latestIncomeStatement && latestBalanceSheet) {
      const netIncome = latestIncomeStatement.netIncome || 0;
      const totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      const shareholderEquity = latestBalanceSheet.totalStockholdersEquity || 0;
      const investedCapital = totalDebt + shareholderEquity;
      
      if (investedCapital !== 0) {
        roic = netIncome / investedCapital;
      }
    }
    
    // Debt to Assets
    if (latestBalanceSheet) {
      const totalDebt = (latestBalanceSheet.shortTermDebt || 0) + (latestBalanceSheet.longTermDebt || 0);
      const totalAssets = latestBalanceSheet.totalAssets || 1; // Avoid division by zero
      
      debtToAssets = totalDebt / totalAssets;
    }
    
    // Interest Coverage Ratio
    if (latestIncomeStatement) {
      const ebit = latestIncomeStatement.ebit || latestIncomeStatement.operatingIncome || 0;
      const interestExpense = Math.abs(latestIncomeStatement.interestExpense || 0);
      
      if (interestExpense !== 0) {
        interestCoverage = ebit / interestExpense;
      } else {
        // If no interest expense, set to a high value to indicate strong coverage
        interestCoverage = 100;
      }
    }
    
    // Calculate FCF from cash flow statements
    if (latestCashFlowStatement) {
      const operatingCashFlow = latestCashFlowStatement.operatingCashFlow || 0;
      const capex = latestCashFlowStatement.capitalExpenditure || 0;
      
      // Free Cash Flow = Operating Cash Flow - Capital Expenditures
      fcf = operatingCashFlow + capex; // capex is usually negative, so we add it
      
      console.log(`FCF calculation: ${operatingCashFlow} + (${capex}) = ${fcf}`);
    }
    
    // Determine the currency of the financial statements
    let reportedCurrency = 'USD'; // Default to USD
    
    if (latestIncomeStatement && latestIncomeStatement.reportedCurrency) {
      reportedCurrency = latestIncomeStatement.reportedCurrency;
    } else if (quoteData && quoteData.currency) {
      reportedCurrency = quoteData.currency;
    }
    
    // Prepare historical data (last 10 years if available)
    const historicalData = {
      revenue: [],
      earnings: [],
      eps: []
    };
    
    // Get up to 10 years of data
    const yearsToInclude = Math.min(10, incomeStatements.length);
    
    for (let i = 0; i < yearsToInclude; i++) {
      const statement = incomeStatements[i];
      if (statement) {
        const year = statement.date ? statement.date.substring(0, 4) : `Year-${i}`;
        
        historicalData.revenue.push({
          year,
          value: statement.revenue || 0,
          originalCurrency: reportedCurrency
        });
        
        historicalData.earnings.push({
          year,
          value: statement.netIncome || 0,
          originalCurrency: reportedCurrency
        });
        
        historicalData.eps.push({
          year,
          value: statement.eps || 0,
          originalCurrency: reportedCurrency
        });
      }
    }
    
    return {
      // Existing metrics
      eps,
      roe,
      netMargin,
      roic,
      debtToAssets,
      interestCoverage,
      
      // Add FCF to returned metrics
      fcf,
      
      // Add the reported currency to the returned object
      reportedCurrency,
      
      // Historical data
      historicalData,
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    throw error;
  }
};

// Function to get overall rating and intrinsic value estimation
export const getOverallRating = async (ticker: string) => {
  try {
    // Fetch all necessary data
    const [quoteData, financialMetrics, buffettCriteria] = await Promise.all([
      fetchStockQuote(ticker),
      getFinancialMetrics(ticker),
      analyzeBuffettCriteria(ticker)
    ]);
    
    // Extract key metrics
    const currentPrice = quoteData.price;
    const eps = financialMetrics.eps;
    const roe = financialMetrics.roe;
    
    // Count passed Buffett criteria
    const buffettScore = Object.values(buffettCriteria).filter(
      criterion => criterion.status === "pass"
    ).length;
    
    // Calculate intrinsic value using a simple DCF model
    // Assuming 10% growth rate for companies with good fundamentals, 5% for others
    const growthRate = (buffettScore >= 4 && roe > 0.15) ? 0.1 : 0.05;
    const discountRate = 0.12; // 12% discount rate
    const terminalMultiple = 15; // Conservative P/E multiple for terminal value
    
    let presentValue = 0;
    let futureEPS = eps;
    
    // Calculate 10-year DCF
    for (let year = 1; year <= 10; year++) {
      futureEPS *= (1 + growthRate);
      presentValue += futureEPS / Math.pow(1 + discountRate, year);
    }
    
    // Add terminal value
    const terminalValue = (futureEPS * terminalMultiple) / Math.pow(1 + discountRate, 10);
    const intrinsicValue = presentValue + terminalValue;
    
    // Calculate margin of safety
    const marginOfSafetyTarget = 0.25; // 25% margin of safety
    const bestBuyPrice = intrinsicValue * (1 - marginOfSafetyTarget);
    const currentMarginOfSafety = (intrinsicValue - currentPrice) / intrinsicValue;
    
    // Determine margin of safety status correctly as a union type
    let marginOfSafetyStatus: "pass" | "warning" | "fail";
    if (currentMarginOfSafety > marginOfSafetyTarget) {
      marginOfSafetyStatus = "pass";
    } else if (currentMarginOfSafety > 0) {
      marginOfSafetyStatus = "warning";
    } else {
      marginOfSafetyStatus = "fail";
    }
    
    // Prepare the rating object
    const rating = {
      overall: 
        buffettScore >= 5 ? "Strong Buy" :
        buffettScore >= 4 ? "Buy" :
        buffettScore >= 3 ? "Hold" :
        "Caution",
      
      summary: `Die Aktie erfüllt ${buffettScore} von 6 Buffett-Kriterien.`,
      
      strengths: [],
      weaknesses: [],
      
      recommendation: 
        currentPrice < bestBuyPrice ? 
          `Aktueller Kurs liegt unter dem berechneten Kaufpreis von ${bestBuyPrice.toFixed(2)} ${quoteData.currency}.` :
          `Aktueller Kurs liegt über dem berechneten Kaufpreis von ${bestBuyPrice.toFixed(2)} ${quoteData.currency}.`,
      
      buffettScore,
      
      marginOfSafety: {
        value: currentMarginOfSafety,
        status: marginOfSafetyStatus
      },
      
      bestBuyPrice,
      currentPrice,
      intrinsicValue,
      targetMarginOfSafety: marginOfSafetyTarget,
      
      currency: quoteData.currency
    };
    
    // Collect strengths and weaknesses
    Object.entries(buffettCriteria).forEach(([key, criterion]) => {
      if (criterion.status === "pass") {
        rating.strengths.push(criterion.reason);
      } else if (criterion.status === "fail") {
        rating.weaknesses.push(criterion.reason);
      }
    });
    
    return rating;
  } catch (error) {
    console.error('Error calculating overall rating:', error);
    throw error;
  }
};

// ... keep existing code (other API functions)
