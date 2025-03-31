
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Info, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BuffettCriterionProps {
  title: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details: string[];
  gptAnalysis?: string | null;
  score?: number;
  maxScore?: number;
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
    rationalBehavior: BuffettCriterionProps;
    cyclicalBehavior: BuffettCriterionProps;
    oneTimeEffects: BuffettCriterionProps;
    turnaround: BuffettCriterionProps;
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

// Function to get score display based on status
const getScoreDisplay = (criterion: BuffettCriterionProps) => {
  if (criterion.score === undefined || criterion.maxScore === undefined) {
    return null;
  }
  
  // Added tooltip with detailed explanation
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center ml-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            criterion.score / criterion.maxScore >= 0.7 ? 'bg-green-100 text-green-700' :
            criterion.score / criterion.maxScore >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {criterion.score}/{criterion.maxScore}
          </span>
          <Info className="h-3 w-3 ml-1 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            Punktzahl basierend auf der Analyse der Unterkategorien dieses Kriteriums.
            {criterion.title === '1. Verstehbares Geschäftsmodell' && 
              ' Einfache Geschäftsmodelle erhalten 3/3, moderate 2/3 und komplexe 0/3 Punkte.'}
            {criterion.title === '11. Keine Turnarounds' && 
              ' Hier gilt: Keine Umstrukturierung = 3/3, leichte Umstrukturierung = 1/3, klarer Turnaround = 0/3 Punkte.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper function to detect inconsistencies between GPT analysis and score
const hasInconsistentAnalysis = (criterion: BuffettCriterionProps): boolean => {
  if (!criterion.gptAnalysis || criterion.score === undefined || criterion.maxScore === undefined) {
    return false;
  }
  
  const gptAnalysis = criterion.gptAnalysis.toLowerCase();
  const scoreRatio = criterion.score / criterion.maxScore;
  
  // Check specific inconsistencies
  if (criterion.title === '1. Verstehbares Geschäftsmodell') {
    if (gptAnalysis.includes('moderat') && scoreRatio > 0.7) return true;
    if (gptAnalysis.includes('komplex') && scoreRatio > 0.3) return true;
  }
  
  if (criterion.title === '11. Keine Turnarounds') {
    if (gptAnalysis.includes('kein turnaround') && scoreRatio < 0.7) return true;
    if ((gptAnalysis.includes('umstrukturierung') || gptAnalysis.includes('turnaround')) && scoreRatio > 0.3) return true;
  }
  
  return false;
};

// Helper function to extract key insights from GPT analysis
const extractKeyInsights = (gptAnalysis: string | null | undefined) => {
  if (!gptAnalysis) return { summary: '', points: [] };
  
  // Split by new lines and filter out empty lines
  const lines = gptAnalysis.split('\n').filter(line => line.trim() !== '');
  
  // Extract first sentence or paragraph as summary
  const summary = lines[0] || '';
  
  // Extract bullet points (lines starting with - or *)
  const points = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.trim().replace(/^[-*]\s*/, ''));
    
  return { summary, points };
};

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria }) => {
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
  ];

  // Zählen der Punkte für die Gesamtbewertung
  const totalPoints = allCriteria.reduce((acc, criterion) => {
    if (criterion.status === 'pass') return acc + 3;
    if (criterion.status === 'warning') return acc + 1;
    return acc;
  }, 0);
  
  const maxPoints = allCriteria.length * 3;
  const buffettScore = Math.round((totalPoints / maxPoints) * 100);

  // Calculate the total detailed score if available
  const detailedScores = allCriteria.filter(c => c.score !== undefined && c.maxScore !== undefined);
  const hasDetailedScores = detailedScores.length > 0;
  
  const totalDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.score || 0), 0) : 0;
  const maxDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.maxScore || 0), 0) : 0;
  
  const detailedBuffettScore = hasDetailedScores && maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : buffettScore;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Buffett-Kriterien Analyse mit GPT</h2>
      <p className="text-buffett-subtext mb-6">
        Eine umfassende Analyse nach Warren Buffetts 11 Investmentkriterien, unterstützt durch GPT für die qualitative Bewertung.
      </p>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-2">
          Buffett-Kompatibilität: {hasDetailedScores ? detailedBuffettScore : buffettScore}%
          {hasDetailedScores && buffettScore !== detailedBuffettScore && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Einfache Bewertung: {buffettScore}%)
            </span>
          )}
        </h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="h-2.5 rounded-full" 
               style={{
                 width: `${hasDetailedScores ? detailedBuffettScore : buffettScore}%`,
                 backgroundColor: (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 70 ? '#10b981' : 
                                 (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 40 ? '#f59e0b' : '#ef4444'
               }}></div>
        </div>
        <p className="text-sm mt-2 text-gray-600">
          {(hasDetailedScores ? detailedBuffettScore : buffettScore) >= 70 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
          (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 40 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
          'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCriteria.map((criterion, index) => {
          const { summary, points } = extractKeyInsights(criterion.gptAnalysis);
          const hasInconsistency = hasInconsistentAnalysis(criterion);
          
          return (
            <Card key={index} className={`border-l-4 ${getStatusColor(criterion.status)}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <CardTitle className="text-lg">{criterion.title}</CardTitle>
                    {getScoreDisplay(criterion)}
                    {hasInconsistency && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="ml-2">
                            <AlertCircle size={16} className="text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              Mögliche Inkonsistenz zwischen GPT-Analyse und Bewertung. Prüfen Sie die Details genauer.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
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
                      <div className="text-gray-700 gpt-analysis prose prose-sm max-w-none">
                        <ReactMarkdown components={{
                          strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                          p: ({ node, ...props }) => <div className="mb-2" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-1 mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-1 mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />
                        }}>
                          {criterion.gptAnalysis}
                        </ReactMarkdown>
                      </div>
                      
                      {points.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="font-medium text-sm text-gray-700 mb-1">Wichtigste Erkenntnisse:</div>
                          <ul className="list-disc pl-5 space-y-0.5">
                            {points.map((point, i) => (
                              <li key={i} className="text-sm text-gray-600">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BuffettCriteriaGPT;
