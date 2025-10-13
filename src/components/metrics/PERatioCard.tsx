import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';

interface PERatioCardProps {
  currentPrice: number;
  historicalEPS?: Array<{ year: string; value: number }>;
}

export const PERatioCard: React.FC<PERatioCardProps> = ({ currentPrice, historicalEPS }) => {
  // Calculate P/E ratio for each year
  const calculatePERatios = (epsData: Array<{ year: string; value: number }>, price: number) => {
    return epsData.map(item => ({
      year: item.year,
      value: item.value > 0 ? price / item.value : null,
      eps: item.value
    })).filter(item => item.value !== null) as Array<{ year: string; value: number; eps: number }>;
  };

  // Calculate average from P/E ratios
  const calculateAverage = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    return sum / data.length;
  };

  // Calculate current P/E ratio
  const currentEPS = historicalEPS && historicalEPS.length > 0 
    ? historicalEPS[historicalEPS.length - 1].value 
    : null;
  const currentPE = currentEPS && currentEPS > 0 ? currentPrice / currentEPS : null;

  // Determine which timeframe to use (10Y > 5Y > 3Y > current)
  let displayValue = currentPE;
  let displayLabel = 'Aktuell';
  let chartData: Array<{ year: string; value: number }> = [];

  if (historicalEPS && historicalEPS.length > 0) {
    const peRatios = calculatePERatios(historicalEPS, currentPrice);
    
    if (peRatios.length >= 10) {
      const last10Years = peRatios.slice(-10);
      displayValue = calculateAverage(last10Years);
      displayLabel = '10-Jahres-Durchschnitt';
      chartData = last10Years;
    } else if (peRatios.length >= 5) {
      const last5Years = peRatios.slice(-5);
      displayValue = calculateAverage(last5Years);
      displayLabel = '5-Jahres-Durchschnitt';
      chartData = last5Years;
    } else if (peRatios.length >= 3) {
      const last3Years = peRatios.slice(-3);
      displayValue = calculateAverage(last3Years);
      displayLabel = '3-Jahres-Durchschnitt';
      chartData = last3Years;
    } else {
      chartData = peRatios;
    }
  }

  // Score calculation based on P/E ratio
  const getScore = (value: number | null): number => {
    if (value === null) return 0;
    if (value <= 15) return 3;
    if (value <= 20) return 2;
    if (value <= 25) return 1;
    return 0;
  };

  // Get color based on score
  const getColorByScore = (score: number): string => {
    if (score === 3) return 'text-green-600';
    if (score === 2) return 'text-yellow-600';
    if (score === 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number): string => {
    if (score === 3) return 'bg-green-50 border-green-200';
    if (score === 2) return 'bg-yellow-50 border-yellow-200';
    if (score === 1) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const score = getScore(displayValue);
  const maxScore = 3;

  const getScoringTooltip = () => {
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm">Bewertung (0-3 Punkte):</p>
        <p className="text-sm"><span className="text-green-600">●</span> 3 Pkt: ≤ 15</p>
        <p className="text-sm"><span className="text-yellow-600">●</span> 2 Pkt: &gt;15–20</p>
        <p className="text-sm"><span className="text-orange-600">●</span> 1 Pkt: &gt;20–25</p>
        <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &gt;25</p>
      </div>
    );
  };

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">KGV = Aktienkurs / Gewinn je Aktie (EPS)</p>
      <p className="text-sm">
        Es zeigt, <strong>wie viele Euro</strong> Anleger für <strong>1 Euro Jahresgewinn</strong> bezahlen.
      </p>
      <p className="text-sm">
        Beispiel: Kurs 30 €, EPS 2 € ⇒ <strong>KGV 15</strong> (man zahlt 15× den Jahresgewinn).
      </p>
      <div className="space-y-1 mt-2">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Preis vs. Ertrag:</strong> Schneller Eindruck, ob eine Aktie <strong>teuer oder günstig</strong> wirkt.</li>
          <li><strong>Erwartungen im Kurs:</strong> Hohes KGV = Markt erwartet <strong>Wachstum/Qualität</strong>.</li>
          <li><strong>Vergleichbarkeit:</strong> Zwischen Jahren/Peers (mit Vorsicht) vergleichbar.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">KGV (Kurs-Gewinn-Verhältnis)</h3>
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
          <div className={`text-2xl font-bold ${getColorByScore(score)}`}>
            {displayValue !== null ? displayValue.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByScore(score)}`}>
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

      {/* Chart if historical data available */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Historischer Verlauf</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
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
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = typeof payload[0].value === 'number' ? payload[0].value : null;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-primary">
                          KGV: <span className="font-bold">{value !== null ? value.toFixed(1) : 'N/A'}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={15} stroke="#16a34a" strokeDasharray="3 3" />
              <ReferenceLine y={20} stroke="#ca8a04" strokeDasharray="3 3" />
              <ReferenceLine y={25} stroke="#ea580c" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span><span className="text-green-600">---</span> 15 (Günstig)</span>
            <span><span className="text-yellow-600">---</span> 20 (Fair)</span>
            <span><span className="text-orange-600">---</span> 25 (Teuer)</span>
          </div>
        </div>
      )}
    </Card>
  );
};
