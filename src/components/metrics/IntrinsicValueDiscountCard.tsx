import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IntrinsicValueDiscountCardProps {
  currentPrice: number;
  fairValue: number;
  sector?: string;
  currency?: string;
}

export const IntrinsicValueDiscountCard: React.FC<IntrinsicValueDiscountCardProps> = ({
  currentPrice,
  fairValue,
  sector = 'Default',
  currency = 'USD'
}) => {

  // Calculate discount percentage
  const discount = fairValue > 0 ? ((fairValue - currentPrice) / fairValue) * 100 : 0;

  // Get MoS target based on sector
  const getMoSTarget = (sector: string): number => {
    const sectorLower = sector?.toLowerCase() || '';
    
    // Wide Moat (Software, Consumer Staples, Healthcare)
    if (sectorLower.includes('software') || 
        sectorLower.includes('consumer defensive') || 
        sectorLower.includes('healthcare') ||
        sectorLower.includes('consumer staples')) {
      return 20;
    }
    
    // Utilities/REITs (regulated, predictable)
    if (sectorLower.includes('utilities') || 
        sectorLower.includes('real estate') || 
        sectorLower.includes('communication')) {
      return 20;
    }
    
    // Cyclical (Energy, Materials, Industrials)
    if (sectorLower.includes('energy') || 
        sectorLower.includes('materials') || 
        sectorLower.includes('industrials') ||
        sectorLower.includes('basic materials')) {
      return 35;
    }
    
    // Default
    return 30;
  };

  // Get score based on discount and MoS target
  const getScore = (discount: number, target: number): number => {
    if (discount >= target) return 5;
    if (discount >= 0.67 * target) return 3;
    if (discount >= 0.33 * target) return 2;
    if (discount >= 0) return 1;
    return 0; // Overvalued
  };

  const mosTarget = getMoSTarget(sector);
  const score = getScore(discount, mosTarget);
  const maxScore = 5;

  // Get color based on score
  const getColorByScore = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'text-green-600';
    if (ratio >= 0.6) return 'text-yellow-600';
    if (ratio >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'bg-green-50 border-green-200';
    if (ratio >= 0.6) return 'bg-yellow-50 border-yellow-200';
    if (ratio >= 0.4) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Get sector-specific description
  const getSectorDescription = (): string => {
    const sectorLower = sector?.toLowerCase() || '';
    
    if (sectorLower.includes('software') || sectorLower.includes('consumer defensive') || sectorLower.includes('healthcare')) {
      return 'Wide Moat & stabile Cashflows';
    }
    if (sectorLower.includes('utilities') || sectorLower.includes('real estate') || sectorLower.includes('communication')) {
      return 'Reguliert & planbar';
    }
    if (sectorLower.includes('energy') || sectorLower.includes('materials') || sectorLower.includes('industrials')) {
      return 'Zyklisch & unsicher';
    }
    return 'Normal Quality';
  };


  const tooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">Innerer Wert-Abweichung (Discount)</p>
        <p className="text-xs mt-1">
          Die Abweichung zeigt, wie weit der Aktienkurs unter/über dem inneren Wert liegt.
        </p>
      </div>
      
      <div className="text-xs">
        <p className="font-medium mb-1">Formel:</p>
        <code className="bg-muted px-2 py-1 rounded text-[10px]">
          Discount % = ((Fair Value - Preis) / Fair Value) × 100
        </code>
      </div>

      <div className="text-xs space-y-1">
        <p className="font-medium">MoS-Ziel (M) = gewünschte Sicherheitsmarge</p>
        <div className="space-y-1 pl-2 border-l-2 border-border">
          <p>• Wide Moat (Software, Konsumgüter): <strong>20-25%</strong></p>
          <p>• Normal Quality: <strong>30%</strong> (Default)</p>
          <p>• Zyklisch (Energy/Materials): <strong>35-40%</strong></p>
          <p>• Utilities/REITs: <strong>20-25%</strong></p>
        </div>
      </div>

      <div className="pt-2 border-t text-xs">
        <p className="text-muted-foreground italic">
          Scoring-Preset: <strong>{sector}</strong> ({getSectorDescription()})
        </p>
        <p className="text-muted-foreground">
          MoS-Ziel: <strong>{mosTarget}%</strong>
        </p>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header with Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Innerer Wert-Abweichung</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByScore(score, maxScore)}`}>
            {discount >= 0 ? '+' : ''}{discount.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {discount >= 0 ? 'Unterbewertet' : 'Überbewertet'}
          </div>
        </div>
      </div>

      {/* Current Values */}
      <div className="mb-3 p-3 bg-muted/30 rounded-lg text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aktueller Kurs:</span>
          <span className="font-medium">{currentPrice.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Innerer Wert:</span>
          <span className="font-medium">{fairValue.toFixed(2)} {currency}</span>
        </div>
        <div className="flex justify-between border-t pt-1 mt-1">
          <span className="text-muted-foreground">Differenz:</span>
          <span className={`font-bold ${discount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {discount >= 0 ? '+' : ''}{(fairValue - currentPrice).toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Bewertung ({sector}):</div>
          <div className={`px-3 py-1 rounded text-sm font-bold ${getColorByScore(score, maxScore)}`}>
            {score}/{maxScore} Punkte
          </div>
        </div>
        
        <div className="text-xs space-y-1 pl-3 border-l-2 border-border">
          <div className="flex justify-between">
            <span>Aktueller Discount:</span>
            <span className="font-medium">{discount.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>MoS-Ziel ({getSectorDescription()}):</span>
            <span className="font-medium">{mosTarget}%</span>
          </div>
          <div className="flex justify-between">
            <span>Erreichungsgrad:</span>
            <span className="font-medium">{mosTarget > 0 ? ((discount / mosTarget) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
      </div>


      {/* Scoring Explanation */}
      <div className="mt-4 text-xs text-muted-foreground space-y-2 p-3 bg-muted/20 rounded-lg">
        <div>
          <p className="font-semibold mb-1">Bewertungssystem (0-5 Punkte):</p>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span>• ≥ M ({mosTarget}%): <strong>5 Pkt</strong></span>
          <span>• ≥ 0,67×M ({(0.67 * mosTarget).toFixed(0)}%): <strong>3 Pkt</strong></span>
          <span>• ≥ 0,33×M ({(0.33 * mosTarget).toFixed(0)}%): <strong>2 Pkt</strong></span>
          <span>• ≥ 0%: <strong>1 Pkt</strong></span>
          <span className="col-span-2">• &lt; 0% (überbewertet): <strong>0 Pkt</strong></span>
        </div>
        
        <div className="text-[10px] text-muted-foreground pt-1 border-t">
          <p>M = MoS-Ziel (Sicherheitsmarge) basierend auf Sektor/Qualität</p>
        </div>
      </div>
    </Card>
  );
};
