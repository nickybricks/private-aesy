import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { useChartTooltipTrigger } from '@/hooks/useChartTooltipTrigger';

interface PriceToMedianPSChartProps {
  ticker: string;
  currentPrice: number;
  sector?: string;
  currency?: string;
  onDiscountCalculated?: (discount: number, score: number) => void;
  skipScoreUpdate?: boolean;
}

type TimeRange = '1Y' | '3Y' | '5Y' | '10Y' | 'MAX';
type LookbackPeriod = '2Y' | '5Y' | '10Y' | '15Y';

interface QuarterData {
  date: string;
  price: number;
  revenue: number;
  shares: number;
  revTTM: number;
  sharesTTM: number;
  rps: number;
  ps: number;
}

interface DailyPrice {
  date: string;
  price: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  priceAtMedianPS?: number;
  rps?: number;
  ps?: number;
  isQuarterEnd?: boolean;
}

const fetchFromFMP = async (endpoint: string, params = {}) => {
  try {
    const response = await axios.get(`https://financialmodelingprep.com/api/v3${endpoint}`, {
      params: {
        apikey: DEFAULT_FMP_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data from FMP:', error);
    throw error;
  }
};

export const PriceToMedianPSChart: React.FC<PriceToMedianPSChartProps> = ({
  ticker,
  currentPrice,
  sector = 'Default',
  currency = 'USD',
  onDiscountCalculated,
  skipScoreUpdate = false
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('10Y');
  const [lookbackPeriod, setLookbackPeriod] = useState<LookbackPeriod>('5Y');
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [medianPS, setMedianPS] = useState<number>(0);
  const [currentRPS, setCurrentRPS] = useState<number>(0);
  const [currentPS, setCurrentPS] = useState<number>(0);
  const [hasInsufficientData, setHasInsufficientData] = useState(false);
  const hasLoggedRef = useRef<string | null>(null);
  const tooltipTrigger = useChartTooltipTrigger();

  // Fetch and calculate P/S data
  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
      if (hasLoggedRef.current !== ticker) {
        hasLoggedRef.current = ticker;
        console.log('💰 PriceToMedianPSChart:', {
          ticker,
          currentPrice,
          currency,
          sector,
          reportedCurrency: 'UNKNOWN - needs to be passed as prop',
          conversionApplied: false
        });
      }
      
      setIsLoading(true);
      setHasInsufficientData(false);
      
      try {
        // Fetch 30 years of historical prices
        const thirtyYearsAgo = new Date();
        thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
        const fromDate = thirtyYearsAgo.toISOString().split('T')[0];
        
        const [prices, incomeStatements] = await Promise.all([
          fetchFromFMP(`/historical-price-full/${ticker}`, { from: fromDate }),
          fetchFromFMP(`/income-statement/${ticker}`, { period: 'quarter', limit: 140 })
        ]);

        if (!incomeStatements || incomeStatements.length < 8) {
          console.warn('Insufficient quarterly data (need at least 8 quarters)');
          setHasInsufficientData(true);
          setIsLoading(false);
          return;
        }

        // Store daily prices
        const daily: DailyPrice[] = (prices.historical || []).map((p: any) => ({
          date: p.date,
          price: p.adjClose
        }));
        setDailyPrices(daily);

        // Create a price lookup map
        const priceMap = new Map<string, number>();
        prices.historical?.forEach((p: any) => {
          priceMap.set(p.date, p.adjClose);
        });

        // Sort income statements chronologically (oldest first)
        const sortedStatements = [...incomeStatements].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        console.log(`Processing ${sortedStatements.length} quarterly statements for ${ticker}`);
        console.log(`Latest quarter date: ${sortedStatements[sortedStatements.length - 1]?.date}`);

        // Process quarterly data - start from i=3 to include latest quarters
        const processed: QuarterData[] = [];
        
        for (let i = 3; i < sortedStatements.length; i++) {
          const statement = sortedStatements[i];
          const date = statement.date;
          const revenue = statement.revenue;
          const shares = statement.weightedAverageShsOutDil;

          // Skip if negative revenue or missing data
          if (!revenue || revenue <= 0 || !shares || shares <= 0) {
            continue;
          }

          // Get price at quarter end (or closest available, preferring dates <= quarter end)
          const price = findClosestPrice(priceMap, date);
          if (!price) continue;

          // Calculate TTM revenue (sum of current + 3 previous quarters)
          let revTTM = 0;
          let sharesTTM = 0;
          let validQuarters = 0;

          for (let j = 0; j < 4; j++) {
            const q = sortedStatements[i - j];
            if (q && q.revenue > 0 && q.weightedAverageShsOutDil > 0) {
              revTTM += q.revenue;
              sharesTTM += q.weightedAverageShsOutDil;
              validQuarters++;
            }
          }

          if (validQuarters === 4) {
            sharesTTM = sharesTTM / 4; // Average shares
            const rps = revTTM / sharesTTM;
            const ps = price / rps;

            if (rps > 0 && ps > 0 && isFinite(ps)) {
              processed.push({
                date,
                price,
                revenue,
                shares,
                revTTM,
                sharesTTM,
                rps,
                ps
              });
            }
          }
        }

        if (processed.length < 8) {
          console.warn('Not enough valid quarters after processing');
          setHasInsufficientData(true);
          setIsLoading(false);
          return;
        }

        console.log(`Successfully processed ${processed.length} quarters for ${ticker}`);
        console.log(`Date range: ${processed[0]?.date} to ${processed[processed.length - 1]?.date}`);

        // Already sorted chronologically (oldest to newest)
        setQuarterData(processed);
        
        // Set current RPS and PS from most recent data
        if (processed.length > 0) {
          const latest = processed[processed.length - 1];
          setCurrentRPS(latest.rps);
          setCurrentPS(latest.ps);
        }

      } catch (error) {
        console.error('Error fetching P/S data:', error);
        setQuarterData([]);
        setHasInsufficientData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  // Calculate median P/S based on lookback period (independent of chart zoom)
  useEffect(() => {
    if (quarterData.length === 0) return;

    const now = new Date();
    const cutoffDate = new Date();
    
    switch (lookbackPeriod) {
      case '2Y':
        cutoffDate.setFullYear(now.getFullYear() - 2);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
      case '15Y':
        cutoffDate.setFullYear(now.getFullYear() - 15);
        break;
    }

    const filteredForMedian = quarterData.filter(q => new Date(q.date) >= cutoffDate);
    
    console.log(`Calculating median P/S with ${filteredForMedian.length} quarters (lookback: ${lookbackPeriod})`);
    
    if (filteredForMedian.length === 0) {
      setMedianPS(0);
      return;
    }

    // Calculate median
    const psValues = filteredForMedian.map(q => q.ps).sort((a, b) => a - b);
    const mid = Math.floor(psValues.length / 2);
    const median = psValues.length % 2 === 0 
      ? (psValues[mid - 1] + psValues[mid]) / 2 
      : psValues[mid];
    
    console.log(`Median P/S (${lookbackPeriod}): ${median.toFixed(2)}`);
    setMedianPS(median);
  }, [quarterData, lookbackPeriod]);

  // Helper function to find closest price (preferring dates <= targetDate)
  const findClosestPrice = (priceMap: Map<string, number>, targetDate: string): number | null => {
    const target = new Date(targetDate);
    let closest: { date: Date; price: number } | null = null;
    let minDiff = Infinity;

    priceMap.forEach((price, dateStr) => {
      const date = new Date(dateStr);
      // Prefer prices on or before the target date
      if (date <= target) {
        const diff = target.getTime() - date.getTime();
        if (diff < minDiff) {
          minDiff = diff;
          closest = { date, price };
        }
      }
    });

    // If no price found before target, find closest after
    if (!closest) {
      priceMap.forEach((price, dateStr) => {
        const date = new Date(dateStr);
        const diff = date.getTime() - target.getTime();
        if (diff < minDiff) {
          minDiff = diff;
          closest = { date, price };
        }
      });
    }

    return closest?.price || null;
  };

  // Calculate price at median P/S and discount
  const priceAtMedianPS = medianPS > 0 && currentRPS > 0 ? currentRPS * medianPS : 0;
  const discount = priceAtMedianPS > 0 ? ((priceAtMedianPS - currentPrice) / priceAtMedianPS) * 100 : 0;

  // Get score based on discount (3-point system)
  const getScore = (discount: number): number => {
    if (discount >= 35) return 3;
    if (discount >= 23) return 2;
    if (discount >= 12) return 1;
    if (discount >= 0) return 0.5;
    return 0; // Overvalued
  };

  const score = getScore(discount);
  const maxScore = 3;

  // Notify parent component when discount/score changes (with ref to prevent loops)
  const lastReportedScoreRef = useRef<{ discount: number; score: number } | null>(null);
  useEffect(() => {
    // Skip score update if explicitly disabled (e.g., in ValuationTab where pre-loader already calculated)
    if (skipScoreUpdate || !onDiscountCalculated || isLoading || hasInsufficientData) {
      return;
    }
    
    // Only call if values actually changed
    if (!lastReportedScoreRef.current || 
        lastReportedScoreRef.current.discount !== discount || 
        lastReportedScoreRef.current.score !== score) {
      lastReportedScoreRef.current = { discount, score };
      onDiscountCalculated(discount, score);
    }
  }, [discount, score, isLoading, hasInsufficientData, onDiscountCalculated, skipScoreUpdate]);

  // Get color based on score
  const getColorByScore = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio === 1) return 'text-green-600';
    if (ratio >= 0.75) return 'text-lime-600';
    if (ratio >= 0.5) return 'text-yellow-600';
    if (ratio >= 0.25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number, maxScore: number): string => {
    if (maxScore === 0) return 'bg-gray-100 border-gray-300';
    const ratio = score / maxScore;
    if (ratio === 1) return 'bg-green-50 border-green-200';
    if (ratio >= 0.75) return 'bg-lime-50 border-lime-200';
    if (ratio >= 0.5) return 'bg-yellow-50 border-yellow-200';
    if (ratio >= 0.25) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Helper function to find quarter data with fuzzy date matching
  const findQuarterForDate = (
    dailyDate: string, 
    quarterMap: Map<string, QuarterData>
  ): QuarterData | undefined => {
    // 1. Try exact match first
    if (quarterMap.has(dailyDate)) {
      return quarterMap.get(dailyDate);
    }
    
    // 2. Try ±3 days tolerance (for trading days vs. quarter-end dates)
    const target = new Date(dailyDate);
    for (let offset = -3; offset <= 3; offset++) {
      if (offset === 0) continue; // Already tested
      const testDate = new Date(target);
      testDate.setDate(testDate.getDate() + offset);
      const testDateStr = testDate.toISOString().split('T')[0];
      if (quarterMap.has(testDateStr)) {
        return quarterMap.get(testDateStr);
      }
    }
    
    return undefined;
  };

  // Build chart data: merge daily prices with quarterly P/S data (memoized)
  const chartData = useMemo(() => {
    if (dailyPrices.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedRange) {
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '3Y':
        cutoffDate.setFullYear(now.getFullYear() - 3);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
      case 'MAX':
        cutoffDate.setFullYear(now.getFullYear() - 30);
        break;
    }
    
    // Filter daily prices by range and sort ascending (oldest to newest)
    const filteredDaily = dailyPrices
      .filter(d => new Date(d.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Create a map of quarter-end data
    const quarterMap = new Map<string, QuarterData>();
    quarterData.forEach(q => {
      quarterMap.set(q.date, q);
    });
    
    // Merge daily prices with quarterly median P/S using fuzzy matching
    const result = filteredDaily.map(daily => {
      const quarter = findQuarterForDate(daily.date, quarterMap);
      if (quarter && medianPS > 0) {
        return {
          date: daily.date,
          price: daily.price,
          priceAtMedianPS: quarter.rps * medianPS,
          rps: quarter.rps,
          ps: quarter.ps,
          isQuarterEnd: true
        };
      }
      return {
        date: daily.date,
        price: daily.price
      };
    });
    
    return result;
  }, [dailyPrices, quarterData, selectedRange, medianPS]);

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">Preis beim Median-KUV</p>
        <p className="text-sm text-muted-foreground">(Price at Median P/S)</p>
        <p className="text-xs mt-1">
          Zeigt, zu welchem Kurs die Aktie handeln würde, <strong>wenn</strong> sie heute genau zum <strong>Median ihres historischen KUV (P/S)</strong> bewertet wäre.
        </p>
      </div>
      
      <div className="text-xs">
        <p className="font-medium mb-1">Definitionen:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><strong>KUV (P/S)</strong> = Price-to-Sales Ratio = Kurs / Umsatz je Aktie</li>
          <li><strong>RPS</strong> = Revenue per Share = Umsatz je Aktie (TTM)</li>
          <li><strong>Median-KUV</strong> = Median aller KUV-Werte im Lookback-Fenster</li>
        </ul>
      </div>

      <div className="text-xs space-y-1">
        <p className="font-medium">Interpretation:</p>
        <div className="space-y-1 pl-2 border-l-2 border-border">
          <p>• <strong>Kurs &gt; Preis beim Median-KUV</strong> → teurer als historischer Median</p>
          <p>• <strong>Kurs &lt; Preis beim Median-KUV</strong> → günstiger als historischer Median</p>
        </div>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-3 Punkte):</p>
      <p className="text-sm"><span className="text-green-600">●</span> 3 Punkte: ≥ 35%</p>
      <p className="text-sm"><span className="text-lime-600">●</span> 2 Punkte: ≥ 23%</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 1 Punkt: ≥ 12%</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 0,5 Punkt: ≥ 0%</p>
      <p className="text-sm"><span className="text-red-600">●</span> 0 Punkte: &lt; 0% (überbewertet)</p>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Lade P/S-Daten...</div>
        </div>
      </Card>
    );
  }

  if (hasInsufficientData) {
    return (
      <Card className="p-4 border-2 border-yellow-200 bg-yellow-50">
        <div className="flex items-center gap-2 text-yellow-700">
          <Info className="h-5 w-5" />
          <p className="text-sm font-medium">
            Nicht genügend Daten für P/S-Analyse (min. 2 Jahre benötigt)
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Preis vs. Preis beim Median-KUV</h3>
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
          <div className={`text-2xl font-bold ${getColorByScore(score, maxScore)}`}>
            {discount >= 0 ? '+' : ''}{discount.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {discount >= 0 ? 'Unterbewertet' : 'Überbewertet'}
          </div>
        </div>
      </div>

      {/* Score indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-medium">Bewertung:</div>
        <div className={`px-2 py-1 rounded text-sm font-semibold ${getColorByScore(score, maxScore)}`}>
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
          <p className="text-xs text-muted-foreground">Preis @ Median P/S</p>
          <p className="font-semibold">{priceAtMedianPS.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Differenz</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            discount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {discount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {discount >= 0 ? '+' : ''}{(priceAtMedianPS - currentPrice).toFixed(2)} {currency}
          </div>
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                RPS (TTM) <span className="font-bold">{currentRPS.toFixed(2)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Revenue Per Share (Trailing Twelve Months)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                P/S aktuell <span className="font-bold">{currentPS.toFixed(2)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Aktuelles Price-to-Sales Ratio</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Median P/S ({lookbackPeriod}) <span className="font-bold">{medianPS.toFixed(2)}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Median des P/S über {lookbackPeriod}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Selectors: Side-by-side on desktop, stacked on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        {/* Lookback Period Selector */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Lookback-Zeitraum für Median:</p>
          <div className="flex gap-1">
            {(['2Y', '5Y', '10Y', '15Y'] as LookbackPeriod[]).map(period => (
              <Button
                key={period}
                variant={lookbackPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLookbackPeriod(period)}
                className="text-xs h-7 px-2.5"
              >
                {period.replace('Y', 'J')}
              </Button>
            ))}
          </div>
        </div>

        {/* Time Range Selector for Chart */}
        <div className="sm:text-right">
          <p className="text-xs text-muted-foreground mb-2">Chart-Zeitraum:</p>
          <div className="flex gap-1 sm:justify-end">
            {(['1Y', '3Y', '5Y', '10Y', 'MAX'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={selectedRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range)}
                className="text-xs h-7 px-2.5"
              >
                {range === 'MAX' ? 'MAX' : range.replace('Y', 'J')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                if (selectedRange === '1Y') {
                  return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
                }
                return date.getFullYear().toString();
              }}
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              stroke="#9ca3af"
              domain={['auto', 'auto']}
              width={60}
            />
            <RechartsTooltip
              trigger={tooltipTrigger}
              wrapperStyle={{ zIndex: 50, maxWidth: 'calc(100vw - 32px)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataPoint;
                  
                  // Show full details for all data points like before
                  if (data.priceAtMedianPS && data.rps && data.ps) {
                    const discountAtPoint = ((data.priceAtMedianPS - data.price) / data.priceAtMedianPS) * 100;
                    return (
                      <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 max-w-[280px]">
                        <p className="text-xs font-semibold mb-1">
                          {new Date(data.date).toLocaleDateString('de-DE')}
                        </p>
                        <p className="text-sm text-blue-600">
                          Kurs: <span className="font-bold">{data.price.toFixed(2)} {currency}</span>
                        </p>
                        <p className="text-sm text-purple-600">
                          Preis @ Median P/S: <span className="font-bold">{data.priceAtMedianPS.toFixed(2)} {currency}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          RPS (TTM): <span className="font-semibold">{data.rps.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          P/S: <span className="font-semibold">{data.ps.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Median P/S: <span className="font-semibold">{medianPS.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Discount: <span className={`font-bold ${discountAtPoint >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {discountAtPoint >= 0 ? '+' : ''}{discountAtPoint.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    );
                  }
                  
                  // For daily price points without P/S data
                  return (
                    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3 max-w-[280px]">
                      <p className="text-xs font-semibold mb-1">
                        {new Date(data.date).toLocaleDateString('de-DE')}
                      </p>
                      <p className="text-sm text-blue-600">
                        Kurs: <span className="font-bold">{data.price.toFixed(2)} {currency}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Price line (blue) - daily data */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Preis"
            />
            
            {/* Price at Median P/S line (violet) - quarterly data only */}
            <Line 
              type="monotone" 
              dataKey="priceAtMedianPS" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                // Only show dot if this point has priceAtMedianPS data
                if (payload.priceAtMedianPS !== undefined) {
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={3} 
                      fill="#8b5cf6" 
                      stroke="#8b5cf6" 
                      strokeWidth={1}
                    />
                  );
                }
                return null;
              }}
              connectNulls={true}
              name="Preis @ Median P/S"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
