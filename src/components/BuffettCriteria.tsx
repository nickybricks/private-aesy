
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BuffettCriterionCard } from './BuffettCriterionCard';
import BuffettOverallAnalysis from './BuffettOverallAnalysis';
import { 
  BuffettCriteriaProps as BuffettCriteriaPropsType,
  BuffettCriterionProps,
  getUnifiedCriterionScore
} from '@/utils/buffettUtils';

interface BuffettCriteriaProps {
  criteria: BuffettCriteriaPropsType | null;
  analysisMode?: 'standard' | 'gpt';
}


const BuffettCriteria: React.FC<BuffettCriteriaProps> = ({ criteria, analysisMode = 'gpt' }) => {
  if (!criteria) return null;
  
  const isBuffettCriterion = (criterion: any): criterion is BuffettCriterionProps => {
    return criterion && 
           typeof criterion.title === 'string' && 
           ['pass', 'warning', 'fail'].includes(criterion.status) &&
           typeof criterion.description === 'string' &&
           Array.isArray(criterion.details);
  };

  // Get all criteria
  const allCriteria = [
    criteria.businessModel,
    criteria.economicMoat,
    criteria.financialMetrics,
    criteria.financialStability,
    criteria.management,
    criteria.valuation,
    criteria.longTermOutlook,
    criteria.rationalBehavior,
    criteria.cyclicalBehavior,
    criteria.oneTimeEffects,
    criteria.turnaround
  ].filter(isBuffettCriterion);
  
  // Filter für Standard-Modus: nur quantitative Kriterien (3, 4, 6)
  const quantitativeCriteriaIndices = [2, 3, 5]; // financialMetrics, financialStability, valuation
  
  const displayedCriteria = analysisMode === 'standard' 
    ? allCriteria.filter((_, index) => quantitativeCriteriaIndices.includes(index))
    : allCriteria;
  
  const title = analysisMode === 'standard' 
    ? 'Buffett-Kriterien Analyse (Quantitative Kriterien)'
    : 'Buffett-Kriterien Analyse';
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      
      {analysisMode === 'standard' && (
        <Alert className="bg-blue-50 border-blue-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            Diese Standard-Analyse basiert ausschließlich auf quantitativen Finanzkennzahlen (ROE, Verschuldung, Bewertung). 
            Für eine umfassende Bewertung inklusive qualitativer Faktoren aktivieren Sie die KI-Analyse.
          </AlertDescription>
        </Alert>
      )}
      
      <p className="text-buffett-subtext mb-6">
        {analysisMode === 'standard' 
          ? 'Bewertung nach den 3 wichtigsten quantitativen Buffett-Kriterien (0-10 Punkte pro Kriterium).'
          : 'Eine umfassende Analyse nach Warren Buffetts 11 Investmentkriterien mit gewichteter Bewertung (0-10 Punkte pro Kriterium).'}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {displayedCriteria.map((criterion, index) => (
          <BuffettCriterionCard 
            key={index} 
            criterion={criterion} 
            index={index}
          />
        ))}
      </div>
      
      {analysisMode === 'standard' && (
        <BuffettOverallAnalysis criteria={criteria} />
      )}
    </div>
  );
};

export default BuffettCriteria;
