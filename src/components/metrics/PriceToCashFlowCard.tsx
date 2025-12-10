import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';

interface PriceToCashFlowCardProps {
  currentPrice: number;
  fcfPerShare: number | null;
  historicalPrices?: Array<{ date: string; close: number }>;
  historicalFCF?: Array<{ year: string; value: number }>;
  sharesOutstanding?: number;
  currency: string;
  sector?: string;
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

export const PriceToCashFlowCard: React.FC<PriceToCashFlowCardProps> = ({
  currentPrice,
  fcfPerShare,
  historicalPrices = [],
  historicalFCF = [],
  sharesOutstanding,
  currency,
  sector = 'Default'
}) => {
  const isMobile = useIsMobile();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('5Y');
  const hasLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    const logKey = `${currentPrice}-${fcfPerShare}`;
    if (hasLoggedRef.current === logKey) return;
    hasLoggedRef.current = logKey;
    
    console.log('💰 PriceToCashFlowCard:', {
      currentPrice,
      fcfPerShare,
      currency,
      reportedCurrency: 'UNKNOWN - needs to be passed as prop',
      conversionApplied: false
    });
  }, [currentPrice, fcfPerShare, currency]);

  // Calculate P/FCF ratio
  const priceToCashFlow = useMemo(() => {
    if (!fcfPerShare || fcfPerShare <= 0) return null;
    return currentPrice / fcfPerShare;
  }, [currentPrice, fcfPerShare]);

  // Check if FCF was negative in 2 out of last 3 years
  const hasNegativeCashFlow = useMemo(() => {
    if (!historicalFCF || historicalFCF.length < 3) return false;
    
    const lastThreeYears = historicalFCF.slice(0, 3);
    const negativeCount = lastThreeYears.filter(item => item.value < 0).length;
    
    return negativeCount >= 2;
  }, [historicalFCF]);

  // Calculate score based on P/FCF ratio
  const getScore = (pcf: number | null): number => {
    if (pcf === null || !fcfPerShare || fcfPerShare <= 0 || hasNegativeCashFlow) return 0;
    
    if (pcf <= 12) return 4;
    if (pcf <= 16) return 3;
    if (pcf <= 20) return 2;
    if (pcf <= 25) return 1;
    return 0;
  };

  const score = getScore(priceToCashFlow);
  const maxScore = 4;

  // Get colors based on score
  const getColorByScore = (score: number): string => {
    if (score === 4) return 'text-green-600';
    if (score === 3) return 'text-yellow-600';
    if (score === 2) return 'text-orange-600';
    if (score === 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number): string => {
    if (!fcfPerShare || fcfPerShare <= 0) return 'bg-gray-100 border-gray-300';
    if (score === 4) return 'bg-green-50 border-green-200';
    if (score === 3) return 'bg-yellow-50 border-yellow-200';
    if (score === 2) return 'bg-orange-50 border-orange-200';
    if (score === 1) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Calculate percentage deviation from ideal P/FCF of 12
  const deviation = priceToCashFlow ? ((priceToCashFlow - 12) / 12) * 100 : 0;

  // Prepare historical data for chart
  const chartData = useMemo(() => {
    if (!historicalPrices.length || !historicalFCF.length || !sharesOutstanding) return [];

    // Sort FCF data by year (newest first, then reverse for chronological order)
    const sortedFCF = [...historicalFCF].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Create a map of FCF per share by year
    const fcfPerShareMap = new Map(
      sortedFCF.map(item => {
        const fcfPS = item.value / sharesOutstanding;
        return [item.year, fcfPS];
      })
    );

    // Process historical prices and match with FCF data
    const processedData = historicalPrices
      .map(price => {
        const year = new Date(price.date).getFullYear().toString();
        const fcfPS = fcfPerShareMap.get(year);
        
        // Skip if no FCF data for this year or FCF is negative/zero
        if (!fcfPS || fcfPS <= 0) return null;
        
        return {
          date: price.date,
          price: price.close,
          pcf: price.close / fcfPS,
          fcfPerShare: fcfPS
        };
      })
      .filter(item => item !== null);

    return processedData;
  }, [historicalPrices, historicalFCF, sharesOutstanding]);

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
        <p className="font-semibold text-sm mb-1">Kurs-Cashflow-Verhältnis</p>
        <p className="text-sm text-muted-foreground mb-1">(P/FCF = Price to Free Cash Flow)</p>
        <p className="text-sm">
          <strong>P/FCF = Aktienkurs / Free Cashflow je Aktie.</strong>
        </p>
        <p className="text-sm mt-1">
          Zeigt, wie viele Euro du für <strong>1 € Cashflow</strong> der Firma zahlst.
        </p>
        <p className="text-sm mt-2">
          <strong>Varianten:</strong>
        </p>
        <ul className="text-sm list-disc list-inside mt-1">
          <li><strong>P/FCF</strong>: Preis zum <strong>freien Cashflow</strong> (nach nötigen Investitionen/Capex). → <strong>Bevorzugt!</strong></li>
        </ul>
        <p className="text-sm mt-2 text-muted-foreground italic">
          Beispiel: Kurs 30 €, FCF/Aktie 2,5 € ⇒ <strong>P/FCF 12</strong> (du zahlst das 12-Fache des jährlichen freien Cashflows).
        </p>
      </div>
      
      <div className="pt-2 border-t">
        <p className="font-semibold text-sm mb-1">Warum wichtig?</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li><strong>Cash schlägt Papiergewinn:</strong> Cashflow ist schwerer „schönzurechnen" als der Gewinn.</li>
          <li><strong>Ausschüttungsfähigkeit:</strong> Aus FCF werden Dividenden, Rückkäufe, Schuldenabbau finanziert.</li>
          <li><strong>Bewertungsfilter:</strong> Niedrigeres Multiple = mehr Sicherheitsmarge – sofern <strong>qualitativer Cash</strong>.</li>
        </ul>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-4 Punkte):</p>
      <p className="text-sm"><span className="text-green-600">●</span> 4 Punkte: P/FCF ≤ 12</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 3 Punkte: P/FCF 12-16</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 2 Punkte: P/FCF 16-20</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 1 Punkt: P/FCF 20-25</p>
      <p className="text-sm"><span className="text-red-600">●</span> 0 Punkte: P/FCF &gt; 25 oder FCF in 2/3 Jahren negativ</p>
    </div>
  );

  if (!fcfPerShare || fcfPerShare <= 0) {
    return (
      <Card className="p-4 border-2 bg-gray-50 border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-lg">Kurs-Cashflow-Verhältnis (P/FCF)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "right"} className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Free Cashflow je Aktie nicht verfügbar oder FCF ≤ 0
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Kurs-Cashflow-Verhältnis (P/FCF)</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "top" : "right"} className="max-w-md">
                {mainTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getColorByScore(score)}`}>
            {priceToCashFlow?.toFixed(2) || 'N/A'}
          </div>
          <div className="text-xs text-muted-foreground">
            {score === 4 ? 'Sehr attraktiv' : score === 3 ? 'Attraktiv' : score === 2 ? 'Moderat' : score === 1 ? 'Hoch' : 'Sehr hoch / Negativ'}
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
            <TooltipContent side={isMobile ? "top" : "right"}>
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
          <p className="text-xs text-muted-foreground">FCF/Aktie</p>
          <p className="font-semibold">{fcfPerShare.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">P/FCF Verhältnis</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            score === 4 ? 'bg-green-100 text-green-700' :
            score === 3 ? 'bg-yellow-100 text-yellow-700' :
            score >= 1 ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {priceToCashFlow && priceToCashFlow < 12 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {priceToCashFlow?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                P/FCF <span className={`font-bold ${getColorByScore(score)}`}>
                  {priceToCashFlow?.toFixed(2) || 'N/A'}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Kurs-Cashflow-Verhältnis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                FCF/Aktie <span className="font-bold">{fcfPerShare.toFixed(2)} {currency}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Freier Cashflow je Aktie</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Abweichung von 12 <span className={`font-bold ${
                  deviation >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Ideales P/FCF = 12 (attraktive Bewertung)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {hasNegativeCashFlow && (
          <>
            <span>•</span>
            <span className="text-red-600 font-semibold">⚠ FCF in 2/3 Jahren negativ</span>
          </>
        )}
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
                {range === 'YTD' ? range : range.replace('Y', 'J')}
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
                  allowEscapeViewBox={{ x: false, y: false }}
                  wrapperStyle={{ zIndex: 50, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden' }}
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
                              <span className="text-muted-foreground">P/FCF: </span>
                              <span className="font-semibold">{data.pcf.toFixed(2)}</span>
                            </p>
                            <p className="text-xs">
                              <span className="text-muted-foreground">Kurs: </span>
                              <span className="font-semibold">{data.price.toFixed(2)} {currency}</span>
                            </p>
                            <p className="text-xs">
                              <span className="text-muted-foreground">FCF/Aktie: </span>
                              <span className="font-semibold">{data.fcfPerShare.toFixed(2)} {currency}</span>
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
                  dataKey="pcf"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="P/FCF Verhältnis"
                />
                <ReferenceLine
                  y={12}
                  stroke="hsl(142, 76%, 36%)"
                  strokeDasharray="3 3"
                  label={{ value: 'Ziel: 12', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
                <ReferenceLine
                  y={16}
                  stroke="hsl(45, 93%, 47%)"
                  strokeDasharray="3 3"
                  label={{ value: '16', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
                <ReferenceLine
                  y={20}
                  stroke="hsl(25, 95%, 53%)"
                  strokeDasharray="3 3"
                  label={{ value: '20', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
                <ReferenceLine
                  y={25}
                  stroke="hsl(0, 72%, 51%)"
                  strokeDasharray="3 3"
                  label={{ value: '25', position: 'right', fontSize: 11, fill: '#6b7280' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
};
