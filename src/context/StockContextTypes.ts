
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
  reportedCurrency: string;  // Required
  originalIntrinsicValue: number | null;
  originalBestBuyPrice: number | null;
  originalPrice: number | null;
  originalCurrency?: string;
}

export interface DCFData {
  ufcf: number[];  // Unlevered Free Cash Flows for 5 years
  wacc: number;    // Weighted Average Cost of Capital (%)
  presentTerminalValue: number;  // Present value of terminal value
  netDebt: number; // Net debt (total debt - cash)
  dilutedSharesOutstanding: number; // Number of outstanding shares
  currency: string; // Currency of the calculations
  intrinsicValue: number; // Calculated intrinsic value per share
  // New fields for detailed DCF calculations
  pvUfcfs: number[]; // Present values of each UFCF
  sumPvUfcfs: number; // Sum of all present values of UFCFs
  enterpriseValue: number; // Enterprise value (sum PVs + terminal value)
  equityValue: number; // Equity value (enterprise value - net debt)
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
