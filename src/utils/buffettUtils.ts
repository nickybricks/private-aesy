
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
        analysisLower.includes('rationales verhalten (pass)') ||
        analysisLower.includes('alle') && analysisLower.includes('teilaspekte') && analysisLower.includes('erfüllt')) {
      return { status: 'pass' };
    } 
    
    if (analysisLower.includes('(fail)')) {
      return { status: 'fail' };
    }
    
    if (analysisLower.includes('(warning)')) {
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
      assessmentLower.includes('pass)')) {
    return { status: 'pass' };
  }
  
  if (assessmentLower.includes('(fail)') ||
      assessmentLower.includes('fail)')) {
    return { status: 'fail' };
  }
  
  if (assessmentLower.includes('(warning)') ||
      assessmentLower.includes('warning)')) {
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

// FIXED: Convert GPT assessment directly to 0-10 score with proper Pass handling
export const deriveScoreFromGptAnalysis = (
  criterion: BuffettCriterionProps
): number => {
  if (!criterion.gptAnalysis) {
    throw new Error(`GPT-Analyse fehlt für Kriterium: ${criterion.title}`);
  }
  
  // Extract the final assessment from GPT analysis
  const assessment = extractGptAssessmentStatus(criterion.gptAnalysis);
  
  if (!assessment) {
    throw new Error(`Keine gültige Bewertung in GPT-Analyse gefunden für: ${criterion.title}`);
  }
  
  console.log(`GPT Assessment for ${criterion.title}: ${assessment.status}`);
  
  // FIXED SCORING: Pass = 10, Fail = 0, Warning = proportional based on fulfillment
  if (assessment.status === 'pass') {
    console.log('Pass status: 10/10 points');
    return 10; // Pass always gets full points
  } else if (assessment.status === 'fail') {
    console.log('Fail status: 0/10 points');
    return 0; // Fail gets no points
  } else if (assessment.status === 'warning') {
    // For warning: calculate based on partial fulfillment
    const analysis = criterion.gptAnalysis.toLowerCase();
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
    
    // Default warning score if no specific fulfillment mentioned
    console.log('Warning status without specific fulfillment: 5/10 points');
    return 5;
  }
  
  throw new Error(`Unbekannter Bewertungsstatus: ${assessment.status} für ${criterion.title}`);
};

// Calculate score for criteria 3, 4, and 6 based on financial metrics (not GPT)
export const calculateFinancialMetricScore = (
  criterionNumber: number,
  financialData: any
): number => {
  if (!financialData) {
    throw new Error(`Finanzdaten fehlen für Kriterium ${criterionNumber}`);
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
      
      // ROE Check
      if (financialData.roe !== undefined) {
        criteriaCount++;
        if (financialData.roe >= 15) score += 2.5;
        else if (financialData.roe >= 10) score += 1.5;
        else score += 0;
      }
      
      // ROA Check  
      if (financialData.roa !== undefined) {
        criteriaCount++;
        if (financialData.roa >= 10) score += 2.5;
        else if (financialData.roa >= 5) score += 1.5;
        else score += 0;
      }
      
      // Profit Margin Check
      if (financialData.profitMargin !== undefined) {
        criteriaCount++;
        if (financialData.profitMargin >= 15) score += 2.5;
        else if (financialData.profitMargin >= 10) score += 1.5;
        else score += 0;
      }
      
      // EPS Growth Check (durchschnittliches Wachstum)
      if (financialData.epsGrowth !== undefined) {
        criteriaCount++;
        if (financialData.epsGrowth >= 10) score += 2.5;
        else if (financialData.epsGrowth >= 5) score += 1.5;
        else score += 0;
      }
      
      if (criteriaCount === 0) {
        throw new Error('Keine Finanzkennzahlen für Kriterium 3 verfügbar');
      }
      
      return Math.round((score / criteriaCount) * 4) / 4;
      
    case 4: // Finanzielle Stabilität
      // Buffett Richtwerte für Kriterium 4:
      // - Schulden zu EBITDA: < 2 = sehr gut, 2-3 = ok, > 3 = schlecht
      // - Current Ratio: > 1.5 = gut, 1-1.5 = ok, < 1 = schlecht
      // - Quick Ratio: > 1 = gut, 0.8-1 = ok, < 0.8 = schlecht
      
      let stabilityScore = 0;
      let stabilityCriteriaCount = 0;
      
      // Debt to EBITDA Check
      if (financialData.debtToEbitda !== undefined) {
        stabilityCriteriaCount++;
        if (financialData.debtToEbitda < 2) stabilityScore += 3.33;
        else if (financialData.debtToEbitda <= 3) stabilityScore += 1.67;
        else stabilityScore += 0;
      }
      
      // Current Ratio Check
      if (financialData.currentRatio !== undefined) {
        stabilityCriteriaCount++;
        if (financialData.currentRatio > 1.5) stabilityScore += 3.33;
        else if (financialData.currentRatio >= 1) stabilityScore += 1.67;
        else stabilityScore += 0;
      }
      
      // Quick Ratio Check
      if (financialData.quickRatio !== undefined) {
        stabilityCriteriaCount++;
        if (financialData.quickRatio > 1) stabilityScore += 3.33;
        else if (financialData.quickRatio >= 0.8) stabilityScore += 1.67;
        else stabilityScore += 0;
      }
      
      if (stabilityCriteriaCount === 0) {
        throw new Error('Keine Stabilitätskennzahlen für Kriterium 4 verfügbar');
      }
      
      return Math.round(stabilityScore / stabilityCriteriaCount * 10) / 10;
      
    case 6: // Bewertung
      if (!financialData?.marginOfSafety) {
        throw new Error('Margin of Safety fehlt für Bewertungskriterium 6');
      }
      
      const mos = financialData.marginOfSafety;
      if (mos >= 30) return 10;
      if (mos >= 20) return 8;
      if (mos >= 10) return 6;
      if (mos >= 0) return 4;
      return 0;
      
    default:
      throw new Error(`Unbekanntes Finanzkriterium: ${criterionNumber}`);
  }
};

// UNIFIED FUNCTION: Get the displayed score for any criterion - used everywhere
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
    } else {
      throw new Error(`Financial Score fehlt für Finanzkriterium ${criterionNum}: ${criterion.title}`);
    }
  }
  
  // For all other criteria, use explicit score first
  if (criterion.score !== undefined) {
    console.log('Using explicit score:', criterion.score);
    return criterion.score;
  }
  
  // Then derive from GPT analysis (this should now always give 10 for Pass)
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  console.log('Using derived score from GPT analysis:', derivedScore);
  return derivedScore;
};

// UNIFIED FUNCTION: Get the max score for any criterion - used everywhere
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

  criteriaArray.forEach(({ criterion, weight }) => {
    // Use the unified scoring function
    const score = getUnifiedCriterionScore(criterion);
    
    // Calculate weighted contribution: score * weight percentage
    const weightedScore = score * (weight.weight / 100);
    const maxWeightedScore = 10 * (weight.weight / 100);
    
    console.log(`${criterion.title}: score=${score}, weight=${weight.weight}%, weighted=${weightedScore.toFixed(2)}`);
    
    totalWeightedScore += weightedScore;
    totalMaxWeightedScore += maxWeightedScore;
  });

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
  // Use the unified scoring function
  const score = getUnifiedCriterionScore(criterion);
  
  const criteriaWeight = buffettCriteriaWeights.find(c => c.id === criterionId);
  
  if (!criteriaWeight) {
    return { weightedScore: 0, weightPercentage: 0 };
  }
  
  // Calculate weighted contribution
  const weightedScore = score * (criteriaWeight.weight / 100);
  const weightPercentage = Math.round((score / 10) * 100);
  
  return { weightedScore, weightPercentage };
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
  financialScore?: number; // NEW: For criteria 3, 4, 6 based on financial metrics
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
