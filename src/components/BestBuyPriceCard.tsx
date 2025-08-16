
import React from 'react';
import { Euro } from 'lucide-react';
import { ClickableTooltip } from './ClickableTooltip';
import { Info } from 'lucide-react';
import { BuffettBuyPriceTooltip } from './BuffettBuyPriceTooltip';

interface BestBuyPriceCardProps {
  bestBuyPrice?: number | null;
  currentPrice?: number | null;
  intrinsicValue?: number | null;
  targetMarginOfSafety: number;
  currency: string;
}

export const BestBuyPriceCard: React.FC<BestBuyPriceCardProps> = ({
  bestBuyPrice,
  currentPrice,
  intrinsicValue,
  targetMarginOfSafety,
  currency
}) => {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
      <div className="flex items-center gap-2 mb-2">
        <Euro size={18} className="text-blue-600" />
        <h4 className="font-semibold">Idealer Kaufpreis</h4>
        
        <ClickableTooltip
          content={
            <BuffettBuyPriceTooltip 
              intrinsicValue={intrinsicValue}
              bestBuyPrice={bestBuyPrice}
              targetMarginOfSafety={targetMarginOfSafety}
              currency={currency}
            />
          }
          width="96"
        >
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Info size={14} className="text-gray-500" />
          </button>
        </ClickableTooltip>
      </div>
      
      <div className="text-2xl font-bold mb-2 text-blue-600">
        {bestBuyPrice ? `${bestBuyPrice.toFixed(2)} ${currency}` : 'N/A'}
      </div>
      
      <div className="text-sm text-gray-600 mb-1 flex-1">
        {currentPrice !== null && currentPrice !== undefined && !isNaN(Number(currentPrice)) && (
          <div className="space-y-1">
            <div>Aktueller Preis: {currentPrice.toFixed(2)} {currency}</div>
            {bestBuyPrice && (
              <div className={`${((currentPrice - bestBuyPrice) / bestBuyPrice * 100) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {((currentPrice - bestBuyPrice) / bestBuyPrice * 100).toFixed(1)}% über ideal
              </div>
            )}
          </div>
        )}
        {(!currentPrice || isNaN(Number(currentPrice))) && 'Berechnung nicht möglich'}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
        <div 
          className="h-2 rounded-full bg-blue-500"
          style={{
            width: bestBuyPrice && currentPrice 
              ? `${Math.min(Math.max((bestBuyPrice / currentPrice) * 100, 0), 100)}%`
              : '0%'
          }}
        />
      </div>
    </div>
  );
};
