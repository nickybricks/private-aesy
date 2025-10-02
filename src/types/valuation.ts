export type ValuationMode = 'EPS_WO_NRI' | 'FCF' | 'ADJUSTED_DIVIDEND';

export interface ValuationAssumptions {
  discountRatePct: number;
  growthYears: number;
  growthRatePct: number;
  terminalYears: number;
  terminalRatePct: number;
  tangibleBookPerShare: number;
  includeTangibleBook: boolean;
  predictability: 'low' | 'medium' | 'high';
}

export interface ValuationComponents {
  startValuePerShare: number;
  pvPhase1: number;
  pvPhase2: number;
  tangibleBookAdded: number;
}

export interface ValuationResponse {
  ticker: string;
  price: number;
  mode: ValuationMode;
  fairValuePerShare: number;
  marginOfSafetyPct: number;
  assumptions: ValuationAssumptions;
  components: ValuationComponents;
  asOf: string;
}

export interface ValuationError {
  error: 'INSUFFICIENT_DATA' | 'INVALID_MODE' | 'API_ERROR';
  details: string;
}
