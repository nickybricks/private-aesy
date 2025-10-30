export interface IndustryBranchMapping {
  preset_de: string;      // "Energierohstoffe"
  preset: string;         // "EnergyMaterials" 
  branch_de: string;      // "Metalle"
  branch_en: string;      // "Metals"
  industry_de: string;    // "Stahl"
  industry: string;       // "Steel"
}

export const industryBranchMappings: IndustryBranchMapping[] = [
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Stahl", industry: "Steel" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Silber", industry: "Silver" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Andere Edelmetalle", industry: "Other Precious Metals" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Gold", industry: "Gold" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Kupfer", industry: "Copper" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Metalle", branch_en: "Metals", industry_de: "Aluminium", industry: "Aluminum" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Papier & Holz", branch_en: "Paper & Lumber", industry_de: "Papier, Holz & Forstprodukte", industry: "Paper, Lumber & Forest Products" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Industriematerialien", branch_en: "Industrial Materials", industry_de: "Industriematerialien", industry: "Industrial Materials" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Industriematerialien", branch_en: "Industrial Materials", industry_de: "Baumaterialien", industry: "Construction Materials" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Chemie & Agrar", branch_en: "Chemicals & Agriculture", industry_de: "Spezialchemikalien", industry: "Chemicals - Specialty" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Chemie & Agrar", branch_en: "Chemicals & Agriculture", industry_de: "Chemikalien", industry: "Chemicals" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Chemie & Agrar", branch_en: "Chemicals & Agriculture", industry_de: "Agrarinputs (Dünger, Saatgut etc.)", industry: "Agricultural Inputs" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Telekommunikation", branch_en: "Telecommunications", industry_de: "Telekommunikationsdienste", industry: "Telecommunications Services" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Internetinhalte & Informationen", industry: "Internet Content & Information" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Verlagswesen", industry: "Publishing" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Rundfunk", industry: "Broadcasting" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Werbeagenturen", industry: "Advertising Agencies" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Unterhaltung", industry: "Entertainment" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Reisen & Logistik", branch_en: "Travel & Logistics", industry_de: "Reiselogistik (Hotels, Unterkünfte)", industry: "Travel Lodging" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Reisen & Logistik", branch_en: "Travel & Logistics", industry_de: "Reisedienstleistungen", industry: "Travel Services" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Fachhandel", industry: "Specialty Retail" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Luxusgüter", industry: "Luxury Goods" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Heimwerker & Renovierung", industry: "Home Improvement" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Bau & Ingenieurwesen", branch_en: "Construction & Engineering", industry_de: "Wohnungsbau", industry: "Residential Construction" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Kaufhäuser", industry: "Department Stores" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Konsumgüter", branch_en: "Consumer Goods", industry_de: "Körperpflege & persönliche Dienstleistungen", industry: "Personal Products & Services" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Gastronomie & Freizeit", branch_en: "Food & Leisure", industry_de: "Freizeit", industry: "Leisure" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Gastronomie & Freizeit", branch_en: "Food & Leisure", industry_de: "Glücksspiel, Resorts & Casinos", industry: "Gambling, Resorts & Casinos" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Konsumgüter", branch_en: "Consumer Goods", industry_de: "Möbel, Einrichtung & Haushaltsgeräte", industry: "Furnishings, Fixtures & Appliances" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Gastronomie & Freizeit", branch_en: "Food & Leisure", industry_de: "Restaurants", industry: "Restaurants" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Automobil", branch_en: "Automotive", industry_de: "Autoteile", industry: "Auto - Parts" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Automobil", branch_en: "Automotive", industry_de: "Autohersteller", industry: "Auto - Manufacturers" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Automobil", branch_en: "Automotive", industry_de: "Freizeitfahrzeuge", industry: "Auto - Recreational Vehicles" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Autohäuser", industry: "Auto - Dealerships" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Bekleidung – Einzelhandel", industry: "Apparel - Retail" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Konsumgüter", branch_en: "Consumer Goods", industry_de: "Bekleidungshersteller", industry: "Apparel - Manufacturers" },
  { preset_de: "Handel & Logistik", preset: "RetailLogistics", branch_de: "Einzelhandel", branch_en: "Retail", industry_de: "Schuhe & Accessoires", industry: "Apparel - Footwear & Accessories" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Fertigung", branch_en: "Manufacturing", industry_de: "Verpackung & Behälter", industry: "Packaging & Containers" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Tabak", branch_en: "Tobacco", industry_de: "Tabak", industry: "Tobacco" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Lebensmittelgeschäfte", industry: "Grocery Stores" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Discounter", industry: "Discount Stores" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Haushalt & Pflege", branch_en: "Household & Care", industry_de: "Haushalts- & Körperpflegeprodukte", industry: "Household & Personal Products" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Verpackte Lebensmittel", industry: "Packaged Foods" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Lebensmittelvertrieb", industry: "Food Distribution" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Süßwarenhersteller", industry: "Food Confectioners" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Landwirtschaftliche Erzeugnisse", industry: "Agricultural Farm Products" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "Bildungs- & Schulungsdienste", industry: "Education & Training Services" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Getränke – Weingüter & Brennereien", industry: "Beverages - Wineries & Distilleries" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Alkoholfreie Getränke", industry: "Beverages - Non-Alcoholic" },
  { preset_de: "Grundversorgung", preset: "Staples", branch_de: "Lebensmittel & Getränke", branch_en: "Food & Beverages", industry_de: "Alkoholische Getränke", industry: "Beverages - Alcoholic" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Uran", industry: "Uranium" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Erneuerbare Energien", branch_en: "Renewable Energy", industry_de: "Solarenergie", industry: "Solar" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gasraffinerie & -vermarktung", industry: "Oil & Gas Refining & Marketing" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gas-Midstream", industry: "Oil & Gas Midstream" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gas-Integrated", industry: "Oil & Gas Integrated" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gasexploration & -produktion", industry: "Oil & Gas Exploration & Production" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gasausrüstung & -dienste", industry: "Oil & Gas Equipment & Services" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gasenergie", industry: "Oil & Gas Energy" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Öl- & Gasbohrung", industry: "Oil & Gas Drilling" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Energie", branch_en: "Energy", industry_de: "Kohle", industry: "Coal" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Mantelgesellschaften", industry: "Shell Companies" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Investmentbanking & Anlagedienste", industry: "Investment - Banking & Investment Services" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Spezialversicherungen", industry: "Insurance - Specialty" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Rückversicherungen", industry: "Insurance - Reinsurance" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Sach- & Haftpflichtversicherung", industry: "Insurance - Property & Casualty" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Lebensversicherung", industry: "Insurance - Life" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Diversifizierte Versicherungen", industry: "Insurance - Diversified" },
  { preset_de: "Versicherungen", preset: "Insurance", branch_de: "Versicherungen", branch_en: "Insurance", industry_de: "Versicherungsmakler", industry: "Insurance - Brokers" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Hypothekenfinanzierung", industry: "Financial - Mortgages" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Diversifizierte Finanzdienstleister", industry: "Financial - Diversified" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Finanzdaten & Börsen", industry: "Financial - Data & Stock Exchanges" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Kreditdienste", industry: "Financial - Credit Services" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Finanzkonglomerate", industry: "Financial - Conglomerates" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Investment & Finanzdienstleistungen", branch_en: "Investment & Financial Services", industry_de: "Kapitalmärkte", industry: "Financial - Capital Markets" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Banken", branch_en: "Banks", industry_de: "Regionalbanken", industry: "Banks - Regional" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Banken", branch_en: "Banks", industry_de: "Diversifizierte Banken", industry: "Banks - Diversified" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Banken", branch_en: "Banks", industry_de: "Banken", industry: "Banks" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Vermögensverwaltung", industry: "Asset Management" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Anleihenverwaltung", industry: "Asset Management - Bonds" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Ertragsfokussierte Vermögensverwaltung", industry: "Asset Management - Income" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Hebelprodukt-Verwaltung", industry: "Asset Management - Leveraged" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Kryptowährungsverwaltung", industry: "Asset Management - Cryptocurrency" },
  { preset_de: "Banken & Finanzdienstleister", preset: "Banks", branch_de: "Vermögensverwaltung", branch_en: "Asset Management", industry_de: "Globale Vermögensverwaltung", industry: "Asset Management - Global" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Gesundheitsdienste", branch_en: "Healthcare Services", industry_de: "Medizinische Spezialitäten", industry: "Medical - Specialties" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizin & Pharma", branch_en: "Medicine & Pharma", industry_de: "Pharmazeutika", industry: "Medical - Pharmaceuticals" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizintechnik", branch_en: "Medical Technology", industry_de: "Medizinische Instrumente & Verbrauchsmaterialien", industry: "Medical - Instruments & Supplies" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Gesundheitsdienste", branch_en: "Healthcare Services", industry_de: "Gesundheitspläne", industry: "Medical - Healthcare Plans" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Gesundheitsdienste", branch_en: "Healthcare Services", industry_de: "Gesundheitsinformationsdienste", industry: "Medical - Healthcare Information Services" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizintechnik", branch_en: "Medical Technology", industry_de: "Medizintechnik & -dienste", industry: "Medical - Equipment & Services" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Gesundheitsdienste", branch_en: "Healthcare Services", industry_de: "Medizinproduktevertrieb", industry: "Medical - Distribution" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Diagnostik & Forschung", branch_en: "Diagnostics & Research", industry_de: "Diagnostik & Forschung", industry: "Medical - Diagnostics & Research" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizintechnik", branch_en: "Medical Technology", industry_de: "Medizinische Geräte", industry: "Medical - Devices" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Gesundheitsdienste", branch_en: "Healthcare Services", industry_de: "Pflegeeinrichtungen", industry: "Medical - Care Facilities" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizin & Pharma", branch_en: "Medicine & Pharma", industry_de: "Arzneimittelhersteller – Spezial & Generika", industry: "Drug Manufacturers - Specialty & Generic" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizin & Pharma", branch_en: "Medicine & Pharma", industry_de: "Arzneimittelhersteller – Allgemein", industry: "Drug Manufacturers - General" },
  { preset_de: "Gesundheitswesen", preset: "Healthcare", branch_de: "Medizin & Pharma", branch_en: "Medicine & Pharma", industry_de: "Biotechnologie", industry: "Biotechnology" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Abfall & Umwelt", branch_en: "Waste & Environment", industry_de: "Abfallwirtschaft", industry: "Waste Management" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "LKW-Transport", industry: "Trucking" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Eisenbahnen", industry: "Railroads" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Luft- & Raumfahrt und Verteidigung", industry: "Aerospace & Defense" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Seeschifffahrt", industry: "Marine Shipping" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Integrierte Fracht & Logistik", industry: "Integrated Freight & Logistics" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Fluggesellschaften, Flughäfen & Luftdienste", industry: "Airlines, Airports & Air Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Transport & Verteidigung", branch_en: "Transport & Defense", industry_de: "Allgemeiner Transport", industry: "General Transportation" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Fertigung", branch_en: "Manufacturing", industry_de: "Fertigung – Werkzeuge & Zubehör", industry: "Manufacturing - Tools & Accessories" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Fertigung", branch_en: "Manufacturing", industry_de: "Textilherstellung", industry: "Manufacturing - Textiles" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Fertigung", branch_en: "Manufacturing", industry_de: "Sonstige Fertigung", industry: "Manufacturing - Miscellaneous" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Fertigung", branch_en: "Manufacturing", industry_de: "Metallverarbeitung", industry: "Manufacturing - Metal Fabrication" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Industrievertrieb", industry: "Industrial - Distribution" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Industriespezialitäten", industry: "Industrial - Specialties" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Industrie – Umwelt- & Abgasreinigung", industry: "Industrial - Pollution & Treatment Controls" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Abfall & Umwelt", branch_en: "Waste & Environment", industry_de: "Umweltdienstleistungen", industry: "Environmental Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Maschinen & Anlagen", branch_en: "Machinery & Equipment", industry_de: "Industriemaschinen", industry: "Industrial - Machinery" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Infrastruktur", branch_en: "Infrastructure", industry_de: "Infrastrukturbetrieb", industry: "Industrial - Infrastructure Operations" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Investitionsgüter", industry: "Industrial - Capital Goods" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "Beratungsdienste", industry: "Consulting Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Büromaschinen & -bedarf", industry: "Business Equipment & Supplies" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "Personaldienstleistungen", industry: "Staffing & Employment Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Miet- & Leasingdienste", industry: "Rental & Leasing Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Bau & Ingenieurwesen", branch_en: "Construction & Engineering", industry_de: "Ingenieurwesen & Bauwesen", industry: "Engineering & Construction" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "Sicherheits- & Schutzdienste", industry: "Security & Protection Services" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "Spezialisierte Geschäftsdienste", industry: "Specialty Business Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Bau & Ingenieurwesen", branch_en: "Construction & Engineering", industry_de: "Bauwesen", industry: "Construction" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Industrie allgemein", branch_en: "Industrial General", industry_de: "Konglomerate", industry: "Conglomerates" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Maschinen & Anlagen", branch_en: "Machinery & Equipment", industry_de: "Elektroausrüstung & -teile", industry: "Electrical Equipment & Parts" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Maschinen & Anlagen", branch_en: "Machinery & Equipment", industry_de: "Landmaschinen", industry: "Agricultural - Machinery" },
  { preset_de: "Energierohstoffe", preset: "EnergyMaterials", branch_de: "Agrarrohstoffe", branch_en: "Agricultural Commodities", industry_de: "Agrarrohstoffe & Mahlung", industry: "Agricultural - Commodities/Milling" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Spezial-REITs", industry: "REIT - Specialty" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Einzelhandels-REITs", industry: "REIT - Retail" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Wohn-REITs", industry: "REIT - Residential" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Büro-REITs", industry: "REIT - Office" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Hypotheken-REITs", industry: "REIT - Mortgage" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Industrie-REITs", industry: "REIT - Industrial" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Hotel-REITs", industry: "REIT - Hotel & Motel" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Gesundheitsimmobilien-REITs", industry: "REIT - Healthcare Facilities" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien (REITs)", branch_en: "Real Estate (REITs)", industry_de: "Diversifizierte REITs", industry: "REIT - Diversified" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien allgemein", branch_en: "Real Estate General", industry_de: "Immobiliendienstleistungen", industry: "Real Estate - Services" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien allgemein", branch_en: "Real Estate General", industry_de: "Diversifizierte Immobilien", industry: "Real Estate - Diversified" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien allgemein", branch_en: "Real Estate General", industry_de: "Immobilienentwicklung", industry: "Real Estate - Development" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Immobilien allgemein", branch_en: "Real Estate General", industry_de: "Immobilien allgemein", industry: "Real Estate - General" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "IT-Dienste & Beratung", branch_en: "IT Services & Consulting", industry_de: "IT-Dienstleistungen", industry: "Information Technology Services" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Hardware", branch_en: "Hardware", industry_de: "Hardware, Geräte & Teile", industry: "Hardware, Equipment & Parts" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Hardware", branch_en: "Hardware", industry_de: "Computerhardware", industry: "Computer Hardware" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Elektronische Spiele & Multimedia", industry: "Electronic Gaming & Multimedia" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Software", branch_en: "Software", industry_de: "Software-Dienste", industry: "Software - Services" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Software", branch_en: "Software", industry_de: "Software-Infrastruktur", industry: "Software - Infrastructure" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Software", branch_en: "Software", industry_de: "Anwendungssoftware", industry: "Software - Application" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Hardware", branch_en: "Hardware", industry_de: "Halbleiter", industry: "Semiconductors" },
  { preset_de: "Software & IT-Dienste", preset: "Software", branch_de: "Medien & Unterhaltung", branch_en: "Media & Entertainment", industry_de: "Medien & Unterhaltung", industry: "Media & Entertainment" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Maschinen & Anlagen", branch_en: "Machinery & Equipment", industry_de: "Kommunikationsausrüstung", industry: "Communication Equipment" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Hardware", branch_en: "Hardware", industry_de: "Technologievertrieb", industry: "Technology Distributors" },
  { preset_de: "Industrie", preset: "Industrials", branch_de: "Konsumgüter", branch_en: "Consumer Goods", industry_de: "Unterhaltungselektronik", industry: "Consumer Electronics" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Erneuerbare Energien", branch_en: "Renewable Energy", industry_de: "Erneuerbare Versorger", industry: "Renewable Utilities" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Regulierte Wasserwerke", industry: "Regulated Water" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Regulierte Gasversorger", industry: "Regulated Gas" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Regulierte Stromversorger", industry: "Regulated Electric" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Unabhängige Stromerzeuger", industry: "Independent Power Producers" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Diversifizierte Versorger", industry: "Diversified Utilities" },
  { preset_de: "Versorger & Telekom", preset: "UtilitiesTelecom", branch_de: "Regulierte Versorger", branch_en: "Regulated Utilities", industry_de: "Allgemeine Versorger", industry: "General Utilities" }
];

// Helper: Finde Mapping für eine Industry (EN)
export const getMapping = (industryEn: string): IndustryBranchMapping | null => {
  return industryBranchMappings.find(m => m.industry === industryEn) || null;
};

// Helper: Alle Presets (dedupliziert)
export const getAllPresets = (): { preset: string; preset_de: string }[] => {
  const unique = new Map<string, string>();
  industryBranchMappings.forEach(m => unique.set(m.preset, m.preset_de));
  return Array.from(unique.entries())
    .map(([preset, preset_de]) => ({ preset, preset_de }))
    .sort((a, b) => a.preset_de.localeCompare(b.preset_de));
};

// Helper: Alle Branches für einen Preset
export const getBranchesForPreset = (preset: string): { branch_en: string; branch_de: string }[] => {
  const unique = new Map<string, string>();
  industryBranchMappings
    .filter(m => m.preset === preset)
    .forEach(m => unique.set(m.branch_en, m.branch_de));
  return Array.from(unique.entries())
    .map(([branch_en, branch_de]) => ({ branch_en, branch_de }))
    .sort((a, b) => a.branch_de.localeCompare(b.branch_de));
};

// Helper: Alle Industries für eine Branch
export const getIndustriesForBranch = (branchEn: string): { industry: string; industry_de: string }[] => {
  return industryBranchMappings
    .filter(m => m.branch_en === branchEn)
    .map(m => ({ industry: m.industry, industry_de: m.industry_de }))
    .sort((a, b) => a.industry_de.localeCompare(b.industry_de));
};
