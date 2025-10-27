import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

interface QuarterlyData {
  date: string;
  filingDate: string;
  netIncome: number;
  eps: number;
  weightedAverageShsOutDil: number;
  epsWithoutNRI?: number;
}

interface AnnualData {
  date: string;
  ebitda: number;
  weightedAverageShsOutDil: number;
  bookValuePerShare?: number;
}

interface PriceData {
  date: string;
  adjClose: number;
}

interface LynchDataPoint {
  date: string;
  price: number;
  fairValue: number | null;
  discount?: number;
}

interface PeterLynchDiscountCardProps {
  ticker: string;
  currentPrice: number;
  currency: string;
  sector?: string;
}

type TimeRange = '1M' | '6M' | 'YTD' | '1Y' | '5Y' | '10Y' | '25Y' | 'MAX';

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

const isBank = (ticker: string): boolean => {
  const bankTickers = ['BAC', 'JPM', 'WFC', 'C', 'GS', 'MS'];
  return bankTickers.includes(ticker.toUpperCase());
};

export const PeterLynchDiscountCard: React.FC<PeterLynchDiscountCardProps> = ({
  ticker,
  currentPrice,
  currency,
  sector = 'Technology'
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoggedRef = useRef<string | null>(null);
  
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [annualData, setAnnualData] = useState<AnnualData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);

  // Fetch financial data
  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
      if (hasLoggedRef.current !== ticker) {
        hasLoggedRef.current = ticker;
        console.log('💰 PeterLynchDiscountCard:', {
          ticker,
          currentPrice,
          currency,
          reportedCurrency: 'UNKNOWN - needs to be passed as prop',
          conversionApplied: false
        });
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [quarterly, annual, prices] = await Promise.all([
          fetchFromFMP(`/income-statement/${ticker}`, { period: 'quarter', limit: 40 }),
          fetchFromFMP(`/income-statement/${ticker}`, { period: 'annual', limit: 10 }),
          fetchFromFMP(`/historical-price-full/${ticker}`, { from: '2014-01-01' })
        ]);

        const processedQuarterly: QuarterlyData[] = quarterly
          .filter((q: any) => q.netIncome !== null && q.weightedAverageShsOutDil > 0)
          .map((q: any) => ({
            date: q.date,
            filingDate: q.fillingDate || q.date,
            netIncome: q.netIncome,
            eps: q.eps || (q.netIncome / q.weightedAverageShsOutDil),
            weightedAverageShsOutDil: q.weightedAverageShsOutDil,
            epsWithoutNRI: q.epsWithoutNRI
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const processedAnnual: AnnualData[] = annual
          .filter((a: any) => a.ebitda !== null && a.weightedAverageShsOutDil > 0)
          .map((a: any) => ({
            date: a.date,
            ebitda: a.ebitda,
            weightedAverageShsOutDil: a.weightedAverageShsOutDil,
            bookValuePerShare: a.bookValuePerShare
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const processedPrices: PriceData[] = prices.historical
          ?.map((p: any) => ({
            date: p.date,
            adjClose: p.adjClose
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

        setQuarterlyData(processedQuarterly);
        setAnnualData(processedAnnual);
        setPriceData(processedPrices);
      } catch (error) {
        console.error('Error fetching Lynch data:', error);
        setError('Fehler beim Laden der Finanzdaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticker]);

  // Calculate EPS TTM from quarterly data
  const epsTimeSeries = useMemo(() => {
    if (quarterlyData.length < 4) return [];

    const result: { date: string; epsTTM: number }[] = [];
    
    for (let i = 3; i < quarterlyData.length; i++) {
      const last4Quarters = quarterlyData.slice(i - 3, i + 1);
      const epsTTM = last4Quarters.reduce((sum, q) => sum + q.eps, 0);
      
      result.push({
        date: quarterlyData[i].filingDate,
        epsTTM
      });
    }
    
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [quarterlyData]);

  // Calculate 5-year CAGR for PEG mode
  const growthRate = useMemo(() => {
    if (annualData.length < 6) return null;

    const isBankStock = isBank(ticker);
    const sortedData = [...annualData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const latest = sortedData[sortedData.length - 1];
    const fiveYearsAgo = sortedData[sortedData.length - 6];
    
    if (!latest || !fiveYearsAgo) return null;

    let currentValue: number;
    let pastValue: number;

    if (isBankStock) {
      currentValue = latest.bookValuePerShare || 0;
      pastValue = fiveYearsAgo.bookValuePerShare || 0;
    } else {
      currentValue = latest.ebitda / latest.weightedAverageShsOutDil;
      pastValue = fiveYearsAgo.ebitda / fiveYearsAgo.weightedAverageShsOutDil;
    }

    if (pastValue <= 0 || currentValue <= 0) return null;

    const cagr = (Math.pow(currentValue / pastValue, 1/5) - 1) * 100;
    
    if (cagr < 5) return null;
    return Math.min(25, Math.max(5, cagr));
  }, [annualData, ticker]);

  // Filter data by time range
  const getFilteredData = (data: any[], range: TimeRange) => {
    if (!data || data.length === 0) return [];
    
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
        cutoffDate.setMonth(0);
        cutoffDate.setDate(1);
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
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!priceData.length || !epsTimeSeries.length || growthRate === null) return [];

    const filteredPrices = getFilteredData(priceData, selectedRange);
    
    const result: LynchDataPoint[] = [];
    let epsIndex = 0;
    let currentEPS = epsTimeSeries[0]?.epsTTM || 0;

    for (const pricePoint of filteredPrices) {
      while (epsIndex < epsTimeSeries.length - 1 && 
             new Date(epsTimeSeries[epsIndex + 1].date) <= new Date(pricePoint.date)) {
        epsIndex++;
        currentEPS = epsTimeSeries[epsIndex].epsTTM;
      }

      let fairValue: number | null = null;

      if (currentEPS > 0 && growthRate !== null) {
        fairValue = currentEPS * growthRate;
      }

      const discount = fairValue ? ((fairValue - pricePoint.adjClose) / fairValue) * 100 : undefined;

      result.push({
        date: pricePoint.date,
        price: pricePoint.adjClose,
        fairValue,
        discount
      });
    }

    return result;
  }, [priceData, epsTimeSeries, selectedRange, growthRate]);

  // Calculate latest discount
  const latestData = chartData[chartData.length - 1];
  const discount = latestData?.fairValue 
    ? ((latestData.fairValue - currentPrice) / latestData.fairValue) * 100 
    : 0;

  // Get MoS target based on sector
  const getMoSTarget = (sector: string): number => {
    const targets: { [key: string]: number } = {
      'Technology': 30,
      'Healthcare': 25,
      'Consumer Cyclical': 25,
      'Financial Services': 20,
      'Industrials': 20,
      'Consumer Defensive': 15,
      'Utilities': 10,
      'Real Estate': 15,
      'Basic Materials': 20,
      'Energy': 25,
      'Communication Services': 20
    };
    return targets[sector] || 25;
  };

  const mosTarget = getMoSTarget(sector);

  // Calculate score based on price-to-fairValue ratio
  const getScore = (currentPrice: number, fairValue: number | null): number => {
    if (!fairValue || fairValue <= 0) return 0;
    
    const ratio = currentPrice / fairValue;
    
    if (ratio <= 0.75) return 3; // Deutlich unter Lynch-Wert
    if (ratio <= 0.95) return 2;
    if (ratio <= 1.10) return 1;
    return 0; // Klar darüber
  };

  const score = getScore(currentPrice, latestData?.fairValue || null);

  // Get colors based on score
  const maxScore = 3;
  
  const getColorByScore = (score: number, maxScore: number): string => {
    if (score === 3) return 'text-green-600';
    if (score === 2) return 'text-yellow-600';
    if (score === 1) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBgColorByScore = (score: number, maxScore: number): string => {
    if (maxScore === 0 || !latestData?.fairValue) return 'bg-gray-100 border-gray-300';
    if (score === 3) return 'bg-green-50 border-green-200';
    if (score === 2) return 'bg-yellow-50 border-yellow-200';
    if (score === 1) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const mainTooltipContent = (
    <div className="space-y-3 max-w-md">
      <div>
        <p className="font-semibold">Peter Lynch-Abweichung</p>
        <p className="text-sm text-muted-foreground">(GARP: Growth at Reasonable Price)</p>
        <p className="text-xs mt-1">
          Die Abweichung zeigt, wie weit der Aktienkurs unter/über dem fairen Wert nach Peter Lynch liegt.
        </p>
      </div>
      
      <div className="text-xs">
        <p className="font-medium mb-1">Konzept:</p>
        <p className="text-xs">
          <strong>Fairer KGV ≈ nachhaltige EPS-Wachstumsrate</strong> („PEG ≈ 1")
        </p>
      </div>

      <div className="text-xs">
        <p className="font-medium mb-1">Formel:</p>
        <code className="bg-muted px-2 py-1 rounded text-[10px]">
          Fair Value = EPS × Wachstumsrate (5J-CAGR)
        </code>
      </div>

      <div className="pt-2 border-t text-xs">
        <p className="text-muted-foreground">
          Wachstumsrate: <strong>{growthRate?.toFixed(1)}%</strong> (5J-CAGR)
        </p>
      </div>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-1">
      <p className="font-medium text-sm">Bewertungssystem (0-3 Punkte):</p>
      <p className="text-sm"><span className="text-green-600">●</span> 3 Punkte: Kurs/Fair Value ≤ 0.75 (deutlich unter Lynch-Wert)</p>
      <p className="text-sm"><span className="text-yellow-600">●</span> 2 Punkte: Kurs/Fair Value 0.75-0.95</p>
      <p className="text-sm"><span className="text-orange-600">●</span> 1 Punkt: Kurs/Fair Value 0.95-1.10</p>
      <p className="text-sm"><span className="text-red-600">●</span> 0 Punkte: Kurs/Fair Value &gt; 1.10 (klar darüber)</p>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Lade Daten...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !latestData || growthRate === null) {
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Peter Lynch-Abweichung (Fair Value GARP)</h3>
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
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'PEG=1 Modus nicht verfügbar: Wachstumsrate unter 5% oder nicht genügend historische Daten.'}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={`p-4 border-2 ${getBgColorByScore(score, maxScore)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Peter Lynch-Abweichung (Fair Value GARP)</h3>
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
          <p className="text-xs text-muted-foreground">Fair Value (PEG=1)</p>
          <p className="font-semibold">{latestData.fairValue?.toFixed(2)} {currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Differenz</p>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            discount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {discount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {discount >= 0 ? '+' : ''}{(latestData.fairValue! - currentPrice).toFixed(2)} {currency}
          </div>
        </div>
      </div>

      {/* Meta Row with tooltips */}
      <div className="flex items-center justify-start gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Abweichung <span className={`font-bold ${discount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {discount >= 0 ? '+' : ''}{discount.toFixed(1)}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Aktuelle Abweichung vom fairen Wert (PEG=1)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                MoS-Ziel <span className="font-bold">{mosTarget}%</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Gewünschte Sicherheitsmarge für {sector}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span>•</span>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                Erfüllung MoS-Ziel <span className={`font-bold ${
                  (discount / mosTarget) >= 1 ? 'text-green-600' : 
                  (discount / mosTarget) >= 0.67 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {mosTarget > 0 ? ((discount / mosTarget) * 100).toFixed(0) : 0}%
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Wie nahe die Abweichung am MoS-Ziel liegt</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Time Range Selector and Chart */}
      {chartData && chartData.length > 0 && (
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    if (selectedRange === '1M' || selectedRange === '6M') {
                      return `${date.getDate()}. ${date.toLocaleDateString('de-DE', { month: 'short' })}`;
                    } else if (selectedRange === 'YTD' || selectedRange === '1Y') {
                      return date.toLocaleDateString('de-DE', { month: 'short' });
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
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as LynchDataPoint;
                      const price = data.price;
                      const fairValue = data.fairValue;
                      const discountAtPoint = data.discount || 0;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="text-xs font-semibold mb-1">
                            {new Date(data.date).toLocaleDateString('de-DE')}
                          </p>
                          <p className="text-sm text-blue-600">
                            Kurs: <span className="font-bold">{price.toFixed(2)} {currency}</span>
                          </p>
                          {fairValue && (
                            <p className="text-sm text-green-600">
                              Fair Value: <span className="font-bold">{fairValue.toFixed(2)} {currency}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Discount: <span className={`font-bold ${discountAtPoint >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {discountAtPoint >= 0 ? '+' : ''}{discountAtPoint.toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Reference line for Fair Value (horizontal) */}
                {latestData.fairValue && (
                  <ReferenceLine 
                    y={latestData.fairValue} 
                    stroke="#16a34a" 
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    opacity={0.7}
                    label={{ 
                      value: `Fair Value: ${latestData.fairValue.toFixed(2)} ${currency}`, 
                      position: 'insideTopRight', 
                      fontSize: 11, 
                      fill: '#16a34a',
                      fontWeight: 600
                    }}
                  />
                )}
                
                {/* Reference lines for discount targets */}
                {latestData.fairValue && (
                  <>
                    <ReferenceLine 
                      y={latestData.fairValue * 0.8} 
                      stroke="#3b82f6" 
                      strokeDasharray="3 3" 
                      opacity={0.4}
                      label={{ value: '-20%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                    />
                    <ReferenceLine 
                      y={latestData.fairValue * 0.7} 
                      stroke="#3b82f6" 
                      strokeDasharray="3 3" 
                      opacity={0.4}
                      label={{ value: '-30%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                    />
                    <ReferenceLine 
                      y={latestData.fairValue * 0.6} 
                      stroke="#3b82f6" 
                      strokeDasharray="3 3" 
                      opacity={0.4}
                      label={{ value: '-40%', position: 'insideRight', fontSize: 10, fill: '#3b82f6' }}
                    />
                  </>
                )}
                
                {/* Stock Price Line (blue) */}
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  dot={false}
                  name="Aktienkurs"
                />
                
                {/* Fair Value Line */}
                {latestData.fairValue && (
                  <Line 
                    type="monotone" 
                    dataKey="fairValue" 
                    stroke="#16a34a" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Fair Value (PEG=1)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-600"></span> Aktienkurs
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-green-600 border-dashed border-t-2 border-green-600"></span> Fair Value
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
