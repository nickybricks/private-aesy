
import React from 'react';
import { 
  AlertTriangle,
  Info,
  DollarSign,
  Calculator,
  Percent,
  TrendingUp,
  TrendingDown,
  Minimize2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { 
  IntrinsicValueCalcResult, 
  IntrinsicValueResult,
  IntrinsicValueError,
  evaluateValuation 
} from '@/utils/buffettIntrinsicValue';

interface BuffettDCFAnalysisProps {
  dcfResult: IntrinsicValueCalcResult;
  currentPrice: number | null;
  currency: string;
  marginOfSafety?: number;
}

const BuffettDCFAnalysis: React.FC<BuffettDCFAnalysisProps> = ({ 
  dcfResult, 
  currentPrice, 
  currency, 
  marginOfSafety = 20 
}) => {
  if (!dcfResult.isValid) {
    const errorResult = dcfResult as IntrinsicValueError;
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-buffett-yellow" />
          Buffett DCF-Bewertung
        </h3>
        
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            <p className="font-medium">❗ Keine DCF-Daten verfügbar</p>
            <p className="mt-1">
              Für diese Aktie liegen nicht alle nötigen Finanzdaten vor. Eine Bewertung nach Buffett-Prinzipien ist aktuell nicht möglich.
            </p>
            {errorResult.missingInputs && errorResult.missingInputs.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Fehlende Daten:</p>
                <ul className="list-disc pl-4 mt-1">
                  {errorResult.missingInputs.map((input, index) => (
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
  
  const result = dcfResult as IntrinsicValueResult;
  
  // Format numbers for display
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value);
  };
  
  // Calculate valuation metrics
  const valuation = currentPrice ? evaluateValuation(result.intrinsicValue, currentPrice) : null;
  const idealBuyPrice = result.intrinsicValue * (1 - marginOfSafety / 100);
  
  // Labels for valuation status
  const valuationLabel = !valuation ? 'Keine Kursdaten' :
    valuation.status === 'undervalued' ? 'Unterbewertet' :
    valuation.status === 'fairvalued' ? 'Fair bewertet' :
    'Überbewertet';
  
  // Colors for valuation status
  const valuationColor = !valuation ? 'text-gray-500' :
    valuation.status === 'undervalued' ? 'text-buffett-green' :
    valuation.status === 'fairvalued' ? 'text-buffett-blue' :
    'text-buffett-red';
  
  // Icon for valuation status
  const ValuationIcon = !valuation ? Minimize2 :
    valuation.status === 'undervalued' ? TrendingDown :
    valuation.status === 'fairvalued' ? Minimize2 :
    TrendingUp;
  
  const DCFExplanationTooltip: React.FC = () => (
    <TooltipContent className="max-w-sm p-4">
      <h4 className="font-semibold mb-1">Buffett DCF-Bewertung</h4>
      <p className="text-sm">
        Diese Berechnung basiert auf Warren Buffetts Prinzip des Discounted Cash Flow (DCF):
      </p>
      <ul className="text-xs list-disc pl-4 mt-2">
        <li>Prognostizierte Free Cashflows für {result.details.years} Jahre</li>
        <li>Terminalwert für alle zukünftigen Jahre danach</li>
        <li>Abzug der Nettoschulden</li>
        <li>Berechnung pro ausstehende Aktie</li>
      </ul>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <p className="text-xs">
          <span className="font-medium">Terminalwert-Anteil:</span> {result.terminalValuePercentage.toFixed(1)}% des Enterprise Value
        </p>
        <p className="text-xs">
          <span className="font-medium">Margin of Safety:</span> {marginOfSafety}% (Idealer Kaufpreis)
        </p>
      </div>
    </TooltipContent>
  );

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-buffett-blue" />
        Buffett DCF-Bewertung
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </TooltipTrigger>
            <DCFExplanationTooltip />
          </Tooltip>
        </TooltipProvider>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Innerer Wert pro Aktie (nach Buffett)</div>
            <div className="text-2xl font-bold text-buffett-blue">
              {formatValue(result.intrinsicValue)} {currency}
            </div>
          </div>
          
          {currentPrice && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Aktueller Kurs</div>
              <div className="text-xl">
                {formatValue(currentPrice)} {currency}
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
            <div className="text-xl font-bold text-buffett-green">
              {formatValue(idealBuyPrice)} {currency}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">Terminalwert-Anteil am Gesamtwert</div>
            <div className="text-lg flex items-center gap-1">
              <Percent size={16} />
              {formatValue(result.terminalValuePercentage)}%
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Berechnungsbasis: {result.details.years} Jahre UFCF + Terminal Value
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

export default BuffettDCFAnalysis;
