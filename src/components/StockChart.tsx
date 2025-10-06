
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
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  { label: '1T', value: '1D' },
  { label: '5T', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1J', value: '1Y' },
  { label: '5J', value: '5Y' },
  { label: 'All', value: 'MAX' }
] as const;

const StockChart: React.FC<StockChartProps> = ({ symbol, currency, intrinsicValue }) => {
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [selectedRange, setSelectedRange] = useState<typeof TIME_RANGES[number]['value']>('1Y');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  
  const { watchlists, createWatchlist } = useWatchlists();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching historical data for ${symbol} with currency ${currency}, range: ${selectedRange}`);
        
        // Debug intrinsic value
        if (intrinsicValue === undefined || intrinsicValue === null || isNaN(Number(intrinsicValue))) {
          console.warn(`DCF ERROR: Intrinsic value is invalid: ${intrinsicValue}`);
        } else {
          console.log(`Using intrinsic value: ${intrinsicValue} ${currency}`);
        }
        
        // Determine which API endpoint to use based on selected range
        let priceEndpoint: string;
        let isIntradayData = false;
        
        if (selectedRange === '1D') {
          // 5-minute intraday data for 1-day view
          priceEndpoint = `https://financialmodelingprep.com/api/v3/historical-chart/5min/${symbol}?apikey=${DEFAULT_FMP_API_KEY}`;
          isIntradayData = true;
        } else if (selectedRange === '5D') {
          // 1-hour intraday data for 5-day view
          priceEndpoint = `https://financialmodelingprep.com/api/v3/historical-chart/1hour/${symbol}?apikey=${DEFAULT_FMP_API_KEY}`;
          isIntradayData = true;
        } else {
          // Daily historical data for longer ranges
          priceEndpoint = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${DEFAULT_FMP_API_KEY}`;
        }
        
        // Fetch both historical price data and financial data in parallel
        const [priceResponse, financialResponse] = await Promise.all([
          fetch(priceEndpoint),
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=quarter&limit=40&apikey=${DEFAULT_FMP_API_KEY}`)
        ]);
        
        if (!priceResponse.ok) {
          console.error(`API response not ok: ${priceResponse.status}`);
          throw new Error('Fehler beim Laden der historischen Daten');
        }

        const priceData = await priceResponse.json();
        
        // Handle different response formats
        let processedData: HistoricalDataPoint[];
        
        if (isIntradayData) {
          // Intraday data comes as a direct array with 'date' field containing datetime
          if (!Array.isArray(priceData) || priceData.length === 0) {
            console.error('No intraday data available', priceData);
            throw new Error('Keine Intraday-Daten verfügbar');
          }
          
          processedData = priceData.map((item: any) => ({
            date: item.date, // Format: "2024-01-15 15:30:00"
            close: item.close,
          })).reverse(); // Reverse to get chronological order (API returns newest first)
          
        } else {
          // Daily data comes wrapped in 'historical' property
          if (!priceData.historical || !Array.isArray(priceData.historical) || priceData.historical.length === 0) {
            console.error('No historical data available', priceData);
            throw new Error('Keine historischen Daten verfügbar');
          }

          processedData = priceData.historical.map((item: any) => ({
            date: item.date,
            close: item.close,
          }));
        }

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
  }, [symbol, currency, intrinsicValue, selectedRange]);

  const getFilteredData = () => {
    if (!historicalData.length) return [];
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedRange) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '5D':
        cutoffDate.setDate(now.getDate() - 5);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'YTD':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 5);
        break;
      case 'MAX':
        return historicalData;
      default:
        return historicalData;
    }
    
    return historicalData.filter(item => item.date >= cutoffDate);
  };

  const calculatePerformanceStats = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return null;

    const currentPrice = filteredData[filteredData.length - 1]?.price;
    const startPrice = filteredData[0]?.price;
    
    if (!currentPrice || !startPrice) return null;

    // Calculate performance
    const performance = ((currentPrice - startPrice) / startPrice) * 100;

    // Calculate high and low
    const prices = filteredData.map(d => d.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);

    const aboveLow = ((currentPrice - low) / low) * 100;
    const belowHigh = ((currentPrice - high) / high) * 100;

    return {
      performance,
      aboveLow,
      belowHigh
    };
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
  const performanceStats = calculatePerformanceStats();

  // Get readable range label
  const getRangeLabel = () => {
    const range = TIME_RANGES.find(r => r.value === selectedRange);
    return range?.value || selectedRange;
  };

  // Format X-axis based on selected range
  const formatXAxis = (date: Date) => {
    switch (selectedRange) {
      case '1D':
      case '5D':
        return format(date, 'HH:mm', { locale: de });
      case '1M':
        return format(date, 'dd.MM', { locale: de });
      case '6M':
      case 'YTD':
      case '1Y':
        return format(date, 'MMM yy', { locale: de });
      case '5Y':
      case 'MAX':
        return format(date, 'yyyy', { locale: de });
      default:
        return format(date, 'dd.MM.yy', { locale: de });
    }
  };

  const handleAddToWatchlist = async () => {
    if (!selectedWatchlistId || !user) return;
    
    setIsAddingToWatchlist(true);
    try {
      // Check if stock already exists
      const { data: existingStock } = await supabase
        .from('user_stocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('watchlist_id', selectedWatchlistId)
        .eq('symbol', symbol)
        .single();

      if (existingStock) {
        toast({
          variant: "destructive",
          title: "Aktie bereits vorhanden",
          description: "Diese Aktie ist bereits in der Watchlist."
        });
        return;
      }

      // Get current stock price
      const currentPrice = filteredData.length > 0 
        ? filteredData[filteredData.length - 1].price 
        : 0;

      // Add stock to watchlist
      const { error } = await supabase
        .from('user_stocks')
        .insert([{
          user_id: user.id,
          watchlist_id: selectedWatchlistId,
          symbol: symbol,
          company_name: symbol,
          analysis_data: {
            price: currentPrice,
            currency: currency,
            changePercent: 0,
            sinceAddedPercent: 0,
          },
          last_analysis_date: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Zur Watchlist hinzugefügt",
        description: `${symbol} wurde erfolgreich zur Watchlist hinzugefügt.`
      });
      
      setIsDialogOpen(false);
      setSelectedWatchlistId('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const handleCreateAndSelect = async () => {
    try {
      const newWatchlist = await createWatchlist(`${symbol} Watchlist`);
      if (newWatchlist) {
        setSelectedWatchlistId(newWatchlist.id);
      }
    } catch (error) {
      // Error already handled in createWatchlist
    }
  };

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* Header with Zeitraum-Buttons and Add to Watchlist Button */}
      <div className="w-full hidden md:flex items-center gap-2">
        <div className="flex justify-between gap-1 sm:gap-1.5 flex-1">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
              className="text-xs h-7 px-1.5 sm:px-2.5 md:px-3 flex-1 min-w-0"
            >
              {range.label}
            </Button>
          ))}
        </div>
        
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 flex items-center gap-1 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Watchlist</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Zu Watchlist hinzufügen</DialogTitle>
                <DialogDescription>
                  Wähle eine Watchlist aus, um {symbol} hinzuzufügen.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {watchlists.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Du hast noch keine Watchlists.
                    </p>
                    <Button onClick={handleCreateAndSelect}>
                      Neue Watchlist erstellen
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select value={selectedWatchlistId} onValueChange={setSelectedWatchlistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Watchlist auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlists.map((watchlist) => (
                          <SelectItem key={watchlist.id} value={watchlist.id}>
                            {watchlist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddToWatchlist}
                        disabled={!selectedWatchlistId || isAddingToWatchlist}
                        className="flex-1"
                      >
                        {isAddingToWatchlist ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCreateAndSelect}
                      >
                        Neue erstellen
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Performance Stats - Kompakter auf Mobile */}
      {performanceStats && (
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
          <div>
            <span className="font-medium text-muted-foreground">{getRangeLabel()}: </span>
            <span className={performanceStats.performance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {performanceStats.performance >= 0 ? '+' : ''}{performanceStats.performance.toFixed(2)}%
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="font-medium text-muted-foreground">Above Low: </span>
            <span className="text-green-600 font-semibold">+{performanceStats.aboveLow.toFixed(2)}%</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-medium text-muted-foreground">Below High: </span>
            <span className={performanceStats.belowHigh >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {performanceStats.belowHigh.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      
      <div className="w-full h-[220px] md:h-[260px]">
        <ChartContainer
          config={{
            line1: { theme: { light: 'hsl(221, 83%, 53%)', dark: 'hsl(221, 83%, 70%)' } },
            line2: { theme: { light: 'hsl(142, 76%, 36%)', dark: 'hsl(142, 76%, 50%)' } },
            area: { theme: { light: 'hsl(221, 83%, 95%)', dark: 'hsl(221, 83%, 30%)' } },
          }}
          className="h-full w-full aspect-auto"
        >
          <ComposedChart data={getFilteredData()} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 95%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(221, 83%, 95%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => formatXAxis(new Date(date))}
              height={28}
              tickMargin={4}
              minTickGap={10}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
              <YAxis
                orientation="right"
                domain={['auto', 'auto']}
                tickFormatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toFixed(2);
                  }
                  return value.toString();
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
          </ComposedChart>
        </ChartContainer>
      </div>
      
      {/* Zeitraum-Buttons und Watchlist Button - Mobile (unter dem Chart) */}
      <div className="w-full md:hidden space-y-2">
        <div className="flex justify-between gap-1">
          {TIME_RANGES.map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
              className="text-xs h-7 px-1.5 flex-1 min-w-0"
            >
              {range.label}
            </Button>
          ))}
        </div>
        
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Zu Watchlist hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Zu Watchlist hinzufügen</DialogTitle>
                <DialogDescription>
                  Wähle eine Watchlist aus, um {symbol} hinzuzufügen.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {watchlists.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Du hast noch keine Watchlists.
                    </p>
                    <Button onClick={handleCreateAndSelect}>
                      Neue Watchlist erstellen
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select value={selectedWatchlistId} onValueChange={setSelectedWatchlistId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Watchlist auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlists.map((watchlist) => (
                          <SelectItem key={watchlist.id} value={watchlist.id}>
                            {watchlist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddToWatchlist}
                        disabled={!selectedWatchlistId || isAddingToWatchlist}
                        className="flex-1"
                      >
                        {isAddingToWatchlist ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCreateAndSelect}
                      >
                        Neue erstellen
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default StockChart;
