import React from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { HistoricalDataItem, ScoreResult } from '@/context/StockContextTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip, Cell } from 'recharts';

interface YearsOfProfitabilityCardProps {
  historicalNetIncome?: HistoricalDataItem[];
  preset?: string;
  scoreFromBackend?: ScoreResult;
  displayCurrency?: string;
}

export const YearsOfProfitabilityCard: React.FC<YearsOfProfitabilityCardProps> = ({
  historicalNetIncome = [],
  preset = 'Default',
  scoreFromBackend,
  displayCurrency = 'USD'
}) => {
  // Calculate profitable years count
  const profitableYears = historicalNetIncome.filter(item => item.isProfitable).length;
  const totalYears = historicalNetIncome.length;
  
  // Calculate score based on profitable years
  const calculateScore = (years: number): number => {
    if (years === 10) return 4;
    if (years === 9) return 3;
    if (years === 8) return 2;
    if (years === 7) return 1;
    return 0;
  };
  
  const score = scoreFromBackend?.score ?? calculateScore(profitableYears);
  const maxScore = scoreFromBackend?.maxScore ?? 4;
  
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 3) return 'text-green-600';
    if (score === 2) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getBgColor = (score: number): string => {
    if (score >= 3) return 'bg-green-50 border-green-200';
    if (score === 2) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Prepare chart data
  const chartData = historicalNetIncome.map(item => ({
    year: item.year,
    value: item.value / 1000000, // Convert to millions
    isProfitable: item.isProfitable,
    originalCurrency: item.originalCurrency || 'USD'
  }));

  // Format large numbers
  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}B`;
    }
    return `${value.toFixed(0)}M`;
  };

  // Tooltip content generator based on preset
  const getTooltipContent = () => {
    const baseContent = (
      <>
        <p className="font-semibold">Jahre mit Gewinn</p>
        <p className="text-sm text-muted-foreground">(Years of Profitability)</p>
        <p>
          Zählt, in wie vielen der <strong>letzten 10 Geschäftsjahre</strong> die Firma{' '}
          <strong>einen echten Gewinn</strong> erzielt hat (<strong>Net Income &gt; 0</strong>, 
          bereinigt um Einmaleffekte).
        </p>
        <p>
          Beispiel: 9 Jahre Gewinn, 1 Jahr Verlust ⇒ <strong>9/10</strong>.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Warum wichtig?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Robustheit:</strong> Zeigt, ob das Geschäftsmodell{' '}
              <strong>durch Zyklen</strong> (Krisen/Boomphasen) trägt.
            </li>
            <li>
              <strong>Qualität:</strong> Dauerhaft profitabel = oft <strong>Moat</strong>, 
              solide Kundenbindung, gute Kostenkontrolle.
            </li>
            <li>
              <strong>Risikobild:</strong> Viele Verlustjahre deuten auf{' '}
              <strong>zyklische/fragile</strong> Strukturen oder Fehlsteuerung hin.
            </li>
          </ul>
        </div>
      </>
    );

    return (
      <div className="space-y-3">
        {baseContent}
        <div className="space-y-2">
          <p className="font-semibold">Was ist „gut"?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-success">Grün (stark):</strong> ≥ 9/10 Jahre Gewinn 
              (Top), ideal 10/10.
            </li>
            <li>
              <strong className="text-warning">Gelb (ok):</strong> 8/10 Jahre Gewinn.
            </li>
            <li>
              <strong className="text-danger">Rot (schwach):</strong> ≤ 7/10 Jahre Gewinn 
              oder wiederkehrend große Verlustjahre.
            </li>
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
  };

  const getScoringTooltip = () => {
    if (preset === 'Industrials') {
      return (
        <div className="space-y-2">
          <p className="font-semibold">Punktelogik - Industrials (max 4 Pkt)</p>
          <ul className="space-y-1 text-sm">
            <li>• <strong>10/10</strong> → 4 Punkte</li>
            <li>• <strong>9/10</strong> → 3 Punkte</li>
            <li>• <strong>8/10</strong> → 2 Punkte</li>
            <li>• <strong>7/10</strong> → 1 Punkt</li>
            <li>• <strong>≤ 6/10</strong> → 0 Punkte</li>
          </ul>
        </div>
      );
    }

    if (preset === 'Software') {
      return (
        <div className="space-y-2">
          <p className="font-semibold">Punktelogik - Software (max 3 Pkt)</p>
          <ul className="space-y-1 text-sm">
            <li>• <strong>10/10</strong> → 3 Punkte</li>
            <li>• <strong>9/10</strong> → 2 Punkte</li>
            <li>• <strong>8/10</strong> → 1 Punkt</li>
            <li>• <strong>≤ 7/10</strong> → 0 Punkte</li>
          </ul>
        </div>
      );
    }

    // Default
    return (
      <div className="space-y-2">
        <p className="font-semibold">Punktelogik</p>
        <ul className="space-y-1 text-sm">
          <li>• <strong>10/10</strong> → 4 Punkte</li>
          <li>• <strong>9/10</strong> → 3 Punkte</li>
          <li>• <strong>8/10</strong> → 2 Punkte</li>
          <li>• <strong>7/10</strong> → 1 Punkt</li>
          <li>• <strong>≤ 6/10</strong> → 0 Punkte</li>
        </ul>
      </div>
    );
  };

  return (
    <Card className={`p-4 border-2 ${getBgColor(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Jahre mit Gewinn (Years of Profitability)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                {getTooltipContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {profitableYears}/{totalYears}
          </div>
          <div className="text-xs text-muted-foreground">Jahre mit Gewinn</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(score)}`}>
          {score}/{maxScore} Punkte
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

      {/* Bar Chart */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Net Income Entwicklung</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="#9ca3af"
                tickFormatter={(value) => formatValue(value)}
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{data.year}</p>
                        <p className={`text-sm ${data.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                          {data.isProfitable ? '✓ Gewinn' : '✗ Verlust'}
                        </p>
                        <p className="text-sm text-primary">
                          Net Income: <span className="font-bold">{formatValue(data.value)}</span> {displayCurrency}
                          {data.originalCurrency && data.originalCurrency !== displayCurrency && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (urspr.: {formatValue(data.originalValue || data.value)} {data.originalCurrency})
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isProfitable ? '#16a34a' : '#dc2626'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span><span className="text-green-600">■</span> Gewinn</span>
            <span><span className="text-red-600">■</span> Verlust</span>
          </div>
        </div>
      )}
    </Card>
  );
};
