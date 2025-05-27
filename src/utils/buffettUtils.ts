
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pass':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'fail':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pass':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'fail':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// New weighted scoring system according to Buffett's priorities
export const buffettCriteriaWeights = [
  { id: "criterion1", name: "1. Verständliches Geschäftsmodell", weight: 10, maxPoints: 10 },
  { id: "criterion2", name: "2. Wirtschaftlicher Burggraben (Moat)", weight: 20, maxPoints: 10 },
  { id: "criterion3", name: "3. Finanzkennzahlen (10 Jahre)", weight: 15, maxPoints: 10 },
  { id: "criterion4", name: "4. Finanzielle Stabilität & Verschuldung", weight: 10, maxPoints: 10 },
  { id: "criterion5", name: "5. Qualität des Managements", weight: 10, maxPoints: 10 },
  { id: "criterion6", name: "6. Bewertung (nicht zu teuer kaufen)", weight: 10, maxPoints: 10 },
  { id: "criterion7", name: "7. Langfristiger Horizont", weight: 7, maxPoints: 10 },
  { id: "criterion8", name: "8. Rationalität & Disziplin", weight: 5, maxPoints: 10 },
  { id: "criterion9", name: "9. Antizyklisches Verhalten", weight: 5, maxPoints: 10 },
  { id: "criterion10", name: "10. Vergangenheit ≠ Zukunft", weight: 5, maxPoints: 10 },
  { id: "criterion11", name: "11. Keine Turnarounds", weight: 3, maxPoints: 10 }
];

// Extract the GPT assessment status from the analysis text
export const extractGptAssessmentStatus = (
  analysis: string | null | undefined
): { status: 'pass' | 'warning' | 'fail', partialFulfillment?: number } | undefined => {
  if (!analysis) {
    return undefined;
  }
  
  const analysisLower = analysis.toLowerCase();
  
  // Look for the assessment line at the end of the analysis
  const lines = analysis.split('\n');
  const assessmentLine = lines
    .filter(line => line.toLowerCase().includes('bewertung:') || 
                     (line.toLowerCase().includes('bewertung') && 
                     (line.includes('(Pass)') || line.includes('(Warning)') || line.includes('(Fail)'))))
    .pop();
  
  if (!assessmentLine) {
    // Try to infer from other mentions in the text
    if (analysisLower.includes('(pass)') || 
        analysisLower.includes('einfach verständlich') ||
        analysisLower.includes('starker moat') ||
        analysisLower.includes('gutes management') ||
        analysisLower.includes('starke langzeitperspektive') ||
        analysisLower.includes('antizyklisches verhalten') ||
        analysisLower.includes('nachhaltige geschäftsentwicklung') ||
        analysisLower.includes('stabiles unternehmen') || 
        analysisLower.includes('rationales verhalten')) {
      return { status: 'pass' };
    } 
    
    if (analysisLower.includes('(fail)') || 
        analysisLower.includes('zu komplex') ||
        analysisLower.includes('schwacher moat') || 
        analysisLower.includes('kein moat') ||
        analysisLower.includes('problematisches management') ||
        analysisLower.includes('schwache langzeitperspektive') ||
        analysisLower.includes('stark zyklisches verhalten') ||
        analysisLower.includes('stark von einmaleffekten abhängig') ||
        analysisLower.includes('klarer turnaround-fall') ||
        analysisLower.includes('irrationales verhalten')) {
      return { status: 'fail' };
    }
    
    if (analysisLower.includes('(warning)') || 
        analysisLower.includes('moderat komplex') ||
        analysisLower.includes('moderater moat') ||
        analysisLower.includes('durchschnittliches management') ||
        analysisLower.includes('moderate langzeitperspektive') ||
        analysisLower.includes('neutrales verhalten') ||
        analysisLower.includes('teilweise nachhaltig') ||
        analysisLower.includes('leichte umstrukturierung') ||
        analysisLower.includes('gemischtes bild')) {
      
      // Look for partial fulfillment information
      let partialFulfillment = extractPartialFulfillment(analysisLower);
      
      return { 
        status: 'warning',
        partialFulfillment: partialFulfillment || 1 // Default to 1 if not specified
      };
    }
    
    return undefined;
  }
  
  // Extract status from the assessment line
  const assessmentLower = assessmentLine.toLowerCase();
  
  if (assessmentLower.includes('(pass)') || 
      assessmentLower.includes('pass') ||
      assessmentLower.includes('gutes management') ||
      assessmentLower.includes('stabiles unternehmen')) {
    return { status: 'pass' };
  }
  
  if (assessmentLower.includes('(fail)') ||
      assessmentLower.includes('fail')) {
    return { status: 'fail' };
  }
  
  if (assessmentLower.includes('(warning)') ||
      assessmentLower.includes('warning')) {
    // Look for partial fulfillment information
    let partialFulfillment = extractPartialFulfillment(analysisLower);
    
    return { 
      status: 'warning',
      partialFulfillment: partialFulfillment || 1  // Default to 1 if not specified
    };
  }
  
  return undefined;
};

// Extract the number of fulfilled aspects from a warning assessment
export const extractPartialFulfillment = (analysisLower: string): number | undefined => {
  // Look for patterns like "von 3 teilaspekten wurden 2 erfüllt"
  const partialFulfillmentRegex = /von\s+(\d+)\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i;
  const match = analysisLower.match(partialFulfillmentRegex);
  
  if (match && match[1] && match[2]) {
    const total = parseInt(match[1], 10);
    const fulfilled = parseInt(match[2], 10);
    
    if (!isNaN(fulfilled) && !isNaN(total) && total > 0) {
      // Make sure the result makes sense
      if (fulfilled >= 0 && fulfilled <= total) {
        return fulfilled;
      }
    }
  }
  
  return undefined;
};

// Convert GPT assessment directly to 0-10 score
export const deriveScoreFromGptAnalysis = (
  criterion: BuffettCriterionProps
): number => {
  if (!criterion.gptAnalysis) {
    throw new Error(`Keine GPT-Analyse verfügbar für Kriterium: ${criterion.title}`);
  }
  
  const analysis = criterion.gptAnalysis.toLowerCase();
  
  // Extract the final assessment from GPT analysis
  const assessment = extractGptAssessmentStatus(criterion.gptAnalysis);
  
  if (!assessment) {
    throw new Error(`GPT-Bewertung konnte nicht extrahiert werden für Kriterium: ${criterion.title}. GPT-Analyse: ${criterion.gptAnalysis.substring(0, 100)}...`);
  }
  
  console.log(`GPT Assessment for ${criterion.title}: ${assessment.status}`);
  
  if (assessment.status === 'pass') {
    console.log('Pass status: 10/10 points');
    return 10; // (Pass) = 10/10
  } else if (assessment.status === 'fail') {
    console.log('Fail status: 0/10 points');
    return 0; // (Fail) = 0/10
  } else if (assessment.status === 'warning') {
    // For warning: calculate based on partial fulfillment
    // Look for "von X teilaspekten wurden Y erfüllt" pattern
    const fulfillmentMatch = analysis.match(/von\s+(\d+)\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i);
    
    if (fulfillmentMatch) {
      const total = parseInt(fulfillmentMatch[1], 10);
      const fulfilled = parseInt(fulfillmentMatch[2], 10);
      
      if (!isNaN(fulfilled) && !isNaN(total) && total > 0) {
        // Calculate score: (fulfilled/total) * 10
        const score = Math.round((fulfilled / total) * 10 * 10) / 10;
        console.log(`Warning with partial fulfillment: ${fulfilled}/${total} = ${score}/10`);
        return score;
      }
    }
    
    throw new Error(`Warning-Bewertung ohne erkennbare Teilerfüllung für Kriterium: ${criterion.title}. Erwartetes Format: "Von X Teilaspekten wurden Y erfüllt."`);
  }
  
  throw new Error(`Unbekannter Bewertungsstatus für Kriterium: ${criterion.title}: ${assessment.status}`);
};

// Calculate score for criteria 3, 4, and 6 based on financial metrics
export const calculateFinancialMetricScore = (
  criterionNumber: number,
  financialData: any
): number => {
  console.log(`calculateFinancialMetricScore called for criterion ${criterionNumber} with data:`, financialData);
  
  if (!financialData) {
    throw new Error(`Keine Finanzdaten verfügbar für Kriterium ${criterionNumber}`);
  }
  
  switch (criterionNumber) {
    case 3: // Finanzkennzahlen
      // Buffett Richtwerte für Kriterium 3:
      // - ROE: ≥ 15% = gut, 10-15% = ok, < 10% = schlecht
      // - ROA: ≥ 10% = gut, 5-10% = ok, < 5% = schlecht  
      // - Gewinnmarge: ≥ 15% = gut, 10-15% = ok, < 10% = schlecht
      // - EPS Wachstum: ≥ 10% = gut, 5-10% = ok, < 5% = schlecht
      
      let score = 0;
      let criteriaCount = 0;
      let missingMetrics = [];
      
      // ROE Check
      if (financialData.roe !== undefined) {
        criteriaCount++;
        const roePercent = financialData.roe * 100; // Convert to percentage
        if (roePercent >= 15) score += 2.5;
        else if (roePercent >= 10) score += 1.5;
        else score += 0;
        console.log(`ROE: ${roePercent}% -> points: ${roePercent >= 15 ? 2.5 : roePercent >= 10 ? 1.5 : 0}`);
      } else {
        missingMetrics.push('ROE');
      }
      
      // Net Margin Check (using netMargin as profit margin)
      if (financialData.netMargin !== undefined) {
        criteriaCount++;
        const marginPercent = financialData.netMargin * 100; // Convert to percentage
        if (marginPercent >= 15) score += 2.5;
        else if (marginPercent >= 10) score += 1.5;
        else score += 0;
        console.log(`Net Margin: ${marginPercent}% -> points: ${marginPercent >= 15 ? 2.5 : marginPercent >= 10 ? 1.5 : 0}`);
      } else {
        missingMetrics.push('Net Margin');
      }
      
      // EPS Check - using current EPS as baseline
      if (financialData.eps !== undefined && financialData.historicalData?.eps) {
        criteriaCount++;
        const epsData = financialData.historicalData.eps;
        if (epsData.length >= 2) {
          const currentEps = epsData[0].value;
          const previousEps = epsData[1].value;
          const epsGrowth = ((currentEps - previousEps) / previousEps) * 100;
          
          if (epsGrowth >= 10) score += 2.5;
          else if (epsGrowth >= 5) score += 1.5;
          else score += 0;
          console.log(`EPS Growth: ${epsGrowth.toFixed(1)}% -> points: ${epsGrowth >= 10 ? 2.5 : epsGrowth >= 5 ? 1.5 : 0}`);
        } else {
          missingMetrics.push('EPS Historical Data');
        }
      } else {
        missingMetrics.push('EPS');
      }
      
      // ROIC Check
      if (financialData.roic !== undefined) {
        criteriaCount++;
        const roicPercent = financialData.roic * 100; // Convert to percentage
        if (roicPercent >= 15) score += 2.5;
        else if (roicPercent >= 10) score += 1.5;
        else score += 0;
        console.log(`ROIC: ${roicPercent}% -> points: ${roicPercent >= 15 ? 2.5 : roicPercent >= 10 ? 1.5 : 0}`);
      } else {
        missingMetrics.push('ROIC');
      }
      
      if (criteriaCount === 0) {
        throw new Error(`Alle erforderlichen Finanzkennzahlen fehlen für Kriterium 3: ${missingMetrics.join(', ')}`);
      }
      
      const finalScore = Math.round((score / criteriaCount) * 4 * 10) / 10;
      console.log(`Criterion 3 final score: ${finalScore}/10 (${score}/${criteriaCount} metrics)`);
      return finalScore;
      
    case 4: // Finanzielle Stabilität
      // Buffett Richtwerte für Kriterium 4:
      // - Schulden zu EBITDA: < 2 = sehr gut, 2-3 = ok, > 3 = schlecht
      // - Schulden zu Vermögen: < 30% = gut, 30-50% = ok, > 50% = schlecht
      // - Zinslast: Interest Coverage > 5 = gut, 2-5 = ok, < 2 = schlecht
      
      let stabilityScore = 0;
      let stabilityCriteriaCount = 0;
      let missingStabilityMetrics = [];
      
      // Debt to Assets Check
      if (financialData.debtToAssets !== undefined) {
        stabilityCriteriaCount++;
        const debtRatioPercent = financialData.debtToAssets * 100;
        if (debtRatioPercent < 30) stabilityScore += 3.33;
        else if (debtRatioPercent <= 50) stabilityScore += 1.67;
        else stabilityScore += 0;
        console.log(`Debt to Assets: ${debtRatioPercent}% -> points: ${debtRatioPercent < 30 ? 3.33 : debtRatioPercent <= 50 ? 1.67 : 0}`);
      } else {
        missingStabilityMetrics.push('Debt to Assets');
      }
      
      // Interest Coverage Check
      if (financialData.interestCoverage !== undefined) {
        stabilityCriteriaCount++;
        if (financialData.interestCoverage > 5) stabilityScore += 3.33;
        else if (financialData.interestCoverage >= 2) stabilityScore += 1.67;
        else stabilityScore += 0;
        console.log(`Interest Coverage: ${financialData.interestCoverage} -> points: ${financialData.interestCoverage > 5 ? 3.33 : financialData.interestCoverage >= 2 ? 1.67 : 0}`);
      } else {
        missingStabilityMetrics.push('Interest Coverage');
      }
      
      // Add a third criterion if available (current ratio or similar)
      // For now, we'll use the average of the two above
      
      if (stabilityCriteriaCount === 0) {
        throw new Error(`Alle erforderlichen Stabilitätskennzahlen fehlen für Kriterium 4: ${missingStabilityMetrics.join(', ')}`);
      }
      
      const stabilityFinalScore = Math.round(stabilityScore / stabilityCriteriaCount * 10) / 10;
      console.log(`Criterion 4 final score: ${stabilityFinalScore}/10 (${stabilityScore}/${stabilityCriteriaCount} metrics)`);
      return stabilityFinalScore;
      
    case 6: // Bewertung
      if (!financialData?.marginOfSafety) {
        throw new Error('Margin of Safety Daten fehlen für Kriterium 6');
      }
      
      const mos = financialData.marginOfSafety;
      let valuationScore;
      if (mos >= 30) valuationScore = 10;
      else if (mos >= 20) valuationScore = 8;
      else if (mos >= 10) valuationScore = 6;
      else if (mos >= 0) valuationScore = 4;
      else valuationScore = 0;
      
      console.log(`Criterion 6 - Margin of Safety: ${mos}% -> score: ${valuationScore}/10`);
      return valuationScore;
      
    default:
      throw new Error(`Unbekanntes Finanzkriterium: ${criterionNumber}`);
  }
};

// UNIFIED FUNCTION: Get the displayed score for any criterion
export const getUnifiedCriterionScore = (criterion: BuffettCriterionProps): number => {
  console.log('getUnifiedCriterionScore called for:', criterion.title);
  
  // First check if this is a financial metric criterion (3, 4, or 6)
  const criterionNumber = criterion.title.match(/^\d+/)?.[0];
  const criterionNum = criterionNumber ? parseInt(criterionNumber, 10) : 0;
  
  if ([3, 4, 6].includes(criterionNum)) {
    // For financial criteria, use financial data if available
    if (criterion.financialScore !== undefined) {
      console.log(`Using financial score for criterion ${criterionNum}:`, criterion.financialScore);
      return criterion.financialScore;
    }
    
    throw new Error(`Financial Score fehlt für Finanzkriterium ${criterionNum}: ${criterion.title}. Stelle sicher, dass calculateFinancialMetricScore() für dieses Kriterium aufgerufen wird.`);
  }
  
  // For all other criteria, use explicit score first
  if (criterion.score !== undefined) {
    console.log('Using explicit score:', criterion.score);
    return criterion.score;
  }
  
  // Then derive from GPT analysis
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  console.log('Using derived score from GPT analysis:', derivedScore);
  return derivedScore;
};

// UNIFIED FUNCTION: Get the max score for any criterion
export const getUnifiedCriterionMaxScore = (criterion: BuffettCriterionProps): number => {
  // Use explicit maxScore if available, otherwise default to 10
  return criterion.maxScore !== undefined ? criterion.maxScore : 10;
};

// Enhanced version to extract key insights and partial fulfillment information
export const extractKeyInsights = (gptAnalysis: string | null | undefined) => {
  if (!gptAnalysis) return { summary: '', points: [], partialFulfillment: null };
  
  const lines = gptAnalysis.split('\n').filter(line => line.trim() !== '');
  
  const summary = lines[0] || '';
  
  const points = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.trim().replace(/^[-*]\s*/, ''));
  
  // Extract partial fulfillment information
  const analysisLower = gptAnalysis.toLowerCase();
  const partialFulfillmentRegex = /(\d+)\s+von\s+(\d+)\s+teilaspekten?\s+erfüllt/i;
  const match = analysisLower.match(partialFulfillmentRegex) || 
                analysisLower.match(/von\s+(\d+)\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i);
  
  let partialFulfillment = null;
  if (match && match[1] && match[2]) {
    // Ensure we get the correct order based on the match pattern
    const isReversedOrder = analysisLower.includes("von") && analysisLower.includes("wurden");
    
    // If format is "von X teilaspekten wurden Y erfüllt", then match[1] is total and match[2] is fulfilled
    // If format is "Y von X teilaspekten erfüllt", then match[1] is fulfilled and match[2] is total
    const fulfilled = isReversedOrder ? parseInt(match[2], 10) : parseInt(match[1], 10);
    const total = isReversedOrder ? parseInt(match[1], 10) : parseInt(match[2], 10);
    
    if (!isNaN(fulfilled) && !isNaN(total) && total > 0) {
      partialFulfillment = {
        fulfilled,
        total
      };
    }
  }
    
  return { summary, points, partialFulfillment };
};

// Calculate total weighted Buffett score using unified scoring system
export const calculateTotalBuffettScore = (criteria: BuffettCriteriaProps): number => {
  console.log('calculateTotalBuffettScore called');

  const criteriaArray = [
    { criterion: criteria.businessModel, weight: buffettCriteriaWeights[0] },
    { criterion: criteria.economicMoat, weight: buffettCriteriaWeights[1] },
    { criterion: criteria.financialMetrics, weight: buffettCriteriaWeights[2] },
    { criterion: criteria.financialStability, weight: buffettCriteriaWeights[3] },
    { criterion: criteria.management, weight: buffettCriteriaWeights[4] },
    { criterion: criteria.valuation, weight: buffettCriteriaWeights[5] },
    { criterion: criteria.longTermOutlook, weight: buffettCriteriaWeights[6] },
    { criterion: criteria.rationalBehavior, weight: buffettCriteriaWeights[7] },
    { criterion: criteria.cyclicalBehavior, weight: buffettCriteriaWeights[8] },
    { criterion: criteria.oneTimeEffects, weight: buffettCriteriaWeights[9] },
    { criterion: criteria.turnaround, weight: buffettCriteriaWeights[10] }
  ];

  let totalWeightedScore = 0;
  let totalMaxWeightedScore = 0;
  let errors = [];

  criteriaArray.forEach(({ criterion, weight }) => {
    try {
      // Use the unified scoring function - will throw error if no score available
      const score = getUnifiedCriterionScore(criterion);
      
      // Calculate weighted contribution: score * weight percentage
      const weightedScore = score * (weight.weight / 100);
      const maxWeightedScore = 10 * (weight.weight / 100);
      
      console.log(`${criterion.title}: score=${score}, weight=${weight.weight}%, weighted=${weightedScore.toFixed(2)}`);
      
      totalWeightedScore += weightedScore;
      totalMaxWeightedScore += maxWeightedScore;
    } catch (error) {
      errors.push(`Fehler bei ${criterion.title}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Berechnung des Buffett-Scores fehlgeschlagen:\n${errors.join('\n')}`);
  }

  // Convert to percentage: (totalWeightedScore / totalMaxWeightedScore) * 100
  const finalScore = Math.round((totalWeightedScore / totalMaxWeightedScore) * 100 * 10) / 10;
  console.log(`Total: ${totalWeightedScore.toFixed(2)} / ${totalMaxWeightedScore.toFixed(2)} = ${finalScore}%`);
  
  return finalScore;
};

// Get interpretation of the Buffett score with neutral language
export const getBuffettScoreInterpretation = (score: number): { 
  label: string; 
  description: string; 
  color: string 
} => {
  if (score >= 80) {
    return {
      label: "Sehr hohe Übereinstimmung",
      description: "Exzellente Übereinstimmung mit Warren Buffetts Investitionskriterien",
      color: "#10b981"
    };
  } else if (score >= 65) {
    return {
      label: "Gute Übereinstimmung",
      description: "Solide Basis, einzelne Aspekte genau prüfen",
      color: "#f59e0b"
    };
  } else {
    return {
      label: "Niedrige Übereinstimmung",
      description: "Geringe Übereinstimmung mit Buffetts Investitionskriterien",
      color: "#ef4444"
    };
  }
};

// Helper function to calculate weighted score for individual criterion
export const calculateWeightedScore = (
  criterion: BuffettCriterionProps,
  criterionId: string
): { weightedScore: number, weightPercentage: number } => {
  // Use the unified scoring function - will throw error if no score available
  const score = getUnifiedCriterionScore(criterion);
  
  const criteriaWeight = buffettCriteriaWeights.find(c => c.id === criterionId);
  
  if (!criteriaWeight) {
    throw new Error(`Gewichtung nicht gefunden für Kriterium: ${criterionId}`);
  }
  
  // Calculate weighted contribution
  const weightedScore = score * (criteriaWeight.weight / 100);
  const weightPercentage = Math.round((score / 10) * 100);
  
  return { weightedScore, weightPercentage };
};

// Function to add financial scores to criteria objects
export const enrichCriteriaWithFinancialScores = (
  criteria: BuffettCriteriaProps,
  financialData: any,
  marginOfSafety?: number
): BuffettCriteriaProps => {
  console.log('enrichCriteriaWithFinancialScores called with:', { financialData, marginOfSafety });
  
  const enrichedCriteria = { ...criteria };
  
  try {
    // Calculate financial score for criterion 3
    const criterion3Score = calculateFinancialMetricScore(3, financialData);
    enrichedCriteria.financialMetrics = {
      ...enrichedCriteria.financialMetrics,
      financialScore: criterion3Score
    };
    console.log(`Added financial score to criterion 3: ${criterion3Score}`);
  } catch (error) {
    console.error('Error calculating financial score for criterion 3:', error);
  }
  
  try {
    // Calculate financial score for criterion 4
    const criterion4Score = calculateFinancialMetricScore(4, financialData);
    enrichedCriteria.financialStability = {
      ...enrichedCriteria.financialStability,
      financialScore: criterion4Score
    };
    console.log(`Added financial score to criterion 4: ${criterion4Score}`);
  } catch (error) {
    console.error('Error calculating financial score for criterion 4:', error);
  }
  
  try {
    // Calculate financial score for criterion 6 if margin of safety is available
    if (marginOfSafety !== undefined) {
      const criterion6Score = calculateFinancialMetricScore(6, { marginOfSafety });
      enrichedCriteria.valuation = {
        ...enrichedCriteria.valuation,
        financialScore: criterion6Score
      };
      console.log(`Added financial score to criterion 6: ${criterion6Score}`);
    } else {
      console.warn('Margin of safety not available for criterion 6');
    }
  } catch (error) {
    console.error('Error calculating financial score for criterion 6:', error);
  }
  
  return enrichedCriteria;
};

export interface DCFDataProps {
  ufcf: number[];
  wacc: number;
  presentTerminalValue: number;
  netDebt: number;
  dilutedSharesOutstanding: number;
  currency: string;
  intrinsicValue: number;
}

export interface BuffettCriterionProps {
  title: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details: string[];
  gptAnalysis?: string | null;
  score?: number;
  maxScore?: number;
  financialScore?: number; // For criteria 3, 4, 6 based on financial metrics
  dcfData?: DCFDataProps;
  partialFulfillment?: {
    fulfilled: number;
    total: number;
  };
}

export interface BuffettCriteriaProps {
  businessModel: BuffettCriterionProps;
  economicMoat: BuffettCriterionProps;
  financialMetrics: BuffettCriterionProps;
  financialStability: BuffettCriterionProps;
  management: BuffettCriterionProps;
  valuation: BuffettCriterionProps;
  longTermOutlook: BuffettCriterionProps;
  rationalBehavior: BuffettCriterionProps;
  cyclicalBehavior: BuffettCriterionProps;
  oneTimeEffects: BuffettCriterionProps;
  turnaround: BuffettCriterionProps;
}
