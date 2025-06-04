
import React from 'react';
import { Target } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { MarginOfSafetyTooltip } from './MarginOfSafetyTooltip';

interface MarginOfSafetyCardProps {
  marginOfSafetyValue: number;
  targetMarginOfSafety: number;
  intrinsicValue?: number | null;
  currentPrice?: number | null;
  currency: string;
}

export const MarginOfSafetyCard: React.FC<MarginOfSafetyCardProps> = ({
  marginOfSafetyValue,
  targetMarginOfSafety,
  intrinsicValue,
  currentPrice,
  currency
}) => {
  const getColor = (value: number) => {
    if (value >= 20) return '#10b981';
    if (value >= 0) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex flex-col h-48">
      <div className="flex items-center gap-2 mb-2">
        <Target size={18} className="text-green-600" />
        <h4 className="font-semibold">Sicherheitsmarge</h4>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <MarginOfSafetyTooltip 
                targetMarginOfSafety={targetMarginOfSafety}
                intrinsicValue={intrinsicValue}
                currentPrice={currentPrice}
                currency={currency}
                marginOfSafetyValue={marginOfSafetyValue}
              />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="text-2xl font-bold mb-2" style={{ color: getColor(marginOfSafetyValue) }}>
        {marginOfSafetyValue.toFixed(1)}%
      </div>
      
      <div className="text-sm text-gray-600 mb-3 flex-1">
        {marginOfSafetyValue >= 0 ? 'Positive Sicherheitsmarge' : 'Überbewertet'}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mt-auto">
        <div 
          className="h-2 rounded-full" 
          style={{
            width: `${Math.min(Math.max(marginOfSafetyValue + 50, 0), 100)}%`,
            backgroundColor: getColor(marginOfSafetyValue)
          }}
        />
      </div>
    </div>
  );
};
