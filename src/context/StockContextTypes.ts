
import { ReactNode } from 'react';
import { PredictabilityResult } from '@/services/PredictabilityStarsService';

export interface HistoricalDataItem {
  year: string;
  value: number;
  originalValue?: number;
  originalCurrency?: string;
}

export interface FinancialMetricsData {
  eps?: any;
  roe?: any;
  netMargin?: any;
  roic?: any;
  debtToAssets?: any;
  interestCoverage?: any;
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
  };
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
  predictabilityStars: PredictabilityResult | null;
  setActiveTab: (tab: string) => void;
  setLoadingProgress: (progress: number) => void;
  handleSearch: (ticker: string) => Promise<void>;
  loadSavedAnalysis: (analysisData: any) => void;
}

export interface StockProviderProps {
  children: ReactNode;
}
