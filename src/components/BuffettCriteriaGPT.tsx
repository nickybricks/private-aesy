
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface BuffettCriterionProps {
  title: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details: string[];
  gptAnalysis?: string | null;
}

interface BuffettCriteriaGPTProps {
  criteria: {
    businessModel: BuffettCriterionProps;
    economicMoat: BuffettCriterionProps;
    financialMetrics: BuffettCriterionProps;
    financialStability: BuffettCriterionProps;
    management: BuffettCriterionProps;
    valuation: BuffettCriterionProps;
    longTermOutlook: BuffettCriterionProps;
    rationalBehavior?: BuffettCriterionProps;
    cyclicalBehavior?: BuffettCriterionProps;
    oneTimeEffects?: BuffettCriterionProps;
    turnaround?: BuffettCriterionProps;
  };
}

const getStatusColor = (status: string) => {
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pass':
      return <Badge className="bg-green-500">Erfüllt</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500">Teilweise erfüllt</Badge>;
    case 'fail':
      return <Badge className="bg-red-500">Nicht erfüllt</Badge>;
    default:
      return <Badge className="bg-gray-500">Unbekannt</Badge>;
  }
};

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria }) => {
  // Get all criteria in an array, filtering out any undefined values
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
  ].filter(Boolean);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Buffett-Kriterien Analyse mit GPT</h2>
      <p className="text-buffett-subtext mb-6">
        Eine umfassende Analyse nach Warren Buffetts 11 Investmentkriterien, unterstützt durch GPT für die qualitative Bewertung.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCriteria.map((criterion, index) => (
          <Card key={index} className={`border-l-4 ${getStatusColor(criterion.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{criterion.title}</CardTitle>
                {getStatusBadge(criterion.status)}
              </div>
              <CardDescription>{criterion.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <ul className="list-disc pl-5 space-y-1 mb-3">
                  {criterion.details.map((detail, i) => (
                    <li key={i} className="text-gray-700">{detail}</li>
                  ))}
                </ul>
                
                {criterion.gptAnalysis && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center mb-2">
                      <Bot size={16} className="mr-2 text-blue-500" />
                      <span className="font-medium text-blue-700">GPT-Analyse:</span>
                    </div>
                    <p className="text-gray-700">{criterion.gptAnalysis}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
