
import React from 'react';

interface MarginOfSafetyTooltipProps {
  targetMarginOfSafety: number;
  intrinsicValue?: number | null;
  currentPrice?: number | null;
  currency?: string;
  marginOfSafetyValue?: number;
}

export const MarginOfSafetyTooltip: React.FC<MarginOfSafetyTooltipProps> = ({ 
  targetMarginOfSafety, 
  intrinsicValue, 
  currentPrice, 
  currency, 
  marginOfSafetyValue 
}) => {
  const hasRealData = intrinsicValue !== null && 
                     intrinsicValue !== undefined && 
                     !isNaN(Number(intrinsicValue)) && 
                     currentPrice !== null && 
                     currentPrice !== undefined && 
                     !isNaN(Number(currentPrice)) && 
                     currency;
  
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Sicherheitsmarge (Margin of Safety)</h4>
      <p>Die Sicherheitsmarge zeigt, um wie viel Prozent der Aktienkurs unter dem inneren Wert liegt.</p>
      <ul className="list-disc pl-4 text-sm">
        <li>Schützt vor Bewertungsfehlern</li>
        <li>Erhöht langfristiges Renditepotential</li>
        <li>Reduziert Verlustrisiko</li>
      </ul>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium mb-1">Berechnung der Margin of Safety:</h5>
        <p className="text-sm mb-2">Formel: (Innerer Wert - Aktueller Preis) / Aktueller Preis × 100</p>
        
        {hasRealData && intrinsicValue !== null && currentPrice !== null ? (
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Innerer Wert:</span> {intrinsicValue.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Aktueller Preis:</span> {currentPrice.toFixed(2)} {currency}</p>
            <p><span className="font-medium">Berechnung:</span> ({intrinsicValue.toFixed(2)} - {currentPrice.toFixed(2)}) / {currentPrice.toFixed(2)} × 100</p>
            <p className={`font-medium ${marginOfSafetyValue && marginOfSafetyValue > 0 ? 'text-buffett-green' : 'text-buffett-red'}`}>
              <span className="font-medium">Ergebnis:</span> {marginOfSafetyValue?.toFixed(1)}%
              {marginOfSafetyValue && marginOfSafetyValue > 0 ? ' (Unterbewertet)' : ' (Überbewertet)'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">Für eine konkrete Berechnung werden Daten zum inneren Wert und aktuellen Preis benötigt.</p>
          </div>
        )}
        
        <p className="text-sm font-medium mt-2">Positive Werte bedeuten "günstig", negative "überbewertet".</p>
      </div>
    </div>
  );
};
