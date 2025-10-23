
export interface StockInfo {
  name: string;
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketCap: number | null;
  image?: string;
  intrinsicValue?: number | null;
  sharesOutstanding?: number | null;
  originalIntrinsicValue?: number | null;
  originalCurrency?: string;
  reportedCurrency?: string;
  // Additional company information
  description?: string;
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
