import React, { useState, useMemo } from 'react';
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
import { format } from 'date-fns';

interface PriceToBookCardProps {
  currentPrice: number;
  bookValuePerShare: number | null;
  historicalPrices?: Array<{ date: string; close: number }>;
  historicalBookValue?: Array<{ date: string; bookValuePerShare: number }>;
  currency: string;
  sector?: string;
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

export const PriceToBookCard: React.FC<PriceToBookCardProps> = ({
  currentPrice,
  bookValuePerShare,
  historicalPrices = [],
  historicalBookValue = [],
  currency,
  sector = 'Default'
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('5Y');

  // Calculate P/B ratio
  const priceToBook = useMemo(() => {
    if (!bookValuePerShare || bookValuePerShare <= 0) return null;
    return currentPrice / bookValuePerShare;
  }, [currentPrice, bookValuePerShare]);

  // Calculate score based on P/B ratio
  const getScore = (pb: number | null): number => {
    if (pb === null || !bookValuePerShare || bookValuePerShare <= 0) return 0;
    
    if (pb <= 1.5) return 3;
    if (pb <= 2.5) return 2;
    if (pb <= 3.5) return 1;
    return 0;
  };

  const score = getScore(priceToBook);
  const maxScore = 3;

  // Get colors based on score
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

  // Calculate percentage deviation from ideal P/B of 1.0
  const deviation = priceToBook ? ((priceToBook - 1.0) / 1.0) * 100 : 0;

  // Prepare historical data for chart
  const chartData = useMemo(() => {
    if (!historicalPrices.length) return [];

    // If we have no historical book value data, we can only show price
    if (!historicalBookValue.length) {
      // Use current book value for all historical data points
      if (!bookValuePerShare || bookValuePerShare <= 0) return [];
      
      return historicalPrices
        .map(price => ({
          date: price.date,
          price: price.close,
          pb: price.close / bookValuePerShare,
          bookValue: bookValuePerShare
        }))
        .reverse();
    }

    const bookValueMap = new Map(
      historicalBookValue.map(item => [item.date, item.bookValuePerShare])
    );

    return historicalPrices
      .map(price => {
        const bvps = bookValueMap.get(price.date);
        if (!bvps || bvps <= 0) return null;
        
        return {
          date: price.date,
          price: price.close,
          pb: price.close / bvps,
          bookValue: bvps
        };
      })
      .filter(item => item !== null)
      .reverse();
  }, [historicalPrices, historicalBookValue, bookValuePerShare]);

  // Filter data by selected range
  const filterDataByRange = (data: any[], range: TimeRange) => {
    if (!data.length) return [];
    
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
        cutoffDate.setMonth(0, 1);
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
      default:
        cutoffDate.setFullYear(now.getFullYear() - 5);
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = filterDataByRange(chartData, selectedRange);

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold text-sm mb-1">Was ist P/B?</p>
        <p className="text-sm">
          <strong>P/B = Aktienkurs / Buchwert je Aktie.</strong>
        </p>
        <p className="text-sm mt-1">
          Zeigt, wie viel der Markt für <strong>1 € Eigenkapital</strong> (laut Bilanz) bezahlt.
        </p>
        <p className="text-sm mt-2 text-muted-foreground italic">
          Beispiel: Kurs 30 €, Buchwert/Aktie 20 € ⇒ <strong>P/B 1,5</strong>.
        </p>
        <p className="text-sm mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
          <strong>Wichtig:</strong> Bei Firmen mit vielen immateriellen Vermögenswerten (Marken, Software, Goodwill) sagt der Buchwert oft wenig über den wahren Wert.
        </p>
      </div>
      
      <div className="pt-2 border-t">
        <p className="font-semibold text-sm mb-1">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Schneller Preis-Check</strong> für „substanzlastige" Firmen (Banken, Versicherer, Industrie).</li>
          <li><strong>Sicherheitsmarge:</strong> Niedriges P/B <strong>kann</strong> Unterbewertung bedeuten.</li>
          <li><strong>Qualitätsbezug:</strong> Hohe <strong>ROE</strong> (Eigenkapitalrendite) kann <strong>höheres</strong> P/B rechtfertigen.</li>
        </ul>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-3 Punkte):</p>
      <p className="text-sm"><span className="text-green-600">●</span> 3 Punkte: P/B ≤ 1.5</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 2 Punkte: P/B 1.5-2.5</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 1 Punkt: P/B 2.5-3.5</p>
      <p className="text-sm"><span className="text-red-600">●</span> 0 Punkte: P/B &gt; 3.5 oder EK ≤ 0</p>
    </div>
  );

  if (!bookValuePerShare || bookValuePerShare <= 0) {
    return (
      <Card className="p-4 border-2 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-lg">Kurs-Buchwert-Verhältnis (P/B)</h3>
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
        <p className="text-sm text-muted-foreground">
          Buchwert je Aktie nicht verfügbar oder Eigenkapital ≤ 0
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Kurs-Buchwert-Verhältnis (P/B)</h3>
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
          <div className={`text-2xl font-bold ${getColorByScore(score)}`}>
            {priceToBook?.toFixed(2) || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            {score === 3 ? 'Attraktiv' : score === 2 ? 'Moderat' : score === 1 ? 'Hoch' : 'Sehr hoch'}
          </div>
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
          <p className="text-xs text-muted-foreground">Buchwert/Aktie</p>
          <p className="font-semibold">{bookValuePerShare.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">P/B Verhältnis</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            score === 3 ? 'bg-green-100 text-green-700' :
            score === 2 ? 'bg-yellow-100 text-yellow-700' :
            score === 1 ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {priceToBook && priceToBook < 1 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {priceToBook?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                P/B <span className={`font-bold ${getColorByScore(score)}`}>
                  {priceToBook?.toFixed(2) || 'N/A'}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Kurs-Buchwert-Verhältnis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Buchwert <span className="font-bold">{bookValuePerShare.toFixed(2)} {currency}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Eigenkapital je Aktie laut Bilanz</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Abweichung von 1.0 <span className={`font-bold ${
                  deviation >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Ideales P/B = 1.0 (Kurs = Buchwert)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Time Range Selector and Chart */}
      {filteredData.length > 0 && (
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
                  tickFormatter={(value) => format(new Date(value), 'MM/yy')}
                  fontSize={11}
                  stroke="#6b7280"
                />
                <YAxis 
                  fontSize={11}
                  stroke="#6b7280"
                  width={60}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
                          <p className="text-xs font-medium mb-2">
                            {format(new Date(data.date), 'dd.MM.yyyy')}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs">
                              <span className="text-muted-foreground">P/B: </span>
                              <span className="font-semibold">{data.pb.toFixed(2)}</span>
                            </p>
                            <p className="text-xs">
                              <span className="text-muted-foreground">Kurs: </span>
                              <span className="font-semibold">{data.price.toFixed(2)} {currency}</span>
                            </p>
                            <p className="text-xs">
                              <span className="text-muted-foreground">Buchwert: </span>
                              <span className="font-semibold">{data.bookValue.toFixed(2)} {currency}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pb"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="P/B Verhältnis"
                />
                <ReferenceLine
                  y={1.5}
                  stroke="hsl(142, 76%, 36%)"
                  strokeDasharray="3 3"
                  label={{ value: 'Ziel: 1.5', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
                <ReferenceLine
                  y={2.5}
                  stroke="hsl(45, 93%, 47%)"
                  strokeDasharray="3 3"
                  label={{ value: '2.5', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
                <ReferenceLine
                  y={3.5}
                  stroke="hsl(25, 95%, 53%)"
                  strokeDasharray="3 3"
                  label={{ value: '3.5', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
};
