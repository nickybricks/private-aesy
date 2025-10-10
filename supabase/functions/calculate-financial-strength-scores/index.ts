import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Industry to Preset Mapping (same as profitability scoring)
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
  "Airlines, Airports & Air Services": "Industrials",
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
  "Software - Services": "Software",
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
  "Media & Entertainment": "Software",
  
  // Staples (defensiv)
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
  
  // Retail Logistics (margenschwach, WC-lastig)
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
  
  // UtilitiesTelecom (reguliert)
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
  
  // EnergyMaterials (Commodity-Zykliker)
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
  
  // Healthcare (Pharma/Biotech/Medtech)
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
  
  // Financials - Banks
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
  
  // Financials - Insurance
  "Insurance - Specialty": "Insurance",
  "Insurance - Reinsurance": "Insurance",
  "Insurance - Property & Casualty": "Insurance",
  "Insurance - Life": "Insurance",
  "Insurance - Diversified": "Insurance",
  "Insurance - Brokers": "Insurance",
};

interface MetricsInput {
  industry: string;
  netDebtToEbitda: number | null;
  interestCoverage: number | null;
  debtToAssets: number | null;
  currentRatio: number | null;
}

interface ScoreResult {
  score: number;
  maxScore: number;
}

interface ScoringResponse {
  preset: string;
  scores: {
    netDebtToEbitda: ScoreResult;
    interestCoverage: ScoreResult;
    debtToAssets: ScoreResult;
    currentRatio: ScoreResult;
  };
  totalScore: number;
  maxTotalScore: number;
}

// ============ PRESET 1: SOFTWARE ============
function scoreSoftwareNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreSoftwareInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreSoftwareDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 25) return { score: 4, maxScore: 4 };
  if (value < 35) return { score: 3, maxScore: 4 };
  if (value < 45) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreSoftwareCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 2: STAPLES ============
function scoreStaplesNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreStaplesInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreStaplesDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 35) return { score: 4, maxScore: 4 };
  if (value < 45) return { score: 3, maxScore: 4 };
  if (value < 55) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreStaplesCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 3: INDUSTRIALS ============
function scoreIndustrialsNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreIndustrialsInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreIndustrialsDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 40) return { score: 4, maxScore: 4 };
  if (value < 50) return { score: 3, maxScore: 4 };
  if (value < 60) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreIndustrialsCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 4: RETAIL LOGISTICS ============
function scoreRetailLogisticsNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreRetailLogisticsInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreRetailLogisticsDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 35) return { score: 4, maxScore: 4 };
  if (value < 45) return { score: 3, maxScore: 4 };
  if (value < 55) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreRetailLogisticsCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 5: ENERGY MATERIALS ============
function scoreEnergyMaterialsNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreEnergyMaterialsInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreEnergyMaterialsDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 35) return { score: 4, maxScore: 4 };
  if (value < 45) return { score: 3, maxScore: 4 };
  if (value < 55) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreEnergyMaterialsCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 6: HEALTHCARE ============
function scoreHealthcareNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreHealthcareInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreHealthcareDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 35) return { score: 4, maxScore: 4 };
  if (value < 45) return { score: 3, maxScore: 4 };
  if (value < 55) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreHealthcareCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// ============ PRESET 7: UTILITIES TELECOM ============
function scoreUtilitiesTelecomNetDebtToEbitda(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value <= 0) return { score: 6, maxScore: 6 }; // Net Cash (unusual for utilities)
  if (value <= 1.0) return { score: 6, maxScore: 6 }; // ≤ 1.0× (sehr stark)
  if (value <= 1.5) return { score: 5, maxScore: 6 }; // > 1.0-1.5× (stark)
  if (value <= 2.0) return { score: 4, maxScore: 6 }; // > 1.5-2.0× (ok)
  if (value <= 3.0) return { score: 2, maxScore: 6 }; // > 2.0-3.0× (beobachten)
  return { score: 0, maxScore: 6 }; // > 3.0× (heikel)
}

function scoreUtilitiesTelecomInterestCoverage(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 6 };
  if (value >= 12) return { score: 6, maxScore: 6 }; // ≥ 12× (exzellent)
  if (value >= 8) return { score: 5, maxScore: 6 }; // ≥ 8-<12× (stark, Buffett-kompatibel)
  if (value >= 5) return { score: 3, maxScore: 6 }; // ≥ 5-<8× (ok, beobachten)
  if (value >= 3) return { score: 1, maxScore: 6 }; // ≥ 3-<5× (beobachten)
  return { score: 0, maxScore: 6 }; // < 3× (riskant)
}

function scoreUtilitiesTelecomDebtToAssets(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value < 45) return { score: 4, maxScore: 4 };
  if (value < 55) return { score: 3, maxScore: 4 };
  if (value < 65) return { score: 1, maxScore: 4 };
  return { score: 0, maxScore: 4 };
}

function scoreUtilitiesTelecomCurrentRatio(value: number | null): ScoreResult {
  if (value === null) return { score: 0, maxScore: 4 };
  if (value >= 2.0) return { score: 4, maxScore: 4 }; // ≥ 2.0 (stark)
  if (value >= 1.5) return { score: 3, maxScore: 4 }; // ≥ 1.5-<2.0 (ok)
  if (value >= 1.2) return { score: 1, maxScore: 4 }; // ≥ 1.2-<1.5 (beobachten)
  return { score: 0, maxScore: 4 }; // < 1.2 (riskant)
}

// Main scoring function
function calculateScores(preset: string, input: MetricsInput): ScoringResponse {
  let netDebtScore: ScoreResult;
  let interestCoverageScore: ScoreResult;
  let debtToAssetsScore: ScoreResult;
  let currentRatioScore: ScoreResult;

  switch (preset) {
    case 'Software':
      netDebtScore = scoreSoftwareNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreSoftwareInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreSoftwareDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreSoftwareCurrentRatio(input.currentRatio);
      break;
    
    case 'Staples':
      netDebtScore = scoreStaplesNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreStaplesInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreStaplesDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreStaplesCurrentRatio(input.currentRatio);
      break;
    
    case 'Industrials':
      netDebtScore = scoreIndustrialsNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreIndustrialsInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreIndustrialsDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreIndustrialsCurrentRatio(input.currentRatio);
      break;
    
    case 'RetailLogistics':
      netDebtScore = scoreRetailLogisticsNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreRetailLogisticsInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreRetailLogisticsDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreRetailLogisticsCurrentRatio(input.currentRatio);
      break;
    
    case 'EnergyMaterials':
      netDebtScore = scoreEnergyMaterialsNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreEnergyMaterialsInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreEnergyMaterialsDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreEnergyMaterialsCurrentRatio(input.currentRatio);
      break;
    
    case 'Healthcare':
      netDebtScore = scoreHealthcareNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreHealthcareInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreHealthcareDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreHealthcareCurrentRatio(input.currentRatio);
      break;
    
    case 'UtilitiesTelecom':
      netDebtScore = scoreUtilitiesTelecomNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreUtilitiesTelecomInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreUtilitiesTelecomDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreUtilitiesTelecomCurrentRatio(input.currentRatio);
      break;
    
    default:
      // Default to Industrials for unknown industries
      netDebtScore = scoreIndustrialsNetDebtToEbitda(input.netDebtToEbitda);
      interestCoverageScore = scoreIndustrialsInterestCoverage(input.interestCoverage);
      debtToAssetsScore = scoreIndustrialsDebtToAssets(input.debtToAssets);
      currentRatioScore = scoreIndustrialsCurrentRatio(input.currentRatio);
      break;
  }

  const totalScore = netDebtScore.score + interestCoverageScore.score + 
                     debtToAssetsScore.score + currentRatioScore.score;
  const maxTotalScore = netDebtScore.maxScore + interestCoverageScore.maxScore + 
                        debtToAssetsScore.maxScore + currentRatioScore.maxScore;

  return {
    preset,
    scores: {
      netDebtToEbitda: netDebtScore,
      interestCoverage: interestCoverageScore,
      debtToAssets: debtToAssetsScore,
      currentRatio: currentRatioScore,
    },
    totalScore,
    maxTotalScore,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: MetricsInput = await req.json();
    console.log('Financial Strength Scoring Input:', input);

    // Determine preset from industry
    const preset = industryToPreset[input.industry] || 'Industrials';
    console.log(`Industry "${input.industry}" mapped to preset: ${preset}`);

    // Calculate scores
    const result = calculateScores(preset, input);
    console.log('Financial Strength Scoring Result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in calculate-financial-strength-scores:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        preset: 'Industrials',
        scores: {
          netDebtToEbitda: { score: 0, maxScore: 6 },
          interestCoverage: { score: 0, maxScore: 6 },
          debtToAssets: { score: 0, maxScore: 4 },
          currentRatio: { score: 0, maxScore: 4 },
        },
        totalScore: 0,
        maxTotalScore: 20,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
