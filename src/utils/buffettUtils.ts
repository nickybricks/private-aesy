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

// Convert GPT analysis to 0-10 score based on fulfilled criteria
export const deriveScoreFromGptAnalysis = (
  criterion: BuffettCriterionProps
): number | undefined => {
  if (!criterion.gptAnalysis || criterion.maxScore === undefined) {
    return undefined;
  }
  
  const analysis = criterion.gptAnalysis.toLowerCase();
  
  // First, look for explicit numerical scores in the analysis
  const explicitScoreMatch = analysis.match(/(\d+)\s*\/\s*10|(\d+)\s*punkte?\s*von\s*10|score:\s*(\d+)/i);
  if (explicitScoreMatch) {
    const score = parseInt(explicitScoreMatch[1] || explicitScoreMatch[2] || explicitScoreMatch[3], 10);
    if (!isNaN(score) && score >= 0 && score <= 10) {
      console.log(`Found explicit score in GPT analysis: ${score}/10`);
      return score;
    }
  }
  
  // Look for patterns like "2 von 3 teilaspekten erfüllt" or similar
  const fulfillmentMatch = analysis.match(/(\d+)\s+von\s+(\d+)\s+teilaspekten?\s+erfüllt/i) ||
                          analysis.match(/(\d+)\s+\/\s*(\d+)\s+erfüllt/i) ||
                          analysis.match(/erfüllt[e]?\s*[:\-]?\s*(\d+)\s*\/\s*(\d+)/i) ||
                          analysis.match(/von\s+(\d+)\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i);
  
  if (fulfillmentMatch) {
    const [, fulfilledStr, totalStr] = fulfillmentMatch;
    const fulfilled = parseInt(fulfilledStr, 10);
    const total = parseInt(totalStr, 10);
    
    if (!isNaN(fulfilled) && !isNaN(total) && total > 0) {
      // Convert to 0-10 scale based on ratio: (fulfilled/total) * 10
      const score = Math.round((fulfilled / total) * 10 * 10) / 10;
      console.log(`Derived score from fulfillment ratio: ${fulfilled}/${total} = ${score}/10`);
      return score;
    }
  }
  
  // Extract the final assessment from GPT analysis
  const assessment = extractGptAssessmentStatus(criterion.gptAnalysis);
  
  if (!assessment) {
    console.log('No assessment found in GPT analysis');
    return undefined;
  }
  
  console.log(`GPT Assessment status: ${assessment.status}`);
  
  // Convert assessment status to numerical score
  if (assessment.status === 'pass') {
    // For "pass" status, check for quality indicators to determine exact score
    if (analysis.includes('exzellent') || analysis.includes('hervorragend') || analysis.includes('sehr gut')) {
      console.log('Pass with excellent quality indicators: 10/10');
      return 10;
    } else if (analysis.includes('gut') || analysis.includes('solid') || analysis.includes('stark')) {
      console.log('Pass with good quality indicators: 8-9/10');
      return 9;
    } else {
      console.log('Pass with standard quality: 8/10');
      return 8;
    }
  } else if (assessment.status === 'fail') {
    // For "fail" status, check severity
    if (analysis.includes('völlig') || analysis.includes('komplett') || analysis.includes('gar nicht')) {
      console.log('Complete fail: 0/10');
      return 0;
    } else if (analysis.includes('schwach') || analysis.includes('unzureichend')) {
      console.log('Weak performance: 2/10');
      return 2;
    } else {
      console.log('Standard fail: 1/10');
      return 1;
    }
  } else if (assessment.status === 'warning') {
    // For "warning" status, use partial fulfillment if available
    if (assessment.partialFulfillment !== undefined) {
      const totalSubCriteria = 3; // Standard is 3 sub-criteria
      const score = Math.round((assessment.partialFulfillment / totalSubCriteria) * 10 * 10) / 10;
      console.log(`Warning with partial fulfillment: ${assessment.partialFulfillment}/${totalSubCriteria} = ${score}/10`);
      return score;
    }
    
    // Check for quality indicators in warning
    if (analysis.includes('moderat') || analysis.includes('teilweise gut')) {
      console.log('Warning with moderate quality: 6/10');
      return 6;
    } else if (analysis.includes('durchschnittlich') || analysis.includes('neutral')) {
      console.log('Warning with average quality: 5/10');
      return 5;
    } else {
      console.log('Warning with lower quality: 4/10');
      return 4;
    }
  }
  
  console.log('Could not derive score from GPT analysis');
  return undefined;
};

// UNIFIED FUNCTION: Get the displayed score for any criterion - used everywhere
export const getUnifiedCriterionScore = (criterion: BuffettCriterionProps): number => {
  console.log('getUnifiedCriterionScore called for:', criterion.title);
  
  // First priority: explicit score
  if (criterion.score !== undefined) {
    console.log('Using explicit score:', criterion.score);
    return criterion.score;
  }
  
  // Second priority: derive from GPT analysis
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  if (derivedScore !== undefined) {
    console.log('Using derived score from GPT analysis:', derivedScore);
    return derivedScore;
  }
  
  // NO FALLBACK - if we can't derive a score, we need to know about it
  console.error('WARNING: Could not determine score for criterion:', criterion.title);
  console.error('GPT Analysis available:', !!criterion.gptAnalysis);
  console.error('Analysis content:', criterion.gptAnalysis?.substring(0, 200));
  
  // Return 0 but log the issue clearly
  console.log('Returning 0 due to missing score data');
  return 0;
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
