import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValuationInput {
  // Intrinsic Value Discount (max 5 points)
  fairValuePerShare: number | null;
  currentPrice: number;
  sector: string;
  
  // Peter Lynch Discount (max 3 points)
  peterLynchFairValue: number | null;
  
  // P/E Ratio (max 3 points)
  currentPE: number | null;
  industryPE: number | null;
  
  // Dividend Yield (max 4 points)
  dividendYield: number | null;
  payoutRatio: number | null;
  dividendStreak: number;
  dividendCAGR3Y: number | null;
  dividendCAGR5Y: number | null;
  dividendCAGR10Y: number | null;
  
  // Price to Book (max 3 points)
  bookValuePerShare: number | null;
  
  // Price to Cash Flow (max 4 points)
  fcfPerShare: number | null;
  historicalFCF: Array<{ year: string; value: number }>;
}

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface ValuationScoresResult {
  scores: {
    intrinsicValueDiscount: ScoreResult;
    peterLynchDiscount: ScoreResult;
    peRatio: ScoreResult;
    dividendYield: ScoreResult;
    priceToBook: ScoreResult;
    priceToCashFlow: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

// Get MoS target based on sector
function getMoSTarget(sector: string): number {
  const sectorLower = sector?.toLowerCase() || '';
  
  if (sectorLower.includes('tech') || sectorLower.includes('software') || sectorLower.includes('internet')) {
    return 30; // High growth, high uncertainty
  }
  if (sectorLower.includes('healthcare') || sectorLower.includes('biotech') || sectorLower.includes('pharma')) {
    return 25;
  }
  if (sectorLower.includes('financial') || sectorLower.includes('bank') || sectorLower.includes('insurance')) {
    return 20;
  }
  if (sectorLower.includes('utility') || sectorLower.includes('utilities') || sectorLower.includes('consumer staples')) {
    return 15; // Defensive, stable
  }
  
  return 20; // Default
}

// Calculate Intrinsic Value Discount Score (max 5 points)
function calculateIntrinsicValueScore(fairValue: number | null, currentPrice: number, sector: string): ScoreResult {
  if (!fairValue || fairValue <= 0) {
    return { score: 0, maxScore: 5 };
  }
  
  const discount = ((fairValue - currentPrice) / currentPrice) * 100;
  const target = getMoSTarget(sector);
  
  let score = 0;
  if (discount >= target) score = 5;
  else if (discount >= 0.67 * target) score = 3;
  else if (discount >= 0.33 * target) score = 2;
  else if (discount >= 0) score = 1;
  
  return { score, maxScore: 5 };
}

// Calculate Peter Lynch Discount Score (max 3 points)
function calculatePeterLynchScore(peterLynchFairValue: number | null, currentPrice: number): ScoreResult {
  if (!peterLynchFairValue || peterLynchFairValue <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  const ratio = currentPrice / peterLynchFairValue;
  
  let score = 0;
  if (ratio <= 0.75) score = 3;
  else if (ratio <= 0.95) score = 2;
  else if (ratio <= 1.10) score = 1;
  
  return { score, maxScore: 3 };
}

// Calculate P/E Ratio Score (max 3 points)
function calculatePERatioScore(currentPE: number | null, industryPE: number | null): ScoreResult {
  if (!currentPE || currentPE <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  // Absolute score (0-1.5 points)
  let absoluteScore = 0;
  if (currentPE <= 10) absoluteScore = 1.5;
  else if (currentPE <= 15) absoluteScore = 1.0;
  else if (currentPE <= 20) absoluteScore = 0.5;
  
  // Relative score (0-1.5 points)
  let relativeScore = 0;
  if (industryPE && industryPE > 0) {
    const peRel = currentPE / industryPE;
    if (peRel <= 0.80) relativeScore = 1.5;
    else if (peRel <= 0.95) relativeScore = 1.0;
    else if (peRel <= 1.10) relativeScore = 1.0;
    else if (peRel <= 1.30) relativeScore = 0.5;
  }
  
  const totalScore = absoluteScore + relativeScore;
  return { score: totalScore, maxScore: 3 };
}

// Calculate Dividend Yield Score (max 4 points)
function calculateDividendScore(
  dividendYield: number | null,
  payoutRatio: number | null,
  dividendStreak: number,
  cagr3y: number | null,
  cagr5y: number | null,
  cagr10y: number | null
): ScoreResult {
  if (!dividendYield || dividendYield <= 0) {
    return { score: 0, maxScore: 4 };
  }
  
  // Payout ratio score (0-2 points)
  let payoutScore = 0;
  if (payoutRatio !== null && payoutRatio >= 0) {
    if (payoutRatio >= 30 && payoutRatio <= 70) payoutScore = 2;
    else if (payoutRatio >= 20 && payoutRatio <= 80) payoutScore = 1.5;
    else if (payoutRatio < 90) payoutScore = 1;
  }
  
  // Growth score (0-2 points)
  const medianCAGR = [cagr3y, cagr5y, cagr10y]
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)[1] || null;
  
  let growthScore = 0;
  if (dividendStreak >= 10 && medianCAGR !== null && medianCAGR >= 8) {
    growthScore = 2;
  } else if (dividendStreak >= 5 && medianCAGR !== null && medianCAGR >= 5) {
    growthScore = 1.5;
  } else if (dividendStreak >= 3 && medianCAGR !== null && medianCAGR >= 3) {
    growthScore = 1;
  } else if (dividendStreak >= 1) {
    growthScore = 0.5;
  }
  
  const totalScore = payoutScore + growthScore;
  return { score: totalScore, maxScore: 4 };
}

// Calculate Price to Book Score (max 3 points)
function calculatePriceToBookScore(bookValuePerShare: number | null, currentPrice: number): ScoreResult {
  if (!bookValuePerShare || bookValuePerShare <= 0) {
    return { score: 0, maxScore: 3 };
  }
  
  const pb = currentPrice / bookValuePerShare;
  
  let score = 0;
  if (pb <= 1.5) score = 3;
  else if (pb <= 2.5) score = 2;
  else if (pb <= 3.5) score = 1;
  
  return { score, maxScore: 3 };
}

// Calculate Price to Cash Flow Score (max 4 points)
function calculatePriceToCashFlowScore(
  fcfPerShare: number | null,
  currentPrice: number,
  historicalFCF: Array<{ year: string; value: number }>
): ScoreResult {
  if (!fcfPerShare || fcfPerShare <= 0) {
    return { score: 0, maxScore: 4 };
  }
  
  // Check if FCF was negative in 2 out of last 3 years
  if (historicalFCF && historicalFCF.length >= 3) {
    const lastThreeYears = historicalFCF.slice(0, 3);
    const negativeCount = lastThreeYears.filter(item => item.value < 0).length;
    if (negativeCount >= 2) {
      return { score: 0, maxScore: 4 };
    }
  }
  
  const pcf = currentPrice / fcfPerShare;
  
  let score = 0;
  if (pcf <= 12) score = 4;
  else if (pcf <= 16) score = 3;
  else if (pcf <= 20) score = 2;
  else if (pcf <= 25) score = 1;
  
  return { score, maxScore: 4 };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: ValuationInput = await req.json();
    
    // Calculate individual scores
    const intrinsicValueDiscount = calculateIntrinsicValueScore(
      input.fairValuePerShare,
      input.currentPrice,
      input.sector
    );
    
    const peterLynchDiscount = calculatePeterLynchScore(
      input.peterLynchFairValue,
      input.currentPrice
    );
    
    const peRatio = calculatePERatioScore(
      input.currentPE,
      input.industryPE
    );
    
    const dividendYield = calculateDividendScore(
      input.dividendYield,
      input.payoutRatio,
      input.dividendStreak,
      input.dividendCAGR3Y,
      input.dividendCAGR5Y,
      input.dividendCAGR10Y
    );
    
    const priceToBook = calculatePriceToBookScore(
      input.bookValuePerShare,
      input.currentPrice
    );
    
    const priceToCashFlow = calculatePriceToCashFlowScore(
      input.fcfPerShare,
      input.currentPrice,
      input.historicalFCF || []
    );
    
    // Calculate total score
    const maxTotalScore = 22; // Sum of all max scores
    const totalScore = 
      intrinsicValueDiscount.score +
      peterLynchDiscount.score +
      peRatio.score +
      dividendYield.score +
      priceToBook.score +
      priceToCashFlow.score;
    
    const result: ValuationScoresResult = {
      scores: {
        intrinsicValueDiscount,
        peterLynchDiscount,
        peRatio,
        dividendYield,
        priceToBook,
        priceToCashFlow,
      },
      totalScore,
      maxTotalScore,
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error calculating valuation scores:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  }
});
