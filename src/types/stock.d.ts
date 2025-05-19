
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
  originalIntrinsicValue?: number | null;
  originalCurrency?: string;
  reportedCurrency?: string;
}
