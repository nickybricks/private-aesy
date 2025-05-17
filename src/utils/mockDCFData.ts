
import { DCFData } from '@/components/BuffettCriteriaGPT';

// This function provides mock DCF data for testing purposes only
// It's intended to be replaced with real API data
export function getMockDCFData(ticker: string, currentPrice: number, currency: string): DCFData {
  // For testing: Return sample data for specific tickers, otherwise show error
  if (ticker === 'AAPL') {
    return {
      intrinsicValue: 140.68,
      currentPrice: currentPrice,
      deviation: ((currentPrice - 140.68) / 140.68) * 100,
      terminalValuePercentage: 78,
      currency: currency,
      missingInputs: null
    };
  } else if (ticker === 'MSFT') {
    return {
      intrinsicValue: 310.25,
      currentPrice: currentPrice,
      deviation: ((currentPrice - 310.25) / 310.25) * 100,
      terminalValuePercentage: 82,
      currency: currency,
      missingInputs: null
    };
  } else {
    // For all other tickers, simulate missing data
    return {
      intrinsicValue: null,
      currentPrice: currentPrice,
      deviation: null,
      terminalValuePercentage: null,
      currency: currency,
      missingInputs: ['Prognostizierte UFCF für min. 5 Jahre', 'Gewichtete durchschnittliche Kapitalkosten (WACC)']
    };
  }
}
