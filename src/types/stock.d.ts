
export interface StockInfo {
  name: string;
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;           // Stock price currency (exchange-based, e.g., USD for NYSE)
  reportedCurrency?: string;  // Financial statements currency (company-based, e.g., JPY for Toyota)
  marketCap: number | null;
  image?: string;
  intrinsicValue?: number | null;
  sharesOutstanding?: number | null;
  originalIntrinsicValue?: number | null;
  originalCurrency?: string;
  // Additional company information
  ceo?: string;
  employees?: number;
  foundedYear?: string;
  website?: string;
  sector?: string;
  industry?: string;
  country?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ipoDate?: string;
  isin?: string;
}
