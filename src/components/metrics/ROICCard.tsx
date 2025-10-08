import React from 'react';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';

interface ROICCardProps {
  currentValue: number | null;
  historicalData?: Array<{ year: string; value: number }>;
  wacc?: number;
}

export const ROICCard: React.FC<ROICCardProps> = ({ currentValue, historicalData, wacc }) => {
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

  // Calculate spread over WACC
  const spread = displayValue !== null && wacc !== null && wacc !== undefined 
    ? displayValue - wacc 
    : null;

  // Score calculation based on ROIC value and WACC spread
  const getScore = (value: number | null, waccValue?: number): number => {
    if (value === null) return 0;
    
    // If WACC is available, consider the spread
    if (waccValue !== null && waccValue !== undefined) {
      if (value >= 15 && value > waccValue) return 2;
      if (value >= 8 && value > waccValue) return 1;
      return 0;
    }
    
    // Fallback to absolute values if WACC not available
    if (value >= 15) return 2;
    if (value >= 8) return 1;
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

  const score = getScore(displayValue, wacc);

  const tooltipContent = (
    <div className="max-w-sm space-y-2">
      <p className="font-semibold">ROIC = Rendite auf das im Kerngeschäft gebundene Kapital</p>
      <p className="text-sm italic">
        Einfach gesagt: Wie viel Gewinn nach Steuern verdient die Firma auf jeden Euro, 
        der im Geschäft arbeitet (Maschinen, Lager, Software – abzüglich überschüssiger Kasse).
      </p>
      
      <div className="space-y-1">
        <p className="font-medium text-sm">Formel in leicht:</p>
        <ul className="text-sm space-y-1 list-disc list-inside ml-2">
          <li><strong>ROIC ≈ NOPAT / Invested Capital</strong></li>
          <li><strong>NOPAT</strong> = operativer Gewinn (EBIT) × (1 − normalisierte Steuerquote)</li>
          <li><strong>Invested Capital</strong> = Betriebsvermögen (Working Capital + Anlagen + nötige immaterielle Werte) minus überschüssige Liquidität</li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Moat-Messer:</strong> Dauerhaft hoher ROIC zeigt Preissetzungsmacht, Effizienz und starke Position.</li>
          <li><strong>Werttreiber:</strong> Nur wenn ROIC &gt; Kapitalkosten (WACC), wird nachhaltig Wert geschaffen.</li>
          <li><strong>Manager-Score:</strong> Zeigt, wie gut das Management Kapital zuteilt (Investitionen, Zukäufe, Rückkäufe).</li>
        </ul>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Mehrjahresblick & Stabilität:</p>
        <p className="text-sm">10/5/3-Jahres-Median und Trend prüfen: ist ROIC konstant hoch oder zackig?</p>
      </div>

      <div className="space-y-1">
        <p className="font-medium text-sm">Spread über WACC:</p>
        <p className="text-sm">
          Entscheidend ist der Abstand: <strong>ROIC − WACC</strong>.
          {' '}&gt; 0 = Wertschaffung; je größer, desto besser (Moat-Hinweis).
        </p>
      </div>

      <div className="pt-2 border-t space-y-1">
        <p className="font-medium text-sm">Bewertung:</p>
        <p className="text-sm"><span className="text-green-600">●</span> Grün (2 Pkt): ≥ 15% und klar &gt; WACC über mehrere Jahre</p>
        <p className="text-sm"><span className="text-yellow-600">●</span> Gelb (1 Pkt): 8-15% oder nur knapp &gt; WACC</p>
        <p className="text-sm"><span className="text-red-600">●</span> Rot (0 Pkt): &lt; 8% oder ≤ WACC (kein Wertaufbau)</p>
      </div>
    </div>
  );

  return (
    <Card className={`p-4 border-2 ${getBgColor(score)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">ROIC (Return on Invested Capital)</h3>
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

      {/* Score indicator and WACC spread */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Bewertung:</div>
          <div className={`px-2 py-1 rounded text-sm font-semibold ${getColor(score)}`}>
            {score}/2 Punkte
          </div>
        </div>
        
        {spread !== null && wacc !== null && wacc !== undefined && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Spread vs. WACC:</div>
            <div className={`px-2 py-1 rounded text-xs font-semibold ${
              spread > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {spread > 0 ? '+' : ''}{spread.toFixed(1)} pp
            </div>
          </div>
        )}
      </div>

      {wacc !== null && wacc !== undefined && (
        <div className="text-xs text-muted-foreground mb-3">
          WACC (Kapitalkosten): {wacc.toFixed(1)}%
        </div>
      )}

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
                          ROIC: <span className="font-bold">{payload[0].value}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={15} stroke="#16a34a" strokeDasharray="3 3" />
              <ReferenceLine y={8} stroke="#ca8a04" strokeDasharray="3 3" />
              {wacc !== null && wacc !== undefined && (
                <ReferenceLine y={wacc} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'WACC', fontSize: 10, fill: '#dc2626' }} />
              )}
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
            <span><span className="text-green-600">---</span> 15% (Exzellent)</span>
            <span><span className="text-yellow-600">---</span> 8% (Akzeptabel)</span>
            {wacc !== null && wacc !== undefined && (
              <span><span className="text-red-600">---</span> WACC ({wacc.toFixed(1)}%)</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
