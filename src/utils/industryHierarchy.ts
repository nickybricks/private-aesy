export interface IndustryItem {
  de: string;           // Deutsche Bezeichnung (UI)
  en: string;           // Englische Bezeichnung
  fmpIndustry: string;  // Exakter Match von FMP API
}

export interface IndustryBranch {
  de: string;
  en: string;
  industries: IndustryItem[];
}

export interface IndustryCategory {
  de: string;
  en: string;
  branches: IndustryBranch[];
}

export const industryHierarchy: IndustryCategory[] = [
  {
    de: "Zyklisch",
    en: "Cyclical",
    branches: [
      {
        de: "Rohstoffe",
        en: "Basic Materials",
        industries: [
          { de: "Dünger und Saatgut", en: "Agricultural Inputs", fmpIndustry: "Agricultural Inputs" },
          { de: "Baustoffe", en: "Construction Materials", fmpIndustry: "Building Materials" },
          { de: "Allgemeine Chemikalien", en: "Chemicals", fmpIndustry: "Chemicals" },
          { de: "Spezielle Chemikalien", en: "Chemicals - Specialty", fmpIndustry: "Specialty Chemicals" },
          { de: "Papier, Holz und Waldprodukte", en: "Paper, Lumber & Forest Products", fmpIndustry: "Lumber & Wood Production" },
          { de: "Aluminium", en: "Aluminum", fmpIndustry: "Aluminum" },
          { de: "Kupfer", en: "Copper", fmpIndustry: "Copper" },
          { de: "Gold", en: "Gold", fmpIndustry: "Gold" },
          { de: "Silber", en: "Silver", fmpIndustry: "Silver" },
          { de: "Andere Edelmetalle", en: "Other Precious Metals", fmpIndustry: "Other Precious Metals & Mining" },
          { de: "Stahl", en: "Steel", fmpIndustry: "Steel" },
          { de: "Industrielle Materialien", en: "Industrial Materials", fmpIndustry: "Other Industrial Metals & Mining" }
        ]
      },
      {
        de: "Verbrauchsgüter",
        en: "Consumer Cyclical",
        industries: [
          { de: "Autohändler", en: "Auto - Dealerships", fmpIndustry: "Auto & Truck Dealerships" },
          { de: "Autohersteller", en: "Auto - Manufacturers", fmpIndustry: "Auto Manufacturers" },
          { de: "Autoteile", en: "Auto - Parts", fmpIndustry: "Auto Parts" },
          { de: "Freizeitfahrzeuge", en: "Auto - Recreational Vehicles", fmpIndustry: "Recreational Vehicles" },
          { de: "Möbel und Haushaltsgeräte", en: "Furnishings, Fixtures & Appliances", fmpIndustry: "Furnishings, Fixtures & Appliances" },
          { de: "Wohnungsbau", en: "Residential Construction", fmpIndustry: "Residential Construction" },
          { de: "Kleidungshersteller", en: "Apparel - Manufacturers", fmpIndustry: "Apparel Manufacturing" },
          { de: "Schuhe und Zubehör", en: "Apparel - Footwear & Accessories", fmpIndustry: "Footwear & Accessories" },
          { de: "Verpackungen", en: "Packaging & Containers", fmpIndustry: "Packaging & Containers" },
          { de: "Restaurants", en: "Restaurants", fmpIndustry: "Restaurants" },
          { de: "Kleidungsläden", en: "Apparel - Retail", fmpIndustry: "Apparel Retail" },
          { de: "Warenhäuser", en: "Department Stores", fmpIndustry: "Department Stores" },
          { de: "Heimwerkerbedarf", en: "Home Improvement", fmpIndustry: "Home Improvement Retail" },
          { de: "Luxusartikel", en: "Luxury Goods", fmpIndustry: "Luxury Goods" },
          { de: "Spezialgeschäfte", en: "Specialty Retail", fmpIndustry: "Specialty Retail" },
          { de: "Glücksspiel, Resorts und Casinos", en: "Gambling, Resorts & Casinos", fmpIndustry: "Resorts & Casinos" },
          { de: "Freizeitaktivitäten", en: "Leisure", fmpIndustry: "Leisure" },
          { de: "Unterkünfte", en: "Travel Lodging", fmpIndustry: "Lodging" },
          { de: "Reisedienste", en: "Travel Services", fmpIndustry: "Travel Services" },
          { de: "Persönliche Produkte und Dienstleistungen", en: "Personal Products & Services", fmpIndustry: "Personal Services" }
        ]
      },
      {
        de: "Finanzdienste",
        en: "Financial Services",
        industries: [
          { de: "Vermögensverwaltung", en: "Asset Management", fmpIndustry: "Asset Management" },
          { de: "Anleihenfonds", en: "Asset Management - Bonds", fmpIndustry: "Asset Management" },
          { de: "Einkommensfonds", en: "Asset Management - Income", fmpIndustry: "Asset Management" },
          { de: "Hebelprodukte", en: "Asset Management - Leveraged", fmpIndustry: "Asset Management" },
          { de: "Kryptowährungsfonds", en: "Asset Management - Cryptocurrency", fmpIndustry: "Asset Management" },
          { de: "Globale Fonds", en: "Asset Management - Global", fmpIndustry: "Asset Management" },
          { de: "Banken", en: "Banks", fmpIndustry: "Banks—Diversified" },
          { de: "Große Universalbanken", en: "Banks - Diversified", fmpIndustry: "Banks—Diversified" },
          { de: "Regionale Banken", en: "Banks - Regional", fmpIndustry: "Banks—Regional" },
          { de: "Finanzmärkte", en: "Financial - Capital Markets", fmpIndustry: "Capital Markets" },
          { de: "Finanzdaten und Börsen", en: "Financial - Data & Stock Exchanges", fmpIndustry: "Financial Data & Stock Exchanges" },
          { de: "Kredite und Darlehen", en: "Financial - Credit Services", fmpIndustry: "Credit Services" },
          { de: "Lebensversicherungen", en: "Insurance - Life", fmpIndustry: "Insurance—Life" },
          { de: "Sach- und Unfallversicherungen", en: "Insurance - Property & Casualty", fmpIndustry: "Insurance—Property & Casualty" },
          { de: "Rückversicherungen", en: "Insurance - Reinsurance", fmpIndustry: "Insurance—Reinsurance" },
          { de: "Spezialversicherungen", en: "Insurance - Specialty", fmpIndustry: "Insurance—Specialty" },
          { de: "Verschiedene Versicherungen", en: "Insurance - Diversified", fmpIndustry: "Insurance—Diversified" },
          { de: "Versicherungsmakler", en: "Insurance - Brokers", fmpIndustry: "Insurance Brokers" },
          { de: "Finanzkonglomerate", en: "Financial - Conglomerates", fmpIndustry: "Financial Conglomerates" },
          { de: "Hypotheken", en: "Financial - Mortgages", fmpIndustry: "Mortgage Finance" },
          { de: "Verschiedene Finanzdienste", en: "Financial - Diversified", fmpIndustry: "Financial Data & Stock Exchanges" },
          { de: "Leere Firmen", en: "Shell Companies", fmpIndustry: "Shell Companies" }
        ]
      },
      {
        de: "Immobilien",
        en: "Real Estate",
        industries: [
          { de: "Immobilienentwicklung", en: "Real Estate - Development", fmpIndustry: "Real Estate—Development" },
          { de: "Verschiedene Immobilien", en: "Real Estate - Diversified", fmpIndustry: "Real Estate—Diversified" },
          { de: "Immobiliendienste", en: "Real Estate - Services", fmpIndustry: "Real Estate Services" },
          { de: "Allgemeine Immobilien", en: "Real Estate - General", fmpIndustry: "Real Estate—Diversified" },
          { de: "REIT - Gesundheitseinrichtungen", en: "REIT - Healthcare Facilities", fmpIndustry: "REIT—Healthcare Facilities" },
          { de: "REIT - Hotels und Motels", en: "REIT - Hotel & Motel", fmpIndustry: "REIT—Hotel & Motel" },
          { de: "REIT - Industrieimmobilien", en: "REIT - Industrial", fmpIndustry: "REIT—Industrial" },
          { de: "REIT - Büros", en: "REIT - Office", fmpIndustry: "REIT—Office" },
          { de: "REIT - Wohnungen", en: "REIT - Residential", fmpIndustry: "REIT—Residential" },
          { de: "REIT - Einzelhandel", en: "REIT - Retail", fmpIndustry: "REIT—Retail" },
          { de: "REIT - Hypotheken", en: "REIT - Mortgage", fmpIndustry: "REIT—Mortgage" },
          { de: "REIT - Spezielle Immobilien", en: "REIT - Specialty", fmpIndustry: "REIT—Specialty" },
          { de: "REIT - Verschiedene", en: "REIT - Diversified", fmpIndustry: "REIT—Diversified" }
        ]
      }
    ]
  },
  {
    de: "Defensiv",
    en: "Defensive",
    branches: [
      {
        de: "Verbrauchsgüter des Alltags",
        en: "Consumer Defensive",
        industries: [
          { de: "Bier und andere", en: "Beverages - Alcoholic", fmpIndustry: "Beverages—Wineries & Distilleries" },
          { de: "Wein und Spirituosen", en: "Beverages - Wineries & Distilleries", fmpIndustry: "Beverages—Wineries & Distilleries" },
          { de: "Nicht-alkoholische Getränke", en: "Beverages - Non-Alcoholic", fmpIndustry: "Beverages—Non-Alcoholic" },
          { de: "Süßigkeiten", en: "Food Confectioners", fmpIndustry: "Confectioners" },
          { de: "Landwirtschaftliche Produkte", en: "Agricultural Farm Products", fmpIndustry: "Farm Products" },
          { de: "Fertigessen", en: "Packaged Foods", fmpIndustry: "Packaged Foods" },
          { de: "Lebensmittelvertrieb", en: "Food Distribution", fmpIndustry: "Food Distribution" },
          { de: "Haushalts- und Pflegeprodukte", en: "Household & Personal Products", fmpIndustry: "Household & Personal Products" },
          { de: "Bildung und Schulungen", en: "Education & Training Services", fmpIndustry: "Education & Training Services" },
          { de: "Discounter", en: "Discount Stores", fmpIndustry: "Discount Stores" },
          { de: "Supermärkte", en: "Grocery Stores", fmpIndustry: "Grocery Stores" },
          { de: "Tabak", en: "Tobacco", fmpIndustry: "Tobacco" }
        ]
      },
      {
        de: "Gesundheitswesen",
        en: "Healthcare",
        industries: [
          { de: "Biotechnologie", en: "Biotechnology", fmpIndustry: "Biotechnology" },
          { de: "Pharmafirmen", en: "Drug Manufacturers - General", fmpIndustry: "Drug Manufacturers—General" },
          { de: "Spezielle und Generika", en: "Drug Manufacturers - Specialty & Generic", fmpIndustry: "Drug Manufacturers—Specialty & Generic" },
          { de: "Medizinische Geräte", en: "Medical - Devices", fmpIndustry: "Medical Devices" },
          { de: "Instrumente und Zubehör", en: "Medical - Instruments & Supplies", fmpIndustry: "Medical Instruments & Supplies" },
          { de: "Krankenversicherungen", en: "Medical - Healthcare Plans", fmpIndustry: "Medical Care Facilities" },
          { de: "Kliniken und Pflege", en: "Medical - Care Facilities", fmpIndustry: "Medical Care Facilities" },
          { de: "Arzneimittelhandel", en: "Medical - Pharmaceuticals", fmpIndustry: "Pharmaceutical Retailers" },
          { de: "Gesundheitsinfos", en: "Medical - Healthcare Information Services", fmpIndustry: "Health Information Services" },
          { de: "Diagnostik und Forschung", en: "Medical - Diagnostics & Research", fmpIndustry: "Diagnostics & Research" },
          { de: "Medizinvertrieb", en: "Medical - Distribution", fmpIndustry: "Medical Distribution" },
          { de: "Medizinausrüstung und Dienstleistungen", en: "Medical - Equipment & Services", fmpIndustry: "Medical Instruments & Supplies" },
          { de: "Medizinische Spezialgebiete", en: "Medical - Specialties", fmpIndustry: "Medical Devices" }
        ]
      },
      {
        de: "Versorger",
        en: "Utilities",
        industries: [
          { de: "Wasserversorgung", en: "Regulated Water", fmpIndustry: "Utilities—Regulated Water" },
          { de: "Gasversorgung", en: "Regulated Gas", fmpIndustry: "Utilities—Regulated Gas" },
          { de: "Stromversorgung", en: "Regulated Electric", fmpIndustry: "Utilities—Regulated Electric" },
          { de: "Unabhängige Stromproduzenten", en: "Independent Power Producers", fmpIndustry: "Utilities—Independent Power Producers" },
          { de: "Erneuerbare Energien", en: "Renewable Utilities", fmpIndustry: "Utilities—Renewable" },
          { de: "Verschiedene Versorger", en: "Diversified Utilities", fmpIndustry: "Utilities—Diversified" },
          { de: "Allgemeine Versorger", en: "General Utilities", fmpIndustry: "Utilities—Regulated Electric" }
        ]
      }
    ]
  },
  {
    de: "Sensitiv",
    en: "Sensitive",
    branches: [
      {
        de: "Kommunikationsdienste",
        en: "Communication Services",
        industries: [
          { de: "Telekommunikation", en: "Telecommunications Services", fmpIndustry: "Telecom Services" },
          { de: "Werbeagenturen", en: "Advertising Agencies", fmpIndustry: "Advertising Agencies" },
          { de: "Rundfunk", en: "Broadcasting", fmpIndustry: "Broadcasting" },
          { de: "Verlagswesen", en: "Publishing", fmpIndustry: "Publishing" },
          { de: "Unterhaltung", en: "Entertainment", fmpIndustry: "Entertainment" },
          { de: "Internetinhalte", en: "Internet Content & Information", fmpIndustry: "Internet Content & Information" },
          { de: "Gaming und Multimedia", en: "Electronic Gaming & Multimedia", fmpIndustry: "Electronic Gaming & Multimedia" }
        ]
      },
      {
        de: "Energie",
        en: "Energy",
        industries: [
          { de: "Bohren", en: "Oil & Gas Drilling", fmpIndustry: "Oil & Gas Drilling" },
          { de: "Förderung und Produktion", en: "Oil & Gas Exploration & Production", fmpIndustry: "Oil & Gas E&P" },
          { de: "Integrierte Firmen", en: "Oil & Gas Integrated", fmpIndustry: "Oil & Gas Integrated" },
          { de: "Transport", en: "Oil & Gas Midstream", fmpIndustry: "Oil & Gas Midstream" },
          { de: "Raffinerie und Verkauf", en: "Oil & Gas Refining & Marketing", fmpIndustry: "Oil & Gas Refining & Marketing" },
          { de: "Ausrüstung und Dienstleistungen", en: "Oil & Gas Equipment & Services", fmpIndustry: "Oil & Gas Equipment & Services" },
          { de: "Kohle", en: "Coal", fmpIndustry: "Thermal Coal" },
          { de: "Uran", en: "Uranium", fmpIndustry: "Uranium" },
          { de: "Solar", en: "Solar", fmpIndustry: "Solar" }
        ]
      },
      {
        de: "Industrie",
        en: "Industrials",
        industries: [
          { de: "Luft- und Raumfahrt, Verteidigung", en: "Aerospace & Defense", fmpIndustry: "Aerospace & Defense" },
          { de: "Seeschifffahrt", en: "Marine Shipping", fmpIndustry: "Marine Shipping" },
          { de: "Eisenbahnen", en: "Railroads", fmpIndustry: "Railroads" },
          { de: "Lkw-Transport", en: "Trucking", fmpIndustry: "Trucking" },
          { de: "Fracht und Logistik", en: "Integrated Freight & Logistics", fmpIndustry: "Integrated Freight & Logistics" },
          { de: "Fluglinien und Flughäfen", en: "Airlines, Airports & Air Services", fmpIndustry: "Airports & Air Services" },
          { de: "Allgemeiner Transport", en: "General Transportation", fmpIndustry: "Integrated Freight & Logistics" },
          { de: "Bürogeräte", en: "Business Equipment & Supplies", fmpIndustry: "Business Equipment & Supplies" },
          { de: "Elektrogeräte", en: "Electrical Equipment & Parts", fmpIndustry: "Electrical Equipment & Parts" },
          { de: "Metallverarbeitung", en: "Manufacturing - Metal Fabrication", fmpIndustry: "Metal Fabrication" },
          { de: "Werkzeuge", en: "Manufacturing - Tools & Accessories", fmpIndustry: "Tools & Accessories" },
          { de: "Umweltschutztechnik", en: "Industrial - Pollution & Treatment Controls", fmpIndustry: "Pollution & Treatment Controls" },
          { de: "Industrieller Vertrieb", en: "Industrial - Distribution", fmpIndustry: "Industrial Distribution" },
          { de: "Abfallentsorgung", en: "Waste Management", fmpIndustry: "Waste Management" },
          { de: "Spezielle Dienste", en: "Specialty Business Services", fmpIndustry: "Specialty Business Services" },
          { de: "Beratung", en: "Consulting Services", fmpIndustry: "Consulting Services" },
          { de: "Vermietung", en: "Rental & Leasing Services", fmpIndustry: "Rental & Leasing Services" },
          { de: "Sicherheitsdienste", en: "Security & Protection Services", fmpIndustry: "Security & Protection Services" },
          { de: "Personaldienste", en: "Staffing & Employment Services", fmpIndustry: "Staffing & Employment Services" },
          { de: "Konglomerate", en: "Conglomerates", fmpIndustry: "Conglomerates" },
          { de: "Ingenieurwesen und Bau", en: "Engineering & Construction", fmpIndustry: "Engineering & Construction" },
          { de: "Bauprojekte", en: "Construction", fmpIndustry: "Engineering & Construction" },
          { de: "Infrastrukturbetrieb", en: "Industrial - Infrastructure Operations", fmpIndustry: "Infrastructure Operations" },
          { de: "Landmaschinen", en: "Agricultural - Machinery", fmpIndustry: "Farm & Heavy Construction Machinery" },
          { de: "Industriemaschinen", en: "Industrial - Machinery", fmpIndustry: "Specialty Industrial Machinery" },
          { de: "Industrielle Spezialitäten", en: "Industrial - Specialties", fmpIndustry: "Specialty Industrial Machinery" },
          { de: "Umweltdienste", en: "Environmental Services", fmpIndustry: "Waste Management" },
          { de: "Landwirtschaftliche Rohstoffe", en: "Agricultural - Commodities/Milling", fmpIndustry: "Farm Products" },
          { de: "Sonstige Fertigung", en: "Manufacturing - Miscellaneous", fmpIndustry: "Metal Fabrication" },
          { de: "Textilherstellung", en: "Manufacturing - Textiles", fmpIndustry: "Textile Manufacturing" }
        ]
      },
      {
        de: "Technologie",
        en: "Technology",
        industries: [
          { de: "IT-Dienste", en: "Information Technology Services", fmpIndustry: "Information Technology Services" },
          { de: "Anwendungssoftware", en: "Software - Application", fmpIndustry: "Software—Application" },
          { de: "Infrastruktursoftware", en: "Software - Infrastructure", fmpIndustry: "Software—Infrastructure" },
          { de: "Software-Dienste", en: "Software - Services", fmpIndustry: "Information Technology Services" },
          { de: "Kommunikationsgeräte", en: "Communication Equipment", fmpIndustry: "Communication Equipment" },
          { de: "Computerhardware", en: "Computer Hardware", fmpIndustry: "Computer Hardware" },
          { de: "Unterhaltungselektronik", en: "Consumer Electronics", fmpIndustry: "Consumer Electronics" },
          { de: "Hardware und Teile", en: "Hardware, Equipment & Parts", fmpIndustry: "Computer Hardware" },
          { de: "Halbleiter", en: "Semiconductors", fmpIndustry: "Semiconductors" },
          { de: "Technologievertrieb", en: "Technology Distributors", fmpIndustry: "Electronics & Computer Distribution" },
          { de: "Medien und Unterhaltung", en: "Media & Entertainment", fmpIndustry: "Entertainment" }
        ]
      }
    ]
  }
];

// Helper: Finde Kategorie/Branche für eine FMP Industry
export const findCategoryForIndustry = (fmpIndustry: string): {
  category: string;
  branch: string;
  industry: string;
} | null => {
  for (const category of industryHierarchy) {
    for (const branch of category.branches) {
      for (const industry of branch.industries) {
        if (industry.fmpIndustry === fmpIndustry) {
          return {
            category: category.de,
            branch: branch.de,
            industry: industry.de
          };
        }
      }
    }
  }
  return null;
};

// Helper: Alle Industrien einer Branche
export const getIndustriesForBranch = (categoryDe: string, branchDe: string): IndustryItem[] => {
  const category = industryHierarchy.find(c => c.de === categoryDe);
  if (!category) return [];
  const branch = category.branches.find(b => b.de === branchDe);
  return branch?.industries || [];
};

// Helper: Alle FMP Industry Namen
export const getAllFmpIndustries = (): string[] => {
  const industries: string[] = [];
  industryHierarchy.forEach(category => {
    category.branches.forEach(branch => {
      branch.industries.forEach(industry => {
        industries.push(industry.fmpIndustry);
      });
    });
  });
  return industries;
};
