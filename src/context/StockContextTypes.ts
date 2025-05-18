
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
  dcfData?: DCFData;  // Add dcfData property to OverallRatingData
}

export interface DCFData {
  // Eingabeparameter
  ufcf: number[];                     // Unlevered Free Cash Flows für 5+ Jahre
  wacc: number;                       // Weighted Average Cost of Capital (%)
  presentTerminalValue: number;       // Bereits abgezinster Terminal Value
  netDebt: number;                    // Nettoverschuldung (Total Debt - Cash)
  dilutedSharesOutstanding: number;   // Anzahl ausstehender Aktien
  currency: string;                   // Währung der Berechnungen
  
  // Berechnete Werte
  pvUfcfs: number[];                  // Present Values der einzelnen UFCFs
  sumPvUfcfs: number;                 // Summe aller PVs der UFCFs
  enterpriseValue: number;            // Unternehmenswert (PV Summe + Terminal Value)
  equityValue: number;                // Eigenkapitalwert (Enterprise Value - Nettoverschuldung)
  intrinsicValue: number;             // Berechneter innerer Wert pro Aktie
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
