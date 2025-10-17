import { 
  QualitativeAnswer, 
  QualitativeCriterion, 
  QualitativeScores 
} from '@/context/StockContextTypes';

// Mapping of criterion IDs to their question weightings
// true = full weight (1.0), false = half weight (0.5)
const QUESTION_WEIGHTS: Record<string, [boolean, boolean, boolean]> = {
  'businessModel': [true, true, false],      // Q3 half-weighted
  'economicMoat': [true, false, true],       // Q2 half-weighted
  'management': [true, true, true],          // All full-weighted
  'longTermOutlook': [true, false, true],    // Q2 half-weighted
  'rationalBehavior': [false, true, true],   // Q1 half-weighted
  'cyclicalBehavior': [false, true, false],  // Q1, Q3 half-weighted
  'oneTimeEffects': [true, false, true],     // Q2 half-weighted
  'turnaround': [true, false, true]          // Q2 half-weighted
};

const CRITERION_TITLES: Record<string, string> = {
  'businessModel': '1. Verständliches Geschäftsmodell',
  'economicMoat': '2. Economic Moat',
  'management': '3. Qualität des Managements',
  'longTermOutlook': '4. Langfristiger Horizont',
  'rationalBehavior': '5. Rationalität & Disziplin',
  'cyclicalBehavior': '6. Antizyklisches Verhalten',
  'oneTimeEffects': '7. Vergangenheit ≠ Zukunft',
  'turnaround': '8. Keine Turnarounds'
};

const CRITERION_QUESTIONS: Record<string, string[]> = {
  'businessModel': [
    'Wird klar, womit das Unternehmen Geld verdient?',
    'Ist das Geschäftsmodell einfach in wenigen Sätzen erklärbar?',
    'Ist das Geschäftsmodell auch für Laien oder junge Menschen verständlich?'
  ],
  'economicMoat': [
    'Hat das Unternehmen strukturelle Wettbewerbsvorteile (z. B. Netzwerkeffekt, Marke, Technologievorsprung)?',
    'Werden diese Vorteile durch die Kennzahlen gestützt?',
    'Ist der Burggraben gegenüber Wettbewerbern langfristig verteidigbar?'
  ],
  'management': [
    'Ist das Management ehrlich und transparent?',
    'Handelt es im Sinne der Aktionäre?',
    'Zeigt es eine disziplinierte Kapitalallokation?'
  ],
  'longTermOutlook': [
    'Wird das Unternehmen mit seinem aktuellen Geschäftsmodell auch in 20 Jahren noch eine relevante Rolle spielen?',
    'Wird die Branche durch langfristige Megatrends getragen?',
    'Verfügt das Unternehmen über eine glaubwürdige Zukunftsstrategie?'
  ],
  'rationalBehavior': [
    'Handelt das Management diszipliniert und langfristig denkend?',
    'Gab es in der Vergangenheit überteuerte Übernahmen oder strategische Sprunghaftigkeit?',
    'Werden Ressourcen sinnvoll und effizient eingesetzt?'
  ],
  'cyclicalBehavior': [
    'Ist das Geschäftsmodell grundsätzlich zyklisch oder antizyklisch?',
    'Wie verhält sich das Unternehmen in wirtschaftlichen Krisen oder Abschwüngen?',
    'Kauft das Management gezielt Aktien zurück, wenn der Markt schwach ist?'
  ],
  'oneTimeEffects': [
    'Beruhte der bisherige Erfolg auf einmaligen oder außergewöhnlichen Effekten?',
    'Gab es starke Wachstumsphasen durch untypische externe Faktoren?',
    'Ist das Wachstum langfristig wiederholbar und basiert auf einem stabilen Geschäftsmodell?'
  ],
  'turnaround': [
    'Gibt es Hinweise auf operative Probleme oder strategische Verzweiflung?',
    'Gab es kürzlich eine tiefgreifende Restrukturierung oder einen CEO-Wechsel mit radikaler Neuausrichtung?',
    'Ist das Unternehmen stabil und profitabel – oder kämpft es darum, wieder Vertrauen oder Marktanteile zu gewinnen?'
  ]
};

function parseAnswerStatus(text: string): 'yes' | 'partial' | 'no' | 'unclear' {
  const lowerText = text.toLowerCase();
  
  // Check for clear "yes" indicators
  if (lowerText.includes('✅') || lowerText.includes('ja,') || lowerText.includes('ja.') ||
      lowerText.includes('eindeutig ja') || lowerText.includes('klar ja')) {
    return 'yes';
  }
  
  // Check for "partial" indicators
  if (lowerText.includes('⚠️') || lowerText.includes('teilweise') || 
      lowerText.includes('bedingt') || lowerText.includes('eingeschränkt')) {
    return 'partial';
  }
  
  // Check for "no" indicators
  if (lowerText.includes('❌') || lowerText.includes('nein') || 
      lowerText.includes('nicht erfüllt') || lowerText.includes('unzureichend')) {
    return 'no';
  }
  
  // Check for percentage-based assessment
  const percentMatch = lowerText.match(/(\d+)%/);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);
    if (percent >= 75) return 'yes';
    if (percent >= 40) return 'partial';
    return 'no';
  }
  
  return 'unclear';
}

function extractEvidence(analysisText: string, questionIndex: number): string {
  // Try to extract the relevant section for this question
  const lines = analysisText.split('\n');
  const relevantLines: string[] = [];
  let capturing = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Start capturing after finding the question number
    if (line.includes(`${questionIndex + 1}.`) || line.includes(`Frage ${questionIndex + 1}`)) {
      capturing = true;
      continue;
    }
    
    // Stop capturing when we hit the next question or a major section break
    if (capturing && (line.includes(`${questionIndex + 2}.`) || line.includes('---') || line.includes('###'))) {
      break;
    }
    
    if (capturing && line.trim()) {
      relevantLines.push(line.trim());
    }
  }
  
  return relevantLines.slice(0, 3).join(' ').substring(0, 200);
}

function parseGptAnalysisToQuestions(
  gptAnalysis: string, 
  criterionId: string
): QualitativeAnswer[] {
  const questions = CRITERION_QUESTIONS[criterionId] || [];
  const weights = QUESTION_WEIGHTS[criterionId] || [true, true, true];
  
  const answers: QualitativeAnswer[] = questions.map((question, index) => {
    const answer = parseAnswerStatus(gptAnalysis);
    const evidence = extractEvidence(gptAnalysis, index);
    const weight = weights[index] ? 1.0 : 0.5;
    
    return {
      question,
      answer,
      evidence: evidence || 'Keine spezifische Begründung gefunden.',
      weight
    };
  });
  
  return answers;
}

function calculateCriterionScore(questions: QualitativeAnswer[]): { score: number; maxScore: number } {
  let score = 0;
  let maxScore = 0;
  
  questions.forEach(q => {
    maxScore += q.weight;
    
    if (q.answer === 'yes') {
      score += q.weight;
    } else if (q.answer === 'partial') {
      score += q.weight / 2;
    }
    // 'no' and 'unclear' add 0 points
  });
  
  return { score, maxScore };
}

export function calculateQualitativeScores(buffettCriteria: any): QualitativeScores {
  const criterionIds = [
    'businessModel',
    'economicMoat',
    'management',
    'longTermOutlook',
    'rationalBehavior',
    'cyclicalBehavior',
    'oneTimeEffects',
    'turnaround'
  ];
  
  const criteria: QualitativeCriterion[] = criterionIds.map(id => {
    const criterionData = buffettCriteria[id];
    const gptAnalysis = criterionData?.gptAnalysis || '';
    
    const questions = parseGptAnalysisToQuestions(gptAnalysis, id);
    const { score, maxScore } = calculateCriterionScore(questions);
    
    return {
      id,
      title: CRITERION_TITLES[id],
      questions,
      score,
      maxScore
    };
  });
  
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);
  
  return {
    criteria,
    totalScore,
    maxTotalScore: 20
  };
}
