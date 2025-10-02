import { ValuationData } from '@/context/StockContextTypes';

type BasisMode = 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';

/**
 * Fetch valuation data from the backend API
 */
export async function fetchValuation(
  ticker: string,
  mode: BasisMode,
  currentPrice: number
): Promise<ValuationData> {
  const url = `https://slpruxtkowlxawssqyup.supabase.co/functions/v1/valuation?ticker=${encodeURIComponent(ticker)}&mode=${mode}&price=${currentPrice}`;
  
  console.log(`Fetching valuation: ticker=${ticker}, mode=${mode}, price=${currentPrice}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Valuation data received:', data);
  
  return data;
}

/**
 * Fetch all three valuation modes in parallel
 */
export async function fetchAllValuationModes(
  ticker: string,
  currentPrice: number
): Promise<{
  epsWoNri: ValuationData;
  fcfPerShare: ValuationData;
  adjustedDividend: ValuationData;
}> {
  const [epsWoNri, fcfPerShare, adjustedDividend] = await Promise.all([
    fetchValuation(ticker, 'EPS_WO_NRI', currentPrice),
    fetchValuation(ticker, 'FCF_PER_SHARE', currentPrice),
    fetchValuation(ticker, 'ADJUSTED_DIVIDEND', currentPrice)
  ]);
  
  return {
    epsWoNri,
    fcfPerShare,
    adjustedDividend
  };
}
