
import { ReactNode } from 'react';

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
  originalIntrinsicValue?: number | null;
  originalBestBuyPrice?: number | null;
  originalPrice?: number | null;
  originalCurrency?: string;
}

export interface DCFData {
  ufcf: number[];
  wacc: number;
  presentTerminalValue: number;
  netDebt: number;
  dilutedSharesOutstanding: number;
  currency: string;
  intrinsicValue: number;
}

export interface StockContextType {
  isLoading: boolean;
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
  setActiveTab: (tab: string) => void;
  handleSearch: (ticker: string) => Promise<void>;
}

export interface StockProviderProps {
  children: ReactNode;
}
