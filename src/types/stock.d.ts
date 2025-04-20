
export interface StockInfo {
  name: string;
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketCap: number | null;
  intrinsicValue?: number | null;
  sharesOutstanding?: number | null;
}

export type MarginOfSafetyStatus = "pass" | "warning" | "fail";

export interface OverallRatingData {
  overall: "buy" | "watch" | "avoid";
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  buffettScore: number;
  marginOfSafety: { 
    value: number; 
    status: MarginOfSafetyStatus;
  };
  bestBuyPrice: number | null;
  currentPrice: number | null;
  currency: string;
  intrinsicValue: number | null;
  targetMarginOfSafety: number;
  originalIntrinsicValue?: number | null;
  originalBestBuyPrice?: number | null;
  originalPrice?: number | null;
  originalCurrency?: string;
}
