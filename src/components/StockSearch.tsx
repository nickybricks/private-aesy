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
  const [suggestedCorrection, setSuggestedCorrection] = useState<{original: string, suggestion: string, symbol: string} | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isinResults, setIsinResults] = useState<StockSuggestion | null>(null);
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
      const apiKey = localStorage.getItem('fmp_api_key');
      if (!apiKey) {
        console.log("No API key found for ISIN search");
        return;
      }
      
      setIsSearching(true);
      
      try {
        console.log("Searching for ISIN via search-ticker endpoint:", possibleIsin);
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search-ticker?isin=${possibleIsin}&apikey=${apiKey}`);
        
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
        const directResponse = await axios.get(`https://financialmodelingprep.com/api/v3/isin/${possibleIsin}?apikey=${apiKey}`);
        
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
    
    const scoredResults = filteredResults.map(stock => {
      let score = 0;
      
      if (stock.name.toLowerCase() === searchLower) {
        score += 100;
      } 
      else if (stock.name.toLowerCase().startsWith(searchLower)) {
        score += 80;
      }
      else if (stock.name.toLowerCase().includes(searchLower)) {
        score += 60;
      }
      
      if (stock.symbol.toLowerCase() === searchLower) {
        score += 50;
      }
      else if (stock.symbol.toLowerCase().startsWith(searchLower)) {
        score += 40;
      }
      
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

  const getFuzzyMatches = (query: string, stocks: StockSuggestion[]) => {
    if (query.length < 4) return null;
    
    const exactMatch = stocks.find(stock => 
      stock.symbol.toLowerCase() === query.toLowerCase()
    );
    if (exactMatch) return null;
    
    const queryLower = query.toLowerCase();
    
    for (const stock of stocks) {
      const nameLower = stock.name.toLowerCase();
      const symbolLower = stock.symbol.toLowerCase();
      
      if (symbolLower === queryLower) continue;
      
      let matchCount = 0;
      let lastIndex = -1;
      
      for (const char of queryLower) {
        const index = nameLower.indexOf(char, lastIndex + 1);
        if (index > -1) {
          matchCount++;
          lastIndex = index;
        }
      }
      
      if (matchCount >= queryLower.length * 0.7 && 
          (stock.symbol.endsWith('.DE') || ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].includes(stock.symbol))) {
        return {
          original: query,
          suggestion: stock.name,
          symbol: stock.symbol
        };
      }
    }
    
    return null;
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions(fallbackStocks.slice(0, 6));
        setSuggestedCorrection(null);
        return;
      }

      setIsSearching(true);
      
      try {
        const apiKey = localStorage.getItem('fmp_api_key');
        if (!apiKey) {
          const filteredResults = fallbackStocks.filter(stock => 
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSuggestions(filteredResults);
          
          const correction = getFuzzyMatches(searchQuery, filteredResults);
          setSuggestedCorrection(correction);
          return;
        }
        
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${searchQuery}&limit=25&apikey=${apiKey}`);
        
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
          
          const correction = getFuzzyMatches(searchQuery, prioritizedResults);
          setSuggestedCorrection(correction);
        }
      } catch (error) {
        console.error('Error fetching stock suggestions:', error);
        toast({
          title: "Fehler beim Laden der Vorschläge",
          description: "Fallback-Liste wird angezeigt. Bitte prüfen Sie Ihren API-Key.",
          variant: "destructive",
        });
        
        const filteredResults = fallbackStocks.filter(stock => 
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filteredResults);
        
        const correction = getFuzzyMatches(searchQuery, filteredResults);
        setSuggestedCorrection(correction);
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
      currency: stock.currency || '',
    };
  };

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-4">
        Geben Sie einen Firmennamen oder ein Aktiensymbol ein, um die Buffett-Analyse zu starten.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 text-sm">
        <p className="font-medium">Tipps zur Aktiensuche:</p>
        <ul className="mt-1 list-disc list-inside">
          <li>Geben Sie den Firmennamen (z.B. "Adidas") oder das Symbol (z.B. "ADS.DE") ein</li>
          <li>Deutsche Aktien enden meist auf .DE (z.B. ADS.DE für Adidas)</li>
          <li>Sie können auch eine ISIN eingeben (z.B. DE000A1EWWW0 für Adidas)</li>
        </ul>
      </div>
      
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
      
      {suggestedCorrection && (
        <Alert className="mb-4 border-buffett-blue bg-buffett-blue bg-opacity-5">
          <AlertTitle>Meinten Sie {suggestedCorrection.suggestion}?</AlertTitle>
          <AlertDescription>
            <p>Wir haben eine ähnliche Aktie gefunden.</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-buffett-blue font-medium mt-1"
              onClick={() => {
                setTicker(suggestedCorrection.symbol);
                onSearch(suggestedCorrection.symbol);
                setSuggestedCorrection(null);
              }}
            >
              {suggestedCorrection.symbol} ({suggestedCorrection.suggestion}) verwenden →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Popover open={open} onOpenChange={setOpen}>
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
                    }
                  }}
                  onFocus={() => {
                    if (ticker.length >= 1 || isinResults) {
                      setOpen(true);
                    }
                  }}
                  placeholder="Aktienname, Symbol oder ISIN eingeben..."
                  className="apple-input pl-10"
                  disabled={disabled || isLoading}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="p-0 w-[300px] md:w-[400px]" 
              align="start" 
              sideOffset={5}
              onInteractOutside={(e) => {
                if (isinResults) {
                  e.preventDefault();
                }
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="ml-2 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-4">
              <p className="font-medium mb-2">Hinweis zur API-Nutzung:</p>
              <p>Dieses Tool verwendet die Financial Modeling Prep API und OpenAI GPT für detaillierte Analysen.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
