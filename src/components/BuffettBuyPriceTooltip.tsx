
import React from 'react';

interface BuffettBuyPriceTooltipProps {
  intrinsicValue: number | null | undefined;
  bestBuyPrice: number | null;
  targetMarginOfSafety: number;
  currency: string;
}

export const BuffettBuyPriceTooltip: React.FC<BuffettBuyPriceTooltipProps> = ({ 
  intrinsicValue, 
  bestBuyPrice, 
  targetMarginOfSafety, 
  currency 
}) => {
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
