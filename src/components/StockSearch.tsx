import React, { useState, useEffect } from 'react';
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

// Fallback suggested stocks if API fails
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

// Popular stocks for quick access buttons
const quickAccessStocks = [
  { name: 'Apple', symbol: 'AAPL' },
  { name: 'Microsoft', symbol: 'MSFT' },
  { name: 'Amazon', symbol: 'AMZN' },
  { name: 'Alphabet', symbol: 'GOOGL' },
  { name: 'Tesla', symbol: 'TSLA' },
  { name: 'Adidas', symbol: 'ADS.DE' },
];

// ISIN patterns for major markets
const isinPattern = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

// Common German ISINs for quick detection
const commonGermanIsins: Record<string, string> = {
  "DE000A1EWWW0": "ADS.DE", // Adidas
  "DE000BASF111": "BAS.DE", // BASF
  "DE0005190003": "BMW.DE", // BMW
  "DE0007100000": "DAI.DE", // Mercedes-Benz
  "DE0007664039": "VOW3.DE", // Volkswagen
  "DE0008404005": "ALV.DE", // Allianz
  "DE0007164600": "SAP.DE", // SAP
  "DE0007236101": "SIE.DE", // Siemens
  "DE000ENAG999": "EOAN.DE", // E.ON
  "DE0005557508": "DTE.DE", // Deutsche Telekom
  "DE000ENER6Y0": "ENR.DE", // Siemens Energy
};

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);
  const [suggestedCorrection, setSuggestedCorrection] = useState<{original: string, suggestion: string, symbol: string} | null>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  // Detect if input looks like an ISIN
  useEffect(() => {
    if (isinPattern.test(searchQuery)) {
      handleIsinSearch(searchQuery);
    }
  }, [searchQuery]);

  // Handle ISIN search
  const handleIsinSearch = async (possibleIsin: string) => {
    // Check if it's a common German ISIN we know
    if (commonGermanIsins[possibleIsin]) {
      setTicker(commonGermanIsins[possibleIsin]);
      toast({
        title: "ISIN erkannt",
        description: `ISIN ${possibleIsin} wurde als ${commonGermanIsins[possibleIsin]} identifiziert.`,
      });
      return;
    }
    
    // Otherwise try to look it up via API if we have a key
    try {
      const apiKey = localStorage.getItem('fmp_api_key');
      if (!apiKey) return;
      
      setIsSearching(true);
      const response = await axios.get(`https://financialmodelingprep.com/api/v3/isin/${possibleIsin}?apikey=${apiKey}`);
      
      if (response.data && response.data[0]?.symbol) {
        setTicker(response.data[0].symbol);
        toast({
          title: "ISIN erkannt",
          description: `ISIN ${possibleIsin} wurde als ${response.data[0].symbol} identifiziert.`,
        });
      }
    } catch (error) {
      console.error('Error fetching ISIN:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Function to prioritize and sort search results
  const prioritizeResults = (results: StockSuggestion[]): StockSuggestion[] => {
    if (!results.length) return [];
    
    const searchLower = searchQuery.toLowerCase();
    
    // First, assign a score to each result
    const scoredResults = results.map(stock => {
      let score = 0;
      
      // Prioritize exact name matches
      if (stock.name.toLowerCase() === searchLower) {
        score += 100;
      } 
      // Prioritize name starts with search query
      else if (stock.name.toLowerCase().startsWith(searchLower)) {
        score += 80;
      }
      // Name contains search query
      else if (stock.name.toLowerCase().includes(searchLower)) {
        score += 60;
      }
      
      // Symbol exact match
      if (stock.symbol.toLowerCase() === searchLower) {
        score += 50;
      }
      // Symbol starts with search query
      else if (stock.symbol.toLowerCase().startsWith(searchLower)) {
        score += 40;
      }
      
      // Prioritize German stocks (.DE)
      if (stock.symbol.endsWith('.DE')) {
        score += 30;
      }
      
      // Prioritize main exchanges over OTC
      if (stock.exchangeShortName === 'XETRA' || 
          stock.exchangeShortName === 'NYSE' || 
          stock.exchangeShortName === 'NASDAQ') {
        score += 20;
      }
      
      // Deprioritize certain types
      if (stock.type === 'etf' || stock.type === 'mutual fund' || stock.type === 'trust') {
        score -= 30;
      }
      
      return { ...stock, score };
    });
    
    // Sort by score
    return scoredResults.sort((a: any, b: any) => b.score - a.score);
  };

  // Simple fuzzy match to suggest corrections
  const getFuzzyMatches = (query: string, stocks: StockSuggestion[]) => {
    if (query.length < 4) return null;
    
    const queryLower = query.toLowerCase();
    
    // Look for popular stocks with similar names (levenshtein distance would be better but this is simpler)
    for (const stock of stocks) {
      const nameLower = stock.name.toLowerCase();
      
      // Check if stock name contains most of the query chars in sequence
      let matchCount = 0;
      let lastIndex = -1;
      
      for (const char of queryLower) {
        const index = nameLower.indexOf(char, lastIndex + 1);
        if (index > -1) {
          matchCount++;
          lastIndex = index;
        }
      }
      
      // If we match at least 70% of the characters and it's a somewhat known stock
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
  
  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        setSuggestedCorrection(null);
        return;
      }

      setIsSearching(true);
      
      try {
        // Get API key from localStorage
        const apiKey = localStorage.getItem('fmp_api_key');
        if (!apiKey) {
          const filteredResults = fallbackStocks.filter(stock => 
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setSuggestions(filteredResults);
          
          // Check for fuzzy matches in fallback stocks
          const correction = getFuzzyMatches(searchQuery, filteredResults);
          setSuggestedCorrection(correction);
          return;
        }
        
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${searchQuery}&limit=25&apikey=${apiKey}`);
        
        if (response.data && Array.isArray(response.data)) {
          // Filter out results with empty names
          const validResults = response.data.filter((item: any) => item.name && item.symbol);
          
          // Prioritize and sort results
          const prioritizedResults = prioritizeResults(validResults);
          setSuggestions(prioritizedResults);
          
          // Check for fuzzy matches
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
        
        // Fallback to static list filtered by search query
        const filteredResults = fallbackStocks.filter(stock => 
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filteredResults);
        
        // Check for fuzzy matches in fallback stocks
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
      // Check if the user entered "APPL" instead of "AAPL" (common mistake)
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
    setTicker(stock.symbol);
    setOpen(false);
  };

  // This function is now separate - it updates the ticker but doesn't start analysis
  const selectQuickAccessStock = (symbol: string) => {
    setTicker(symbol);
    setShowAppleCorrection(false);
  };

  const formatStockDisplay = (stock: StockSuggestion) => {
    let exchange = '';
    
    if (stock.exchangeShortName) {
      exchange = stock.exchangeShortName;
    } else if (stock.stockExchange) {
      // Extract a short name from the exchange if possible
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
                    setTicker(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Aktienname, Symbol oder ISIN eingeben..."
                  className="apple-input pl-10"
                  disabled={disabled || isLoading}
                  onClick={() => setOpen(true)}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
              <Command>
                <CommandInput 
                  placeholder="Suche nach Aktien..." 
                  value={searchQuery}
                  onValueChange={(value) => {
                    setSearchQuery(value);
                    setTicker(value);
                  }}
                />
                <CommandList>
                  {isSearching ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Suche nach Unternehmen...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>
                        <div className="py-6 text-center">
                          <p>Keine passenden Aktien gefunden</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Versuchen Sie einen anderen Suchbegriff oder geben Sie das Symbol direkt ein
                          </p>
                        </div>
                      </CommandEmpty>
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
      
      {/* Häufig verwendete Aktiensymbole */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Häufig verwendete Symbole:</p>
        <div className="flex flex-wrap gap-2">
          {quickAccessStocks.map((item) => (
            <Button
              key={item.symbol}
              variant="outline"
              size="sm"
              className="text-xs py-1 h-auto"
              onClick={() => selectQuickAccessStock(item.symbol)}
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
