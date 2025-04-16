
import React, { useState, useEffect } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { convertCurrency, needsCurrencyConversion } from '@/utils/currencyConverter';

// Default API key für den Fall, dass keine Umgebungsvariable gefunden wird
const DEFAULT_FMP_API_KEY = 'uxE1jVMvI8QQen0a4AEpLFTaqf3KQO0y';

interface StockChartProps {
  symbol: string;
  currency: string;
  intrinsicValue?: number;
}

interface HistoricalDataPoint {
  date: string;
  close: number;
  convertedClose?: number;
}

interface ChartData {
  date: Date;
  price: number;
  intrinsicValue?: number;
}

const TIME_RANGES = [
  { label: '1 Jahr', value: '1Y' },
  { label: '5 Jahre', value: '5Y' },
  { label: 'Allzeit', value: 'MAX' },
] as const;

const StockChart: React.FC<StockChartProps> = ({ symbol, currency, intrinsicValue }) => {
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [selectedRange, setSelectedRange] = useState<typeof TIME_RANGES[number]['value']>('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Verwende entweder den API-Schlüssel aus den Umgebungsvariablen oder den Standard-Schlüssel
        const apiKey = import.meta.env.VITE_FMP_API_KEY || DEFAULT_FMP_API_KEY;
        
        console.log(`Fetching historical data for ${symbol}`);
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`
        );
        
        if (!response.ok) {
          console.error(`API response not ok: ${response.status}`);
          throw new Error('Fehler beim Laden der historischen Daten');
        }

        const data = await response.json();
        if (!data.historical || !Array.isArray(data.historical) || data.historical.length === 0) {
          console.error('No historical data available', data);
          throw new Error('Keine historischen Daten verfügbar');
        }

        let processedData: HistoricalDataPoint[] = data.historical.map((item: any) => ({
          date: item.date,
          close: item.close,
        }));

        // Convert currency if needed
        if (needsCurrencyConversion(currency)) {
          const convertedData = await Promise.all(
            processedData.map(async (item) => ({
              ...item,
              close: await convertCurrency(item.close, currency, 'EUR'),
            }))
          );
          processedData = convertedData;
        }

        // Sort data by date and format
        const chartData: ChartData[] = processedData
          .map(item => ({
            date: new Date(item.date),
            price: item.close,
            intrinsicValue: intrinsicValue,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        setHistoricalData(chartData);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchHistoricalData();
    }
  }, [symbol, currency, intrinsicValue]);

  const getFilteredData = () => {
    if (!historicalData.length) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedRange) {
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      default:
        return historicalData;
    }
    
    return historicalData.filter(item => item.date >= cutoffDate);
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-buffett-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
          <p className="mt-2">Lade Kursdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <div className="text-center text-buffett-red">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? 'default' : 'outline'}
            onClick={() => setSelectedRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </div>
      
      <div className="w-full h-[400px]">
        <ChartContainer
          config={{
            line1: { theme: { light: 'hsl(221, 83%, 53%)', dark: 'hsl(221, 83%, 70%)' } },
            line2: { theme: { light: 'hsl(142, 76%, 36%)', dark: 'hsl(142, 76%, 50%)' } },
            area: { theme: { light: 'hsl(221, 83%, 95%)', dark: 'hsl(221, 83%, 30%)' } },
          }}
        >
          <ComposedChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 95%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(221, 83%, 95%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'dd.MM.yy', { locale: de })}
            />
            <YAxis
              domain={['auto', 'auto']}
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
                  return (
                    <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                      <p className="text-sm text-gray-600">
                        {format(new Date(payload[0].payload.date), 'dd. MMMM yyyy', { locale: de })}
                      </p>
                      <p className="text-sm font-semibold">
                        Kurs: {typeof payload[0].value === 'number' 
                          ? payload[0].value.toFixed(2) 
                          : payload[0].value} {currency}
                      </p>
                      {intrinsicValue && (
                        <p className="text-sm text-green-700">
                          Innerer Wert: {intrinsicValue.toFixed(2)} {currency}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(221, 83%, 53%)"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
            {intrinsicValue && (
              <Line
                type="monotone"
                dataKey="intrinsicValue"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default StockChart;
