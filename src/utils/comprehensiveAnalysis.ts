interface FinancialMetrics {
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  grossProfitMargin?: number;
  operatingMargin?: number;
  netProfitMargin?: number;
  pe?: number;
  priceToBook?: number;
  priceToCashFlow?: number;
  dividendYield?: number;
  reportedCurrency?: string;
}

interface BuffettCriteria {
  businessModel: any;
  economicMoat: any;
  financialMetrics: any;
  financialStability: any;
  management: any;
  valuation: any;
  longTermOutlook: any;
  rationalBehavior: any;
  cyclicalBehavior: any;
  oneTimeEffects: any;
  turnaround: any;
}

interface DCFData {
  intrinsicValue?: number;
  currentPrice?: number;
  marginOfSafety?: number;
}

interface ComprehensiveAnalysisResult {
  strengths: string[];
  weaknesses: string[];
}

export const generateComprehensiveAnalysis = (
  financialMetrics: FinancialMetrics | null,
  criteria: BuffettCriteria,
  dcfData: DCFData | null
): ComprehensiveAnalysisResult => {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // 1. QUANTITATIVE FINANZANALYSE
  if (financialMetrics) {
    // Profitabilität
    if (financialMetrics.roe && financialMetrics.roe > 20) {
      strengths.push(`Hervorragende Eigenkapitalrendite von ${financialMetrics.roe.toFixed(1)}% (>20%)`);
    } else if (financialMetrics.roe && financialMetrics.roe > 15) {
      strengths.push(`Solide Eigenkapitalrendite von ${financialMetrics.roe.toFixed(1)}% (>15%)`);
    } else if (financialMetrics.roe && financialMetrics.roe < 10) {
      weaknesses.push(`Niedrige Eigenkapitalrendite von ${financialMetrics.roe.toFixed(1)}% (<10%)`);
    }

    if (financialMetrics.roa && financialMetrics.roa > 10) {
      strengths.push(`Starke Gesamtkapitalrendite von ${financialMetrics.roa.toFixed(1)}% (>10%)`);
    } else if (financialMetrics.roa && financialMetrics.roa < 5) {
      weaknesses.push(`Schwache Gesamtkapitalrendite von ${financialMetrics.roa.toFixed(1)}% (<5%)`);
    }

    // Margen
    if (financialMetrics.grossProfitMargin && financialMetrics.grossProfitMargin > 50) {
      strengths.push(`Hohe Bruttomarge von ${financialMetrics.grossProfitMargin.toFixed(1)}% zeigt Preissetzungsmacht`);
    } else if (financialMetrics.grossProfitMargin && financialMetrics.grossProfitMargin < 20) {
      weaknesses.push(`Niedrige Bruttomarge von ${financialMetrics.grossProfitMargin.toFixed(1)}% deutet auf Kostendruck hin`);
    }

    if (financialMetrics.netProfitMargin && financialMetrics.netProfitMargin > 15) {
      strengths.push(`Starke Nettomarge von ${financialMetrics.netProfitMargin.toFixed(1)}% (>15%)`);
    } else if (financialMetrics.netProfitMargin && financialMetrics.netProfitMargin < 5) {
      weaknesses.push(`Schwache Nettomarge von ${financialMetrics.netProfitMargin.toFixed(1)}% (<5%)`);
    }

    // Verschuldung
    if (financialMetrics.debtToEquity && financialMetrics.debtToEquity < 0.3) {
      strengths.push(`Konservative Verschuldung mit Debt-to-Equity von ${financialMetrics.debtToEquity.toFixed(2)}`);
    } else if (financialMetrics.debtToEquity && financialMetrics.debtToEquity > 1.0) {
      weaknesses.push(`Hohe Verschuldung mit Debt-to-Equity von ${financialMetrics.debtToEquity.toFixed(2)} (>1.0)`);
    }

    // Liquidität
    if (financialMetrics.currentRatio && financialMetrics.currentRatio > 2.0) {
      strengths.push(`Starke Liquidität mit Current Ratio von ${financialMetrics.currentRatio.toFixed(2)}`);
    } else if (financialMetrics.currentRatio && financialMetrics.currentRatio < 1.0) {
      weaknesses.push(`Schwache Liquidität mit Current Ratio von ${financialMetrics.currentRatio.toFixed(2)} (<1.0)`);
    }

    // Bewertung
    if (financialMetrics.pe && financialMetrics.pe < 15) {
      strengths.push(`Attraktives KGV von ${financialMetrics.pe.toFixed(1)} (<15)`);
    } else if (financialMetrics.pe && financialMetrics.pe > 25) {
      weaknesses.push(`Hohes KGV von ${financialMetrics.pe.toFixed(1)} (>25)`);
    }

    if (financialMetrics.priceToBook && financialMetrics.priceToBook < 1.5) {
      strengths.push(`Günstiges Kurs-Buchwert-Verhältnis von ${financialMetrics.priceToBook.toFixed(2)} (<1.5)`);
    } else if (financialMetrics.priceToBook && financialMetrics.priceToBook > 3.0) {
      weaknesses.push(`Hohes Kurs-Buchwert-Verhältnis von ${financialMetrics.priceToBook.toFixed(2)} (>3.0)`);
    }

    if (financialMetrics.dividendYield && financialMetrics.dividendYield > 3) {
      strengths.push(`Attraktive Dividendenrendite von ${financialMetrics.dividendYield.toFixed(1)}% (>3%)`);
    }
  }

  // 2. DCF UND BEWERTUNGSANALYSE
  if (dcfData) {
    if (dcfData.marginOfSafety && dcfData.marginOfSafety > 30) {
      strengths.push(`Hohe Sicherheitsmarge von ${dcfData.marginOfSafety.toFixed(1)}% beim DCF-Modell`);
    } else if (dcfData.marginOfSafety && dcfData.marginOfSafety > 0) {
      strengths.push(`Positive Sicherheitsmarge von ${dcfData.marginOfSafety.toFixed(1)}% beim DCF-Modell`);
    } else if (dcfData.marginOfSafety && dcfData.marginOfSafety < -20) {
      weaknesses.push(`Deutliche Überbewertung mit -${Math.abs(dcfData.marginOfSafety).toFixed(1)}% Sicherheitsmarge`);
    } else if (dcfData.marginOfSafety && dcfData.marginOfSafety < 0) {
      weaknesses.push(`Aktuelle Überbewertung mit ${dcfData.marginOfSafety.toFixed(1)}% Sicherheitsmarge`);
    }
  }

  // 3. QUALITATIVE GPT-ANALYSE (nur wenn echte Daten vorhanden)
  if (criteria) {
    // Geschäftsmodell - nur bei echtem GPT-Score > 0
    if (criteria.businessModel?.score > 8) {
      strengths.push("Ausgezeichnetes, leicht verständliches Geschäftsmodell");
    } else if (criteria.businessModel?.score > 6) {
      strengths.push("Solides, nachvollziehbares Geschäftsmodell");
    } else if (criteria.businessModel?.score > 0 && criteria.businessModel?.score < 4) {
      weaknesses.push("Komplexes oder schwer verständliches Geschäftsmodell");
    }

    // Economic Moat - nur bei echtem GPT-Score > 0
    if (criteria.economicMoat?.score > 8) {
      strengths.push("Starker wirtschaftlicher Burggraben mit nachhaltigen Wettbewerbsvorteilen");
    } else if (criteria.economicMoat?.score > 6) {
      strengths.push("Erkennbarer wirtschaftlicher Burggraben vorhanden");
    } else if (criteria.economicMoat?.score > 0 && criteria.economicMoat?.score < 4) {
      weaknesses.push("Schwacher oder fehlender wirtschaftlicher Burggraben");
    }

    // Management - nur bei echtem GPT-Score > 0
    if (criteria.management?.score > 8) {
      strengths.push("Hervorragendes, aktionärsfreundliches Management");
    } else if (criteria.management?.score > 0 && criteria.management?.score < 4) {
      weaknesses.push("Bedenkenswerte Managementqualität oder -entscheidungen");
    }

    // Langfristige Aussichten - nur bei echtem GPT-Score > 0
    if (criteria.longTermOutlook?.score > 8) {
      strengths.push("Ausgezeichnete langfristige Wachstumsaussichten");
    } else if (criteria.longTermOutlook?.score > 0 && criteria.longTermOutlook?.score < 4) {
      weaknesses.push("Unsichere oder begrenzte langfristige Perspektiven");
    }
  }

  return {
    strengths: strengths.slice(0, 6), // Maximal 6 wichtigste Stärken
    weaknesses: weaknesses.slice(0, 6) // Maximal 6 wichtigste Schwächen
  };
};