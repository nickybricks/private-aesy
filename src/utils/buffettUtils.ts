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

export const deriveScoreFromGptAnalysis = (
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
  
  if (criterion.title === '11. Keine Turnarounds') {
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

export const hasInconsistentAnalysis = (criterion: BuffettCriterionProps): boolean => {
  if (!criterion.gptAnalysis || criterion.score === undefined || criterion.maxScore === undefined) {
    return false;
  }
  
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  
  return derivedScore !== undefined && derivedScore !== criterion.score;
};

export const extractKeyInsights = (gptAnalysis: string | null | undefined) => {
  if (!gptAnalysis) return { summary: '', points: [] };
  
  const lines = gptAnalysis.split('\n').filter(line => line.trim() !== '');
  
  const summary = lines[0] || '';
  
  const points = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.trim().replace(/^[-*]\s*/, ''));
    
  return { summary, points };
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
