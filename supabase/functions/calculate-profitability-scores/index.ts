import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Industry to Preset Mapping
const INDUSTRY_PRESET_MAP: Record<string, string> = {
  // Energy & Materials
  "Steel": "EnergyMaterials",
  "Silver": "EnergyMaterials",
  "Other Precious Metals": "EnergyMaterials",
  "Gold": "EnergyMaterials",
  "Copper": "EnergyMaterials",
  "Aluminum": "EnergyMaterials",
  "Paper, Lumber & Forest Products": "EnergyMaterials",
  "Industrial Materials": "EnergyMaterials",
  "Construction Materials": "EnergyMaterials",
  "Chemicals - Specialty": "EnergyMaterials",
  "Chemicals": "EnergyMaterials",
  "Agricultural Inputs": "EnergyMaterials",
  "Uranium": "EnergyMaterials",
  "Oil & Gas Refining & Marketing": "EnergyMaterials",
  "Oil & Gas Midstream": "EnergyMaterials",
  "Oil & Gas Integrated": "EnergyMaterials",
  "Oil & Gas Exploration & Production": "EnergyMaterials",
  "Oil & Gas Equipment & Services": "EnergyMaterials",
  "Oil & Gas Energy": "EnergyMaterials",
  "Oil & Gas Drilling": "EnergyMaterials",
  "Coal": "EnergyMaterials",
  "Agricultural - Commodities/Milling": "EnergyMaterials",

  // Utilities & Telecom
  "Telecommunications Services": "UtilitiesTelecom",
  "Solar": "UtilitiesTelecom",
  "Waste Management": "UtilitiesTelecom",
  "Environmental Services": "UtilitiesTelecom",
  "Industrial - Infrastructure Operations": "UtilitiesTelecom",
  "REIT - Specialty": "UtilitiesTelecom",
  "REIT - Retail": "UtilitiesTelecom",
  "REIT - Residential": "UtilitiesTelecom",
  "REIT - Office": "UtilitiesTelecom",
  "REIT - Mortgage": "UtilitiesTelecom",
  "REIT - Industrial": "UtilitiesTelecom",
  "REIT - Hotel & Motel": "UtilitiesTelecom",
  "REIT - Healthcare Facilities": "UtilitiesTelecom",
  "REIT - Diversified": "UtilitiesTelecom",
  "Real Estate - Services": "UtilitiesTelecom",
  "Real Estate - Diversified": "UtilitiesTelecom",
  "Real Estate - Development": "UtilitiesTelecom",
  "Real Estate - General": "UtilitiesTelecom",
  "Renewable Utilities": "UtilitiesTelecom",
  "Regulated Water": "UtilitiesTelecom",
  "Regulated Gas": "UtilitiesTelecom",
  "Regulated Electric": "UtilitiesTelecom",
  "Independent Power Producers": "UtilitiesTelecom",
  "Diversified Utilities": "UtilitiesTelecom",
  "General Utilities": "UtilitiesTelecom",

  // Software & Media
  "Internet Content & Information": "Software",
  "Publishing": "Software",
  "Broadcasting": "Software",
  "Advertising Agencies": "Software",
  "Entertainment": "Software",
  "Education & Training Services": "Software",
  "Consulting Services": "Software",
  "Staffing & Employment Services": "Software",
  "Security & Protection Services": "Software",
  "Specialty Business Services": "Software",
  "Information Technology Services": "Software",
  "Electronic Gaming & Multimedia": "Software",
  "Software - Services": "Software",
  "Software - Infrastructure": "Software",
  "Software - Application": "Software",
  "Media & Entertainment": "Software",

  // Retail & Logistics
  "Travel Lodging": "RetailLogistics",
  "Travel Services": "RetailLogistics",
  "Specialty Retail": "RetailLogistics",
  "Luxury Goods": "RetailLogistics",
  "Home Improvement": "RetailLogistics",
  "Department Stores": "RetailLogistics",
  "Personal Products & Services": "RetailLogistics",
  "Leisure": "RetailLogistics",
  "Gambling, Resorts & Casinos": "RetailLogistics",
  "Furnishings, Fixtures & Appliances": "RetailLogistics",
  "Restaurants": "RetailLogistics",
  "Auto - Dealerships": "RetailLogistics",
  "Apparel - Retail": "RetailLogistics",
  "Apparel - Manufacturers": "RetailLogistics",
  "Apparel - Footwear & Accessories": "RetailLogistics",

  // Industrials
  "Residential Construction": "Industrials",
  "Auto - Parts": "Industrials",
  "Auto - Manufacturers": "Industrials",
  "Auto - Recreational Vehicles": "Industrials",
  "Packaging & Containers": "Industrials",
  "Trucking": "Industrials",
  "Railroads": "Industrials",
  "Aerospace & Defense": "Industrials",
  "Marine Shipping": "Industrials",
  "Integrated Freight & Logistics": "Industrials",
  "Airlines, Airports & Air Services": "Industrials",
  "General Transportation": "Industrials",
  "Manufacturing - Tools & Accessories": "Industrials",
  "Manufacturing - Textiles": "Industrials",
  "Manufacturing - Miscellaneous": "Industrials",
  "Manufacturing - Metal Fabrication": "Industrials",
  "Industrial - Distribution": "Industrials",
  "Industrial - Specialties": "Industrials",
  "Industrial - Pollution & Treatment Controls": "Industrials",
  "Industrial - Machinery": "Industrials",
  "Industrial - Capital Goods": "Industrials",
  "Business Equipment & Supplies": "Industrials",
  "Rental & Leasing Services": "Industrials",
  "Engineering & Construction": "Industrials",
  "Construction": "Industrials",
  "Conglomerates": "Industrials",
  "Electrical Equipment & Parts": "Industrials",
  "Agricultural - Machinery": "Industrials",
  "Hardware, Equipment & Parts": "Industrials",
  "Computer Hardware": "Industrials",
  "Semiconductors": "Industrials",
  "Communication Equipment": "Industrials",
  "Technology Distributors": "Industrials",
  "Consumer Electronics": "Industrials",

  // Consumer Staples
  "Tobacco": "Staples",
  "Grocery Stores": "Staples",
  "Discount Stores": "Staples",
  "Household & Personal Products": "Staples",
  "Packaged Foods": "Staples",
  "Food Distribution": "Staples",
  "Food Confectioners": "Staples",
  "Agricultural Farm Products": "Staples",
  "Beverages - Wineries & Distilleries": "Staples",
  "Beverages - Non-Alcoholic": "Staples",
  "Beverages - Alcoholic": "Staples",

  // Banks & Financial
  "Shell Companies": "Banks",
  "Investment - Banking & Investment Services": "Banks",
  "Financial - Mortgages": "Banks",
  "Financial - Diversified": "Banks",
  "Financial - Data & Stock Exchanges": "Banks",
  "Financial - Credit Services": "Banks",
  "Financial - Conglomerates": "Banks",
  "Financial - Capital Markets": "Banks",
  "Banks - Regional": "Banks",
  "Banks - Diversified": "Banks",
  "Banks": "Banks",
  "Asset Management": "Banks",
  "Asset Management - Bonds": "Banks",
  "Asset Management - Income": "Banks",
  "Asset Management - Leveraged": "Banks",
  "Asset Management - Cryptocurrency": "Banks",
  "Asset Management - Global": "Banks",

  // Insurance
  "Insurance - Specialty": "Insurance",
  "Insurance - Reinsurance": "Insurance",
  "Insurance - Property & Casualty": "Insurance",
  "Insurance - Life": "Insurance",
  "Insurance - Diversified": "Insurance",
  "Insurance - Brokers": "Insurance",

  // Healthcare
  "Medical - Specialties": "Healthcare",
  "Medical - Pharmaceuticals": "Healthcare",
  "Medical - Instruments & Supplies": "Healthcare",
  "Medical - Healthcare Plans": "Healthcare",
  "Medical - Healthcare Information Services": "Healthcare",
  "Medical - Equipment & Services": "Healthcare",
  "Medical - Distribution": "Healthcare",
  "Medical - Diagnostics & Research": "Healthcare",
  "Medical - Devices": "Healthcare",
  "Medical - Care Facilities": "Healthcare",
  "Drug Manufacturers - Specialty & Generic": "Healthcare",
  "Drug Manufacturers - General": "Healthcare",
  "Biotechnology": "Healthcare",
};

function getPresetForIndustry(industry: string): string {
  console.log('🔍 Looking up preset for industry:', industry);
  
  // Direct match
  if (INDUSTRY_PRESET_MAP[industry]) {
    console.log('✅ Found direct match:', INDUSTRY_PRESET_MAP[industry]);
    return INDUSTRY_PRESET_MAP[industry];
  }
  
  // Case-insensitive match
  const lowerIndustry = industry.toLowerCase();
  const matchedKey = Object.keys(INDUSTRY_PRESET_MAP).find(
    key => key.toLowerCase() === lowerIndustry
  );
  
  if (matchedKey) {
    console.log('✅ Found case-insensitive match:', INDUSTRY_PRESET_MAP[matchedKey]);
    return INDUSTRY_PRESET_MAP[matchedKey];
  }
  
  // Default to Industrials if no match
  console.log('⚠️ No match found, defaulting to Industrials');
  return "Industrials";
}

// Scoring functions for Software/Media preset
function scoreSoftwareROIC(roic: number | null, wacc: number | null): { score: number; maxScore: number } {
  const maxScore = 6;
  if (roic === null) return { score: 0, maxScore };
  
  const spread = (wacc !== null && wacc !== undefined) ? roic - wacc : null;
  
  // ≥18% & Spread≥8pp → 6
  if (roic >= 18 && spread !== null && spread >= 8) return { score: 6, maxScore };
  // ≥15% & ≥5pp → 5
  if (roic >= 15 && spread !== null && spread >= 5) return { score: 5, maxScore };
  // ≥12% & >WACC → 4
  if (roic >= 12 && spread !== null && spread > 0) return { score: 4, maxScore };
  // ≥9% → 2
  if (roic >= 9) return { score: 2, maxScore };
  // sonst → 0
  return { score: 0, maxScore };
}

function scoreSoftwareOperatingMargin(opMargin: number | null): { score: number; maxScore: number } {
  const maxScore = 4;
  if (opMargin === null) return { score: 0, maxScore };
  
  // ≥22% → 4
  if (opMargin >= 22) return { score: 4, maxScore };
  // 18–<22 → 3
  if (opMargin >= 18) return { score: 3, maxScore };
  // 14–<18 → 2
  if (opMargin >= 14) return { score: 2, maxScore };
  // 10–<14 → 1
  if (opMargin >= 10) return { score: 1, maxScore };
  // <10 → 0
  return { score: 0, maxScore };
}

function scoreSoftwareNetMargin(netMargin: number | null): { score: number; maxScore: number } {
  const maxScore = 3;
  if (netMargin === null) return { score: 0, maxScore };
  
  // ≥18% → 3
  if (netMargin >= 18) return { score: 3, maxScore };
  // 14–<18 → 2
  if (netMargin >= 14) return { score: 2, maxScore };
  // 10–<14 → 1
  if (netMargin >= 10) return { score: 1, maxScore };
  // <10 → 0
  return { score: 0, maxScore };
}

function scoreSoftwareYears(profitableYears: number | null): { score: number; maxScore: number } {
  const maxScore = 3;
  if (profitableYears === null) return { score: 0, maxScore };
  
  // 10 → 3
  if (profitableYears === 10) return { score: 3, maxScore };
  // 9 → 2
  if (profitableYears === 9) return { score: 2, maxScore };
  // 8 → 1
  if (profitableYears === 8) return { score: 1, maxScore };
  // ≤7 → 0
  return { score: 0, maxScore };
}

function scoreSoftwareROE(roe: number | null): { score: number; maxScore: number } {
  const maxScore = 2;
  if (roe === null) return { score: 0, maxScore };
  
  // ≥18% → 2
  if (roe >= 18) return { score: 2, maxScore };
  // 12–<18 → 1
  if (roe >= 12) return { score: 1, maxScore };
  // <12 → 0
  return { score: 0, maxScore };
}

function scoreSoftwareROA(roa: number | null): { score: number; maxScore: number } {
  const maxScore = 2;
  if (roa === null) return { score: 0, maxScore };
  
  // ≥10% → 2
  if (roa >= 10) return { score: 2, maxScore };
  // <10 → 0
  return { score: 0, maxScore };
}

// Main scoring function
function calculateScores(preset: string, metrics: any) {
  console.log('📊 Calculating scores for preset:', preset);
  console.log('📊 Input metrics:', JSON.stringify(metrics, null, 2));
  
  if (preset === 'Software') {
    const roicResult = scoreSoftwareROIC(metrics.roic, metrics.wacc);
    const opMarginResult = scoreSoftwareOperatingMargin(metrics.operatingMargin);
    const netMarginResult = scoreSoftwareNetMargin(metrics.netMargin);
    const yearsResult = scoreSoftwareYears(metrics.profitableYears);
    const roeResult = scoreSoftwareROE(metrics.roe);
    const roaResult = scoreSoftwareROA(metrics.roa);
    
    const totalScore = roicResult.score + opMarginResult.score + netMarginResult.score + 
                      yearsResult.score + roeResult.score + roaResult.score;
    const maxTotalScore = 20; // Sum of all maxScores
    
    return {
      roic: roicResult,
      operatingMargin: opMarginResult,
      netMargin: netMarginResult,
      years: yearsResult,
      roe: roeResult,
      roa: roaResult,
      totalScore,
      maxTotalScore,
      percentage: (totalScore / maxTotalScore) * 100
    };
  }
  
  // Default/fallback for other presets (to be implemented)
  return {
    error: 'Preset not yet implemented',
    preset
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, metrics } = await req.json();

    console.log('📊 Calculate Profitability Scores request:', { industry, metrics });

    if (!industry) {
      throw new Error('Industry is required');
    }

    if (!metrics) {
      throw new Error('Metrics are required');
    }

    // Get preset for industry
    const preset = getPresetForIndustry(industry);
    console.log(`✅ Industry "${industry}" mapped to preset "${preset}"`);

    // Calculate scores
    const scores = calculateScores(preset, metrics);
    console.log('✅ Scores calculated:', JSON.stringify(scores, null, 2));

    return new Response(
      JSON.stringify({
        industry,
        preset,
        scores
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in calculate-profitability-scores:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to calculate profitability scores'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
