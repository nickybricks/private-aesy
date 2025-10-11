import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';

interface PERatioCardProps {
  currentPrice: number;
  eps: number | null;
  historicalData?: Array<{ year: string; value: number }>;
}

export const PERatioCard: React.FC<PERatioCardProps> = ({ currentPrice, eps, historicalData }) => {
  // Calculate P/E ratio
  const peRatio = eps && eps > 0 ? currentPrice / eps : null;

  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  // Determine which timeframe to use (10Y > 5Y > 3Y > current)
  let displayValue = peRatio;
  let displayLabel = 'Aktuell';
  let chartData = historicalData || [];

  if (historicalData && historicalData.length >= 10) {
    const last10Years = historicalData.slice(-10);
    displayValue = calculateMedian(last10Years);
    displayLabel = '10-Jahres-Median';
    chartData = last10Years;
  } else if (historicalData && historicalData.length >= 5) {
    const last5Years = historicalData.slice(-5);
    displayValue = calculateMedian(last5Years);
    displayLabel = '5-Jahres-Median';
    chartData = last5Years;
  } else if (historicalData && historicalData.length >= 3) {
    const last3Years = historicalData.slice(-3);
    displayValue = calculateMedian(last3Years);
    displayLabel = '3-Jahres-Median';
    chartData = last3Years;
  }

  // Score calculation based on P/E ratio
  const getScore = (value: number | null): number => {
    if (value === null) return 0;
    if (value <= 15) return 3;
    if (value <= 20) return 2;
    if (value <= 25) return 1;
    return 0;
  };

  const score = getScore(displayValue);
  const maxScore = 3;

  // Get color based on score ratio
  const getColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'text-green-600';
    if (ratio >= 0.67) return 'text-yellow-600';
    if (ratio >= 0.33) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByRatio = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'bg-green-50 border-green-200';
    if (ratio >= 0.67) return 'bg-yellow-50 border-yellow-200';
    if (ratio >= 0.33) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

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
    <div className="max-w-md space-y-3">
      <p className="font-semibold">KGV = Aktienkurs / Gewinn je Aktie (EPS)</p>
      
      <p className="text-sm">
        Es zeigt, <strong>wie viele Euro</strong> Anleger für <strong>1 Euro Jahresgewinn</strong> bezahlen.
      </p>
      
      <p className="text-sm">
        <strong>Beispiel:</strong> Kurs 30 €, EPS 2 € ⇒ <strong>KGV 15</strong> (man zahlt 15× den Jahresgewinn).
      </p>

      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Preis vs. Ertrag:</strong> Schneller Eindruck, ob eine Aktie <strong>teuer oder günstig</strong> wirkt.</li>
          <li><strong>Erwartungen im Kurs:</strong> Hohes KGV = Markt erwartet <strong>Wachstum/Qualität</strong>.</li>
          <li><strong>Vergleichbarkeit:</strong> Zwischen Jahren/Peers (mit Vorsicht) vergleichbar.</li>
        </ul>
      </div>

      <div className="border-t pt-2 space-y-1">
        <p className="font-medium text-sm">So liest du das KGV richtig:</p>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li><strong>Bereinigter Gewinn:</strong> Einmaleffekte raus (Impairments, Sondereinnahmen). Nutzt „EPS ohne NRI".</li>
          <li><strong>Mehrjahresblick:</strong> Heutiges KGV vs. 5–10-Jahres-Durchschnitt der Firma und vs. Sektor-Median.</li>
        </ol>
      </div>

      <div className="border-t pt-2 space-y-1">
        <p className="font-medium text-sm">Was ist „gut"?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong className="text-green-600">Grün (günstig):</strong> KGV ≤ 15 (für stabile, nicht schnell wachsende Firmen).</li>
          <li><strong className="text-yellow-600">Gelb (fair):</strong> 15–20.</li>
          <li><strong className="text-red-600">Rot (teuer):</strong> &gt; 25 (ohne klaren Moat, hohen ROIC und nachhaltiges Wachstum).</li>
        </ul>
        <p className="text-xs text-muted-foreground italic mt-1">
          <strong>Ausnahme (Qualitäts-/Wachstumswerte):</strong> Höher okay, wenn ROIC-Spread groß, Wachstum sichtbar (3–5 J.) und Bilanz solide.
        </p>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColorByRatio(score, maxScore)}`}>
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
          <div className={`text-2xl font-bold ${getColorByRatio(score, maxScore)}`}>
            {displayValue !== null ? displayValue.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByRatio(score, maxScore)}`}>
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
                    const value = typeof payload[0].value === 'number' ? payload[0].value : 0;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-primary">
                          KGV: <span className="font-bold">{value.toFixed(1)}</span>
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
          <div className="flex justify-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span><span className="text-green-600">---</span> 15 (Günstig)</span>
            <span><span className="text-yellow-600">---</span> 20 (Fair)</span>
            <span><span className="text-orange-600">---</span> 25 (Grenze)</span>
          </div>
        </div>
      )}
    </Card>
  );
};
