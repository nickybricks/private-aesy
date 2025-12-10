import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { HistoricalDataItem, ScoreResult } from '@/context/StockContextTypes';
import { useIsMobile } from '@/hooks/use-mobile';

interface ROACardProps {
  currentValue: number | null;
  historicalData?: HistoricalDataItem[];
  preset?: string;
  scoreFromBackend?: ScoreResult;
}

export const ROACard: React.FC<ROACardProps> = ({ currentValue, historicalData, preset = 'Default', scoreFromBackend }) => {
  const isMobile = useIsMobile();
  // Calculate score based on ROA value
  const calculateScore = (value: number | null): number => {
    if (value === null) return 0;
    if (value >= 8) return 1;
    return 0;
  };

  // Determine color based on thresholds
  const getScoreColor = (value: number | null): string => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 8) return 'text-green-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (value: number | null): string => {
    if (value === null) return 'bg-gray-100 border-gray-300';
    if (value >= 8) return 'bg-green-50 border-green-200';
    if (value >= 4) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Calculate medians if historical data available
  const calculateMedian = (data: HistoricalDataItem[], years: number): number | null => {
    if (!data || data.length === 0) return null;
    const recentData = data.slice(-years);
    if (recentData.length === 0) return null;
    const values = recentData.map(d => d.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  };

  const median10y = historicalData && historicalData.length >= 10 ? calculateMedian(historicalData, 10) : null;
  const median5y = historicalData && historicalData.length >= 5 ? calculateMedian(historicalData, 5) : null;
  const median3y = historicalData && historicalData.length >= 3 ? calculateMedian(historicalData, 3) : null;

  // Determine which value to display (10Y > 5Y > 3Y > current)
  let displayValue = currentValue;
  let displayLabel = 'Aktuell';

  if (median10y !== null) {
    displayValue = median10y;
    displayLabel = '10-Jahres-Median';
  } else if (median5y !== null) {
    displayValue = median5y;
    displayLabel = '5-Jahres-Median';
  } else if (median3y !== null) {
    displayValue = median3y;
    displayLabel = '3-Jahres-Median';
  }

  const score = scoreFromBackend?.score ?? calculateScore(displayValue);
  const maxScore = scoreFromBackend?.maxScore ?? 1;

  // Prepare chart data
  const chartData = historicalData?.map(item => ({
    year: item.year.toString(),
    value: item.value
  })) || [];

  // Tooltip content generator based on preset
  const getTooltipContent = () => {
    const baseContent = (
      <>
        <div className="font-semibold mb-1">Gesamtkapitalrendite = Gewinn / Gesamtes Vermögen</div>
        <p className="text-sm text-muted-foreground">(ROA = Return on Assets)</p>
        <p className="text-muted-foreground">
          Zeigt, wie viel <strong>Gewinn</strong> ein Unternehmen mit <strong>allen eingesetzten Vermögenswerten</strong> erwirtschaftet (Maschinen, Lager, Software, Cash …).
        </p>
        <p className="text-muted-foreground mt-2">
          Bildlich: Du besitzt Anlagen im Wert von 100 €. Verdient die Firma 8 € pro Jahr, ist die <strong>ROA = 8 %</strong>.
        </p>
        
        <div className="mt-2">
          <div className="font-semibold mb-1">Warum wichtig?</div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong>Effizienz-Gesamtblick:</strong> Misst, wie gut <em>alle</em> Ressourcen arbeiten – nicht nur das Eigenkapital.</li>
            <li><strong>Branchen-Thermometer:</strong> Kapitalleichte Firmen (Software) sollten meist höhere ROA haben als kapitalintensive (Industrie).</li>
            <li><strong>Qualität der Gewinne:</strong> Stetig solide ROA über Jahre deutet auf gutes Management und Prozesse hin.</li>
          </ul>
        </div>

        <div className="mt-2">
          <div className="font-semibold mb-1">Mehrjahresblick & Stabilität</div>
          <p className="text-muted-foreground">
            <strong>10/5/3-Jahres-Median</strong> und <strong>Trend</strong> ansehen (stabil/steigend besser als zackig/volatil).
          </p>
        </div>

        <div className="mt-2">
          <div className="font-semibold mb-1">Was ist „gut"?</div>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li><strong className="text-green-600">Grün (stark):</strong> <strong>≥ 8 %</strong> über mehrere Jahre (außer sehr kapitalintensiven Sektoren).</li>
            <li><strong className="text-yellow-600">Gelb (ok):</strong> <strong>4–8 %</strong> oder stark schwankend.</li>
            <li><strong className="text-red-600">Rot (schwach):</strong> <strong>&lt; 4 %</strong> dauerhaft.</li>
          </ul>
          <p className="text-muted-foreground text-xs mt-2">
            <em>(Immer mit dem <strong>Sektor-Median</strong> spiegeln: in kapitalarmen Sektoren strenger, in kapitalintensiven etwas milder.)</em>
          </p>
        </div>
      </>
    );

    if (preset === 'Industrials') {
      return (
        <div className="space-y-3 text-sm">
          {baseContent}
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground italic">
              Scoring-Preset: <strong>{preset}</strong>
            </p>
          </div>
        </div>
      );
    }

    if (preset === 'Software') {
      return (
        <div className="space-y-3 text-sm">
          {baseContent}
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground italic">
              Scoring-Preset: <strong>{preset}</strong>
            </p>
          </div>
        </div>
      );
    }

    // Default
    return (
      <div className="space-y-3 text-sm">
        {baseContent}
      </div>
    );
  };

  const getScoringTooltip = () => {
    if (preset === 'Industrials') {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-2 Punkte) - Industrials:</p>
          <p className="text-sm"><span className="text-green-600">●</span> 2 Pkt: ≥ 7%</p>
          <p className="text-sm"><span className="text-yellow-600">●</span> 1 Pkt: 5–&lt;7%</p>
          <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 5%</p>
        </div>
      );
    }

    if (preset === 'Software') {
      return (
        <div className="space-y-1">
          <p className="font-medium text-sm">Bewertung (0-2 Punkte) - Software:</p>
          <p className="text-sm"><span className="text-green-600">●</span> 2 Pkt: ≥ 10%</p>
          <p className="text-sm"><span className="text-yellow-600">●</span> 1 Pkt: 8–&lt;10%</p>
          <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 8%</p>
        </div>
      );
    }

    // Default
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm">Bewertung:</p>
        <p className="text-sm"><span className="text-green-600">●</span> 1 Pkt: ≥ 8%</p>
        <p className="text-sm"><span className="text-red-600">●</span> 0 Pkt: &lt; 8%</p>
      </div>
    );
  };

  return (
    <Card className={`border ${getBgColor(currentValue)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Gesamtkapitalrendite (ROA)</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "top" : "right"} className="max-w-md">
                  {getTooltipContent()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(displayValue)}`}>
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
          <div className={`px-2 py-1 rounded text-sm font-semibold ${getScoreColor(displayValue)}`}>
            {score}/{maxScore} Punkt{maxScore !== 1 ? 'e' : ''}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "right"}>
                {getScoringTooltip()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {historicalData && historicalData.length > 0 ? (
          <>

            {/* Chart */}
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
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'ROA']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-8">
            Keine historischen Daten verfügbar
          </div>
        )}
      </CardContent>
    </Card>
  );
};
