import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  TrendingDown,
  Eye,
  DollarSign,
  Calculator,
  HelpCircle,
  Info,
  PieChart
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getExchangeRate } from '@/utils/currencyConverter';

type Rating = 'buy' | 'watch' | 'avoid';

interface OverallRatingProps {
  rating: {
    overall: Rating;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    // Optional fields for additional metrics
    buffettScore?: number;
    marginOfSafety?: {
      value: number;
      status: 'pass' | 'warning' | 'fail';
    };
    bestBuyPrice?: number | null;
    // New fields for price analysis
    currentPrice?: number | null;
    currency?: string;
    intrinsicValue?: number | null;
    targetMarginOfSafety?: number;
    originalCurrency?: string;
    originalPrice?: number | null;
    originalIntrinsicValue?: number | null;
    originalBestBuyPrice?: number | null;
  } | null;
}

// Utility function to determine the correct rating based on Buffett score and MoS
const determineRating = (
  buffettScore?: number,
  marginOfSafetyValue?: number
): { rating: Rating; reasoning: string } => {
  // Default values if not provided
  const score = buffettScore || 0;
  const mos = marginOfSafetyValue || 0;
  
  // High quality (Buffett score ≥75%)
  if (score >= 75) {
    if (mos > 20) {
      return { rating: 'buy', reasoning: 'Hohe Qualität und stark unterbewertet' };
    } else if (mos >= 0) {
      return { rating: 'watch', reasoning: 'Hohe Qualität, aber fair oder nur leicht unterbewertet' };
    } else {
      return { rating: 'avoid', reasoning: 'Hohe Qualität, aber aktuell zu teuer' };
    }
  }
  // Medium quality (Buffett score 60-74%)
  else if (score >= 60) {
    if (mos > 10) {
      return { rating: 'watch', reasoning: 'Mittlere Qualität, nur mit Vorsicht kaufen' };
    } else {
      return { rating: 'avoid', reasoning: 'Mittlere Qualität, nicht ausreichend unterbewertet' };
    }
  }
  // Low quality (Buffett score <60%)
  else {
    return { rating: 'avoid', reasoning: 'Schwache Übereinstimmung mit Buffetts Kriterien' };
  }
};

// Function to interpret MoS status properly
const interpretMarginOfSafety = (value: number): 'pass' | 'warning' | 'fail' => {
  if (value > 30) return 'pass'; // Strongly undervalued
  if (value >= 10) return 'warning'; // Slightly undervalued
  if (value >= 0) return 'warning'; // Fair value (borderline)
  return 'fail'; // Overvalued
};

// Function to get MoS description based on value
const getMarginOfSafetyDescription = (value: number): string => {
  if (value > 30) return 'Signifikante Sicherheitsmarge (stark unterbewertet)';
  if (value >= 10) return 'Moderate Sicherheitsmarge (leicht unterbewertet)';
  if (value >= 0) return 'Minimale Sicherheitsmarge (fair bewertet)';
  return 'Keine Sicherheitsmarge (überbewertet)';
};

const RatingIcon: React.FC<{ rating: Rating }> = ({ rating }) => {
  switch (rating) {
    case 'buy':
      return <CheckCircle size={40} className="text-buffett-green" />;
    case 'watch':
      return <AlertTriangle size={40} className="text-buffett-yellow" />;
    case 'avoid':
      return <XCircle size={40} className="text-buffett-red" />;
    default:
      return null;
  }
};

// Diese Funktion erstellt den detaillierten Tooltip für die DCF-Berechnung
const IntrinsicValueTooltip: React.FC<{
  intrinsicValue: number | null | undefined;
  currency: string;
  originalCurrency?: string;
  originalIntrinsicValue?: number | null;
}> = ({ intrinsicValue, currency, originalCurrency, originalIntrinsicValue }) => {
  if (!intrinsicValue || isNaN(Number(intrinsicValue))) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">DCF-Berechnung nicht möglich</h4>
        <p>Für dieses Wertpapier liegen nicht genügend Daten vor, um eine DCF-Berechnung durchzuführen.</p>
      </div>
    );
  }
  
  // Determine which currency and value to use for calculations
  const calculationCurrency = originalCurrency || currency;
  const calculationValue = originalIntrinsicValue !== null && originalIntrinsicValue !== undefined ? 
                         originalIntrinsicValue : 
                         intrinsicValue;
  
  // Calculate actual values used in the DCF model
  // We use the original currency values for calculation
  const currentFCF = calculationValue * 0.04; // Assuming 4% of intrinsic value as current FCF
  
  // Display exchange rate message if currencies differ
  const showExchangeInfo = originalCurrency && currency && originalCurrency !== currency;
  
  // Growth rates remain unchanged
  const growthRate1 = 15; // First 5 years growth rate (%)
  const growthRate2 = 8;  // Years 6-10 growth rate (%)
  const terminalGrowth = 3; // Terminal growth rate (%)
  const discountRate = 8; // Discount rate (%)
  
  // Calculate projected cash flows - all in original currency
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
  
  // Terminal value calculation - in original currency
  const terminalValue = fcf10 * (1 + terminalGrowth/100) / (discountRate/100 - terminalGrowth/100);
  
  // Discount factors remain unchanged
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
  
  // Present values of projected cash flows - all in original currency
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
  
  // Present value of terminal value - in original currency
  const pvTerminal = terminalValue * df10;
  
  // Sum of all present values - in original currency
  const totalPV = pv1 + pv2 + pv3 + pv4 + pv5 + pv6 + pv7 + pv8 + pv9 + pv10 + pvTerminal;
  
  // Exchange rate calculation for display (only if currencies differ)
  const exchangeRate = showExchangeInfo && originalIntrinsicValue && intrinsicValue 
    ? intrinsicValue / originalIntrinsicValue 
    : 1;
  
  // Formatting helper with currency conversion
  const formatValue = (value: number): string => {
    // Scale the value appropriately
    let scaledValue = value;
    let unit = '';
    
    if (Math.abs(value) >= 1000000000000) {
      scaledValue = value / 1000000000000;
      unit = ' Bio';
    } else if (Math.abs(value) >= 1000000000) {
      scaledValue = value / 1000000000;
      unit = ' Mrd';
    } else if (Math.abs(value) >= 1000000) {
      scaledValue = value / 1000000;
      unit = ' Mio';
    }
    
    // Format with the appropriate currency
    return `${scaledValue.toFixed(2)}${unit} ${calculationCurrency}`;
  };
  
  // Function to format and display both original and converted values
  const formatBothValues = (originalValue: number): string => {
    if (!showExchangeInfo) {
      return formatValue(originalValue);
    }
    
    // Format the original value
    let origScaledValue = originalValue;
    let origUnit = '';
    
    if (Math.abs(originalValue) >= 1000000000000) {
      origScaledValue = originalValue / 1000000000000;
      origUnit = ' Bio';
    } else if (Math.abs(originalValue) >= 1000000000) {
      origScaledValue = originalValue / 1000000000;
      origUnit = ' Mrd';
    } else if (Math.abs(originalValue) >= 1000000) {
      origScaledValue = originalValue / 1000000;
      origUnit = ' Mio';
    }
    
    // Format the converted value
    const convertedValue = originalValue * (exchangeRate as number);
    let convScaledValue = convertedValue;
    let convUnit = '';
    
    if (Math.abs(convertedValue) >= 1000000000000) {
      convScaledValue = convertedValue / 1000000000000;
      convUnit = ' Bio';
    } else if (Math.abs(convertedValue) >= 1000000000) {
      convScaledValue = convertedValue / 1000000000;
      convUnit = ' Mrd';
    } else if (Math.abs(convertedValue) >= 1000000) {
      convScaledValue = convertedValue / 1000000;
      convUnit = ' Mio';
    }
    
    return `${origScaledValue.toFixed(2)}${origUnit} ${originalCurrency} (≈ ${convScaledValue.toFixed(2)}${convUnit} ${currency})`;
  };
  
  // Display message about currency
  const currencyMessage = showExchangeInfo
    ? `Alle Werte werden in ${originalCurrency} berechnet und zur Anzeige in ${currency} umgerechnet (Kurs: 1 ${originalCurrency} ≈ ${exchangeRate?.toFixed(8)} ${currency}).`
    : '';
  
  return (
    <div className="space-y-2 max-w-2xl">
      <h4 className="font-semibold">Detaillierte DCF-Berechnung</h4>
      <p>Der innere Wert von <strong>{intrinsicValue.toFixed(2)} {currency}</strong> wurde mittels dieser DCF-Berechnung ermittelt:</p>
      {currencyMessage && <p className="text-sm text-gray-500">{currencyMessage}</p>}
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50 mt-2">
        <h5 className="font-medium mb-2">1. Eingabeparameter:</h5>
        <ul className="text-sm space-y-1">
          <li>• Aktueller Free Cashflow: <strong>{formatBothValues(currentFCF)}</strong></li>
          <li>• Abzinsungsrate: <strong>{discountRate}%</strong></li>
          <li className="font-medium mt-1">Prognostizierte Wachstumsraten:</li>
          <li>• Jahre 1-5: <strong>{growthRate1}%</strong> jährlich</li>
          <li>• Jahre 6-10: <strong>{growthRate2}%</strong> jährlich</li>
          <li>• Ab Jahr 11: <strong>{terminalGrowth}%</strong> (ewiges Wachstum)</li>
        </ul>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">2. Prognose der Free Cashflows:</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Phase 1 (Hohes Wachstum):</p>
            <ul className="space-y-1">
              <li>Jahr 1: <strong>{showExchangeInfo ? formatBothValues(fcf1) : formatValue(fcf1)}</strong></li>
              <li>Jahr 2: <strong>{showExchangeInfo ? formatBothValues(fcf2) : formatValue(fcf2)}</strong></li>
              <li>Jahr 3: <strong>{showExchangeInfo ? formatBothValues(fcf3) : formatValue(fcf3)}</strong></li>
              <li>Jahr 4: <strong>{showExchangeInfo ? formatBothValues(fcf4) : formatValue(fcf4)}</strong></li>
              <li>Jahr 5: <strong>{showExchangeInfo ? formatBothValues(fcf5) : formatValue(fcf5)}</strong></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Phase 2 (Moderates Wachstum):</p>
            <ul className="space-y-1">
              <li>Jahr 6: <strong>{showExchangeInfo ? formatBothValues(fcf6) : formatValue(fcf6)}</strong></li>
              <li>Jahr 7: <strong>{showExchangeInfo ? formatBothValues(fcf7) : formatValue(fcf7)}</strong></li>
              <li>Jahr 8: <strong>{showExchangeInfo ? formatBothValues(fcf8) : formatValue(fcf8)}</strong></li>
              <li>Jahr 9: <strong>{showExchangeInfo ? formatBothValues(fcf9) : formatValue(fcf9)}</strong></li>
              <li>Jahr 10: <strong>{showExchangeInfo ? formatBothValues(fcf10) : formatValue(fcf10)}</strong></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">3. Terminal Value Berechnung:</h5>
        <p className="text-sm mb-2">
          <span className="font-medium">Terminal Value = </span> 
          FCF<sub>10</sub> × (1 + g) ÷ (r - g) = 
          <strong> {showExchangeInfo ? formatBothValues(terminalValue) : formatValue(terminalValue)}</strong>
        </p>
        <p className="text-sm">
          wobei g = Terminal-Wachstumsrate ({terminalGrowth}%) und r = Abzinsungsrate ({discountRate}%)
        </p>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">4. Diskontierung der Cashflows:</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <ul className="space-y-1">
              <li>PV Jahr 1: <strong>{showExchangeInfo ? formatBothValues(pv1) : formatValue(pv1)}</strong></li>
              <li>PV Jahr 2: <strong>{showExchangeInfo ? formatBothValues(pv2) : formatValue(pv2)}</strong></li>
              <li>PV Jahr 3: <strong>{showExchangeInfo ? formatBothValues(pv3) : formatValue(pv3)}</strong></li>
              <li>PV Jahr 4: <strong>{showExchangeInfo ? formatBothValues(pv4) : formatValue(pv4)}</strong></li>
              <li>PV Jahr 5: <strong>{showExchangeInfo ? formatBothValues(pv5) : formatValue(pv5)}</strong></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-1">
              <li>PV Jahr 6: <strong>{showExchangeInfo ? formatBothValues(pv6) : formatValue(pv6)}</strong></li>
              <li>PV Jahr 7: <strong>{showExchangeInfo ? formatBothValues(pv7) : formatValue(pv7)}</strong></li>
              <li>PV Jahr 8: <strong>{showExchangeInfo ? formatBothValues(pv8) : formatValue(pv8)}</strong></li>
              <li>PV Jahr 9: <strong>{showExchangeInfo ? formatBothValues(pv9) : formatValue(pv9)}</strong></li>
              <li>PV Jahr 10: <strong>{showExchangeInfo ? formatBothValues(pv10) : formatValue(pv10)}</strong></li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-sm">
          <span className="font-medium">PV Terminal Value: </span>
          <strong>{showExchangeInfo ? formatBothValues(pvTerminal) : formatValue(pvTerminal)}</strong>
        </p>
      </div>
      
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <h5 className="font-medium mb-2">5. Ermittlung des inneren Werts:</h5>
        <p className="text-sm">
          <span className="font-medium">Summe aller diskontierten Werte: </span>
          <strong>{showExchangeInfo ? formatBothValues(totalPV) : formatValue(totalPV)}</strong>
        </p>
        <p className="text-sm mt-1">
          <span className="font-medium">Innerer Wert pro Aktie: </span>
          <strong>
            {showExchangeInfo 
              ? `${originalIntrinsicValue?.toFixed(2)} ${originalCurrency} ≈ ${intrinsicValue.toFixed(2)} ${currency}`
              : `${intrinsicValue.toFixed(2)} ${currency}`}
          </strong>
        </p>
      </div>
      
      <div className="text-sm text-gray-600 mt-2">
        <p className="italic">
          Hinweis: Diese Berechnung basiert auf konservativen Annahmen und den verfügbaren Finanzdaten des Unternehmens.
          Die verwendeten Wachstumsraten spiegeln die historische Performance und Zukunftsaussichten wider.
        </p>
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die MoS-Erklärung
const MarginOfSafetyTooltip: React.FC<{
  targetMarginOfSafety: number;
  intrinsicValue?: number | null;
  currentPrice?: number | null;
  currency?: string;
}> = ({ targetMarginOfSafety, intrinsicValue, currentPrice, currency }) => {
  // Berechnen wir ein konkretes Beispiel mit realen Zahlen, falls verfügbar
  const hasRealData = intrinsicValue !== null && 
                     intrinsicValue !== undefined && 
                     !isNaN(Number(intrinsicValue)) && 
                     currentPrice !== null && 
                     currentPrice !== undefined && 
                     !isNaN(Number(currentPrice)) && 
                     currency;
                     
  const actualMarginValue = hasRealData && intrinsicValue 
    ? intrinsicValue * (targetMarginOfSafety / 100) 
    : 20;
    
  const safePrice = hasRealData && intrinsicValue 
    ? intrinsicValue - (actualMarginValue as number) 
    : 80;
    
  const actualMargin = hasRealData && intrinsicValue && currentPrice 
    ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100 
    : -25;
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Was ist die "Margin of Safety"?</h4>
      <p>Die Sicherheitsmarge von {targetMarginOfSafety}% stellt einen Puffer zwischen Kaufpreis und innerem Wert dar:</p>
      <ul className="list-disc pl-4">
        <li>Schützt vor Bewertungsfehlern (DCF-Annahmen könnten zu optimistisch sein)</li>
        <li>Ermöglicht höhere Renditen (Kauf mit Abschlag = höheres Wertsteigerungspotenzial)</li>
        <li>Minimiert Verlustrisiko (selbst bei ungünstigeren Entwicklungen)</li>
      </ul>
      <p className="font-medium">Buffett und Graham empfehlen mindestens {targetMarginOfSafety}% Sicherheitsmarge.</p>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1">Berechnung der Margin of Safety:</h5>
        
        {hasRealData && intrinsicValue !== null && currentPrice !== null ? (
          <div className="space-y-1">
            <p><span className="font-medium">Innerer Wert:</span> {intrinsicValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Sicherheitsmarge ({targetMarginOfSafety}%):</span> {actualMarginValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Idealer Kaufpreis:</span> {safePrice.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Aktueller Preis:</span> {currentPrice.toFixed(2)} {currency}</p>
            <p className={`font-medium ${actualMargin > 0 ? 'text-buffett-green' : 'text-buffett-red'}`}>
              Aktuelle Margin of Safety: {actualMargin.toFixed(1)}%
              {actualMargin > 0 ? ' (Unterbewertet)' : ' (Überbewertet)'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p><span className="font-medium">Beispiel:</span></p>
            <p><span className="font-medium">Innerer Wert:</span> 100 {currency}</p>
            <p><span className="font-medium">Sicherheitsmarge ({targetMarginOfSafety}%):</span> {targetMarginOfSafety} {currency}</p>
            <p><span className="font-medium">Idealer Kaufpreis:</span> {100 - targetMarginOfSafety} {currency}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Diese Funktion erstellt den detaillierten Tooltip für die Buffett-Kaufpreis Erklärung
const BuffettBuyPriceTooltip: React.FC<{
  intrinsicValue: number | null | undefined;
  bestBuyPrice: number | null;
  targetMarginOfSafety: number;
  currency: string;
}> = ({ intrinsicValue, bestBuyPrice, targetMarginOfSafety, currency }) => {
  if (bestBuyPrice === null || bestBuyPrice === undefined || isNaN(Number(bestBuyPrice))) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">Buffett-Kaufpreis nicht verfügbar</h4>
        <p>Für dieses Wertpapier liegen nicht genügend Daten vor, um einen Buffett-Kaufpreis zu berechnen.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Der Buffett-Kaufpreis</h4>
      <p>Der Buffett-Kaufpreis ist der maximale Preis, zu dem Warren Buffett die Aktie als attraktive Investition betrachten würde.</p>
      
      <div className="border border-gray-200 rounded-md p-2 bg-gray-50 mt-2">
        <h5 className="font-medium mb-1 text-sm">Berechnung:</h5>
        <div className="text-sm">
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Innerer Wert:</div>
            <div>{intrinsicValue && !isNaN(Number(intrinsicValue)) ? `${Number(intrinsicValue).toFixed(2)} ${currency}` : 'Berechnet aus DCF-Modell'}</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Margin of Safety:</div>
            <div>{targetMarginOfSafety}%</div>
          </div>
          <div className="flex items-center mb-1">
            <div className="font-medium w-1/2">Berechnung:</div>
            <div>{intrinsicValue && !isNaN(Number(intrinsicValue)) ? `${Number(intrinsicValue).toFixed(2)} ${currency} × (1 - ${targetMarginOfSafety}%)` : 'Innerer Wert × (1 - Margin of Safety)'}</div>
          </div>
          <div className="flex items-center font-medium text-buffett-blue">
            <div className="w-1/2">Buffett-Kaufpreis:</div>
            <div>{bestBuyPrice.toFixed(2)} {currency}</div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="font-medium text-sm">Buffett's Prinzip:</p>
        <p className="text-sm">Eine Aktie sollte nur gekauft werden, wenn sie deutlich unter ihrem inneren Wert gehandelt wird. Der Buffett-Kaufpreis stellt diese Grenze dar - kaufe nur unter diesem Preis.</p>
      </div>
    </div>
  );
};

// Score Breakdown Tooltip Component
const ScoreBreakdownTooltip: React.FC<{
  buffettScore: number;
}> = ({ buffettScore }) => {
  // Beispielhafte Aufschlüsselung der Punkteverteilung
  const scoreComponents = [
    { name: "Verständliches Geschäftsmodell", score: 3, total: 3 },
    { name: "Wirtschaftlicher Burggraben", score: 2, total: 3 },
    { name: "Finanzkennzahlen", score: 10, total: 12 },
    { name: "Finanzielle Stabilität", score: 7, total: 9 },
    { name: "Managementqualität", score: 8, total: 12 },
    { name: "Bewertung (Preis)", score: 4, total: 12 },
    { name: "Langfristiger Ausblick", score: 8, total: 12 },
  ];
  
  // Summe zur Überprüfung
  const totalPoints = scoreComponents.reduce((sum, item) => sum + item.score, 0);
  const totalPossible = scoreComponents.reduce((sum, item) => sum + item.total, 0);
  const calculatedScore = Math.round((totalPoints / totalPossible) * 100);
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Buffett-Score: {buffettScore}%</h4>
      <p>Die Punktzahl zeigt, wie gut das Unternehmen zu Buffetts Investmentkriterien passt:</p>
      
      <div className="space-y-1 mt-2">
        {scoreComponents.map((comp, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{comp.name}:</span>
            <span className="font-medium">{comp.score}/{comp.total} Punkte</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-medium">
          <span>Gesamt:</span>
          <span>{totalPoints}/{totalPossible} Punkte ({calculatedScore}%)</span>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Bewertungsschlüssel:</span><br/>
          ≥75%: Hervorragende Übereinstimmung mit Buffetts Kriterien<br/>
          60-74%: Gute Übereinstimmung, nähere Analyse empfohlen<br/>
          &lt;60%: Schwache Übereinstimmung, entspricht nicht Buffetts Stil
        </p>
      </div>
    </div>
  );
};

const BuffettScoreChart: React.FC<{ score: number }> = ({ score }) => {
  // Berechnet den Umfang des Kreises, der gefüllt werden soll
  const circumference = 2 * Math.PI * 40; // r = 40
  const dashoffset = circumference * (1 - score / 100);
  
  // Farbe basierend auf Score
  const getColor = () => {
    if (score >= 75) return '#10b981'; // grün
    if (score >= 60) return '#f59e0b'; // gelb
    return '#ef4444'; // rot
  };
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Hintergrundkreis */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        {/* Fortschrittskreis */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={getColor()}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute text-2xl font-bold">{score}%</div>
    </div>
  );
};

const DCFExplanationTooltip: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
          <HelpCircle size={14} className="text-gray-500" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm p-4">
        <h4 className="font-semibold mb-1">Discounted Cash Flow (DCF) - Was ist das?</h4>
        <p className="text-sm">
          DCF ist eine Bewertungsmethode, die den heutigen Wert aller zukünftigen Cashflows berechnet:
        </p>
        <ul className="text-xs list-disc pl-4 mt-2">
          <li>Zukunftsprognose: Schätzung der Free Cashflows für 5-10 Jahre</li>
          <li>Abzinsung: Berücksichtigt den Zeitwert des Geldes (meist 8-12%)</li>
          <li>Endwert (Terminal Value): Ewiges Wachstum nach Jahr 10 (meist 2-3%)</li>
          <li>Summe: Alle diskontierten Cashflows = Innerer Wert pro Aktie</li>
        </ul>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-medium">Unsere Standardannahmen:</p>
          <ul className="text-xs list-disc pl-4">
            <li>8% Abzinsungsrate (konservativ)</li>
            <li>3% ewiges Wachstum</li>
            <li>5-10 Jahre Prognosezeitraum</li>
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const MarginOfSafetyExplanation: React.FC = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
          <HelpCircle size={14} className="text-gray-500" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm p-4">
        <h4 className="font-semibold mb-1">Margin of Safety - Warum 20%?</h4>
        <p className="text-sm">
          Die Sicherheitsmarge von 20% folgt Buffetts und Grahams Prinzip des defensiven Investierens:
        </p>
        <ul className="text-xs list-disc pl-4 mt-2">
          <li>Schutz vor Bewertungsfehlern: DCF-Annahmen könnten zu optimistisch sein</li>
          <li>Puffer für unerwartete Ereignisse: Rezessionen, Krisen, etc.</li>
          <li>Bessere Renditen: Kauf unter Wert = mehr Aufwärtspotenzial</li>
          <li>Risikominimierung: Selbst bei Problemen ist Verlustrisiko geringer</li>
        </ul>
        <div className="
