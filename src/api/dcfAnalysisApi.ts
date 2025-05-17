
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
    return null;
  } catch (error) {
    console.error("Error fetching DCF data:", error);
    return null;
  }
}
