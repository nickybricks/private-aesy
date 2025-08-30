import React, { useState, useEffect } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { convertCurrency, needsCurrencyConversion, normalizeCurrencyCode } from '@/utils/currencyConverter';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { Card } from '@/components/ui/card';

interface PeterLynchChartProps {
  symbol: string;
  currency: string;
}

interface PeterLynchDataPoint {
  date: Date;
  price: number;
  pe15Line: number;
}

const TIME_RANGES = [
  { label: '5 Jahre', value: '5Y' },
  { label: '10 Jahre', value: '10Y' },
  { label: 'Allzeit', value: 'MAX' }
] as const;

const PeterLynchChart: React.FC<PeterLynchChartProps> = ({ symbol, currency }) => {
  const [chartData, setChartData] = useState<PeterLynchDataPoint[]>([]);
  const [selectedRange, setSelectedRange] = useState<typeof TIME_RANGES[number]['value']>('5Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeterLynchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching Peter Lynch data for ${symbol}`);
        
        // Fetch historical price data and annual financial data
        const [priceResponse, financialResponse] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${DEFAULT_FMP_API_KEY}`),
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&limit=20&apikey=${DEFAULT_FMP_API_KEY}`)
        ]);
        
        if (!priceResponse.ok || !financialResponse.ok) {
          throw new Error('Fehler beim Laden der Peter Lynch Daten');
        }

        const priceData = await priceResponse.json();
        const financialData = await financialResponse.json();
        
        if (!priceData.historical || !Array.isArray(priceData.historical) || priceData.historical.length === 0) {
          throw new Error('Keine historischen Kursdaten verfügbar');
        }

        if (!financialData || !Array.isArray(financialData) || financialData.length === 0) {
          throw new Error('Keine Finanzdaten verfügbar');
        }

        // Get shares outstanding data for EPS calculation
        const sharesResponse = await fetch(`https://financialmodelingprep.com/api/v3/enterprise-values/${symbol}?period=annual&limit=20&apikey=${DEFAULT_FMP_API_KEY}`);
        const sharesData = sharesResponse.ok ? await sharesResponse.json() : [];

        console.log('Financial data:', financialData.slice(0, 3));
        console.log('Shares data:', sharesData.slice(0, 3));

        // Create a map of EPS by year
        const epsByYear: { [key: string]: number } = {};
        
        financialData.forEach((annual: any) => {
          if (annual.date && annual.netIncome && annual.weightedAverageShsOut) {
            const year = new Date(annual.date).getFullYear().toString();
            const eps = annual.netIncome / annual.weightedAverageShsOut;
            if (eps > 0) { // Only consider positive EPS
              epsByYear[year] = eps;
            }
          }
        });

        console.log('EPS by year:', epsByYear);

        // Normalize currency
        const normalizedCurrency = normalizeCurrencyCode(currency);
        
        // Process historical prices and calculate PE=15 line
        const processedData: PeterLynchDataPoint[] = [];
        
        for (const pricePoint of priceData.historical) {
          const date = new Date(pricePoint.date);
          const year = date.getFullYear().toString();
          
          if (epsByYear[year]) {
            let price = pricePoint.close;
            let eps = epsByYear[year];
            
            // Convert currency if needed
            if (needsCurrencyConversion('USD', normalizedCurrency)) {
              price = await convertCurrency(price, 'USD', normalizedCurrency);
              eps = await convertCurrency(eps, 'USD', normalizedCurrency);
            }
            
            const pe15Line = eps * 15; // P/E = 15 line
            
            processedData.push({
              date,
              price,
              pe15Line
            });
          }
        }

        // Sort by date
        processedData.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        console.log(`Peter Lynch chart data prepared with ${processedData.length} points`);
        setChartData(processedData);
      } catch (err) {
        console.error('Error fetching Peter Lynch data:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchPeterLynchData();
    }
  }, [symbol, currency]);

  const getFilteredData = () => {
    if (!chartData.length) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedRange) {
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case '10Y':
        cutoffDate.setFullYear(now.getFullYear() - 10);
        break;
      case 'MAX':
        return chartData;
      default:
        return chartData;
    }
    
    return chartData.filter(item => item.date >= cutoffDate);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-buffett-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
            <p className="mt-2">Lade Peter Lynch Chart...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="text-center text-buffett-red">
            <p>{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const filteredData = getFilteredData();

  // Calculate min and max values for logarithmic scale
  const allValues = filteredData.flatMap(d => [d.price, d.pe15Line]).filter(v => v > 0);
  const minValue = Math.min(...allValues) * 0.8;
  const maxValue = Math.max(...allValues) * 1.2;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-buffett-navy mb-1">Peter Lynch Chart</h3>
          <p className="text-sm text-buffett-subtext">
            Kaufgelegenheiten entstehen, wenn der Kurs (grün) unter der P/KGV=15 Linie (blau) liegt
          </p>
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="w-full h-[500px] overflow-hidden">
        <ChartContainer
          config={{
            price: { theme: { light: 'hsl(142, 76%, 36%)', dark: 'hsl(142, 76%, 50%)' } },
            pe15: { theme: { light: 'hsl(221, 83%, 53%)', dark: 'hsl(221, 83%, 70%)' } },
          }}
        >
          <ResponsiveContainer width="100%" height={480}>
            <ComposedChart 
              data={filteredData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(date) => format(new Date(date), 'yyyy', { locale: de })}
                height={70}
                tickMargin={30}
              />
              <YAxis
                scale="log"
                domain={[minValue, maxValue]}
                tickFormatter={(value) => {
                  if (typeof value === 'number') {
                    return `${value.toFixed(2)} ${currency}`;
                  }
                  return `${value} ${currency}`;
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          {format(new Date(dataPoint.date), 'dd. MMMM yyyy', { locale: de })}
                        </p>
                        <p className="text-sm font-semibold text-green-700">
                          Aktienkurs: {dataPoint.price.toFixed(2)} {currency}
                        </p>
                        <p className="text-sm font-semibold text-blue-700">
                          P/KGV=15 Linie: {dataPoint.pe15Line.toFixed(2)} {currency}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {dataPoint.price < dataPoint.pe15Line ? 
                            '💡 Potenzielle Kaufgelegenheit' : 
                            '⚠️ Möglicherweise überbewertet'
                          }
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={false}
                name="Aktienkurs"
              />
              <Line
                type="monotone"
                dataKey="pe15Line"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                dot={false}
                name="P/KGV = 15"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="text-xs text-buffett-subtext mt-4">
        <p><strong>Interpretation:</strong> Laut Peter Lynch entstehen die besten Kaufgelegenheiten, wenn der Aktienkurs (grüne Linie) deutlich unter der P/KGV=15 Linie (blaue Linie) liegt. Die Skalierung ist logarithmisch, wie von Lynch empfohlen.</p>
      </div>
    </Card>
  );
};

export default PeterLynchChart;