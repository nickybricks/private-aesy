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

function extractOverallScore(gptAnalysis: string): number {
  const match = gptAnalysis.match(/von\s+3\s+teilaspekten\s+wurden\s+(\d+)\s+erfüllt/i);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Fallback: Try to count "ja" occurrences
  const jaCount = (gptAnalysis.toLowerCase().match(/\*\*ja\*\*|^ja,|eindeutig ja/g) || []).length;
  return Math.min(jaCount, 3);
}

function splitIntoQuestionSections(gptAnalysis: string): string[] {
  const sections: string[] = [];
  const lines = gptAnalysis.split('\n');
  let currentSection = '';
  let inQuestion = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a question header (e.g., "**1. Question text**" or "1. Question text")
    if (line.match(/^\*?\*?\d+\.\s+.+\*?\*?$/) && !line.toLowerCase().includes('bewertung')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = line + '\n';
      inQuestion = true;
    } else if (inQuestion && (line.includes('---') || line.includes('Bewertung') || line.includes('###'))) {
      // End of questions section
      if (currentSection) {
        sections.push(currentSection);
      }
      break;
    } else if (inQuestion) {
      currentSection += line + '\n';
    }
  }
  
  // Add the last section if exists
  if (currentSection && sections.length < 3) {
    sections.push(currentSection);
  }
  
  return sections;
}

function parseQuestionAnswer(
  questionSection: string, 
  questionIndex: number, 
  overallScore: number
): 'yes' | 'partial' | 'no' | 'unclear' {
  const lowerText = questionSection.toLowerCase();
  
  // Check for explicit "yes" indicators
  if (lowerText.includes('**ja**') || lowerText.includes('ja,') || 
      lowerText.includes('eindeutig ja') || lowerText.includes('klar erfüllt') ||
      lowerText.includes('vollständig erfüllt')) {
    return 'yes';
  }
  
  // Check for "partial" indicators
  if (lowerText.includes('teilweise') || lowerText.includes('bedingt') || 
      lowerText.includes('eingeschränkt') || lowerText.includes('überwiegend')) {
    return 'partial';
  }
  
  // Check for "no" indicators
  if (lowerText.includes('**nein**') || lowerText.includes('nein,') ||
      lowerText.includes('nicht erfüllt') || lowerText.includes('unzureichend') ||
      lowerText.includes('schwierig') || lowerText.includes('unklar')) {
    return 'no';
  }
  
  // Fallback: Distribute based on overall score
  if (overallScore >= 3) {
    return 'yes';
  } else if (overallScore === 2) {
    return questionIndex < 2 ? 'yes' : 'partial';
  } else if (overallScore === 1) {
    return questionIndex === 0 ? 'yes' : 'no';
  }
  
  return 'no';
}

function extractQuestionEvidence(questionSection: string): string {
  const lines = questionSection.split('\n');
  const evidenceLines: string[] = [];
  let foundQuestion = false;
  
  for (const line of lines) {
    // Skip the question header itself
    if (line.match(/^\*?\*?\d+\.\s+.+\*?\*?$/) && !foundQuestion) {
      foundQuestion = true;
      continue;
    }
    
    if (foundQuestion && line.trim()) {
      evidenceLines.push(line.trim());
    }
  }
  
  // Join all evidence, keep up to 800 characters for reasonable display
  const fullEvidence = evidenceLines.join('\n');
  return fullEvidence.substring(0, 800) || 'Keine spezifische Begründung gefunden.';
}

function parseGptAnalysisToQuestions(
  gptAnalysis: string, 
  criterionId: string
): QualitativeAnswer[] {
  const questions = CRITERION_QUESTIONS[criterionId] || [];
  const weights = QUESTION_WEIGHTS[criterionId] || [true, true, true];
  
  console.log(`\n=== Parsing ${criterionId} ===`);
  console.log('GPT Analysis length:', gptAnalysis.length);
  
  // Extract overall score and split into sections
  const overallScore = extractOverallScore(gptAnalysis);
  const sections = splitIntoQuestionSections(gptAnalysis);
  
  console.log('Overall Score:', overallScore);
  console.log('Sections found:', sections.length);
  
  const answers: QualitativeAnswer[] = questions.map((question, index) => {
    const questionSection = sections[index] || gptAnalysis;
    const answer = parseQuestionAnswer(questionSection, index, overallScore);
    const evidence = extractQuestionEvidence(questionSection);
    const weight = weights[index] ? 1.0 : 0.5;
    
    console.log(`Q${index + 1}: ${answer} (weight: ${weight}) - Evidence length: ${evidence.length}`);
    
    return {
      question,
      answer,
      evidence,
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
