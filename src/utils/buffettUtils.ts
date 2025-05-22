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
  
  if (assessmentLower.includes('(pass)')) {
    return { status: 'pass' };
  }
  
  if (assessmentLower.includes('(fail)')) {
    return { status: 'fail' };
  }
  
  if (assessmentLower.includes('(warning)')) {
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
        // For 3 total aspects, map to our 0-3 score scale
        return fulfilled;
      }
    }
  }
  
  return undefined;
};

export const deriveScoreFromGptAnalysis = (
  criterion: BuffettCriterionProps
): number | undefined => {
  if (!criterion.gptAnalysis || criterion.maxScore === undefined) {
    return undefined;
  }
  
  // Use the new extraction function
  const assessment = extractGptAssessmentStatus(criterion.gptAnalysis);
  
  if (!assessment) {
    // Fall back to old method if we couldn't extract a clear assessment
    return deriveScoreFromGptAnalysisLegacy(criterion);
  }
  
  if (assessment.status === 'pass') {
    return 3; // Full score for Pass
  } else if (assessment.status === 'fail') {
    return 0; // No points for Fail
  } else if (assessment.status === 'warning') {
    // For Warning, use the extracted partial fulfillment information
    return assessment.partialFulfillment || 1; // Default to 1 if not specified
  }
  
  return undefined;
};

// Keep the old method as a fallback
export const deriveScoreFromGptAnalysisLegacy = (
  criterion: BuffettCriterionProps
): number | undefined => {
  if (!criterion.gptAnalysis || criterion.maxScore === undefined) {
    return undefined;
  }
  
  const analysis = criterion.gptAnalysis.toLowerCase();
  
  if (criterion.title === '1. Verstehbares Geschäftsmodell') {
    if (analysis.includes('einfach verständlich') || 
        analysis.includes('klar') || 
        analysis.includes('verständlich') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('moderat') || 
               analysis.includes('mittlere komplexität') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('komplex') || 
               analysis.includes('schwer verständlich') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '2. Wirtschaftlicher Burggraben') {
    if (analysis.includes('starker moat') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('moderater moat') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('schwacher moat') || 
               analysis.includes('kein moat') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '5. Kompetentes Management') {
    if (analysis.includes('gutes management') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('durchschnittliches management') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('problematisches management') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '7. Langfristige Perspektive') {
    if (analysis.includes('starke langzeitperspektive') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('moderate langzeitperspektive') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('schwache langzeitperspektive') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '9. Antizyklisches Verhalten') {
    if (analysis.includes('antizyklisches verhalten') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('neutrales verhalten') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('stark zyklisches verhalten') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '10. Keine Einmaleffekte') {
    if (analysis.includes('nachhaltige geschäftsentwicklung') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('teilweise nachhaltig') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('stark von einmaleffekten') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  if (criterion.title === '11. Kein Turnarounds') {
    const positiveSignals = [
      'kein turnaround', 'keine umstrukturierung', 'keine restrukturierung', 
      'kein umbau', 'stabil', 'keine umbruchsphase', 'solide', 
      'keine grundlegende änderung', 'keine neuausrichtung', 'stabiles unternehmen'
    ];
    
    const warningSignals = [
      'leichte umstrukturierung', 'moderate änderungen', 'teilweise umstrukturierung',
      'kleinere anpassungen', 'geringfügige umstellung'
    ];
    
    const negativeSignals = [
      'klarer turnaround', 'umfassende umstrukturierung', 'komplette neuausrichtung',
      'grundlegende umstellung', 'signifikante umstrukturierung', 'massiver umbau'
    ];
    
    if (analysis.includes('bewertung:')) {
      if (analysis.includes('bewertung: stabil') || analysis.includes('bewertung: pass'))
        return 3;
      else if (analysis.includes('bewertung: leichte') || analysis.includes('bewertung: warning'))
        return 1;
      else if (analysis.includes('bewertung: klar') || analysis.includes('bewertung: fail'))
        return 0;
    }
    
    const positiveCount = positiveSignals.filter(signal => analysis.includes(signal)).length;
    const warningCount = warningSignals.filter(signal => analysis.includes(signal)).length;
    const negativeCount = negativeSignals.filter(signal => analysis.includes(signal)).length;
    
    if (positiveCount > 0 && warningCount === 0 && negativeCount === 0) {
      return 3;
    } else if (warningCount > 0 && negativeCount === 0) {
      return 1;
    } else if (negativeCount > 0) {
      return 0;
    } else if (positiveCount > 0) {
      return 3;
    }
  }
  
  if (criterion.title === '8. Rationales Verhalten') {
    if (analysis.includes('rationales verhalten') || 
        (analysis.includes('bewertung:') && analysis.includes('pass'))) {
      return 3;
    } else if (analysis.includes('gemischtes bild') || 
               (analysis.includes('bewertung:') && analysis.includes('warning'))) {
      return 2;
    } else if (analysis.includes('irrationales verhalten') || 
               (analysis.includes('bewertung:') && analysis.includes('fail'))) {
      return 1;
    }
  }
  
  return undefined;
};

// This function is no longer needed as we're trusting GPT completely
export const hasInconsistentAnalysis = (criterion: BuffettCriterionProps): boolean => {
  return false; // Always return false as we're fully trusting GPT's assessment
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
  const partialFulfillmentRegex = /von\s+(\d+)\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i;
  const match = analysisLower.match(partialFulfillmentRegex);
  
  let partialFulfillment = null;
  if (match && match[1] && match[2]) {
    const total = parseInt(match[1], 10);
    const fulfilled = parseInt(match[2], 10);
    
    if (!isNaN(fulfilled) && !isNaN(total) && total > 0) {
      partialFulfillment = {
        fulfilled,
        total
      };
    }
  }
    
  return { summary, points, partialFulfillment };
};

// Define criteria weights and max points
export const buffettCriteriaWeights = [
  { id: "businessModel", name: "Verständliches Geschäftsmodell", weight: 10, maxPoints: 3 },
  { id: "economicMoat", name: "Wirtschaftlicher Burggraben (Moat)", weight: 15, maxPoints: 9 },
  { id: "financialMetrics", name: "Finanzkennzahlen", weight: 12, maxPoints: 9 },
  { id: "financialStability", name: "Finanzielle Stabilität & Verschuldung", weight: 10, maxPoints: 9 },
  { id: "management", name: "Qualität des Managements", weight: 12, maxPoints: 12 },
  { id: "valuation", name: "Bewertung (nicht zu teuer kaufen)", weight: 15, maxPoints: 12 },
  { id: "longTermOutlook", name: "Langfristiger Ausblick", weight: 8, maxPoints: 3 },
  { id: "rationalBehavior", name: "Rationalität & Disziplin", weight: 6, maxPoints: 3 },
  { id: "cyclicalBehavior", name: "Antizyklisches Verhalten", weight: 4, maxPoints: 3 },
  { id: "oneTimeEffects", name: "Keine Einmaleffekte / nachhaltiges Wachstum", weight: 5, maxPoints: 3 },
  { id: "turnaround", name: "Kein Turnaround-Fall", weight: 3, maxPoints: 3 }
];

// Helper function to calculate weighted score
export const calculateWeightedScore = (
  criterion: BuffettCriterionProps,
  criterionId: string
): { weightedScore: number, weightPercentage: number } => {
  if (criterion.score === undefined || criterion.maxScore === undefined) {
    return { weightedScore: 0, weightPercentage: 0 };
  }
  
  const criteriaWeight = buffettCriteriaWeights.find(c => c.id === criterionId);
  
  if (!criteriaWeight) {
    return { weightedScore: 0, weightPercentage: 0 };
  }
  
  const scoreRatio = criterion.score / criterion.maxScore;
  const weightedScore = scoreRatio * criteriaWeight.weight;
  const weightPercentage = (scoreRatio * 100).toFixed(0);
  
  return { weightedScore, weightPercentage: parseInt(weightPercentage) };
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
