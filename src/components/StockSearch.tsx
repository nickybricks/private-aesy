import React, { useState, useEffect, useCallback } from 'react';
import { Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_FMP_API_KEY } from '@/components/ApiKeyInput';
import { supabase } from '@/integrations/supabase/client';

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  currency?: string;
  stockExchange?: string;
  exchangeShortName?: string;
  type?: string;
  isin?: string;
}

const fallbackStocks = [
  { name: 'Apple', symbol: 'AAPL' },
  { name: 'Microsoft', symbol: 'MSFT' },
  { name: 'Amazon', symbol: 'AMZN' },
  { name: 'Alphabet (Google)', symbol: 'GOOGL' },
  { name: 'Meta (Facebook)', symbol: 'META' },
  { name: 'Tesla', symbol: 'TSLA' },
  { name: 'Coca-Cola', symbol: 'KO' },
  { name: 'Johnson & Johnson', symbol: 'JNJ' },
  { name: 'Procter & Gamble', symbol: 'PG' },
  { name: 'UnitedHealth Group', symbol: 'UNH' },
  { name: 'Adidas', symbol: 'ADS.DE' },
  { name: 'BASF', symbol: 'BAS.DE' },
  { name: 'BMW', symbol: 'BMW.DE' },
  { name: 'Deutsche Telekom', symbol: 'DTE.DE' },
  { name: 'SAP', symbol: 'SAP.DE' },
  { name: 'Siemens', symbol: 'SIE.DE' },
];

const quickAccessStocks = [
  { name: 'Apple', symbol: 'AAPL' },
  { name: 'Microsoft', symbol: 'MSFT' },
  { name: 'Amazon', symbol: 'AMZN' },
  { name: 'Alphabet', symbol: 'GOOGL' },
  { name: 'Tesla', symbol: 'TSLA' },
  { name: 'Adidas', symbol: 'ADS.DE' },
];

const isinPattern = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

const commonGermanIsins: Record<string, string> = {
  "DE000A1EWWW0": "ADS.DE",
  "DE000BASF111": "BAS.DE",
  "DE0005190003": "BMW.DE",
  "DE0007100000": "DAI.DE",
  "DE0007664039": "VOW3.DE",
  "DE0008404005": "ALV.DE",
  "DE0007164600": "SAP.DE",
  "DE0007236101": "SIE.DE",
  "DE000ENAG999": "EOAN.DE",
  "DE0005557508": "DTE.DE",
  "DE000ENER6Y0": "ENR.DE",
};

const excludedAssetTypes = ['etf', 'crypto', 'mutual fund', 'trust', 'forex', 'commodity', 'index', 'bond', 'fund', 'reit', 'warrant', 'etn'];

const cryptoKeywords = ['bitcoin', 'ethereum', 'crypto', 'token', 'coin', 'blockchain', 'defi', 'nft'];
const cryptoSymbolPatterns = [
  /^[A-Z0-9]{3,4}-[A-Z]{3}$/,
  /^[A-Z0-9]{1,5}USDT$/,
  /^[A-Z0-9]{1,5}USD$/,
  /COIN$/,
  /TOKEN$/
];

const isCryptoAsset = (stock: StockSuggestion): boolean => {
  if (!stock.name || !stock.symbol) return false;
  
  const nameLower = stock.name.toLowerCase();
  const symbolLower = stock.symbol.toLowerCase();
  
  if (cryptoKeywords.some(keyword => nameLower.includes(keyword))) {
    return true;
  }
  
  if (symbolLower.includes('btc') || 
      symbolLower.includes('eth') || 
      symbolLower.includes('usdt') ||
      symbolLower.includes('usdc') ||
      symbolLower.includes('usd-') ||
      symbolLower.includes('-usd') ||
      cryptoSymbolPatterns.some(pattern => pattern.test(stock.symbol))) {
    return true;
  }
  
  if (stock.stockExchange && 
      (stock.stockExchange.toLowerCase().includes('crypto') || 
       stock.stockExchange.toLowerCase().includes('binance') || 
       stock.stockExchange.toLowerCase().includes('coinbase'))) {
    return true;
  }
  
  if (stock.type && 
      (stock.type.toLowerCase().includes('crypto') || 
       stock.type.toLowerCase().includes('token') || 
       stock.type.toLowerCase().includes('coin'))) {
    return true;
  }
  
  return false;
};

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isinResults, setIsinResults] = useState<StockSuggestion | null>(null);
  const [forceKeepOpen, setForceKeepOpen] = useState(false);
  const { toast } = useToast();

  const checkAndHandleIsin = useCallback((value: string) => {
    if (isinPattern.test(value)) {
      console.log("ISIN pattern detected in input/query:", value);
      handleIsinSearch(value);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      setOpen(true);
    }
    
    if (checkAndHandleIsin(searchQuery)) {
      console.log("ISIN pattern detected in searchQuery effect:", searchQuery);
    } else {
      setIsinResults(null);
    }
  }, [searchQuery, checkAndHandleIsin]);

  const handleIsinSearch = async (possibleIsin: string) => {
    console.log("Starting ISIN search for:", possibleIsin);
    
    if (commonGermanIsins[possibleIsin]) {
      const symbol = commonGermanIsins[possibleIsin];
      console.log("Found ISIN in local database:", possibleIsin, "=>", symbol);
      
      const isinStock: StockSuggestion = {
        symbol: symbol,
        name: `ISIN: ${possibleIsin}`,
      };
      
      const matchingFallback = fallbackStocks.find(stock => stock.symbol === symbol);
      if (matchingFallback) {
        isinStock.name = matchingFallback.name;
      }
      
      setIsinResults(isinStock);
      setOpen(true);
      
      toast({
        title: "ISIN erkannt",
        description: `ISIN ${possibleIsin} wurde erkannt. Bitte wählen Sie den Vorschlag aus der Liste aus.`,
      });
      
      return;
    }
    
    try {
      setIsSearching(true);
      
      try {
        console.log("Searching for ISIN via search-ticker endpoint:", possibleIsin);
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search-ticker?isin=${possibleIsin}&apikey=${DEFAULT_FMP_API_KEY}`);
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0 && response.data[0]?.symbol) {
          const result = response.data[0];
          console.log("Found ISIN via search-ticker:", result);
          
          const isinStock: StockSuggestion = {
            symbol: result.symbol,
            name: result.name || `ISIN: ${possibleIsin}`,
            stockExchange: result.exchange,
            currency: result.currency,
            exchangeShortName: result.exchangeShortName,
          };
          
          setIsinResults(isinStock);
          setOpen(true);
          
          toast({
            title: "ISIN erkannt",
            description: `ISIN ${possibleIsin} wurde gefunden. Bitte wählen Sie den Vorschlag aus der Liste aus.`,
          });
          return;
        }
      } catch (error) {
        console.error("Error with search-ticker endpoint:", error);
      }
      
      try {
        console.log("Searching for ISIN via direct ISIN endpoint:", possibleIsin);
        const directResponse = await axios.get(`https://financialmodelingprep.com/api/v3/isin/${possibleIsin}?apikey=${DEFAULT_FMP_API_KEY}`);
        
        if (directResponse.data && Array.isArray(directResponse.data) && directResponse.data.length > 0 && directResponse.data[0]?.symbol) {
          const result = directResponse.data[0];
          console.log("Found ISIN via direct endpoint:", result);
          
          const isinStock: StockSuggestion = {
            symbol: result.symbol,
            name: result.name || `ISIN: ${possibleIsin}`,
            stockExchange: result.stockExchange,
            currency: result.currency,
          };
          
          setIsinResults(isinStock);
          setOpen(true);
          
          toast({
            title: "ISIN erkannt",
            description: `ISIN ${possibleIsin} wurde gefunden. Bitte wählen Sie den Vorschlag aus der Liste aus.`,
          });
          return;
        }
      } catch (error) {
        console.error("Error with direct ISIN endpoint:", error);
      }
      
      if (Object.keys(commonGermanIsins).includes(possibleIsin)) {
        const symbol = commonGermanIsins[possibleIsin];
        console.log("Falling back to local database for ISIN:", possibleIsin);
        
        const isinStock: StockSuggestion = {
          symbol: symbol,
          name: `ISIN: ${possibleIsin}`,
        };
        
        const matchingFallback = fallbackStocks.find(stock => stock.symbol === symbol);
        if (matchingFallback) {
          isinStock.name = matchingFallback.name;
        }
        
        setIsinResults(isinStock);
        setOpen(true);
        
        toast({
          title: "ISIN erkannt (Fallback)",
          description: `ISIN ${possibleIsin} wurde in der lokalen Datenbank gefunden.`,
        });
      } else {
        console.log("No matches found for ISIN:", possibleIsin);
        toast({
          title: "ISIN nicht gefunden",
          description: `Keine Aktie für ISIN ${possibleIsin} gefunden.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching ISIN:', error);
      
      if (Object.keys(commonGermanIsins).includes(possibleIsin)) {
        const symbol = commonGermanIsins[possibleIsin];
        console.log("Final fallback to local database for ISIN:", possibleIsin);
        
        const isinStock: StockSuggestion = {
          symbol: symbol,
          name: `ISIN: ${possibleIsin}`,
        };
        
        const matchingFallback = fallbackStocks.find(stock => stock.symbol === symbol);
        if (matchingFallback) {
          isinStock.name = matchingFallback.name;
        }
        
        setIsinResults(isinStock);
        setOpen(true);
        
        toast({
          title: "ISIN erkannt (Fallback)",
          description: `ISIN ${possibleIsin} wurde in der lokalen Datenbank gefunden.`,
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const normalizeSearchString = (str: string): string => {
    return str.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
      .trim();
  };

  const prioritizeResults = (results: StockSuggestion[]): StockSuggestion[] => {
    if (!results.length) return [];
    
    const filteredResults = results.filter(stock => {
      if (isCryptoAsset(stock)) {
        return false;
      }
      
      if (stock.type && excludedAssetTypes.some(excludedType => 
        stock.type?.toLowerCase().includes(excludedType))) {
        return false;
      }
      
      if (stock.symbol.includes('-USD') || 
          stock.symbol.includes('USD-') || 
          stock.symbol.endsWith('.ETF') ||
          stock.symbol.endsWith('.FUND') ||
          stock.symbol.includes('_ETF') ||
          /^[A-Z0-9]{1,5}\d{1,2}$/.test(stock.symbol) ||
          stock.symbol.includes('BTC') || 
          stock.symbol.includes('ETH') ||
          stock.symbol.includes('USDT')) {
        return false;  
      }
      
      return true;
    });
    
    const searchLower = searchQuery.toLowerCase();
    const normalizedSearch = normalizeSearchString(searchQuery);
    
    const scoredResults = filteredResults.map(stock => {
      let score = 0;
      const stockNameLower = stock.name.toLowerCase();
      const normalizedStockName = normalizeSearchString(stock.name);
      
      // Exact matches (highest priority)
      if (stockNameLower === searchLower) {
        score += 100;
      } 
      // Normalized exact match (for cases like "United health" vs "UnitedHealth")
      else if (normalizedStockName === normalizedSearch) {
        score += 95;
      }
      // Start matches
      else if (stockNameLower.startsWith(searchLower)) {
        score += 80;
      }
      // Normalized start match
      else if (normalizedStockName.startsWith(normalizedSearch)) {
        score += 75;
      }
      // Contains matches
      else if (stockNameLower.includes(searchLower)) {
        score += 60;
      }
      // Normalized contains match
      else if (normalizedStockName.includes(normalizedSearch)) {
        score += 55;
      }
      
      // Symbol matches
      if (stock.symbol.toLowerCase() === searchLower) {
        score += 50;
      }
      else if (stock.symbol.toLowerCase().startsWith(searchLower)) {
        score += 40;
      }
      
      // Exchange preferences
      if (stock.symbol.endsWith('.DE')) {
        score += 30;
      }
      
      if (stock.exchangeShortName === 'XETRA' || 
          stock.exchangeShortName === 'NYSE' || 
          stock.exchangeShortName === 'NASDAQ') {
        score += 20;
      }
      
      return { ...stock, score };
    });
    
    return scoredResults.sort((a: any, b: any) => b.score - a.score);
  };


  const getFMPApiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-fmp-key');
      if (error) throw error;
      return data.apiKey;
    } catch (error) {
      console.warn('Failed to get FMP API key from Supabase, using default:', error);
      return DEFAULT_FMP_API_KEY;
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions(fallbackStocks.slice(0, 6));
        return;
      }

      setIsSearching(true);
      
      try {
        const apiKey = await getFMPApiKey();
        console.log('Searching for:', searchQuery, 'with API key length:', apiKey?.length);
        
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${searchQuery}&limit=25&apikey=${apiKey}`);
        console.log('API Response:', response.status, 'Results count:', response.data?.length);
        
        if (response.data && Array.isArray(response.data)) {
          const stocksOnly = response.data.filter((item: any) => {
            if (!item.name || !item.symbol) return false;
            
            if (isCryptoAsset(item)) {
              return false;
            }
            
            if (item.type && excludedAssetTypes.some(excludedType => 
              item.type.toLowerCase().includes(excludedType))) {
              return false;
            }
            
            if (item.symbol.includes('-USD') || 
                item.symbol.includes('USD-') || 
                item.symbol.endsWith('.ETF') ||
                item.symbol.endsWith('.FUND') ||
                item.symbol.includes('_ETF') ||
                /^[A-Z0-9]{1,5}\d{1,2}$/.test(item.symbol) ||
                item.symbol.includes('BTC') || 
                item.symbol.includes('ETH') ||
                item.symbol.includes('USDT')) {
              return false;  
            }
            
            return true;
          });
          
          const prioritizedResults = prioritizeResults(stocksOnly);
          setSuggestions(prioritizedResults);
        }
      } catch (error) {
        console.error('Error fetching stock suggestions:', error);
        toast({
          title: "Fehler beim Laden der Vorschläge",
          description: "Fallback-Liste wird angezeigt. Bitte prüfen Sie Ihren API-Key.",
          variant: "destructive",
        });
        
        const filteredResults = fallbackStocks.filter(stock => {
          const stockNameLower = stock.name.toLowerCase();
          const searchLower = searchQuery.toLowerCase();
          const normalizedSearch = normalizeSearchString(searchQuery);
          const normalizedStockName = normalizeSearchString(stock.name);
          
          return stockNameLower.includes(searchLower) || 
                 stock.symbol.toLowerCase().includes(searchLower) ||
                 normalizedStockName.includes(normalizedSearch);
        });
        setSuggestions(filteredResults);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      if (ticker.trim().toUpperCase() === 'APPL') {
        setShowAppleCorrection(true);
        return;
      }
      
      setShowAppleCorrection(false);
      onSearch(ticker.trim().toUpperCase());
      setOpen(false);
      setForceKeepOpen(false);
    }
  };

  const correctSymbol = (correctTicker: string) => {
    setTicker(correctTicker);
    setShowAppleCorrection(false);
    onSearch(correctTicker);
  };

  const selectStock = (stock: StockSuggestion) => {
    console.log("Stock selected:", stock);
    setTicker(stock.symbol);
    onSearch(stock.symbol);
    setOpen(false);
    setForceKeepOpen(false);
  };

  const selectQuickAccessStock = (symbol: string) => {
    setTicker(symbol);
    setShowAppleCorrection(false);
  };

  const formatStockDisplay = (stock: StockSuggestion) => {
    let exchange = '';
    
    if (stock.exchangeShortName) {
      exchange = stock.exchangeShortName;
    } else if (stock.stockExchange) {
      const exchangeParts = stock.stockExchange.split(' ');
      exchange = exchangeParts.length > 1 ? exchangeParts[0] : stock.stockExchange;
    }
    
    return {
      name: stock.name,
      symbol: stock.symbol,
      exchange: exchange,
      currency: '',
    };
  };

  const handleInputFocus = () => {
    setForceKeepOpen(true);
    setOpen(true);
    
    if (!searchQuery.trim()) {
      setSuggestions(fallbackStocks.slice(0, 6));
    }
  };

  useEffect(() => {
    if (forceKeepOpen) {
      setOpen(true);
    }
  }, [forceKeepOpen]);

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-4">
        Geben Sie einen Firmennamen oder ein Aktiensymbol ein, um die Buffett-Analyse zu starten.
      </p>
      
      {showAppleCorrection && (
        <Alert className="mb-4 border-buffett-blue bg-buffett-blue bg-opacity-5">
          <AlertTitle>Meinten Sie Apple (AAPL)?</AlertTitle>
          <AlertDescription>
            <p>Das Symbol für Apple Inc. ist "AAPL" (nicht "APPL").</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-buffett-blue font-medium mt-1"
              onClick={() => correctSymbol('AAPL')}
            >
              Stattdessen AAPL verwenden →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Popover open={open} onOpenChange={(newState) => {
            if (!forceKeepOpen || newState) {
              setOpen(newState);
            }
          }}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Input
                  type="text"
                  value={ticker}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setTicker(newValue);
                    setSearchQuery(newValue);
                    
                    checkAndHandleIsin(newValue);
                    
                    if (newValue.length >= 1) {
                      setOpen(true);
                      setForceKeepOpen(true);
                    }
                  }}
                  onFocus={handleInputFocus}
                  onClick={handleInputFocus}
                  placeholder="Aktienname, Symbol oder ISIN eingeben..."
                  className="apple-input pl-10"
                  disabled={disabled || isLoading}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="p-0 w-[300px] md:w-[400px] z-50" 
              align="start" 
              sideOffset={5}
              onInteractOutside={(e) => {
                if (isinResults) {
                  e.preventDefault();
                } else {
                  setForceKeepOpen(false);
                }
              }}
              onEscapeKeyDown={() => {
                setForceKeepOpen(false);
              }}
            >
              <Command>
                <CommandInput 
                  placeholder="Suche nach Aktien..." 
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setTicker(value);
                    
                    checkAndHandleIsin(value);
                  }}
                  onFocus={() => setForceKeepOpen(true)}
                  autoFocus
                />
                <CommandList>
                  {isSearching ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Suche nach Unternehmen...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>
                        {searchQuery && searchQuery.length >= 2 ? (
                          <div className="py-6 text-center">
                            <p>Keine passenden Aktien gefunden</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Versuchen Sie einen anderen Suchbegriff oder geben Sie das Symbol direkt ein
                            </p>
                          </div>
                        ) : (
                          <div className="py-6 text-center">
                            <p className="text-xs text-muted-foreground">
                              Beliebte Aktien werden angezeigt
                            </p>
                          </div>
                        )}
                      </CommandEmpty>
                      
                      {isinResults && (
                        <CommandGroup heading="ISIN Ergebnis">
                          <CommandItem
                            key={`isin-${isinResults.symbol}`}
                            value={`${isinResults.name} ${isinResults.symbol}`}
                            onSelect={() => {
                              console.log("ISIN result selected:", isinResults);
                              selectStock(isinResults);
                            }}
                            className="flex justify-between bg-blue-50 font-medium"
                          >
                            <div className="flex-1 truncate">
                              <span className="font-medium">{isinResults.name}</span>
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({isinResults.symbol})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                              {isinResults.exchangeShortName && <span>{isinResults.exchangeShortName}</span>}
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      )}
                      
                      {(!searchQuery || searchQuery.length < 2) ? (
                        <CommandGroup heading="Beliebte Aktien">
                          {fallbackStocks.slice(0, 6).map((stock) => {
                            const display = formatStockDisplay(stock);
                            return (
                              <CommandItem 
                                key={stock.symbol} 
                                value={`${stock.name} ${stock.symbol}`}
                                onSelect={() => selectStock(stock)}
                                className="flex justify-between"
                              >
                                <div className="flex-1 truncate">
                                  <span className="font-medium">{display.name}</span>
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({display.symbol})
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ) : (
                        <CommandGroup heading="Vorschläge">
                          {suggestions.map((stock) => {
                            const display = formatStockDisplay(stock);
                            return (
                              <CommandItem 
                                key={stock.symbol} 
                                value={`${stock.name} ${stock.symbol}`}
                                onSelect={() => selectStock(stock)}
                                className="flex justify-between"
                              >
                                <div className="flex-1 truncate">
                                  <span className="font-medium">{display.name}</span>
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({display.symbol})
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                  {display.exchange && <span>{display.exchange}</span>}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <Button 
          type="submit" 
          className="apple-button"
          disabled={isLoading || !ticker.trim() || disabled}
        >
          {isLoading ? 'Analysiere...' : 'Analysieren'}
        </Button>
      </form>
      
      <div className="mt-4 text-sm text-buffett-subtext flex items-center">
        <p>Das Tool analysiert automatisch alle 7 Buffett-Kriterien und gibt eine Gesamtbewertung.</p>
        <Popover>
          <PopoverTrigger asChild>
            <Info size={16} className="ml-2 cursor-pointer" />
          </PopoverTrigger>
          <PopoverContent className="max-w-xs p-4">
            <p className="font-medium mb-2">Hinweis zur API-Nutzung:</p>
            <p>Dieses Tool verwendet die Financial Modeling Prep API und KI-Technologie für detaillierte Analysen.</p>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Häufig verwendete Symbole:</p>
        <div className="flex flex-wrap gap-2">
          {quickAccessStocks.map((item) => (
            <Button
              key={item.symbol}
              variant="outline"
              size="sm"
              className="text-xs py-1 h-auto"
              onClick={() => {
                selectQuickAccessStock(item.symbol);
                setOpen(true);
                setForceKeepOpen(true);
              }}
            >
              {item.symbol} ({item.name})
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockSearch;
