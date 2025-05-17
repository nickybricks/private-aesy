
import axios from 'axios';
const API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

export interface DCFAdvancedData {
  symbol: string;
  ufcf: number[];
  wacc: number;
  presentTerminalValue: number;
  netDebt: number;
  dilutedSharesOutstanding: number;
  date: string[];
}

/**
 * Fetches advanced DCF data from the Financial Modeling Prep API
 */
export async function fetchDCFAdvancedData(ticker: string): Promise<DCFAdvancedData | null> {
  try {
    // TODO: Replace with actual API endpoint when available
    const response = await axios.get(
      `https://financialmodelingprep.com/api/v4/advanced_dcf/${ticker}`,
      {
        params: {
          apikey: API_KEY
        }
      }
    );

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    
    console.warn("No DCF data returned from API for:", ticker);
    
    // If we're in development mode and testing AAPL or MSFT, return mock data
    // This section MUST be removed in production
    if (process.env.NODE_ENV === 'development') {
      if (ticker === 'AAPL') {
        return getMockAppleData();
      } else if (ticker === 'MSFT') {
        return getMockMicrosoftData();
      }
    }
    
    // If we don't get data and there's no mock, return null
    return null;
  } catch (error) {
    console.error("Error fetching DCF data:", error);
    
    // If we're in development mode and testing AAPL or MSFT, return mock data
    // This section MUST be removed in production
    if (process.env.NODE_ENV === 'development') {
      if (ticker === 'AAPL') {
        return getMockAppleData();
      } else if (ticker === 'MSFT') {
        return getMockMicrosoftData();
      }
    }
    
    return null;
  }
}

// Mock data functions for development - REMOVE IN PRODUCTION
function getMockAppleData(): DCFAdvancedData {
  return {
    symbol: 'AAPL',
    ufcf: [110000000000, 120000000000, 130000000000, 140000000000, 150000000000],
    wacc: 9.87,
    presentTerminalValue: 1750750570757,
    netDebt: 76686000000,
    dilutedSharesOutstanding: 15408095000,
    date: ['2025', '2026', '2027', '2028', '2029']
  };
}

function getMockMicrosoftData(): DCFAdvancedData {
  return {
    symbol: 'MSFT',
    ufcf: [85000000000, 95000000000, 105000000000, 115000000000, 125000000000],
    wacc: 8.5,
    presentTerminalValue: 2250750570757,
    netDebt: 42686000000,
    dilutedSharesOutstanding: 7408095000,
    date: ['2025', '2026', '2027', '2028', '2029']
  };
}
