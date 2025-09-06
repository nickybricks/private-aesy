import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, AlertTriangle, X, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useStock } from '@/context/StockContext';
import { 
  BuffettCriteriaProps,
  getUnifiedCriterionScore,
  buffettCriteriaWeights
} from '@/utils/buffettUtils';

interface CriterionDisplayProps {
  criterion: any;
  name: string;
  weight: number;
}

const CriterionStatus: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 8) return <Check className="text-buffett-green h-3 w-3" />;
  if (score >= 5) return <AlertTriangle className="text-buffett-yellow h-3 w-3" />;
  return <X className="text-buffett-red h-3 w-3" />;
};

const CompactCriterionDisplay: React.FC<CriterionDisplayProps> = ({ criterion, name, weight }) => {
  const score = getUnifiedCriterionScore(criterion);
  
  return (
    <div className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <CriterionStatus score={score} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{name}</div>
          <div className="text-xs text-muted-foreground">Gewichtung: {weight}%</div>
        </div>
      </div>
      <div className="text-sm font-semibold">
        {score.toFixed(1)}/10
      </div>
    </div>
  );
};

const CompactStandardAnalysis: React.FC<{ criteria: BuffettCriteriaProps }> = ({ criteria }) => {
  const criteriaList = [
    { criterion: criteria.businessModel, name: 'Geschäftsmodell', weight: buffettCriteriaWeights[0].weight },
    { criterion: criteria.economicMoat, name: 'Burggraben', weight: buffettCriteriaWeights[1].weight },
    { criterion: criteria.financialMetrics, name: 'Finanzkennzahlen', weight: buffettCriteriaWeights[2].weight },
    { criterion: criteria.financialStability, name: 'Finanzstabilität', weight: buffettCriteriaWeights[3].weight },
    { criterion: criteria.management, name: 'Management', weight: buffettCriteriaWeights[4].weight },
    { criterion: criteria.valuation, name: 'Bewertung', weight: buffettCriteriaWeights[5].weight },
    { criterion: criteria.longTermOutlook, name: 'Langfristiger Ausblick', weight: buffettCriteriaWeights[6].weight },
  ];

  return (
    <div className="space-y-0">
      {criteriaList.map(({ criterion, name, weight }, index) => (
        <CompactCriterionDisplay 
          key={index}
          criterion={criterion}
          name={name}
          weight={weight}
        />
      ))}
    </div>
  );
};

const CompactGPTAnalysis: React.FC<{ criteria: BuffettCriteriaProps }> = ({ criteria }) => {
  const criteriaList = [
    { criterion: criteria.businessModel, name: 'Geschäftsmodell', weight: buffettCriteriaWeights[0].weight },
    { criterion: criteria.economicMoat, name: 'Burggraben', weight: buffettCriteriaWeights[1].weight },
    { criterion: criteria.financialMetrics, name: 'Finanzkennzahlen', weight: buffettCriteriaWeights[2].weight },
    { criterion: criteria.financialStability, name: 'Finanzstabilität', weight: buffettCriteriaWeights[3].weight },
    { criterion: criteria.management, name: 'Management', weight: buffettCriteriaWeights[4].weight },
    { criterion: criteria.valuation, name: 'Bewertung', weight: buffettCriteriaWeights[5].weight },
    { criterion: criteria.longTermOutlook, name: 'Langfristiger Ausblick', weight: buffettCriteriaWeights[6].weight },
    { criterion: criteria.rationalBehavior, name: 'Rationales Verhalten', weight: buffettCriteriaWeights[7].weight },
    { criterion: criteria.cyclicalBehavior, name: 'Zyklisches Verhalten', weight: buffettCriteriaWeights[8].weight },
    { criterion: criteria.oneTimeEffects, name: 'Einmalige Effekte', weight: buffettCriteriaWeights[9].weight },
    { criterion: criteria.turnaround, name: 'Turnaround', weight: buffettCriteriaWeights[10].weight },
  ];

  return (
    <div className="space-y-0">
      {criteriaList.map(({ criterion, name, weight }, index) => (
        <CompactCriterionDisplay 
          key={index}
          criterion={criterion}
          name={name}
          weight={weight}
        />
      ))}
    </div>
  );
};

const CompactCriteriaSection: React.FC = () => {
  const { 
    buffettCriteria, 
    activeTab, 
    setActiveTab, 
    gptAvailable,
    hasCriticalDataMissing
  } = useStock();
  
  if (!buffettCriteria || hasCriticalDataMissing) {
    return null;
  }

  return (
    <Card className="h-fit">
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Buffett-Kriterien</h3>
            <TabsList className="h-8">
              <TabsTrigger value="standard" className="text-xs px-2">Standard</TabsTrigger>
              <TabsTrigger value="gpt" disabled={!gptAvailable} className="text-xs px-2">
                KI ({gptAvailable ? '11' : 'N/A'})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="standard" className="mt-0">
            <CompactStandardAnalysis criteria={buffettCriteria} />
          </TabsContent>
          
          <TabsContent value="gpt" className="mt-0">
            {gptAvailable ? (
              <CompactGPTAnalysis criteria={buffettCriteria} />
            ) : (
              <Alert className="py-2">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  KI-Analyse nicht verfügbar. API-Key erforderlich.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default CompactCriteriaSection;