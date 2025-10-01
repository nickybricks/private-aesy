
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
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { convertCurrency, needsCurrencyConversion, normalizeCurrencyCode } from '@/utils/currencyConverter';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';

interface StockChartProps {
  symbol: string;
  currency: string;
  intrinsicValue?: number | null;
}

interface HistoricalDataPoint {
  date: string;
  close: number;
  convertedClose?: number;
}

interface ChartData {
  date: Date;
  price: number;
  intrinsicValue?: number | null;
}

const TIME_RANGES = [
  { label: '5T', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1J', value: '1Y' },
  { label: '3J', value: '3Y' },
  { label: '5J', value: '5Y' },
  { label: '10J', value: '10Y' },
  { label: 'All', value: 'MAX' }
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
        console.log(`Fetching historical data for ${symbol} with currency ${currency}`);
        
        // Debug intrinsic value
        if (intrinsicValue === undefined || intrinsicValue === null || isNaN(Number(intrinsicValue))) {
          console.warn(`DCF ERROR: Intrinsic value is invalid: ${intrinsicValue}`);
        } else {
          console.log(`Using intrinsic value: ${intrinsicValue} ${currency}`);
        }
        
        // Fetch both historical price data and financial data in parallel
        const [priceResponse, financialResponse] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${DEFAULT_FMP_API_KEY}`),
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=quarter&limit=40&apikey=${DEFAULT_FMP_API_KEY}`)
        ]);
        
        if (!priceResponse.ok) {
          console.error(`API response not ok: ${priceResponse.status}`);
          throw new Error('Fehler beim Laden der historischen Daten');
        }

        const priceData = await priceResponse.json();
        if (!priceData.historical || !Array.isArray(priceData.historical) || priceData.historical.length === 0) {
          console.error('No historical data available', priceData);
          throw new Error('Keine historischen Daten verfügbar');
        }

        let processedData: HistoricalDataPoint[] = priceData.historical.map((item: any) => ({
          date: item.date,
          close: item.close,
        }));

        // Normalize currency codes
        const normalizedCurrency = normalizeCurrencyCode(currency);
        console.log(`Normalized currency: ${normalizedCurrency}`);
        
        // Fix here: Use the correct currency conversion function with normalized currency codes
        if (needsCurrencyConversion('USD', normalizedCurrency)) {
          console.log(`Converting currency from USD to ${normalizedCurrency}`);
          
          // Check if we have an exchange rate before attempting conversion
          const testRate = await convertCurrency(1, 'USD', normalizedCurrency);
          if (isNaN(Number(testRate))) {
            console.warn(`DCF ERROR: No valid exchange rate USD → ${normalizedCurrency} available (${testRate})`);
            // Use original data without conversion if we can't get a valid rate
            setError(`Währungsumrechnung nicht möglich (USD → ${normalizedCurrency})`);
          } else {
            console.log(`Exchange rate USD → ${normalizedCurrency}: ${testRate / 1}`);
            // Convert each data point with debug information
            const convertedData = await Promise.all(
              processedData.map(async (item, index) => {
                const convertedClose = await convertCurrency(item.close, 'USD', normalizedCurrency);
                if (index === 0) { // Only log the first item to avoid console spam
                  console.log(`Converted ${item.close} USD to ${convertedClose} ${normalizedCurrency}`);
                }
                return {
                  ...item,
                  close: convertedClose,
                };
              })
            );
            processedData = convertedData;
          }
        }

        // Calculate historical intrinsic values based on financial data
        let historicalIntrinsicValues: { [key: string]: number } = {};
        
        if (financialResponse.ok && intrinsicValue && !isNaN(Number(intrinsicValue))) {
          const financialData = await financialResponse.json();
          
          if (financialData && Array.isArray(financialData) && financialData.length > 0) {
            console.log('Calculating historical intrinsic values based on earnings growth...');
            
            // Get current and historical earnings
            const sortedFinancials = financialData
              .filter(f => f.netIncome && f.date)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (sortedFinancials.length >= 2) {
              const currentYear = new Date().getFullYear();
              const currentIntrinsic = Number(intrinsicValue);
              
              // Calculate average earnings growth rate
              const recentEarnings = sortedFinancials.slice(0, Math.min(5, sortedFinancials.length));
              let totalGrowthRate = 0;
              let validGrowthRates = 0;
              
              for (let i = 0; i < recentEarnings.length - 1; i++) {
                const currentEarnings = recentEarnings[i].netIncome;
                const previousEarnings = recentEarnings[i + 1].netIncome;
                
                if (previousEarnings > 0 && currentEarnings > 0) {
                  const growthRate = (currentEarnings - previousEarnings) / Math.abs(previousEarnings);
                  totalGrowthRate += growthRate;
                  validGrowthRates++;
                }
              }
              
              const avgGrowthRate = validGrowthRates > 0 ? totalGrowthRate / validGrowthRates : 0;
              console.log(`Average earnings growth rate: ${(avgGrowthRate * 100).toFixed(2)}%`);
              
              // Calculate historical intrinsic values for each year
              const historicalIntrinsicPromises = sortedFinancials.map(async (financial, index) => {
                const financialYear = new Date(financial.date).getFullYear();
                const yearsFromCurrent = currentYear - financialYear;
                
                if (yearsFromCurrent >= 0) {
                  // For historical values, work backwards using growth rate
                  // Use a compound discount approach
                  const discountFactor = Math.pow(1 + Math.max(avgGrowthRate, -0.5), yearsFromCurrent);
                  let historicalIntrinsic = currentIntrinsic / discountFactor;
                  
                  // Apply some smoothing and bounds
                  historicalIntrinsic = Math.max(historicalIntrinsic, currentIntrinsic * 0.3);
                  historicalIntrinsic = Math.min(historicalIntrinsic, currentIntrinsic * 3);
                  
                  // Convert currency if needed
                  if (needsCurrencyConversion('USD', normalizedCurrency)) {
                    historicalIntrinsic = await convertCurrency(historicalIntrinsic, 'USD', normalizedCurrency);
                  }
                  
                  console.log(`Historical intrinsic value for ${financialYear}: ${historicalIntrinsic.toFixed(2)}`);
                  return { year: financialYear.toString(), value: historicalIntrinsic };
                }
                return null;
              });
              
              const historicalIntrinsicResults = await Promise.all(historicalIntrinsicPromises);
              historicalIntrinsicResults.forEach(result => {
                if (result) {
                  historicalIntrinsicValues[result.year] = result.value;
                }
              });
            }
          }
        }
        
        // Create interpolated intrinsic values for missing years
        const years = Object.keys(historicalIntrinsicValues).map(y => parseInt(y)).sort();
        if (years.length >= 2) {
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);
          
          for (let year = minYear; year <= maxYear; year++) {
            if (!historicalIntrinsicValues[year.toString()]) {
              // Linear interpolation between closest years
              let lowerYear = null, upperYear = null;
              
              for (const y of years) {
                if (y < year) lowerYear = y;
                if (y > year && !upperYear) upperYear = y;
              }
              
              if (lowerYear && upperYear) {
                const lowerValue = historicalIntrinsicValues[lowerYear.toString()];
                const upperValue = historicalIntrinsicValues[upperYear.toString()];
                const ratio = (year - lowerYear) / (upperYear - lowerYear);
                historicalIntrinsicValues[year.toString()] = lowerValue + (upperValue - lowerValue) * ratio;
              }
            }
          }
        }

        // Create chart data with historical intrinsic values
        const chartData: ChartData[] = processedData
          .map(item => {
            const itemDate = new Date(item.date);
            const year = itemDate.getFullYear();
            
            let historicalIntrinsic = null;
            
            // Find the closest historical intrinsic value
            if (Object.keys(historicalIntrinsicValues).length > 0) {
              const availableYears = Object.keys(historicalIntrinsicValues).map(y => parseInt(y));
              const closestYear = availableYears.reduce((prev, curr) => 
                Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
              );
              
              if (Math.abs(closestYear - year) <= 1) {
                historicalIntrinsic = historicalIntrinsicValues[closestYear.toString()];
              }
            }
            
            const dataPoint = {
              date: itemDate,
              price: item.close,
              intrinsicValue: historicalIntrinsic,
            };
            
            // Debug for NaN values
            if (isNaN(dataPoint.price)) {
              console.warn(`DCF ERROR: NaN price value for date ${item.date}`);
            }
            
            return dataPoint;
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        
        console.log(`Chart data prepared with ${chartData.length} points. Historical intrinsic values calculated.`);
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
    let cutoffDate = new Date();
    
    switch (selectedRange) {
      case '5D':
        cutoffDate.setDate(now.getDate() - 5);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'YTD':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
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
        return historicalData;
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
  
  // Only include intrinsic value line if it's a valid number
  const showIntrinsicLine = intrinsicValue !== null && 
                           intrinsicValue !== undefined && 
                           !isNaN(Number(intrinsicValue));

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
      
      <div className="w-full h-[600px] overflow-hidden">
        <ChartContainer
          config={{
            line1: { theme: { light: 'hsl(221, 83%, 53%)', dark: 'hsl(221, 83%, 70%)' } },
            line2: { theme: { light: 'hsl(142, 76%, 36%)', dark: 'hsl(142, 76%, 50%)' } },
            area: { theme: { light: 'hsl(221, 83%, 95%)', dark: 'hsl(221, 83%, 30%)' } },
          }}
        >
          <ResponsiveContainer width="100%" height={580}>
            <ComposedChart data={getFilteredData()} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
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
                height={70}
                tickMargin={30}
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
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                        <p className="text-sm text-gray-600">
                          {format(new Date(dataPoint.date), 'dd. MMMM yyyy', { locale: de })}
                        </p>
                        <p className="text-sm font-semibold">
                          Kurs: {typeof payload[0].value === 'number' 
                            ? payload[0].value.toFixed(2) 
                            : payload[0].value} {currency}
                        </p>
                        {dataPoint.intrinsicValue && !isNaN(Number(dataPoint.intrinsicValue)) && (
                          <p className="text-sm text-green-700">
                            Innerer Wert: {Number(dataPoint.intrinsicValue).toFixed(2)} {currency}
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
              <Line
                type="monotone"
                dataKey="intrinsicValue"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default StockChart;
