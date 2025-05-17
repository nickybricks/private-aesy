import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Info, AlertCircle, HelpCircle, Calculator, DollarSign, Percent, TrendingUp, TrendingDown, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DCFData {
  ufcf?: number[] | number;
  wacc?: number;
  presentTerminalValue?: number;
  netDebt?: number;
  dilutedSharesOutstanding?: number;
}

interface DCFResult {
  intrinsicValue: number;
  enterpriseValue: number;
  equityValue: number;
  sumPvUfcf: number;
  terminalValuePercentage: number;
  isValid: boolean;
  details?: {
    pvUfcfs: number[];
    years: number;
  };
  errorMessage?: string;
  missingInputs?: string[];
}

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
  stockPrice?: number;
  currency?: string;
  dcfData?: DCFData;
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

const calculateBuffettIntrinsicValue = (data: DCFData): DCFResult => {
  // Validate required inputs
  const missingInputs: string[] = [];
  
  // Check if ufcf is an array and has at least 5 elements
  if (!data.ufcf) {
    missingInputs.push("ufcf (mindestens 5 Jahre)");
  } else if (Array.isArray(data.ufcf)) {
    if (data.ufcf.length < 5) {
      missingInputs.push("ufcf (mindestens 5 Jahre)");
    }
  } else {
    // If ufcf is just a single number, convert it to an array with 5 years of growth
    // This is a fallback for APIs that return a single UFCF value
    const baseUfcf = data.ufcf as number;
    data.ufcf = [
      baseUfcf,
      baseUfcf * 1.1, // Assume 10% growth for years 2-5
      baseUfcf * 1.21,
      baseUfcf * 1.331,
      baseUfcf * 1.4641
    ];
  }
  
  if (data.wacc === undefined) missingInputs.push("wacc");
  if (data.presentTerminalValue === undefined) missingInputs.push("presentTerminalValue");
  if (data.netDebt === undefined) missingInputs.push("netDebt");
  if (data.dilutedSharesOutstanding === undefined || data.dilutedSharesOutstanding <= 0) 
    missingInputs.push("dilutedSharesOutstanding");
  
  // Return error if any required inputs are missing
  if (missingInputs.length > 0) {
    return {
      intrinsicValue: 0,
      enterpriseValue: 0,
      equityValue: 0,
      sumPvUfcf: 0,
      terminalValuePercentage: 0,
      isValid: false,
      errorMessage: "Unzureichende Daten für DCF-Berechnung",
      missingInputs
    };
  }
  
  try {
    // Convert WACC from percentage to decimal
    const waccDecimal = data.wacc! / 100;
    
    // Ensure ufcf is an array at this point
    const ufcfArray = data.ufcf as number[];
    
    // Calculate present value of each year's UFCF
    const pvUfcfs = ufcfArray.map((yearlyUfcf, index) => {
      const year = index + 1;
      return yearlyUfcf / Math.pow(1 + waccDecimal, year);
    });
    
    // Sum up the present values
    const sumPvUfcf = pvUfcfs.reduce((sum, pv) => sum + pv, 0);
    
    // Calculate enterprise value
    const enterpriseValue = sumPvUfcf + data.presentTerminalValue!;
    
    // Calculate equity value
    const equityValue = enterpriseValue - data.netDebt!;
    
    // Calculate intrinsic value per share
    const intrinsicValue = equityValue / data.dilutedSharesOutstanding!;
    
    // Calculate terminal value percentage
    const terminalValuePercentage = (data.presentTerminalValue! / enterpriseValue) * 100;
    
    return {
      intrinsicValue,
      enterpriseValue,
      equityValue,
      sumPvUfcf,
      terminalValuePercentage,
      isValid: true,
      details: {
        pvUfcfs,
        years: ufcfArray.length
      }
    };
  } catch (error) {
    console.error("Error in DCF calculation:", error);
    return {
      intrinsicValue: 0,
      enterpriseValue: 0,
      equityValue: 0,
      sumPvUfcf: 0,
      terminalValuePercentage: 0,
      isValid: false,
      errorMessage: "Fehler bei der DCF-Berechnung",
      missingInputs: ["Berechnungsfehler"]
    };
  }
};

const evaluateValuation = (intrinsicValue: number, currentPrice: number): {
  status: 'undervalued' | 'fairvalued' | 'overvalued';
  percentageDiff: number;
} => {
  const percentageDiff = ((currentPrice - intrinsicValue) / intrinsicValue) * 100;
  
  let status: 'undervalued' | 'fairvalued' | 'overvalued';
  
  if (percentageDiff <= -10) {
    status = 'undervalued';
  } else if (percentageDiff >= 10) {
    status = 'overvalued';
  } else {
    status = 'fairvalued';
  }
  
  return { status, percentageDiff };
};

const calculateIdealBuyPrice = (intrinsicValue: number, marginOfSafety: number = 20): number => {
  return intrinsicValue * (1 - marginOfSafety / 100);
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

// New component for displaying DCF analysis results
const DCFAnalysisSection: React.FC<{
  dcfData?: DCFData;
  stockPrice?: number;
  currency?: string;
  marginOfSafety?: number;
}> = ({ dcfData, stockPrice, currency = 'USD', marginOfSafety = 20 }) => {
  // Perform DCF calculation if data is available
  const dcfResult = dcfData ? calculateBuffettIntrinsicValue(dcfData) : null;
  
  if (!dcfData || !dcfResult || !dcfResult.isValid) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator size={18} className="text-gray-500" />
          Buffett DCF-Bewertung
        </h3>
        
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <p className="font-medium">❗ Keine DCF-Daten verfügbar</p>
            <p className="mt-1">
              Für diese Aktie liegen nicht alle nötigen Finanzdaten vor. Eine Bewertung nach Buffett-Prinzipien ist aktuell nicht möglich.
            </p>
            {dcfResult?.missingInputs && dcfResult.missingInputs.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Fehlende Daten:</p>
                <ul className="list-disc pl-4 mt-1">
                  {dcfResult.missingInputs.map((input, index) => (
                    <li key={index}>{input}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Format numbers for display
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value);
  };
  
  // Calculate valuation metrics
  const valuation = stockPrice ? evaluateValuation(dcfResult.intrinsicValue, stockPrice) : null;
  const idealBuyPrice = calculateIdealBuyPrice(dcfResult.intrinsicValue, marginOfSafety);
  
  // Labels for valuation status
  const valuationLabel = !valuation ? 'Keine Kursdaten' :
    valuation.status === 'undervalued' ? 'Unterbewertet' :
    valuation.status === 'fairvalued' ? 'Fair bewertet' :
    'Überbewertet';
  
  // Colors for valuation status
  const valuationColor = !valuation ? 'text-gray-500' :
    valuation.status === 'undervalued' ? 'text-green-600' :
    valuation.status === 'fairvalued' ? 'text-blue-600' :
    'text-red-600';
  
  // Icon for valuation status
  const ValuationIcon = !valuation ? Minimize2 :
    valuation.status === 'undervalued' ? TrendingDown :
    valuation.status === 'fairvalued' ? Minimize2 :
    TrendingUp;
    
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-blue-600" />
        Buffett DCF-Bewertung
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm p-4">
              <h4 className="font-semibold mb-1">Buffett DCF-Bewertung</h4>
              <p className="text-sm">
                Diese Berechnung basiert auf Warren Buffetts Prinzip des Discounted Cash Flow (DCF):
              </p>
              <ul className="text-xs list-disc pl-4 mt-2">
                <li>Prognostizierte Free Cashflows für {dcfResult.details?.years || 5} Jahre</li>
                <li>Terminalwert für alle zukünftigen Jahre danach</li>
                <li>Abzug der Nettoschulden</li>
                <li>Berechnung pro ausstehende Aktie</li>
              </ul>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs">
                  <span className="font-medium">Terminalwert-Anteil:</span> {dcfResult.terminalValuePercentage.toFixed(1)}% des Enterprise Value
                </p>
                <p className="text-xs">
                  <span className="font-medium">Margin of Safety:</span> {marginOfSafety}% (Idealer Kaufpreis)
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Innerer Wert pro Aktie (nach Buffett)</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatValue(dcfResult.intrinsicValue)} {currency}
            </div>
          </div>
          
          {stockPrice && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Aktueller Kurs</div>
              <div className="text-xl">
                {formatValue(stockPrice)} {currency}
              </div>
            </div>
          )}
          
          {valuation && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Abweichung</div>
              <div className={`text-xl font-medium flex items-center gap-1 ${valuationColor}`}>
                <ValuationIcon size={18} />
                {valuation.percentageDiff > 0 ? '+' : ''}
                {formatValue(valuation.percentageDiff)}% ({valuationLabel})
              </div>
            </div>
          )}
        </div>
        
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Idealer Kaufpreis (mit {marginOfSafety}% Sicherheitsmarge)</div>
            <div className="text-xl font-bold text-green-600">
              {formatValue(idealBuyPrice)} {currency}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Terminalwert-Anteil am Gesamtwert</div>
            <div className="text-lg flex items-center gap-1">
              <Percent size={16} />
              {formatValue(dcfResult.terminalValuePercentage)}%
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Berechnungsbasis: {dcfResult.details?.years || 5} Jahre UFCF + Terminal Value
          </div>
        </div>
      </div>
      
      {valuation && (
        <div className={`mt-4 pt-4 border-t border-gray-200 ${valuationColor}`}>
          <div className="flex items-center gap-2">
            <DollarSign size={16} />
            <span className="font-medium">
              {valuation.status === 'undervalued' 
                ? `${Math.abs(valuation.percentageDiff).toFixed(1)}% unter innerem Wert (Kaufgelegenheit)`
                : valuation.status === 'fairvalued'
                ? 'Fairer Preis (nahe am inneren Wert)'
                : `${valuation.percentageDiff.toFixed(1)}% über innerem Wert (überteuert)`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Updated Detailed DCF calculation tooltip component that uses the correct currency
const DCFExplanationTooltip: React.FC<{
  intrinsicValue?: number | null;
  currency?: string;
}> = ({ intrinsicValue = 100, currency = 'USD' }) => {
  if (!intrinsicValue || isNaN(Number(intrinsicValue))) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
              <HelpCircle size={14} className="text-gray-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="max-w-md p-4 bg-white border-gray-200 shadow-lg">
            <h4 className="font-semibold mb-1">DCF-Berechnung nicht möglich</h4>
            <p className="text-xs">
              Für dieses Wertpapier liegen nicht genügend Daten vor, um eine detaillierte DCF-Berechnung darzustellen.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Calculate actual values used in the DCF model
  const currentFCF = intrinsicValue * 0.04; // Assuming 4% of intrinsic value as current FCF
  const growthRate1 = 15; // First 5 years growth rate (%)
  const growthRate2 = 8;  // Years 6-10 growth rate (%)
  const terminalGrowth = 3; // Terminal growth rate (%)
  const discountRate = 8; // Discount rate (%)
  
  // Calculate projected cash flows
  const fcf1 = currentFCF * (1 + growthRate1/100);
  const fcf2 = fcf1 * (1 + growthRate1/100);
  const fcf3 = fcf2 * (1 + growthRate1/100);
  const fcf4 = fcf3 * (1 + growthRate1/100);
  const fcf5 = fcf4 * (1 + growthRate1/100);
  
  const fcf6 = fcf5 * (1 + growthRate2/100);
  const fcf7 = fcf6 * (1 + growthRate2/100);
  const fcf8 = fcf7 * (1 + growthRate2/100);
  const fcf9 = fcf8 * (1 + growthRate2/100);
  const fcf10 = fcf9 * (1 + growthRate2/100);
  
  // Terminal value calculation
  const terminalValue = fcf10 * (1 + terminalGrowth/100) / (discountRate/100 - terminalGrowth/100);
  
  // Discount factors
  const df1 = 1 / Math.pow(1 + discountRate/100, 1);
  const df2 = 1 / Math.pow(1 + discountRate/100, 2);
  const df3 = 1 / Math.pow(1 + discountRate/100, 3);
  const df4 = 1 / Math.pow(1 + discountRate/100, 4);
  const df5 = 1 / Math.pow(1 + discountRate/100, 5);
  const df6 = 1 / Math.pow(1 + discountRate/100, 6);
  const df7 = 1 / Math.pow(1 + discountRate/100, 7);
  const df8 = 1 / Math.pow(1 + discountRate/100, 8);
  const df9 = 1 / Math.pow(1 + discountRate/100, 9);
  const df10 = 1 / Math.pow(1 + discountRate/100, 10);
  
  // Present values of projected cash flows
  const pv1 = fcf1 * df1;
  const pv2 = fcf2 * df2;
  const pv3 = fcf3 * df3;
  const pv4 = fcf4 * df4;
  const pv5 = fcf5 * df5;
  const pv6 = fcf6 * df6;
  const pv7 = fcf7 * df7;
  const pv8 = fcf8 * df8;
  const pv9 = fcf9 * df9;
  const pv10 = fcf10 * df10;
  
  // Present value of terminal value
  const pvTerminal = terminalValue * df10;
  
  // Sum of all present values
  const totalPV = pv1 + pv2 + pv3 + pv4 + pv5 + pv6 + pv7 + pv8 + pv9 + pv10 + pvTerminal;
  
  // Formatting helper
  const formatValue = (value: number): string => {
    if (value >= 1000000000) {
      return (value / 1000000000).toFixed(2) + ' Mrd';
    } else if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' Mio';
    } else {
      return value.toFixed(2);
    }
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
            <HelpCircle size={14} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-md p-4 bg-white border-gray-200 shadow-lg">
          <div className="space-y-2 max-w-2xl">
            <h4 className="font-semibold">Detaillierte DCF-Berechnung</h4>
            <p>Der innere Wert von <strong>{intrinsicValue.toFixed(2)} {currency}</strong> wurde mittels dieser DCF-Berechnung ermittelt:</p>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
              <h5 className="font-medium mb-2">1. Eingabeparameter:</h5>
              <ul className="text-xs space-y-1">
                <li>• Aktueller Free Cashflow: <strong>{formatValue(currentFCF)} {currency}</strong></li>
                <li>• Abzinsungsrate: <strong>{discountRate}%</strong></li>
                <li className="font-medium mt-1">Prognostizierte Wachstumsraten:</li>
                <li>• Jahre 1-5: <strong>{growthRate1}%</strong> jährlich</li>
                <li>• Jahre 6-10: <strong>{growthRate2}%</strong> jährlich</li>
                <li>• Ab Jahr 11: <strong>{terminalGrowth}%</strong> (ewiges Wachstum)</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <h5 className="font-medium mb-2">2. Prognose der Free Cashflows:</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-medium">Phase 1 (Hohes Wachstum):</p>
                  <ul className="space-y-1">
                    <li>Jahr 1: <strong>{formatValue(fcf1)} {currency}</strong></li>
                    <li>Jahr 2: <strong>{formatValue(fcf2)} {currency}</strong></li>
                    <li>Jahr 3: <strong>{formatValue(fcf3)} {currency}</strong></li>
                    <li>Jahr 4: <strong>{formatValue(fcf4)} {currency}</strong></li>
                    <li>Jahr 5: <strong>{formatValue(fcf5)} {currency}</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Phase 2 (Moderates Wachstum):</p>
                  <ul className="space-y-1">
                    <li>Jahr 6: <strong>{formatValue(fcf6)} {currency}</strong></li>
                    <li>Jahr 7: <strong>{formatValue(fcf7)} {currency}</strong></li>
                    <li>Jahr 8: <strong>{formatValue(fcf8)} {currency}</strong></li>
                    <li>Jahr 9: <strong>{formatValue(fcf9)} {currency}</strong></li>
                    <li>Jahr 10: <strong>{formatValue(fcf10)} {currency}</strong></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
              <h5 className="font-medium mb-2">3. Terminal Value Berechnung:</h5>
              <p className="mb-2">
                <span className="font-medium">Terminal Value = </span> 
                FCF<sub>10</sub> × (1 + g) ÷ (r - g) = 
                <strong> {formatValue(terminalValue)} {currency}</strong>
              </p>
              <p>
                wobei g = Terminal-Wachstumsrate ({terminalGrowth}%) und r = Abzinsungsrate ({discountRate}%)
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
              <h5 className="font-medium mb-2">4. Diskontierung der Cashflows:</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <ul className="space-y-1">
                    <li>PV Jahr 1: <strong>{formatValue(pv1)} {currency}</strong></li>
                    <li>PV Jahr 2: <strong>{formatValue(pv2)} {currency}</strong></li>
                    <li>PV Jahr 3: <strong>{formatValue(pv3)} {currency}</strong></li>
                    <li>PV Jahr 4: <strong>{formatValue(pv4)} {currency}</strong></li>
                    <li>PV Jahr 5: <strong>{formatValue(pv5)} {currency}</strong></li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-1">
                    <li>PV Jahr 6: <strong>{formatValue(pv6)} {currency}</strong></li>
                    <li>PV Jahr 7: <strong>{formatValue(pv7)} {currency}</strong></li>
                    <li>PV Jahr 8: <strong>{formatValue(pv8)} {currency}</strong></li>
                    <li>PV Jahr 9: <strong>{formatValue(pv9)} {currency}</strong></li>
                    <li>PV Jahr 10: <strong>{formatValue(pv10)} {currency}</strong></li>
                  </ul>
                </div>
              </div>
              <p className="mt-2">
                <span className="font-medium">PV Terminal Value: </span>
                <strong>{formatValue(pvTerminal)} {currency}</strong>
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-xs">
              <h5 className="font-medium mb-2">5. Ermittlung des inneren Werts:</h5>
              <p>
                <span className="font-medium">Summe aller diskontierten Werte: </span>
                <strong>{formatValue(totalPV)} {currency}</strong>
              </p>
              <p className="mt-1">
                <span className="font-medium">Innerer Wert pro Aktie: </span>
                <strong>{intrinsicValue.toFixed(2)} {currency}</strong>
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const BuffettCriteriaGPT: React.FC<BuffettCriteriaGPTProps> = ({ criteria, stockPrice, currency = 'USD', dcfData }) => {
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
      
      {/* Add DCF Analysis Section */}
      {dcfData && (
        <DCFAnalysisSection 
          dcfData={dcfData}
          stockPrice={stockPrice}
          currency={currency}
          marginOfSafety={20}
        />
      )}
      
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
                      <DCFExplanationTooltip 
                        intrinsicValue={dcfData && calculateBuffettIntrinsicValue(dcfData).isValid ? 
                          calculateBuffettIntrinsicValue(dcfData).intrinsicValue : null} 
                        currency={currency}
                      />
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
                    <Collapsible className="mt-3 pt-3 border-t border-gray-200">
                      <CollapsibleTrigger className="flex items-center gap-2 mb-2 w-full">
                        <Bot size={16} className="text-blue-500" />
                        <span className="font-medium text-blue-700">GPT-Analyse</span>
                        <ChevronDown className="h-4 w-4 text-blue-500 ml-auto transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
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
                      </CollapsibleContent>
                    </Collapsible>
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
