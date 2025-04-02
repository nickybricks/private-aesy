
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Info, AlertCircle, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

// Helper function that automatically derives score from GPT analysis
const deriveScoreFromGptAnalysis = (criterion: BuffettCriterionProps): number | undefined => {
  if (!criterion.gptAnalysis || criterion.maxScore === undefined) {
    return undefined;
  }
  
  const analysis = criterion.gptAnalysis.toLowerCase();
  
  // Derive score for business model criterion
  if (criterion.title === '1. Verstehbares Geschäftsmodell') {
    if (analysis.includes('einfach') || analysis.includes('klar') || analysis.includes('verständlich')) {
      return 3;
    } else if (analysis.includes('moderat') || analysis.includes('mittlere komplexität')) {
      return 2;
    } else if (analysis.includes('komplex') || analysis.includes('schwer verständlich')) {
      return 1;
    }
  }
  
  // Derive score for turnaround criterion
  if (criterion.title === '11. Keine Turnarounds') {
    if (analysis.includes('kein turnaround') || analysis.includes('keine umstrukturierung')) {
      return 3;
    } else if (analysis.includes('leichte umstrukturierung') || analysis.includes('moderate änderungen')) {
      return 1;
    } else if (analysis.includes('klarer turnaround') || analysis.includes('umfassende umstrukturierung')) {
      return 0;
    }
  }
  
  // For other criteria, we could add similar pattern matching logic
  return undefined;
}

// Function to get score display based on status with automated GPT score derivation
const getScoreDisplay = (criterion: BuffettCriterionProps) => {
  if (criterion.maxScore === undefined) {
    return null;
  }
  
  // Try to derive score from GPT analysis if it doesn't match current score
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  const score = criterion.score !== undefined ? criterion.score : derivedScore;
  
  if (score === undefined) {
    return null;
  }
  
  // Added tooltip with detailed explanation
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center ml-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            score / criterion.maxScore >= 0.7 ? 'bg-green-100 text-green-700' :
            score / criterion.maxScore >= 0.4 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {score}/{criterion.maxScore}
          </span>
          <Info className="h-3 w-3 ml-1 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            Punktzahl basierend auf der Analyse der Unterkategorien dieses Kriteriums.
            {criterion.title === '1. Verstehbares Geschäftsmodell' && 
              ' Einfaches Geschäftsmodell = 3/3, moderates = 2/3 und komplexes = 0-1/3 Punkte.'}
            {criterion.title === '11. Keine Turnarounds' && 
              ' Hier gilt: Kein Turnaround = 3/3, leichte Umstrukturierung = 1/3, klarer Turnaround = 0/3 Punkte.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Improved function to detect inconsistencies between GPT analysis and score
const hasInconsistentAnalysis = (criterion: BuffettCriterionProps): boolean => {
  if (!criterion.gptAnalysis || criterion.score === undefined || criterion.maxScore === undefined) {
    return false;
  }
  
  // Get the derived score from GPT analysis
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  
  // If we have a derived score and it doesn't match the current score, flag an inconsistency
  return derivedScore !== undefined && derivedScore !== criterion.score;
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

// New component for a more visual score presentation
const BuffettScoreChart = ({ score }: { score: number }) => {
  const COLORS = ['#10b981', '#f0f0f0'];
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
      <h3 className="text-lg font-semibold mb-4">Buffett-Kompatibilität Visualisierung</h3>
      <div className="flex flex-col md:flex-row items-center">
        <div className="h-48 w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={index === 0 ? 2 : 0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 p-4">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-bold">{score}%</h4>
            <p className="text-gray-500 mb-2">Buffett-Kompatibilität</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Erfüllte Kriterien</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                <span>Ausbaufähig</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {score >= 75 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
               score >= 60 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
               'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Added component to help explain DCF calculations
const DCFExplanationTooltip: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center ml-2 text-gray-400">
        <HelpCircle size={16} />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white p-3 shadow-lg">
        <h4 className="font-semibold mb-1">Wie wird der DCF-Wert berechnet?</h4>
        <p className="text-xs">
          Der DCF-Wert (Discounted Cash Flow) wird konservativ auf Basis historischer Free Cashflows berechnet. Wir verwenden standardmäßig:
        </p>
        <ul className="text-xs list-disc pl-4 mt-1">
          <li>8% Abzinsung (Discount Rate)</li>
          <li>3% langfristiges Wachstum (Terminal Growth)</li>
          <li>5-10 Jahre Prognosezeitraum</li>
        </ul>
        <p className="text-xs mt-1">
          Diese konservative Berechnung kann zu niedrigeren Werten führen als aktuelle Marktpreise, besonders bei wachstumsstarken Unternehmen.
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

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

  // Process criteria to automatically update scores based on GPT analysis
  const processedCriteria = allCriteria.map(criterion => {
    const derivedScore = deriveScoreFromGptAnalysis(criterion);
    
    // Only update the score if it's different and we have a derived value
    if (derivedScore !== undefined && (criterion.score === undefined || criterion.score !== derivedScore)) {
      return {
        ...criterion,
        score: derivedScore
      };
    }
    
    return criterion;
  });

  // Calculate total points for overall rating
  const totalPoints = processedCriteria.reduce((acc, criterion) => {
    if (criterion.status === 'pass') return acc + 3;
    if (criterion.status === 'warning') return acc + 1;
    return acc;
  }, 0);
  
  const maxPoints = processedCriteria.length * 3;
  const buffettScore = Math.round((totalPoints / maxPoints) * 100);

  // Calculate detailed score based on the GPT-derived scores when available
  const detailedScores = processedCriteria.filter(c => c.score !== undefined && c.maxScore !== undefined);
  const hasDetailedScores = detailedScores.length > 0;
  
  const totalDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.score || 0), 0) : 0;
  const maxDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.maxScore || 0), 0) : 0;
  
  const detailedBuffettScore = hasDetailedScores && maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : buffettScore;

  // Criteria distribution for visualization
  const criteriaDistribution = {
    pass: processedCriteria.filter(c => c.status === 'pass').length,
    warning: processedCriteria.filter(c => c.status === 'warning').length,
    fail: processedCriteria.filter(c => c.status === 'fail').length
  };

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
                 backgroundColor: (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 75 ? '#10b981' : 
                                 (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 60 ? '#f59e0b' : '#ef4444'
               }}></div>
        </div>
        <p className="text-sm mt-2 text-gray-600">
          {(hasDetailedScores ? detailedBuffettScore : buffettScore) >= 75 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
          (hasDetailedScores ? detailedBuffettScore : buffettScore) >= 60 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
          'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
        </p>
      </div>
      
      {/* New Score Visualization */}
      <BuffettScoreChart score={hasDetailedScores ? detailedBuffettScore : buffettScore} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processedCriteria.map((criterion, index) => {
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
                              Mögliche Inkonsistenz zwischen GPT-Analyse und Bewertung:
                              {criterion.title === '1. Verstehbares Geschäftsmodell' && 
                                ' Bei "moderater Komplexität" sollten 2/3 Punkte vergeben werden.'}
                              {criterion.title === '11. Keine Turnarounds' && 
                                ' Bei "leichter Umstrukturierung" sollte 1/3 Punkt vergeben werden.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* DCF explanation for valuation criterion */}
                    {criterion.title === '6. Akzeptable Bewertung' && (
                      <DCFExplanationTooltip />
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
                  
                  {/* Additional risks for long-term outlook */}
                  {criterion.title === '7. Langfristige Perspektive' && criterion.status === 'pass' && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-700 font-medium">Zu beachtende Langzeitrisiken:</p>
                      <ul className="list-disc pl-5 space-y-1 mt-1 text-sm text-gray-600">
                        <li>Mögliche ESG-Regulierungen könnten Rüstungsunternehmen beeinflussen</li>
                        <li>Politische Änderungen könnten Verteidigungsbudgets beeinflussen</li>
                        <li>Technologischer Wandel könnte bestehende Produkte obsolet machen</li>
                      </ul>
                    </div>
                  )}
                  
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
