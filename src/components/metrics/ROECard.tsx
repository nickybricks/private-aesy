import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';
import { ScoreResult } from '@/context/StockContextTypes';

interface ROECardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const ROECard: React.FC<ROECardProps> = ({ currentValue, historicalData, preset = 'Default', scoreFromBackend }) => {
  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  // Determine which timeframe to use - always use all available data (up to 30 years max)
  let displayValue = currentValue;
  let displayLabel = 'Aktuell';
  let chartData = historicalData || [];

  // Use all available historical data for median calculation and display
  if (historicalData && historicalData.length >= 10) {
    displayValue = calculateMedian(historicalData);
    displayLabel = `${historicalData.length}-Jahres-Median`;
    chartData = historicalData;
  } else if (historicalData && historicalData.length >= 5) {
    displayValue = calculateMedian(historicalData);
    displayLabel = `${historicalData.length}-Jahres-Median`;
    chartData = historicalData;
  } else if (historicalData && historicalData.length >= 3) {
    displayValue = calculateMedian(historicalData);
    displayLabel = `${historicalData.length}-Jahres-Median`;
    chartData = historicalData;
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
    <Card className={`border ${getBgColorByRatio(score, maxScore)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Eigenkapitalrendite (ROE)</CardTitle>
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
      </CardHeader>
      <CardContent>
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

        {/* Chart if historical data available */}
        {chartData.length > 1 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Historischer Verlauf</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#666', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROE']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <ReferenceLine y={15} stroke="#16a34a" strokeDasharray="3 3" />
                <ReferenceLine y={10} stroke="#ca8a04" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span><span className="text-green-600">---</span> 15% (Exzellent)</span>
              <span><span className="text-yellow-600">---</span> 10% (Akzeptabel)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
