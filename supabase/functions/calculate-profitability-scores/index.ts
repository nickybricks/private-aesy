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

// Software/Media scoring functions
function scoreSoftwareROIC(roic: number | null, spread: number | null): number {
  if (roic === null) return 0;
  if (roic >= 18 && spread !== null && spread >= 8) return 6;
  if (roic >= 15 && spread !== null && spread >= 5) return 5;
  if (roic >= 12 && spread !== null && spread > 0) return 4;
  if (roic >= 9) return 2;
  return 0;
}

function scoreSoftwareOperatingMargin(value: number | null): number {
  if (value === null) return 0;
  if (value >= 22) return 4;
  if (value >= 18) return 3;
  if (value >= 14) return 2;
  if (value >= 10) return 1;
  return 0;
}

function scoreSoftwareNetMargin(value: number | null): number {
  if (value === null) return 0;
  if (value >= 18) return 3;
  if (value >= 14) return 2;
  if (value >= 10) return 1;
  return 0;
}

function scoreSoftwareYears(years: number): number {
  if (years === 10) return 3;
  if (years === 9) return 2;
  if (years === 8) return 1;
  return 0;
}

function scoreSoftwareROE(value: number | null): number {
  if (value === null) return 0;
  if (value >= 18) return 2;
  if (value >= 12) return 1;
  return 0;
}

function scoreSoftwareROA(value: number | null): number {
  if (value === null) return 0;
  if (value >= 10) return 2;
  if (value >= 8) return 1;
  return 0;
}

// Industrials/Capital Goods scoring functions
function scoreIndustrialsROIC(roic: number | null, spread: number | null): number {
  if (roic === null) return 0;
  if (roic >= 14 && spread !== null && spread >= 5) return 5;
  if (roic >= 12 && spread !== null && spread >= 3) return 4;
  if (roic >= 10 && spread !== null && spread > 0) return 3;
  if (roic >= 8) return 1;
  return 0;
}

function scoreIndustrialsOperatingMargin(value: number | null): number {
  if (value === null) return 0;
  if (value >= 16) return 4;
  if (value >= 12) return 3;
  if (value >= 9) return 2;
  if (value >= 6) return 1;
  return 0;
}

function scoreIndustrialsNetMargin(value: number | null): number {
  if (value === null) return 0;
  if (value >= 10) return 2;
  if (value >= 7) return 1;
  return 0;
}

function scoreIndustrialsYears(years: number): number {
  if (years === 10) return 4;
  if (years === 9) return 3;
  if (years === 8) return 2;
  if (years === 7) return 1;
  return 0;
}

function scoreIndustrialsROE(value: number | null): number {
  if (value === null) return 0;
  if (value >= 14) return 3;
  if (value >= 9) return 2;
  return 0;
}

function scoreIndustrialsROA(value: number | null): number {
  if (value === null) return 0;
  if (value >= 7) return 2;
  if (value >= 5) return 1;
  return 0;
}

// Get scoring logic based on preset
function getScoringLogic(preset: string) {
  const baseLogic = {
    preset,
    maxTotalScore: 20
  };

  switch (preset) {
    case "Software":
      return {
        ...baseLogic,
        weights: {
          roic: 6,
          operatingMargin: 4,
          years: 3,
          netMargin: 3,
          roe: 2,
          roa: 2
        },
        thresholds: {
          roic: [
            { min: 18, spread: 8, score: 6 },
            { min: 15, spread: 5, score: 5 },
            { min: 12, spread: 0, score: 4 },
            { min: 9, score: 2 }
          ],
          operatingMargin: [
            { min: 22, score: 4 },
            { min: 18, score: 3 },
            { min: 14, score: 2 },
            { min: 10, score: 1 }
          ],
          netMargin: [
            { min: 18, score: 3 },
            { min: 14, score: 2 },
            { min: 10, score: 1 }
          ],
          years: [
            { value: 10, score: 3 },
            { value: 9, score: 2 },
            { value: 8, score: 1 }
          ],
          roe: [
            { min: 18, score: 2 },
            { min: 12, score: 1 }
          ],
          roa: [
            { min: 10, score: 2 },
            { min: 8, score: 1 }
          ]
        }
      };
    
    case "Industrials":
      return {
        ...baseLogic,
        weights: {
          roic: 5,
          operatingMargin: 4,
          years: 4,
          netMargin: 2,
          roe: 3,
          roa: 2
        },
        thresholds: {
          roic: [
            { min: 14, spread: 5, score: 5 },
            { min: 12, spread: 3, score: 4 },
            { min: 10, spread: 0, score: 3 },
            { min: 8, score: 1 }
          ],
          operatingMargin: [
            { min: 16, score: 4 },
            { min: 12, score: 3 },
            { min: 9, score: 2 },
            { min: 6, score: 1 }
          ],
          netMargin: [
            { min: 10, score: 2 },
            { min: 7, score: 1 }
          ],
          years: [
            { value: 10, score: 4 },
            { value: 9, score: 3 },
            { value: 8, score: 2 },
            { value: 7, score: 1 }
          ],
          roe: [
            { min: 14, score: 3 },
            { min: 9, score: 2 }
          ],
          roa: [
            { min: 7, score: 2 },
            { min: 5, score: 1 }
          ]
        }
      };
    
    default:
      return {
        ...baseLogic,
        message: "Default scoring logic - to be customized per preset"
      };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry } = await req.json();

    console.log('📊 Calculate Profitability Scores request:', { industry });

    if (!industry) {
      throw new Error('Industry is required');
    }

    // Get preset for industry
    const preset = getPresetForIndustry(industry);

    console.log(`✅ Industry "${industry}" mapped to preset "${preset}"`);

    // Get scoring logic based on preset
    const scoringLogic = getScoringLogic(preset);

    return new Response(
      JSON.stringify({
        industry,
        preset,
        scoringLogic
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
