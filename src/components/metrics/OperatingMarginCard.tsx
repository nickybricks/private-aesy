import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';

interface OperatingMarginCardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
}

export const OperatingMarginCard: React.FC<OperatingMarginCardProps> = ({ currentValue, historicalData }) => {
  // Calculate median from historical data
  const calculateMedian = (data: Array<{ year: string; value: number }>) => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  // Determine which timeframe to use (10Y > 5Y > 3Y > current)
  let displayValue = currentValue;
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

  // Score calculation based on Operating Margin value
  const getScore = (value: number | null, preset: string = 'Software'): number => {
    if (value === null) return 0;
    
    // Industrials preset
    if (preset === 'Industrials') {
      if (value >= 16) return 4;
      if (value >= 12) return 3;
      if (value >= 9) return 2;
      if (value >= 6) return 1;
      return 0;
    }
    
    // Software/Media preset (default)
    if (value >= 22) return 4;
    if (value >= 18) return 3;
    if (value >= 14) return 2;
    if (value >= 10) return 1;
    return 0;
  };

  // Get color based on score (0-4 scale)
  const getColor = (score: number): string => {
    if (score === 4) return 'text-green-600';
    if (score === 3) return 'text-green-500';
    if (score === 2) return 'text-yellow-600';
    if (score === 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColor = (score: number): string => {
    if (score === 4) return 'bg-green-50 border-green-200';
    if (score === 3) return 'bg-green-50/50 border-green-100';
    if (score === 2) return 'bg-yellow-50 border-yellow-200';
    if (score === 1) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const score = getScore(displayValue);

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">Operating Margin = EBIT / Umsatz</p>
      <p className="text-sm">
        Sie zeigt, <strong>wie viel vom Umsatz nach allen operativen Kosten</strong> (Material, Löhne, Vertrieb, Verwaltung, F&E) 
        übrig bleibt – <strong>vor</strong> Zinsen und Steuern.
      </p>
      <p className="text-sm italic">
        Beispiel: 100 € Umsatz, 18 € EBIT ⇒ <strong>18 % Operating Margin</strong>.
      </p>
      
      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Kerngeschäfts-Stärke:</strong> Misst die wahre Ertragskraft ohne Finanzierungs- und Steuer-Effekte.</li>
          <li><strong>Preissetzung & Kostenkontrolle:</strong> Hohe Marge = Preise durchsetzbar, Kosten im Griff.</li>
          <li><strong>Puffer in Krisen:</strong> Dickere Marge = mehr Schutz bei Gegenwind.</li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Punktelogik Software/Media:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>≥22% → 4 Punkte</li>
          <li>18-&lt;22% → 3 Punkte</li>
          <li>14-&lt;18% → 2 Punkte</li>
          <li>10-&lt;14% → 1 Punkt</li>
          <li>&lt;10% → 0 Punkte</li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Punktelogik Industrials:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>≥16% → 4 Punkte</li>
          <li>12-&lt;16% → 3 Punkte</li>
          <li>9-&lt;12% → 2 Punkte</li>
          <li>6-&lt;9% → 1 Punkt</li>
          <li>&lt;6% → 0 Punkte</li>
        </ul>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground italic">
        <p>Hinweis: Für andere Sektoren gelten angepasste Schwellenwerte. 
        Wichtig: <strong>Stabilität</strong>, <strong>Verbesserungspfad</strong>, <strong>Krisenverhalten</strong>.</p>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColor(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Operating Margin (EBIT-Marge)</h3>
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
          <div className={`text-2xl font-bold ${getColor(score)}`}>
            {displayValue !== null ? `${displayValue.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">{displayLabel}</div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColor(score)}`}>
          {score}/4 Punkte
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="space-y-1">
                <p className="font-medium text-sm">Bewertung (Software/Media):</p>
                <p className="text-sm"><span className="text-green-600">●</span> 4 Pkt: ≥ 22%</p>
                <p className="text-sm"><span className="text-green-500">●</span> 3 Pkt: 18-&lt;22%</p>
                <p className="text-sm"><span className="text-yellow-600">●</span> 2 Pkt: 14-&lt;18%</p>
                <p className="text-sm"><span className="text-orange-600">●</span> 1 Pkt: 10-&lt;14%</p>
                <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 10%</p>
              </div>
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
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-semibold">{payload[0].payload.year}</p>
                        <p className="text-sm text-primary">
                          Operating Margin: <span className="font-bold">{payload[0].value}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={22} stroke="#16a34a" strokeDasharray="3 3" />
              <ReferenceLine y={18} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={14} stroke="#ca8a04" strokeDasharray="3 3" />
              <ReferenceLine y={10} stroke="#f97316" strokeDasharray="3 3" />
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
            <span><span className="text-green-600">---</span> 22%</span>
            <span><span className="text-green-500">---</span> 18%</span>
            <span><span className="text-yellow-600">---</span> 14%</span>
            <span><span className="text-orange-600">---</span> 10%</span>
          </div>
        </div>
      )}
    </Card>
  );
};
