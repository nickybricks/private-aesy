import { HistoricalDataItem } from '@/context/StockContextTypes';

interface GrowthScores {
  revenueScore: number;       // max 4 points
  ebitdaScore: number;        // max 4 points
  epsWoNriScore: number;      // max 6 points
  fcfScore: number;           // max 6 points
  totalScore: number;         // max 20 points
  maxTotalScore: number;
}

// Calculate CAGR (Compound Annual Growth Rate)
const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

// Revenue Growth Score (max 4 points)
// ≥ 10 % → 4, 7–<10 % → 3, 5–<7 % → 2, 3–<5 % → 1, < 3 % → 0
const getRevenueScore = (cagr: number): number => {
  if (cagr >= 10) return 4;
  if (cagr >= 7) return 3;
  if (cagr >= 5) return 2;
  if (cagr >= 3) return 1;
  return 0;
};

// EBITDA Growth Score (max 4 points)
// ≥ 12 % → 4, 8–<12 % → 3, 6–<8 % → 2, 3–<6 % → 1, < 3 % → 0
const getEbitdaScore = (cagr: number): number => {
  if (cagr >= 12) return 4;
  if (cagr >= 8) return 3;
  if (cagr >= 6) return 2;
  if (cagr >= 3) return 1;
  return 0;
};

// EPS w/o NRI Growth Score (max 6 points)
// ≥ 15 % → 6, 12–<15 % → 5, 9–<12 % → 4, 6–<9 % → 2, 3–<6 % → 1, < 3 % → 0
const getEpsWoNriScore = (cagr: number): number => {
  if (cagr >= 15) return 6;
  if (cagr >= 12) return 5;
  if (cagr >= 9) return 4;
  if (cagr >= 6) return 2;
  if (cagr >= 3) return 1;
  return 0;
};

// FCF Growth Score (max 6 points)
// ≥ 12 % → 6, 10–<12 % → 5, 7–<10 % → 4, 4–<7 % → 2, 2–<4 % → 1, < 2 % → 0
const getFcfScore = (cagr: number): number => {
  if (cagr >= 12) return 6;
  if (cagr >= 10) return 5;
  if (cagr >= 7) return 4;
  if (cagr >= 4) return 2;
  if (cagr >= 2) return 1;
  return 0;
};

// Calculate best available CAGR (prefer longer periods: 10Y > 5Y > 3Y)
const calculateBestCAGR = (historicalData: HistoricalDataItem[]): number => {
  if (!historicalData || historicalData.length < 2) {
    return 0;
  }

  const sortedData = [...historicalData].sort((a, b) => 
    parseInt(a.year) - parseInt(b.year)
  );

  const latestYear = sortedData[sortedData.length - 1];
  const latestValue = latestYear.value;

  // Try 10-year CAGR first
  if (sortedData.length >= 11) {
    const cagr10y = calculateCAGR(sortedData[sortedData.length - 11].value, latestValue, 10);
    if (cagr10y > 0) return cagr10y;
  }

  // Try 5-year CAGR
  if (sortedData.length >= 6) {
    const cagr5y = calculateCAGR(sortedData[sortedData.length - 6].value, latestValue, 5);
    if (cagr5y > 0) return cagr5y;
  }

  // Try 3-year CAGR
  if (sortedData.length >= 4) {
    const cagr3y = calculateCAGR(sortedData[sortedData.length - 4].value, latestValue, 3);
    return cagr3y;
  }

  return 0;
};

/**
 * Calculate Growth Scores from historical data
 * Returns scores for all growth metrics (total max: 20 points)
 */
export const calculateGrowthScores = (
  revenueData?: HistoricalDataItem[],
  ebitdaData?: HistoricalDataItem[],
  epsWoNriData?: HistoricalDataItem[],
  fcfData?: HistoricalDataItem[]
): GrowthScores => {
  // Calculate CAGR for each metric
  const revenueCagr = revenueData ? calculateBestCAGR(revenueData) : 0;
  const ebitdaCagr = ebitdaData ? calculateBestCAGR(ebitdaData) : 0;
  const epsWoNriCagr = epsWoNriData ? calculateBestCAGR(epsWoNriData) : 0;
  const fcfCagr = fcfData ? calculateBestCAGR(fcfData) : 0;

  // Calculate scores
  const revenueScore = getRevenueScore(revenueCagr);
  const ebitdaScore = getEbitdaScore(ebitdaCagr);
  const epsWoNriScore = getEpsWoNriScore(epsWoNriCagr);
  const fcfScore = getFcfScore(fcfCagr);

  const totalScore = revenueScore + ebitdaScore + epsWoNriScore + fcfScore;
  const maxTotalScore = 20; // 4 + 4 + 6 + 6

  return {
    revenueScore,
    ebitdaScore,
    epsWoNriScore,
    fcfScore,
    totalScore,
    maxTotalScore
  };
};
