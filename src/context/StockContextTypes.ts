import { ReactNode } from 'react';
import { PredictabilityResult } from '@/services/PredictabilityStarsService';

export interface NewsItem {
  title: string;
  image: string;
  url: string;
  publishedDate: string;
  site: string;
  symbol: string;
  text?: string;
}

export interface HistoricalDataItem {
  year: string;
  value: number;
  originalValue?: number;
  originalCurrency?: string;
  isProfitable?: boolean; // For netIncome: indicates if year was profitable
}

// New interfaces for weekly P/E data
export interface PEDataItem {
  date: string;        // ISO date format (YYYY-MM-DD)
  stockPE: number;     // P/E ratio of the stock
  industryPE?: number; // P/E ratio of the industry (optional)
}

export interface IndustryPEDataItem {
  date: string;
  value: number;
}

export interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  operatingMargin?: any;
  roa?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
  netDebtToEbitda?: any;
  currentRatio?: any;
  reportedCurrency?: string;
  metrics?: Array<{
    name: string;
    value: any;
    formula: string;
    explanation: string;
    threshold: string;
    status: "pass" | "warning" | "fail";
    originalValue?: any;
    originalCurrency?: string;
    isPercentage: boolean;
    isMultiplier: boolean;
  }>;
  historicalData?: {
    revenue: HistoricalDataItem[];
    earnings: HistoricalDataItem[];
    eps: HistoricalDataItem[];
    ebitda: HistoricalDataItem[];
    peRatio: HistoricalDataItem[];
    peRatioWeekly?: PEDataItem[];      // NEW: Weekly P/E data (stock + industry)
    industryPE?: IndustryPEDataItem[]; // NEW: Industry P/E historical data
    roe: HistoricalDataItem[];
    roic: HistoricalDataItem[];
    operatingMargin: HistoricalDataItem[];
    netMargin: HistoricalDataItem[];
    roa: HistoricalDataItem[];
    operatingCashFlow: HistoricalDataItem[];
    freeCashFlow: HistoricalDataItem[];
    netIncome: HistoricalDataItem[];
    debtToAssets: HistoricalDataItem[];
    interestCoverage: HistoricalDataItem[];
    currentRatio: HistoricalDataItem[];
    netDebtToEbitda: HistoricalDataItem[];
    dividend?: HistoricalDataItem[];           // NEW: Historical dividends per share
    payoutRatio?: HistoricalDataItem[];        // NEW: Payout ratio (Dividends/FCF)
    dividendGrowth?: HistoricalDataItem[];     // NEW: Annual dividend growth
    epsWoNri?: HistoricalDataItem[];           // NEW: EPS w/o NRI (Earnings Per Share without Non-Recurring Items)
  };
  dividendMetrics?: {
    currentDividendPerShare: number;
    currentPayoutRatio: number;
    dividendStreak: number;                   // Years without cuts
    dividendCAGR3Y: number | null;            // 3-year CAGR
    dividendCAGR5Y: number | null;            // 5-year CAGR
    dividendCAGR10Y: number | null;           // 10-year CAGR
  };
  wacc?: number;
}

export interface OverallRatingData {
  overall: any;
  summary: any;
  strengths: any[];
  weaknesses: any[];
  recommendation: any;
  buffettScore: number;
  marginOfSafety: { value: number; status: "pass" | "warning" | "fail"; };
  bestBuyPrice: number;
  currentPrice: any;
  currency: any;
  intrinsicValue: any;
  targetMarginOfSafety: number;
  reportedCurrency: string;
  originalIntrinsicValue: number | null;
  originalBestBuyPrice: number | null;
  originalPrice: number | null;
  originalCurrency?: string;
  dcfData?: DCFData;
}

export interface DCFData {
  ufcf: number[];
  wacc: number;
  presentTerminalValue: number;
  netDebt: number;
  dilutedSharesOutstanding: number;
  currency: string;
  intrinsicValue: number;
  pvUfcfs: number[];
  sumPvUfcfs: number;
  enterpriseValue: number;
  equityValue: number;
}

export interface ValuationData {
  ticker: string;
  price: number;
  mode: 'EPS_WO_NRI' | 'FCF_PER_SHARE' | 'ADJUSTED_DIVIDEND';
  fairValuePerShare: number;
  marginOfSafetyPct: number;
  assumptions: {
    discountRatePct: number;
    growthYears: number;
    growthRatePct: number;
    terminalYears: number;
    terminalRatePct: number;
    tangibleBookPerShare: number;
    includeTangibleBook: boolean;
    predictability: string;
  };
  components: {
    startValuePerShare: number;
    pvPhase1: number;
    pvPhase2: number;
    tangibleBookAdded: number;
  };
  asOf: string;
  warnings?: string[];
}

export interface ScoreResult {
  score: number;
  maxScore: number;
}

export interface ProfitabilityScores {
  preset: string;
  scores: {
    roic: ScoreResult;
    operatingMargin: ScoreResult;
    netMargin: ScoreResult;
    years: ScoreResult;
    roe: ScoreResult;
    roa: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

export interface FinancialStrengthScores {
  preset: string;
  scores: {
    netDebtToEbitda: ScoreResult;
    interestCoverage: ScoreResult;
    debtToAssets: ScoreResult;
    currentRatio: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

export interface ValuationScores {
  scores: {
    intrinsicValueDiscount: ScoreResult;
    peterLynchDiscount: ScoreResult;
    peRatio: ScoreResult;
    dividendYield: ScoreResult;
    priceToBook: ScoreResult;
    priceToCashFlow: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

export interface GrowthScores {
  scores: {
    revenue: ScoreResult;
    ebitda: ScoreResult;
    epsWoNri: ScoreResult;
    fcf: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

export interface StockContextType {
  isLoading: boolean;
  loadingProgress: number;
  loadingStartTime: number | null;
  error: string | null;
  stockInfo: any;
  buffettCriteria: any;
  financialMetrics: FinancialMetricsData | null;
  overallRating: OverallRatingData | null;
  gptAvailable: boolean;
  activeTab: string;
  stockCurrency: string;
  hasCriticalDataMissing: boolean;
  dcfData?: DCFData;
  valuationData?: ValuationData;
  predictabilityStars: PredictabilityResult | null;
  newsItems: NewsItem[];
  pressReleases: NewsItem[];
  deepResearchPerformed: boolean;
  profitabilityScores: ProfitabilityScores | null;
  financialStrengthScores: FinancialStrengthScores | null;
  valuationScores: ValuationScores | null;
  growthScores: GrowthScores | null;
  setActiveTab: (tab: string) => void;
  setLoadingProgress: (progress: number) => void;
  handleSearch: (ticker: string, enableDeepResearch?: boolean) => Promise<void>;
  loadSavedAnalysis: (analysisData: any) => void;
  triggerDeepResearch: (ticker: string) => Promise<void>;
}

export interface StockProviderProps {
  children: ReactNode;
}
