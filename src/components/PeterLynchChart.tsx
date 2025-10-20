import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

// Types for financial data
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
  epsTTM: number;
  fairValue: number | null;
  mode: string;
  peMultiple?: number;
  growthRate?: number;
  deviation?: number;
}

interface Props {
  ticker: string;
  currency: string;
  currentPrice: number | null;
  defaultMode?: 'constant-pe' | 'peg-1';
  defaultPE?: number;
  defaultLogScale?: boolean;
}

const TIME_RANGES = [
  { label: '1Y', value: '1year' },
  { label: '3Y', value: '3years' },
  { label: '5Y', value: '5years' },
  { label: '10Y', value: '10years' },
  { label: 'MAX', value: 'max' },
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
  // Simple heuristic - in real implementation, would check sector/industry
  const bankTickers = ['BAC', 'JPM', 'WFC', 'C', 'GS', 'MS'];
  return bankTickers.includes(ticker.toUpperCase());
};

const PeterLynchChartNew: React.FC<Props> = ({
  ticker,
  currency,
  currentPrice,
  defaultMode = 'constant-pe',
  defaultPE = 15,
  defaultLogScale = false
}) => {
  // Fixed settings - no user controls
  const mode: 'constant-pe' | 'peg-1' = 'peg-1';
  const peMultiple = 15;
  const useLogScale = false;
  const [selectedRange, setSelectedRange] = useState('5years');
  const epsSource: 'without-nri' | 'gaap' = 'without-nri';
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
        // Calculate date 30 years ago for maximum historical data
        const thirtyYearsAgo = new Date();
        thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
        const fromDate = thirtyYearsAgo.toISOString().split('T')[0];
        
        const [quarterly, annual, prices] = await Promise.all([
          fetchFromFMP(`/income-statement/${ticker}`, { period: 'quarter', limit: 40 }),
          fetchFromFMP(`/income-statement/${ticker}`, { period: 'annual', limit: 30 }),
          fetchFromFMP(`/historical-price-full/${ticker}`, { from: fromDate })
        ]);

        // Process quarterly data
        const processedQuarterly: QuarterlyData[] = quarterly
          .filter((q: any) => q.netIncome !== null && q.weightedAverageShsOutDil > 0)
          .map((q: any) => ({
            date: q.date,
            filingDate: q.fillingDate || q.date, // Use date as fallback
            netIncome: q.netIncome,
            eps: q.eps || (q.netIncome / q.weightedAverageShsOutDil),
            weightedAverageShsOutDil: q.weightedAverageShsOutDil,
            epsWithoutNRI: q.epsWithoutNRI // If available
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Process annual data
        const processedAnnual: AnnualData[] = annual
          .filter((a: any) => a.ebitda !== null && a.weightedAverageShsOutDil > 0)
          .map((a: any) => ({
            date: a.date,
            ebitda: a.ebitda,
            weightedAverageShsOutDil: a.weightedAverageShsOutDil,
            bookValuePerShare: a.bookValuePerShare
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Process price data
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
        console.error('Error fetching Lynch chart data:', error);
        setError('Fehler beim Laden der Finanzdaten für den Peter Lynch Chart');
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
      const epsTTM = last4Quarters.reduce((sum, q) => {
        const eps = epsSource === 'without-nri' && q.epsWithoutNRI 
          ? q.epsWithoutNRI 
          : q.eps;
        return sum + eps;
      }, 0);
      
      result.push({
        date: quarterlyData[i].filingDate,
        epsTTM
      });
    }
    
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [quarterlyData, epsSource]);

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
      // Use Book Value per Share for banks
      currentValue = latest.bookValuePerShare || 0;
      pastValue = fiveYearsAgo.bookValuePerShare || 0;
    } else {
      // Use EBITDA per share for regular companies
      currentValue = latest.ebitda / latest.weightedAverageShsOutDil;
      pastValue = fiveYearsAgo.ebitda / fiveYearsAgo.weightedAverageShsOutDil;
    }

    if (pastValue <= 0 || currentValue <= 0) return null;

    const cagr = (Math.pow(currentValue / pastValue, 1/5) - 1) * 100;
    
    // Clamp between 5% and 25%
    if (cagr < 5) return null; // Don't show PEG fair value if growth < 5%
    return Math.min(25, Math.max(5, cagr));
  }, [annualData, ticker]);

  // Filter data by time range
  const getFilteredData = (data: any[], range: string) => {
    if (range === 'max') {
      return data; // Return all data for MAX
    }
    
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
    if (!priceData.length || !epsTimeSeries.length) return [];

    const filteredPrices = getFilteredData(priceData, selectedRange);
    
    const result: LynchDataPoint[] = [];
    let epsIndex = 0;
    let currentEPS = epsTimeSeries[0]?.epsTTM || 0;

    for (const pricePoint of filteredPrices) {
      // Update EPS TTM based on filing dates (step function)
      while (epsIndex < epsTimeSeries.length - 1 && 
             new Date(epsTimeSeries[epsIndex + 1].date) <= new Date(pricePoint.date)) {
        epsIndex++;
        currentEPS = epsTimeSeries[epsIndex].epsTTM;
      }

      let fairValue: number | null = null;
      let currentPeMultiple: number | undefined;
      let currentGrowthRate: number | undefined;

      if (currentEPS > 0 && growthRate !== null) {
        fairValue = currentEPS * growthRate;
        currentGrowthRate = growthRate;
      }

      const deviation = fairValue ? (pricePoint.adjClose / fairValue - 1) * 100 : undefined;

      result.push({
        date: pricePoint.date,
        price: pricePoint.adjClose,
        epsTTM: currentEPS,
        fairValue,
        mode: `PEG=1 (${growthRate?.toFixed(1)}%)`,
        peMultiple: currentPeMultiple,
        growthRate: currentGrowthRate,
        deviation
      });
    }

    return result;
  }, [priceData, epsTimeSeries, selectedRange, mode, peMultiple, growthRate]);

  // Calculate latest metrics
  const latestData = chartData[chartData.length - 1];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peter Lynch Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Lade Finanzdaten...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peter Lynch Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peter Lynch Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nicht genügend Daten für die Darstellung verfügbar. 
              Mindestens 4 Quartale mit EPS-Daten erforderlich.
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
          Peter Lynch Chart
          {latestData?.deviation !== undefined && (
            <Badge variant={latestData.deviation > 0 ? "destructive" : "default"} className="ml-2">
              {latestData.deviation > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {latestData.deviation > 0 ? '+' : ''}{latestData.deviation.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Range Controls */}
        <div className="space-y-2">
          <Label>Zeitraum</Label>
          <div className="flex gap-1">
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
        </div>

        {/* Chart */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
              />
              <YAxis 
                scale={useLogScale ? 'log' : 'linear'}
                domain={useLogScale ? ['dataMin', 'dataMax'] : ['auto', 'auto']}
                tickFormatter={(value) => `${value.toFixed(0)} ${currency}`}
              />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString('de-DE')}
                formatter={(value: any, name: string) => {
                  if (name === 'price') return [`${value.toFixed(2)} ${currency}`, 'Kurs (Adjusted Close)'];
                  if (name === 'fairValue') return [`${value.toFixed(2)} ${currency}`, 'Earnings-Line'];
                  return [value, name];
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const data = payload[0].payload as LynchDataPoint;
                  
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{new Date(label as string).toLocaleDateString('de-DE')}</p>
                      <p>Kurs: {data.price.toFixed(2)} {currency}</p>
                      <p>EPS TTM: {data.epsTTM.toFixed(2)} {currency}</p>
                      <p>Modus: {data.mode}</p>
                      {data.fairValue && (
                        <>
                          <p>Earnings-Line: {data.fairValue.toFixed(2)} {currency}</p>
                          {data.deviation !== undefined && (
                            <p className={data.deviation > 0 ? "text-red-600" : "text-green-600"}>
                              Abweichung: {data.deviation > 0 ? '+' : ''}{data.deviation.toFixed(1)}%
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Aktienkurs"
              />
              {growthRate !== null && (
                <Line 
                  type="monotone" 
                  dataKey="fairValue" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`Earnings-Line (PEG=1, ${growthRate.toFixed(1)}%)`}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PEG Mode Limitations */}
        {growthRate === null && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              PEG=1 Modus nicht verfügbar: Wachstumsrate unter 5% oder nicht genügend historische Daten.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Valuation */}
        {latestData && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Aktuelle Bewertung</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Aktueller Kurs</p>
                <p className="font-medium">{latestData.price.toFixed(2)} {currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">EPS TTM</p>
                <p className="font-medium">{latestData.epsTTM.toFixed(2)} {currency}</p>
              </div>
              {growthRate !== null && (
                <div>
                  <p className="text-muted-foreground">Wachstumsrate (5J-CAGR)</p>
                  <p className="font-medium">{growthRate.toFixed(1)}%</p>
                </div>
              )}
              {latestData.fairValue && (
                <div>
                  <p className="text-muted-foreground">Fair Value</p>
                  <p className="font-medium">{latestData.fairValue.toFixed(2)} {currency}</p>
                </div>
              )}
              {latestData.deviation !== undefined && (
                <div>
                  <p className="text-muted-foreground">Abweichung</p>
                  <p className={`font-medium ${latestData.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {latestData.deviation > 0 ? '+' : ''}{latestData.deviation.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Interpretation:</strong> Liegt der Aktienkurs unter der Earnings-Line, ist die Aktie tendenziell unterbewertet. 
            Liegt er darüber, ist sie tendenziell überbewertet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeterLynchChartNew;