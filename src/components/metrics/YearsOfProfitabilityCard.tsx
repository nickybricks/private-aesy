import React from 'react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { HistoricalDataItem } from '@/context/StockContextTypes';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip, Cell } from 'recharts';

interface YearsOfProfitabilityCardProps {
  historicalNetIncome?: HistoricalDataItem[];
}

export const YearsOfProfitabilityCard: React.FC<YearsOfProfitabilityCardProps> = ({
  historicalNetIncome = []
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
  
  const score = calculateScore(profitableYears);
  const maxScore = 4;
  
  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 3) return 'text-success';
    if (score === 2) return 'text-warning';
    return 'text-danger';
  };
  
  const getScoreBgColor = (score: number): string => {
    if (score >= 3) return 'bg-success/10';
    if (score === 2) return 'bg-warning/10';
    return 'bg-danger/10';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Years of Profitability</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <div className="space-y-3">
                      <p className="font-semibold">Years of Profitability</p>
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
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Anzahl profitabler Jahre (Net Income &gt; 0)
            </p>
          </div>
          
          {/* Score Display */}
          <div className={`${getScoreBgColor(score)} px-3 py-1 rounded-lg flex items-center gap-2`}>
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
              {score}/{maxScore}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
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
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Main Value */}
        <div className="text-center py-6">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {profitableYears}/{totalYears}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Jahre mit Gewinn (letzten 10 Jahre)
          </p>
        </div>

        {/* Visual Timeline */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Jahresübersicht:</p>
          <div className="flex justify-between items-center gap-2">
            {historicalNetIncome.slice().reverse().map((item, index) => {
              const isProfitable = item.isProfitable;
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 h-12 rounded-md cursor-help transition-all hover:scale-105 ${
                          isProfitable
                            ? 'bg-success border-2 border-success'
                            : 'bg-danger/20 border-2 border-danger'
                        }`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">{item.year}</p>
                        <p className={isProfitable ? 'text-success' : 'text-danger'}>
                          {isProfitable ? '✓ Gewinn' : '✗ Verlust'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          Net Income: {item.value.toLocaleString()} {item.originalCurrency || 'USD'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{historicalNetIncome[0]?.year}</span>
            <span>{historicalNetIncome[historicalNetIncome.length - 1]?.year}</span>
          </div>
        </div>

        {/* Net Income Chart */}
        {historicalNetIncome.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Net Income Verlauf:</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historicalNetIncome}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => {
                    // Format large numbers in billions/millions
                    if (Math.abs(value) >= 1e9) {
                      return `${(value / 1e9).toFixed(1)}B`;
                    } else if (Math.abs(value) >= 1e6) {
                      return `${(value / 1e6).toFixed(1)}M`;
                    }
                    return value.toFixed(0);
                  }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isProfitable = data.isProfitable;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-semibold">{data.year}</p>
                          <p className={`text-sm ${isProfitable ? 'text-success' : 'text-danger'}`}>
                            Net Income: <span className="font-bold">
                              {data.value.toLocaleString()} {data.originalCurrency || 'USD'}
                            </span>
                          </p>
                          <p className="text-xs mt-1">
                            {isProfitable ? '✓ Profitabel' : '✗ Verlust'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {historicalNetIncome.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isProfitable ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success border-2 border-success" />
            <span className="text-sm text-muted-foreground">Gewinn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-danger/20 border-2 border-danger" />
            <span className="text-sm text-muted-foreground">Verlust</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
