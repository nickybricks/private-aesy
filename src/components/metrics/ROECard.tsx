import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';
import { ScoreResult } from '@/context/StockContextTypes';

type TimeRange = '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';

interface ROECardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const ROECard: React.FC<ROECardProps> = ({ currentValue, historicalData, preset = 'Default', scoreFromBackend }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('MAX');
  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  // Filter data by selected time range
  const filterDataByRange = (data: Array<{ year: string; value: number }> | undefined, range: TimeRange) => {
    if (!data || data.length === 0) return [];
    
    switch (range) {
      case '1Y':
        return data.slice(-1);
      case '3Y':
        return data.slice(-3);
      case '5Y':
        return data.slice(-5);
      case '10Y':
        return data.slice(-10);
      case 'MAX':
        return data;
    }
  };

  const filteredData = filterDataByRange(historicalData, selectedRange);

  // Calculate display value from filtered data
  let displayValue = currentValue;
  let displayLabel = 'Aktuell';

  if (filteredData.length >= 10) {
    displayValue = calculateMedian(filteredData);
    displayLabel = `${filteredData.length}-Jahres-Median`;
  } else if (filteredData.length >= 5) {
    displayValue = calculateMedian(filteredData);
    displayLabel = `${filteredData.length}-Jahres-Median`;
  } else if (filteredData.length >= 3) {
    displayValue = calculateMedian(filteredData);
    displayLabel = `${filteredData.length}-Jahres-Median`;
  }

  // Score calculation based on ROE value
  const getScore = (value: number | null): number => {
    if (value === null) return 0;
    if (value >= 15) return 2;
    if (value >= 10) return 1;
    return 0;
  };

  // Get color based on score
  const getColor = (score: number): string => {
    if (score === 2) return 'text-green-600';
    if (score === 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (score: number): string => {
    if (score === 2) return 'bg-green-50 border-green-200';
    if (score === 1) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Use backend score if available
  const score = scoreFromBackend?.score ?? getScore(displayValue);
  const maxScore = scoreFromBackend?.maxScore ?? 2;

  // Get color based on score ratio
  const getColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'text-green-600';
    if (ratio >= 0.67) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'bg-green-50 border-green-200';
    if (ratio >= 0.67) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Preset-specific tooltip content
  const getScoringTooltip = () => {
    if (preset === 'Industrials') {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-3 Punkte) - Industrials:</p>
          <p className="text-sm"><span className="text-green-600">●</span> 3 Pkt: ≥ 14%</p>
          <p className="text-sm"><span className="text-yellow-600">●</span> 2 Pkt: 9–&lt;14%</p>
          <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 9%</p>
        </div>
      );
    }
    
    if (preset === 'Software') {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-2 Punkte) - Software:</p>
          <p className="text-sm"><span className="text-green-600">●</span> 2 Pkt: ≥ 18%</p>
          <p className="text-sm"><span className="text-yellow-600">●</span> 1 Pkt: 12–&lt;18%</p>
          <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 12%</p>
        </div>
      );
    }
    
    // Default scoring
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm">Bewertung:</p>
        <p className="text-sm"><span className="text-green-600">●</span> Grün (2 Pkt): ≥ 15%</p>
        <p className="text-sm"><span className="text-yellow-600">●</span> Gelb (1 Pkt): 10-15%</p>
        <p className="text-sm"><span className="text-red-600">●</span> Rot (0 Pkt): &lt; 10%</p>
      </div>
    );
  };

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">ROE = Gewinn / Eigenkapital</p>
      <p className="text-sm">
        Sagt, wie viel Gewinn ein Unternehmen pro eingesetztem Eigenkapital erwirtschaftet.
      </p>
      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Qualität:</strong> Zeigt, wie effizient das Unternehmen mit dem Geld der Aktionäre umgeht.</li>
          <li><strong>Moat-Hinweis:</strong> Dauerhaft hoher ROE deutet auf Preissetzungsmacht/Markenstärke hin.</li>
          <li><strong>Kapitalallokation:</strong> Gute Manager erzielen hohe Rendite auf jeden Euro Eigenkapital.</li>
        </ul>
      </div>

      {preset !== 'Default' && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground italic">
            Scoring-Preset: <strong>{preset}</strong>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByRatio(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Eigenkapitalrendite (ROE)</h3>
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
          <div className={`text-2xl font-bold ${getColorByRatio(score, maxScore)}`}>
            {displayValue !== null ? `${displayValue.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByRatio(score, maxScore)}`}>
          {score}/{maxScore} Punkt{maxScore !== 1 ? 'e' : ''}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              {getScoringTooltip()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* KPIs Grid */}
      {currentValue !== null && displayValue !== null && (
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Aktuell</p>
            <p className="font-semibold">{currentValue.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="font-semibold">{displayValue.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jahre</p>
            <p className="font-semibold">{filteredData.length}</p>
          </div>
        </div>
      )}

      {/* Time Range Selector and Chart */}
      {historicalData && historicalData.length > 0 && (
        <>
          <div className="flex justify-end gap-1 mb-3 overflow-x-auto pb-1">
            {(['1Y', '3Y', '5Y', '10Y', 'MAX'] as TimeRange[]).map(range => (
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
                  dataKey="year" 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                  domain={[0, 'auto']}
                  width={60}
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].payload.value;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                          <p className="text-sm text-primary">
                            ROE: <span className="font-bold">{typeof value === 'number' ? value.toFixed(1) : value}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={15} 
                  stroke="#16a34a" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  opacity={0.7}
                  label={{ 
                    value: '15% (Exzellent)', 
                    position: 'insideTopRight', 
                    fontSize: 11, 
                    fill: '#16a34a',
                    fontWeight: 600
                  }}
                />
                <ReferenceLine 
                  y={10} 
                  stroke="#ca8a04" 
                  strokeDasharray="3 3" 
                  opacity={0.5}
                  label={{ value: '10% (Akzeptabel)', position: 'insideRight', fontSize: 10, fill: '#ca8a04' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-8 h-0.5 bg-[#2563eb]"></span>
                Eigenkapitalrendite
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-8 h-0.5 border-t-2 border-dashed border-[#16a34a]"></span>
                Exzellent (15%)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-8 h-0.5 border-t-2 border-dashed border-[#ca8a04]"></span>
                Akzeptabel (10%)
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
