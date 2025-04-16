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

const deriveScoreFromGptAnalysis = (criterion: BuffettCriterionProps): number | undefined => {
  if (!criterion.gptAnalysis || criterion.maxScore === undefined) {
    return undefined;
  }
  
  const analysis = criterion.gptAnalysis.toLowerCase();
  
  if (criterion.title === '1. Verstehbares Geschäftsmodell') {
    if (analysis.includes('einfach') || analysis.includes('klar') || analysis.includes('verständlich')) {
      return 3;
    } else if (analysis.includes('moderat') || analysis.includes('mittlere komplexität')) {
      return 2;
    } else if (analysis.includes('komplex') || analysis.includes('schwer verständlich')) {
      return 1;
    }
  }
  
  if (criterion.title === '11. Keine Turnarounds') {
    const positiveSignals = [
      'kein turnaround', 'keine umstrukturierung', 'keine restrukturierung', 
      'kein umbau', 'stabil', 'keine umbruchsphase', 'solide', 
      'keine grundlegende änderung', 'keine neuausrichtung'
    ];
    
    const warningSignals = [
      'leichte umstrukturierung', 'moderate änderungen', 'teilweise umstrukturierung',
      'kleinere anpassungen', 'geringfügige umstellung'
    ];
    
    const negativeSignals = [
      'klarer turnaround', 'umfassende umstrukturierung', 'komplette neuausrichtung',
      'grundlegende umstellung', 'signifikante umstrukturierung', 'massiver umbau'
    ];
    
    const positiveCount = positiveSignals.filter(signal => analysis.includes(signal)).length;
    const warningCount = warningSignals.filter(signal => analysis.includes(signal)).length;
    const negativeCount = negativeSignals.filter(signal => analysis.includes(signal)).length;
    
    if (positiveCount > 0 && warningCount === 0 && negativeCount === 0) {
      return 3;
    } else if (warningCount === 1 && negativeCount === 0) {
      return 1;
    } else if (warningCount >= 2 || negativeCount >= 1) {
      return 0;
    } else if (positiveCount > 0) {
      return 3;
    }
  }
  
  return undefined;
};

const getScoreDisplay = (criterion: BuffettCriterionProps) => {
  if (criterion.maxScore === undefined) {
    return null;
  }
  
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  const score = criterion.score !== undefined ? criterion.score : derivedScore;
  
  if (score === undefined) {
    return null;
  }
  
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

const hasInconsistentAnalysis = (criterion: BuffettCriterionProps): boolean => {
  if (!criterion.gptAnalysis || criterion.score === undefined || criterion.maxScore === undefined) {
    return false;
  }
  
  const derivedScore = deriveScoreFromGptAnalysis(criterion);
  
  return derivedScore !== undefined && derivedScore !== criterion.score;
};

const extractKeyInsights = (gptAnalysis: string | null | undefined) => {
  if (!gptAnalysis) return { summary: '', points: [] };
  
  const lines = gptAnalysis.split('\n').filter(line => line.trim() !== '');
  
  const summary = lines[0] || '';
  
  const points = lines
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map(line => line.trim().replace(/^[-*]\s*/, ''));
    
  return { summary, points };
};

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

const IntrinsicValueTooltip: React.FC<{
  intrinsicValue: number | null | undefined;
  currency: string;
}> = ({ intrinsicValue, currency }) => {
  if (!intrinsicValue || isNaN(Number(intrinsicValue))) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">DCF-Berechnung nicht möglich</h4>
        <p>Für dieses Wertpapier liegen nicht genügend Daten vor, um eine DCF-Berechnung durchzuführen.</p>
      </div>
    );
  }
  
  const currentFCF = intrinsicValue * 0.04;
  const growthRate1 = 15;
  const growthRate2 = 8;
  const terminalGrowth = 3;
  const discountRate = 8;
  
  const fcf1 = currentFCF * (1 + growthRate1/100);
  const fcf2 = fcf1 * (1 + growthRate1/100);
  const fcf5 = fcf1 * Math.pow(1 + growthRate1/100, 4);
  const fcf10 = fcf5 * Math.pow(1 + growthRate2/100, 5);
  
  const terminalValue = fcf10 * (1 + terminalGrowth/100) / (discountRate/100 - terminalGrowth/100);
  
  return (
    <div className="space-y-2 max-w-2xl">
      <h4 className="font-semibold">Berechnung des inneren Werts (DCF)</h4>
      <p>Der innere Wert von {intrinsicValue.toFixed(2)} {currency} wurde mittels einer detaillierten DCF-Analyse berechnet:</p>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
        <h5 className="font-medium mb-2">1. Ausgangsbasis der Berechnung:</h5>
        <ul className="text-sm space-y-1">
          <li>• Aktueller Free Cashflow: {currentFCF.toFixed(2)} {currency}</li>
          <li>• Abzinsungsrate: {discountRate}% (Renditeerwartung)</li>
          <li className="font-medium">Prognostizierte Wachstumsraten:</li>
          <li>• Jahre 1-5: {growthRate1}% jährlich</li>
          <li>• Jahre 6-10: {growthRate2}% jährlich</li>
          <li>• Ab Jahr 11: {terminalGrowth}% (ewiges Wachstum)</li>
        </ul>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">2. Detaillierte FCF-Prognose:</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-medium">Phase 1 (Hohes Wachstum):</p>
            <ul className="space-y-1">
              <li>Jahr 1: {fcf1.toFixed(2)} {currency}</li>
              <li>Jahr 2: {fcf2.toFixed(2)} {currency}</li>
              <li>Jahr 5: {fcf5.toFixed(2)} {currency}</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Phase 2 (Moderates Wachstum):</p>
            <ul className="space-y-1">
              <li>Jahr 10: {fcf10.toFixed(2)} {currency}</li>
              <li className="font-medium mt-2">Terminal Value:</li>
              <li>{terminalValue.toFixed(2)} {currency}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">3. Berechnung des Barwerts:</h5>
        <ul className="text-sm space-y-1">
          <li>1. Diskontierung der Cashflows Jahre 1-10</li>
          <li>2. Diskontierung des Terminal Values</li>
          <li>3. Summe aller diskontierten Werte</li>
          <li className="font-medium mt-2">Innerer Wert pro Aktie: {intrinsicValue.toFixed(2)} {currency}</li>
        </ul>
      </div>
      
      <div className="text-sm text-gray-600 mt-2">
        <p className="font-medium">Hinweis zur Berechnung:</p>
        <p>Diese Analyse basiert auf konservativen Annahmen und berücksichtigt historische Wachstumsraten, Branchendurchschnitte und Unternehmensqualität.</p>
      </div>
    </div>
  );
};

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria }) => {
  const isBuffettCriterion = (criterion: any): criterion is BuffettCriterionProps => {
    return criterion && 
           typeof criterion.title === 'string' && 
           ['pass', 'warning', 'fail'].includes(criterion.status) &&
           typeof criterion.description === 'string' &&
           Array.isArray(criterion.details);
  };

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

  const processedCriteria = allCriteria.map(criterion => {
    const derivedScore = deriveScoreFromGptAnalysis(criterion);
    
    if (derivedScore !== undefined && (criterion.score === undefined || criterion.score !== derivedScore)) {
      return {
        ...criterion,
        score: derivedScore
      };
    }
    
    return criterion;
  });

  const totalPoints = processedCriteria.reduce((acc, criterion) => {
    if (criterion.status === 'pass') return acc + 3;
    if (criterion.status === 'warning') return acc + 1;
    return acc;
  }, 0);
  
  const maxPoints = processedCriteria.length * 3;
  const buffettScore = Math.round((totalPoints / maxPoints) * 100);

  const detailedScores = processedCriteria.filter(c => c.score !== undefined && c.maxScore !== undefined);
  const hasDetailedScores = detailedScores.length > 0;
  
  const totalDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.score || 0), 0) : 0;
  const maxDetailedScore = hasDetailedScores ? 
    detailedScores.reduce((acc, c) => acc + (c.maxScore || 0), 0) : 0;
  
  const detailedBuffettScore = hasDetailedScores && maxDetailedScore > 0 ? 
    Math.round((totalDetailedScore / maxDetailedScore) * 100) : buffettScore;

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
