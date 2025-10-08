import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Industry to Preset Mapping
const industryPresetMap: Record<string, string> = {
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
  "Telecommunications Services": "UtilitiesTelecom",
  "Internet Content & Information": "Software",
  "Publishing": "Software",
  "Broadcasting": "Software",
  "Advertising Agencies": "Software",
  "Entertainment": "Software",
  "Travel Lodging": "RetailLogistics",
  "Travel Services": "RetailLogistics",
  "Specialty Retail": "RetailLogistics",
  "Luxury Goods": "RetailLogistics",
  "Home Improvement": "RetailLogistics",
  "Residential Construction": "Industrials",
  "Department Stores": "RetailLogistics",
  "Personal Products & Services": "RetailLogistics",
  "Leisure": "RetailLogistics",
  "Gambling, Resorts & Casinos": "RetailLogistics",
  "Furnishings, Fixtures & Appliances": "RetailLogistics",
  "Restaurants": "RetailLogistics",
  "Auto - Parts": "Industrials",
  "Auto - Manufacturers": "Industrials",
  "Auto - Recreational Vehicles": "Industrials",
  "Auto - Dealerships": "RetailLogistics",
  "Apparel - Retail": "RetailLogistics",
  "Apparel - Manufacturers": "RetailLogistics",
  "Apparel - Footwear & Accessories": "RetailLogistics",
  "Packaging & Containers": "Industrials",
  "Tobacco": "Staples",
  "Grocery Stores": "Staples",
  "Discount Stores": "Staples",
  "Household & Personal Products": "Staples",
  "Packaged Foods": "Staples",
  "Food Distribution": "Staples",
  "Food Confectioners": "Staples",
  "Agricultural Farm Products": "Staples",
  "Education & Training Services": "Software",
  "Beverages - Wineries & Distilleries": "Staples",
  "Beverages - Non-Alcoholic": "Staples",
  "Beverages - Alcoholic": "Staples",
  "Uranium": "EnergyMaterials",
  "Solar": "UtilitiesTelecom",
  "Oil & Gas Refining & Marketing": "EnergyMaterials",
  "Oil & Gas Midstream": "EnergyMaterials",
  "Oil & Gas Integrated": "EnergyMaterials",
  "Oil & Gas Exploration & Production": "EnergyMaterials",
  "Oil & Gas Equipment & Services": "EnergyMaterials",
  "Oil & Gas Energy": "EnergyMaterials",
  "Oil & Gas Drilling": "EnergyMaterials",
  "Coal": "EnergyMaterials",
  "Shell Companies": "Banks",
  "Investment - Banking & Investment Services": "Banks",
  "Insurance - Specialty": "Insurance",
  "Insurance - Reinsurance": "Insurance",
  "Insurance - Property & Casualty": "Insurance",
  "Insurance - Life": "Insurance",
  "Insurance - Diversified": "Insurance",
  "Insurance - Brokers": "Insurance",
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
  "Waste Management": "UtilitiesTelecom",
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
  "Environmental Services": "UtilitiesTelecom",
  "Industrial - Machinery": "Industrials",
  "Industrial - Infrastructure Operations": "UtilitiesTelecom",
  "Industrial - Capital Goods": "Industrials",
  "Consulting Services": "Software",
  "Business Equipment & Supplies": "Industrials",
  "Staffing & Employment Services": "Software",
  "Rental & Leasing Services": "Industrials",
  "Engineering & Construction": "Industrials",
  "Security & Protection Services": "Software",
  "Specialty Business Services": "Software",
  "Construction": "Industrials",
  "Conglomerates": "Industrials",
  "Electrical Equipment & Parts": "Industrials",
  "Agricultural - Machinery": "Industrials",
  "Agricultural - Commodities/Milling": "EnergyMaterials",
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
  "Information Technology Services": "Software",
  "Hardware, Equipment & Parts": "Industrials",
  "Computer Hardware": "Industrials",
  "Electronic Gaming & Multimedia": "Software",
  "Software - Services": "Software",
  "Software - Infrastructure": "Software",
  "Software - Application": "Software",
  "Semiconductors": "Industrials",
  "Media & Entertainment": "Software",
  "Communication Equipment": "Industrials",
  "Technology Distributors": "Industrials",
  "Consumer Electronics": "Industrials",
  "Renewable Utilities": "UtilitiesTelecom",
  "Regulated Water": "UtilitiesTelecom",
  "Regulated Gas": "UtilitiesTelecom",
  "Regulated Electric": "UtilitiesTelecom",
  "Independent Power Producers": "UtilitiesTelecom",
  "Diversified Utilities": "UtilitiesTelecom",
  "General Utilities": "UtilitiesTelecom"
};

interface MetricWeights {
  roic: number;
  operatingMargin: number;
  netMargin: number;
  yearsOfProfitability: number;
  roe: number;
  roa: number;
}

interface ScoringLogic {
  weights: MetricWeights;
  calculateROICScore: (roic: number | null, wacc: number | null) => { score: number; maxScore: number };
  calculateOperatingMarginScore: (margin: number | null) => { score: number; maxScore: number };
  calculateNetMarginScore: (margin: number | null) => { score: number; maxScore: number };
  calculateYearsScore: (years: number) => { score: number; maxScore: number };
  calculateROEScore: (roe: number | null) => { score: number; maxScore: number };
  calculateROAScore: (roa: number | null) => { score: number; maxScore: number };
}

// Preset Configurations
const presetConfigurations: Record<string, ScoringLogic> = {
  Software: {
    weights: { roic: 6, operatingMargin: 4, netMargin: 3, yearsOfProfitability: 3, roe: 2, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 18 && spread !== null && spread >= 8) return { score: 6, maxScore: 6 };
      if (roic >= 15 && spread !== null && spread >= 5) return { score: 5, maxScore: 6 };
      if (roic >= 12 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 9) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 22) return { score: 4, maxScore: 4 };
      if (margin >= 18) return { score: 3, maxScore: 4 };
      if (margin >= 14) return { score: 2, maxScore: 4 };
      if (margin >= 10) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 18) return { score: 4, maxScore: 4 };
      if (margin >= 14) return { score: 3, maxScore: 4 };
      if (margin >= 10) return { score: 2, maxScore: 4 };
      if (margin >= 6) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 18) return { score: 2, maxScore: 2 };
      if (roe >= 12) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 2 };
      if (roa >= 10) return { score: 2, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    }
  },
  Staples: {
    weights: { roic: 6, operatingMargin: 3, netMargin: 3, yearsOfProfitability: 4, roe: 3, roa: 1 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 16 && spread !== null && spread >= 6) return { score: 6, maxScore: 6 };
      if (roic >= 13 && spread !== null && spread >= 4) return { score: 5, maxScore: 6 };
      if (roic >= 11 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 9) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 18) return { score: 4, maxScore: 4 };
      if (margin >= 15) return { score: 3, maxScore: 4 };
      if (margin >= 12) return { score: 2, maxScore: 4 };
      if (margin >= 8) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 14) return { score: 4, maxScore: 4 };
      if (margin >= 10) return { score: 3, maxScore: 4 };
      if (margin >= 8) return { score: 2, maxScore: 4 };
      if (margin >= 5) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 15) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 8) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  Industrials: {
    weights: { roic: 5, operatingMargin: 4, netMargin: 2, yearsOfProfitability: 4, roe: 3, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 14 && spread !== null && spread >= 5) return { score: 6, maxScore: 6 };
      if (roic >= 12 && spread !== null && spread >= 3) return { score: 5, maxScore: 6 };
      if (roic >= 10 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 8) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 16) return { score: 4, maxScore: 4 };
      if (margin >= 12) return { score: 3, maxScore: 4 };
      if (margin >= 9) return { score: 2, maxScore: 4 };
      if (margin >= 6) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 10) return { score: 4, maxScore: 4 };
      if (margin >= 7) return { score: 3, maxScore: 4 };
      if (margin >= 5) return { score: 2, maxScore: 4 };
      if (margin >= 3) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 14) return { score: 2, maxScore: 2 };
      if (roe >= 9) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 7) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  RetailLogistics: {
    weights: { roic: 5, operatingMargin: 3, netMargin: 2, yearsOfProfitability: 4, roe: 4, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 12 && spread !== null && spread >= 4) return { score: 6, maxScore: 6 };
      if (roic >= 10 && spread !== null && spread >= 2) return { score: 5, maxScore: 6 };
      if (roic >= 9 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 7) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 10) return { score: 4, maxScore: 4 };
      if (margin >= 7) return { score: 3, maxScore: 4 };
      if (margin >= 5) return { score: 2, maxScore: 4 };
      if (margin >= 3) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 6) return { score: 4, maxScore: 4 };
      if (margin >= 4) return { score: 3, maxScore: 4 };
      if (margin >= 3) return { score: 2, maxScore: 4 };
      if (margin >= 2) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 15) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 6) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  UtilitiesTelecom: {
    weights: { roic: 4, operatingMargin: 3, netMargin: 3, yearsOfProfitability: 5, roe: 3, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 10 && spread !== null && spread >= 2) return { score: 6, maxScore: 6 };
      if (roic >= 9 && spread !== null && spread >= 1) return { score: 5, maxScore: 6 };
      if (roic >= 8 && spread !== null && spread >= 0) return { score: 4, maxScore: 6 };
      if (roic >= 7) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 18) return { score: 4, maxScore: 4 };
      if (margin >= 15) return { score: 3, maxScore: 4 };
      if (margin >= 12) return { score: 2, maxScore: 4 };
      if (margin >= 9) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 10) return { score: 4, maxScore: 4 };
      if (margin >= 8) return { score: 3, maxScore: 4 };
      if (margin >= 6) return { score: 2, maxScore: 4 };
      if (margin >= 4) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10 || years === 9) return { score: 4, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 12) return { score: 2, maxScore: 2 };
      if (roe >= 8) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 6) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  EnergyMaterials: {
    weights: { roic: 5, operatingMargin: 3, netMargin: 2, yearsOfProfitability: 4, roe: 4, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 14 && spread !== null && spread >= 4) return { score: 6, maxScore: 6 };
      if (roic >= 12 && spread !== null && spread >= 2) return { score: 5, maxScore: 6 };
      if (roic >= 10 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 7) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 22) return { score: 4, maxScore: 4 };
      if (margin >= 16) return { score: 3, maxScore: 4 };
      if (margin >= 12) return { score: 2, maxScore: 4 };
      if (margin >= 8) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 12) return { score: 4, maxScore: 4 };
      if (margin >= 8) return { score: 3, maxScore: 4 };
      if (margin >= 5) return { score: 2, maxScore: 4 };
      if (margin >= 3) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 16) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 7) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  Healthcare: {
    weights: { roic: 6, operatingMargin: 4, netMargin: 3, yearsOfProfitability: 3, roe: 3, roa: 1 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 6 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 16 && spread !== null && spread >= 6) return { score: 6, maxScore: 6 };
      if (roic >= 13 && spread !== null && spread >= 4) return { score: 5, maxScore: 6 };
      if (roic >= 11 && spread !== null && spread > 0) return { score: 4, maxScore: 6 };
      if (roic >= 9) return { score: 2, maxScore: 6 };
      return { score: 0, maxScore: 6 };
    },
    calculateOperatingMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 22) return { score: 4, maxScore: 4 };
      if (margin >= 18) return { score: 3, maxScore: 4 };
      if (margin >= 14) return { score: 2, maxScore: 4 };
      if (margin >= 10) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 4 };
      if (margin >= 16) return { score: 4, maxScore: 4 };
      if (margin >= 12) return { score: 3, maxScore: 4 };
      if (margin >= 8) return { score: 2, maxScore: 4 };
      if (margin >= 5) return { score: 1, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 15) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 8) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  Banks: {
    weights: { roic: 2, operatingMargin: 2, netMargin: 0, yearsOfProfitability: 4, roe: 8, roa: 4 },
    calculateROICScore: (_roic, _wacc) => {
      // For banks, ROIC is not meaningful - fixed proxy score
      return { score: 2, maxScore: 2 };
    },
    calculateOperatingMarginScore: (_margin) => {
      // Operating margin as proxy (Cost/Income ratio) - simplified
      return { score: 1, maxScore: 2 };
    },
    calculateNetMarginScore: (_margin) => {
      // Net margin not scored for banks
      return { score: 0, maxScore: 0 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 14) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 1.2) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  },
  Insurance: {
    weights: { roic: 3, operatingMargin: 2, netMargin: 2, yearsOfProfitability: 4, roe: 7, roa: 2 },
    calculateROICScore: (roic, wacc) => {
      if (roic === null) return { score: 0, maxScore: 3 };
      const spread = wacc !== null ? roic - wacc : null;
      if (roic >= 12 && spread !== null && spread >= 3) return { score: 3, maxScore: 3 };
      if (roic >= 10 && spread !== null && spread >= 1) return { score: 2, maxScore: 3 };
      if (roic >= 8) return { score: 1, maxScore: 3 };
      return { score: 0, maxScore: 3 };
    },
    calculateOperatingMarginScore: (_margin) => {
      // Operating margin as Combined Ratio proxy - simplified
      return { score: 1, maxScore: 2 };
    },
    calculateNetMarginScore: (margin) => {
      if (margin === null) return { score: 0, maxScore: 2 };
      if (margin >= 8) return { score: 2, maxScore: 2 };
      if (margin >= 6) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateYearsScore: (years) => {
      if (years === 10) return { score: 4, maxScore: 4 };
      if (years === 9) return { score: 3, maxScore: 4 };
      if (years === 8) return { score: 3, maxScore: 4 };
      if (years === 7) return { score: 2, maxScore: 4 };
      return { score: 0, maxScore: 4 };
    },
    calculateROEScore: (roe) => {
      if (roe === null) return { score: 0, maxScore: 2 };
      if (roe >= 14) return { score: 2, maxScore: 2 };
      if (roe >= 10) return { score: 1, maxScore: 2 };
      return { score: 0, maxScore: 2 };
    },
    calculateROAScore: (roa) => {
      if (roa === null) return { score: 0, maxScore: 1 };
      if (roa >= 1.0) return { score: 1, maxScore: 1 };
      return { score: 0, maxScore: 1 };
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, metrics } = await req.json();
    
    console.log('Received request:', { industry, metrics });

    // Get preset for industry
    const preset = industryPresetMap[industry] || 'Software'; // Default to Software
    const config = presetConfigurations[preset];

    console.log('Using preset:', preset);

    // Calculate scores
    const roicScore = config.calculateROICScore(metrics.roic, metrics.wacc);
    const operatingMarginScore = config.calculateOperatingMarginScore(metrics.operatingMargin);
    const netMarginScore = config.calculateNetMarginScore(metrics.netMargin);
    const yearsScore = config.calculateYearsScore(metrics.yearsOfProfitability);
    const roeScore = config.calculateROEScore(metrics.roe);
    const roaScore = config.calculateROAScore(metrics.roa);

    const result = {
      preset,
      weights: config.weights,
      scores: {
        roic: roicScore,
        operatingMargin: operatingMarginScore,
        netMargin: netMarginScore,
        yearsOfProfitability: yearsScore,
        roe: roeScore,
        roa: roaScore
      }
    };

    console.log('Calculated scores:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating scores:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
