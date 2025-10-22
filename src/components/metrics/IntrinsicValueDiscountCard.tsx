import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

interface IntrinsicValueDiscountCardProps {
  ticker: string;
  currentPrice: number;
  fairValue: number;
  sector?: string;
  currency?: string;
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

interface PriceData {
  date: string;
  adjClose: number;
}

const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from FMP:', error);
    throw error;
  }
};

export const IntrinsicValueDiscountCard: React.FC<IntrinsicValueDiscountCardProps> = ({
  ticker,
  currentPrice,
  fairValue,
  sector = 'Default',
  currency = 'USD'
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch historical price data
  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
      setIsLoading(true);
      
      try {
        // Fetch 30 years of historical data for maximum range
        const thirtyYearsAgo = new Date();
        thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
        const fromDate = thirtyYearsAgo.toISOString().split('T')[0];
        
        const prices = await fetchFromFMP(`/historical-price-full/${ticker}`, { from: fromDate });
        
        const processedPrices: PriceData[] = prices.historical
          ?.map((p: any) => ({
            date: p.date,
            adjClose: p.adjClose
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
        
        setPriceData(processedPrices);
      } catch (error) {
        console.error('Error fetching historical prices:', error);
        setPriceData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

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

  // Filter historical data by selected time range
  const filterDataByRange = (data: PriceData[], range: TimeRange) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (range) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'YTD':
        cutoffDate.setMonth(0);
        cutoffDate.setDate(1);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
      case '25Y':
        cutoffDate.setFullYear(now.getFullYear() - 25);
        break;
      case 'MAX':
        return data;
    }
    
    return data.filter(point => new Date(point.date) >= cutoffDate);
  };

  const filteredData = filterDataByRange(priceData, selectedRange).map(p => ({
    date: p.date,
    value: p.adjClose
  }));

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">Abweichung zum inneren Wert</p>
        <p className="text-sm text-muted-foreground">(Intrinsic Value Discount)</p>
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

  const scoringTooltip = (
    <div className="space-y-1">
      {sector && (
        <p className="text-xs text-muted-foreground mb-1">
          Sektor: <strong>{sector}</strong> ({getSectorDescription()})
        </p>
      )}
      <p className="font-medium text-sm">Bewertungssystem (0-5 Punkte):</p>
      <p className="text-sm"><span className="text-green-600">●</span> 5 Punkte: ≥ {mosTarget}%</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 3 Punkte: ≥ {(0.67 * mosTarget).toFixed(0)}%</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 2 Punkte: ≥ {(0.33 * mosTarget).toFixed(0)}%</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 1 Punkt: ≥ 0%</p>
      <p className="text-sm"><span className="text-red-600">●</span> 0 Punkte: &lt; 0% (überbewertet)</p>
      <p className="text-xs text-muted-foreground mt-2">
        M = MoS-Ziel (Sicherheitsmarge) basierend auf Sektor/Qualität
      </p>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Abweichung zum inneren Wert (Intrinsic Value Discount)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {mainTooltipContent}
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

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByScore(score, maxScore)}`}>
          {score}/{maxScore} Punkte
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {scoringTooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* KPIs as 3-column grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Aktueller Kurs</p>
          <p className="font-semibold">{currentPrice.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Innerer Wert</p>
          <p className="font-semibold">{fairValue.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Differenz</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            discount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {discount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {discount >= 0 ? '+' : ''}{(fairValue - currentPrice).toFixed(2)} {currency}
          </div>
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Abweichung <span className={`font-bold ${discount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {discount >= 0 ? '+' : ''}{discount.toFixed(1)}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Aktuelle Abweichung vom inneren Wert</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                MoS-Ziel <span className="font-bold">{mosTarget}%</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Gewünschte Sicherheitsmarge für {sector}</p>
              <p className="text-xs text-muted-foreground">{getSectorDescription()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Erfüllung MoS-Ziel <span className={`font-bold ${
                  (discount / mosTarget) >= 1 ? 'text-green-600' : 
                  (discount / mosTarget) >= 0.67 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {mosTarget > 0 ? ((discount / mosTarget) * 100).toFixed(0) : 0}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Wie nahe die Abweichung am MoS-Ziel liegt</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Time Range Selector and Chart */}
      {!isLoading && priceData && priceData.length > 0 && (
        <>
          <div className="flex justify-end gap-1 mb-3 overflow-x-auto pb-1">
            {(['1M', '6M', 'YTD', '1Y', '5Y', '10Y', '25Y', 'MAX'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
                className="text-xs h-7 px-2.5 whitespace-nowrap"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (selectedRange === '1M' || selectedRange === '6M') {
                      return `${date.getDate()}. ${date.toLocaleDateString('de-DE', { month: 'short' })}`;
                    } else if (selectedRange === 'YTD' || selectedRange === '1Y') {
                      return date.toLocaleDateString('de-DE', { month: 'short' });
                    }
                    return date.getFullYear().toString();
                  }}
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                  domain={['auto', 'auto']}
                  width={60}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const price = data.value;
                      const discountAtPoint = fairValue > 0 
                        ? ((fairValue - price) / fairValue) * 100 
                        : 0;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="text-xs font-semibold mb-1">
                            {new Date(data.date).toLocaleDateString('de-DE')}
                          </p>
                          <p className="text-sm text-blue-600">
                            Kurs: <span className="font-bold">{price.toFixed(2)} {currency}</span>
                          </p>
                          <p className="text-sm text-green-600">
                            Innerer Wert: <span className="font-bold">{fairValue.toFixed(2)} {currency}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Discount: <span className={`font-bold ${discountAtPoint >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {discountAtPoint >= 0 ? '+' : ''}{discountAtPoint.toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Reference line for Fair Value (horizontal) */}
                <ReferenceLine 
                  y={fairValue} 
                  stroke="#16a34a" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  opacity={0.7}
                  label={{ 
                    value: `Fair Value: ${fairValue.toFixed(2)} ${currency}`, 
                    position: 'insideTopRight', 
                    fontSize: 11, 
                    fill: '#16a34a',
                    fontWeight: 600
                  }}
                />
                
                {/* Reference lines for discount targets */}
                <ReferenceLine 
                  y={fairValue * 0.8} 
                  stroke="#3b82f6" 
                  strokeDasharray="3 3" 
                  opacity={0.4}
                  label={{ value: '-20%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                />
                <ReferenceLine 
                  y={fairValue * 0.7} 
                  stroke="#3b82f6" 
                  strokeDasharray="3 3" 
                  opacity={0.4}
                  label={{ value: '-30%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                />
                <ReferenceLine 
                  y={fairValue * 0.6} 
                  stroke="#3b82f6" 
                  strokeDasharray="3 3" 
                  opacity={0.4}
                  label={{ value: '-40%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                />
                
                {/* Stock Price Line (blue) */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Aktienkurs"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-6 h-0.5 bg-[#2563eb]"></span>
                Aktienkurs
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-6 h-0.5 border-t-2 border-dashed border-[#16a34a]"></span>
                Innerer Wert
              </span>
            </div>
          </div>
        </>
      )}

    </Card>
  );
};
