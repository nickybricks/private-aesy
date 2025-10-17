import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
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

const TIME_RANGES = [
  { label: '1Y', value: '1year' },
  { label: '3Y', value: '3years' },
  { label: '5Y', value: '5years' },
  { label: '10Y', value: '10years' },
];

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
  const [selectedRange, setSelectedRange] = useState('5years');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [annualData, setAnnualData] = useState<AnnualData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);

  // Fetch financial data
  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
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
  const getFilteredData = (data: any[], range: string) => {
    const endDate = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1year':
        startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate());
        break;
      case '3years':
        startDate = new Date(endDate.getFullYear() - 3, endDate.getMonth(), endDate.getDate());
        break;
      case '5years':
        startDate = new Date(endDate.getFullYear() - 5, endDate.getMonth(), endDate.getDate());
        break;
      case '10years':
        startDate = new Date(endDate.getFullYear() - 10, endDate.getMonth(), endDate.getDate());
        break;
      default:
        startDate = new Date(endDate.getFullYear() - 5, endDate.getMonth(), endDate.getDate());
    }
    
    return data.filter(item => new Date(item.date) >= startDate);
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

  // Calculate score based on discount and MoS target
  const getScore = (discount: number, target: number): number => {
    if (discount >= target) return 5;
    if (discount >= 0.67 * target) return 3;
    if (discount >= 0.33 * target) return 2;
    if (discount >= 0) return 1;
    return 0;
  };

  const score = getScore(discount, mosTarget);

  // Get colors based on score
  const getColorByScore = (score: number): string => {
    if (score >= 4) return 'text-green-600 dark:text-green-400';
    if (score >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBgColorByScore = (score: number): string => {
    if (score >= 4) return 'bg-green-50 dark:bg-green-950/30';
    if (score >= 3) return 'bg-yellow-50 dark:bg-yellow-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  const mainTooltipContent = (
    <div className="space-y-2 max-w-sm">
      <p className="font-semibold">Idee nach Peter Lynch (GARP)</p>
      <p className="text-sm">
        <strong>Fairer KGV ≈ nachhaltige EPS-Wachstumsrate</strong> („PEG ≈ 1").
      </p>
      <p className="text-sm">
        Wir leiten daraus einen <strong>fairen Wert</strong> ab und messen die <strong>Abweichung</strong> des Kurses davon.
      </p>
    </div>
  );

  const scoringTooltip = (
    <div className="space-y-2 max-w-sm">
      <p className="font-semibold">Scoring-Preset: {sector}</p>
      <p className="text-sm">MoS-Ziel: {mosTarget}%</p>
      <div className="text-xs space-y-1 mt-2">
        <p className="font-semibold">Punktelogik (M = {mosTarget}%):</p>
        <p>≥ {mosTarget}% → 5 Punkte</p>
        <p>≥ {(0.67 * mosTarget).toFixed(0)}% → 3 Punkte</p>
        <p>≥ {(0.33 * mosTarget).toFixed(0)}% → 2 Punkte</p>
        <p>≥ 0% → 1 Punkt</p>
        <p>&lt; 0% → 0 Punkte</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peter Lynch Abweichung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Lade Daten...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !latestData || growthRate === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Peter Lynch Abweichung</span>
            <ClickableTooltip content={mainTooltipContent}>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </ClickableTooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'PEG=1 Modus nicht verfügbar: Wachstumsrate unter 5% oder nicht genügend historische Daten.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Peter Lynch Abweichung</span>
            <ClickableTooltip content={mainTooltipContent}>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </ClickableTooltip>
          </div>
          <div className={`text-3xl font-bold ${getColorByScore(score)}`}>
            {discount > 0 ? '+' : ''}{discount.toFixed(1)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score and Bewertung */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Bewertung:</span>
          <ClickableTooltip content={scoringTooltip}>
            <Badge variant="outline" className={`${getBgColorByScore(score)} cursor-help`}>
              {score} / 5 Punkte
            </Badge>
          </ClickableTooltip>
        </div>

        {/* KPIs in 3-column grid */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Aktueller Kurs</div>
            <div className="font-semibold">{currentPrice.toFixed(2)} {currency}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Fairer Wert (PEG=1)</div>
            <div className="font-semibold">{latestData.fairValue?.toFixed(2)} {currency}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Differenz</div>
            <div className={`font-semibold flex items-center gap-1 ${getColorByScore(score)}`}>
              {discount > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(latestData.fairValue! - currentPrice).toFixed(2)} {currency}
            </div>
          </div>
        </div>

        {/* Meta Row - left aligned */}
        <div className="flex justify-start gap-4 text-xs text-muted-foreground mb-4">
          <span>Abweichung: {discount > 0 ? '+' : ''}{discount.toFixed(1)}%</span>
          <span>•</span>
          <span>MoS-Ziel: {mosTarget}%</span>
          <span>•</span>
          <span>Wachstumsrate: {growthRate.toFixed(1)}%</span>
        </div>

        {/* Time Range Selector - right aligned */}
        <div className="flex justify-end gap-1 mb-2">
          {TIME_RANGES.map(range => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                className="text-xs"
              />
              <YAxis 
                width={60}
                tickFormatter={(value) => `${value.toFixed(0)}`}
                className="text-xs"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as LynchDataPoint;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm mb-2">
                        {new Date(data.date).toLocaleDateString('de-DE')}
                      </p>
                      <div className="space-y-1 text-xs">
                        <p>Kurs: {data.price.toFixed(2)} {currency}</p>
                        <p>Fair Value: {data.fairValue?.toFixed(2)} {currency}</p>
                        {data.discount !== undefined && (
                          <p className={data.discount > 0 ? 'text-green-600' : 'text-red-600'}>
                            Abweichung: {data.discount > 0 ? '+' : ''}{data.discount.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <ReferenceLine 
                y={latestData.fairValue || 0} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3"
                label={{ value: 'Fair Value', position: 'right', fill: 'hsl(var(--muted-foreground))' }}
              />
              <ReferenceLine 
                y={(latestData.fairValue || 0) * (1 - mosTarget / 100)} 
                stroke="hsl(var(--success))" 
                strokeDasharray="3 3"
                label={{ value: `MoS-Ziel (${mosTarget}%)`, position: 'right', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Aktienkurs"
              />
              <Line 
                type="monotone" 
                dataKey="fairValue" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={`Fair Value (PEG=1)`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
