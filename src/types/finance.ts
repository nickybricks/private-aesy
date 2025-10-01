export type Exchange = "NASDAQ" | "NYSE" | "LSE" | "FWB" | string;

export interface PricePoint { 
  t: string; 
  close: number; 
}

export interface Quote {
  ticker: string; 
  companyName: string; 
  exchange: Exchange; 
  currency: string;
  price: number; 
  changeAbs: number; 
  changePct: number;
  afterHours?: { 
    price: number; 
    changeAbs: number; 
    changePct: number; 
    asOf: string; 
  };
  dayRange: { low: number; high: number };
  week52Range: { low: number; high: number };
  previousClose: number; 
  open: number; 
  beta?: number;
}

export interface KeyMetrics {
  marketCap: number; 
  volume: number; 
  sharesOut: number; 
  epsTTM: number;
  peTTM: number; 
  forwardPE?: number; 
  dividendPerShare?: number; 
  dividendYield?: number;
  exDividendDate?: string; 
  analysts?: { 
    rating: "Buy" | "Hold" | "Sell"; 
    priceTarget?: number 
  };
  earningsDate?: string;
}

export interface Predictability { 
  stars: 0 | 1 | 2 | 3 | 4 | 5; 
  rationale: string[]; 
}

export interface Financials {
  revenueTTM: number; 
  netIncomeTTM: number; 
  fcfTTM?: number;
  quarterly?: Array<{ 
    period: string; 
    revenue: number; 
    netIncome: number; 
    eps: number; 
  }>;
  yearly?: Array<{ 
    year: number; 
    revenue: number; 
    netIncome: number; 
    eps: number; 
  }>;
}

export interface PeterLynchInputs { 
  epsTTM: number; 
  growthPct: number; 
  fairPE?: number; 
}

export interface PeterLynchSeries { 
  date: string; 
  price: number; 
  fairValue: number; 
}

export interface BuffettAnalysis {
  detail: string[];
  twoPillars: { 
    quality: number; 
    price: number; 
    comment: string; 
  };
  criteria: Array<{ 
    name: string; 
    score: number; 
    comment: string; 
  }>;
  marginOfSafetyPct: number;
  idealBuyPrice: number;
}
