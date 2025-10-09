import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Industry to Preset Mapping
const industryToPreset: Record<string, string> = {
  // Construction & Infrastructure
  "Residential Construction": "Industrials",
  "Engineering & Construction": "Industrials",
  "Construction": "Industrials",
  
  // Automotive
  "Auto - Parts": "Industrials",
  "Auto - Manufacturers": "Industrials",
  "Auto - Recreational Vehicles": "Industrials",
  
  // Transportation & Logistics
  "Packaging & Containers": "Industrials",
  "Trucking": "Industrials",
  "Railroads": "Industrials",
  "Marine Shipping": "Industrials",
  "Integrated Freight & Logistics": "Industrials",
  "Airlines": "Industrials",
  "Airports & Air Services": "Industrials",
  "General Transportation": "Industrials",
  
  // Defense & Aerospace
  "Aerospace & Defense": "Industrials",
  
  // Manufacturing
  "Manufacturing - Tools & Accessories": "Industrials",
  "Manufacturing - Textiles": "Industrials",
  "Manufacturing - Miscellaneous": "Industrials",
  "Manufacturing - Metal Fabrication": "Industrials",
  
  // Industrial Equipment & Services
  "Industrial - Distribution": "Industrials",
  "Industrial - Specialties": "Industrials",
  "Industrial - Pollution & Treatment Controls": "Industrials",
  "Industrial - Machinery": "Industrials",
  "Industrial - Capital Goods": "Industrials",
  "Business Equipment & Supplies": "Industrials",
  "Rental & Leasing Services": "Industrials",
  "Electrical Equipment & Parts": "Industrials",
  "Agricultural - Machinery": "Industrials",
  
  // Technology Hardware
  "Hardware, Equipment & Parts": "Industrials",
  "Computer Hardware": "Industrials",
  "Semiconductors": "Industrials",
  "Communication Equipment": "Industrials",
  "Technology Distributors": "Industrials",
  "Consumer Electronics": "Industrials",
  
  // Conglomerates
  "Conglomerates": "Industrials",
  
  // Software, Media, IP-light (asset-leicht)
  "Software": "Software",
  "Software - Application": "Software",
  "Software - Infrastructure": "Software",
  "Internet Content & Information": "Software",
  "Entertainment": "Software",
  "Broadcasting": "Software",
  "Publishing": "Software",
  "Electronic Gaming & Multimedia": "Software",
};

interface MetricsInput {
  industry: string;
  roic: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  roa: number | null;
  wacc: number | null;
  profitableYears?: number;
  totalYears?: number;
}

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface ScoringResponse {
  preset: string;
  scores: {
    roic: ScoreResult;
    operatingMargin: ScoreResult;
    netMargin: ScoreResult;
    years: ScoreResult;
    roe: ScoreResult;
    roa: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

// Industrials Scoring Logic
function scoreIndustrialsROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 5 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 14 && spread !== null && spread >= 5) return { score: 5, maxScore: 5 };
  if (roic >= 12 && spread !== null && spread >= 3) return { score: 4, maxScore: 5 };
  if (roic >= 10 && wacc !== null && roic > wacc) return { score: 3, maxScore: 5 };
  if (roic >= 8) return { score: 1, maxScore: 5 };
  
  return { score: 0, maxScore: 5 };
}

function scoreIndustrialsOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 4 };
  
  if (margin >= 16) return { score: 4, maxScore: 4 };
  if (margin >= 12) return { score: 3, maxScore: 4 };
  if (margin >= 9) return { score: 2, maxScore: 4 };
  if (margin >= 6) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreIndustrialsNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 2 };
  
  // Handle decimal values (0.239 = 23.9%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 10) return { score: 2, maxScore: 2 };
  if (percentValue >= 7) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreIndustrialsYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 4 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 4, maxScore: 4 };
  if (profitableYears === 9 && totalYears === 10) return { score: 3, maxScore: 4 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 2, maxScore: 4 };
  if (profitableYears === 7 && totalYears >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreIndustrialsROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 3 };
  
  if (roe >= 14) return { score: 3, maxScore: 3 };
  if (roe >= 9) return { score: 2, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreIndustrialsROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 7) return { score: 2, maxScore: 2 };
  if (roa >= 5) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

// Software Scoring Logic
function scoreSoftwareROIC(roic: number | null, wacc: number | null): ScoreResult {
  if (roic === null) return { score: 0, maxScore: 6 };
  
  const spread = wacc !== null ? roic - wacc : null;
  
  if (roic >= 18 && spread !== null && spread >= 8) return { score: 6, maxScore: 6 };
  if (roic >= 15 && spread !== null && spread >= 5) return { score: 5, maxScore: 6 };
  if (roic >= 12 && wacc !== null && roic > wacc) return { score: 4, maxScore: 6 };
  if (roic >= 9) return { score: 2, maxScore: 6 };
  
  return { score: 0, maxScore: 6 };
}

function scoreSoftwareOperatingMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 4 };
  
  if (margin >= 22) return { score: 4, maxScore: 4 };
  if (margin >= 18) return { score: 3, maxScore: 4 };
  if (margin >= 14) return { score: 2, maxScore: 4 };
  if (margin >= 10) return { score: 1, maxScore: 4 };
  
  return { score: 0, maxScore: 4 };
}

function scoreSoftwareNetMargin(margin: number | null): ScoreResult {
  if (margin === null) return { score: 0, maxScore: 3 };
  
  // Handle decimal values (0.18 = 18%)
  const percentValue = margin < 1 ? margin * 100 : margin;
  
  if (percentValue >= 18) return { score: 3, maxScore: 3 };
  if (percentValue >= 14) return { score: 2, maxScore: 3 };
  if (percentValue >= 10) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreSoftwareYears(profitableYears: number, totalYears: number): ScoreResult {
  if (totalYears === 0) return { score: 0, maxScore: 3 };
  
  if (profitableYears === 10 && totalYears === 10) return { score: 3, maxScore: 3 };
  if (profitableYears === 9 && totalYears === 10) return { score: 2, maxScore: 3 };
  if (profitableYears === 8 && totalYears >= 10) return { score: 1, maxScore: 3 };
  
  return { score: 0, maxScore: 3 };
}

function scoreSoftwareROE(roe: number | null): ScoreResult {
  if (roe === null) return { score: 0, maxScore: 2 };
  
  if (roe >= 18) return { score: 2, maxScore: 2 };
  if (roe >= 12) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function scoreSoftwareROA(roa: number | null): ScoreResult {
  if (roa === null) return { score: 0, maxScore: 2 };
  
  if (roa >= 10) return { score: 2, maxScore: 2 };
  if (roa >= 8) return { score: 1, maxScore: 2 };
  
  return { score: 0, maxScore: 2 };
}

function calculateScores(preset: string, metrics: MetricsInput): ScoringResponse {
  let scores: ScoringResponse['scores'];
  
  if (preset === "Industrials") {
    scores = {
      roic: scoreIndustrialsROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreIndustrialsOperatingMargin(metrics.operatingMargin),
      netMargin: scoreIndustrialsNetMargin(metrics.netMargin),
      years: scoreIndustrialsYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreIndustrialsROE(metrics.roe),
      roa: scoreIndustrialsROA(metrics.roa),
    };
  } else if (preset === "Software") {
    scores = {
      roic: scoreSoftwareROIC(metrics.roic, metrics.wacc),
      operatingMargin: scoreSoftwareOperatingMargin(metrics.operatingMargin),
      netMargin: scoreSoftwareNetMargin(metrics.netMargin),
      years: scoreSoftwareYears(metrics.profitableYears || 0, metrics.totalYears || 0),
      roe: scoreSoftwareROE(metrics.roe),
      roa: scoreSoftwareROA(metrics.roa),
    };
  } else {
    // Default/Fallback scoring
    scores = {
      roic: { score: 0, maxScore: 6 },
      operatingMargin: { score: 0, maxScore: 4 },
      netMargin: { score: 0, maxScore: 3 },
      years: { score: 0, maxScore: 3 },
      roe: { score: 0, maxScore: 2 },
      roa: { score: 0, maxScore: 1 },
    };
  }
  
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
  const maxTotalScore = Object.values(scores).reduce((sum, s) => sum + s.maxScore, 0);
  
  return {
    preset,
    scores,
    totalScore,
    maxTotalScore,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: MetricsInput = await req.json();
    
    console.log('Received input:', { 
      industry: input.industry,
      roic: input.roic,
      operatingMargin: input.operatingMargin,
      netMargin: input.netMargin,
      roe: input.roe,
      roa: input.roa,
      wacc: input.wacc
    });
    
    // Map industry to preset
    const preset = industryToPreset[input.industry] || "Default";
    
    console.log('Mapped to preset:', preset);
    
    // Calculate scores
    const result = calculateScores(preset, input);
    
    console.log('Calculated scores:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-profitability-scores:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
