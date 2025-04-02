
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

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  
  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      
      try {
        // Get API key from localStorage
        const apiKey = localStorage.getItem('fmp_api_key');
        if (!apiKey) {
          setSuggestions(fallbackStocks.filter(stock => 
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
          ));
          return;
        }
        
        const response = await axios.get(`https://financialmodelingprep.com/api/v3/search?query=${searchQuery}&limit=15&apikey=${apiKey}`);
        
        if (response.data && Array.isArray(response.data)) {
          // Filter out results with empty names
          const validResults = response.data.filter((item: any) => item.name && item.symbol);
          setSuggestions(validResults);
        }
      } catch (error) {
        console.error('Error fetching stock suggestions:', error);
        toast({
          title: "Fehler beim Laden der Vorschläge",
          description: "Fallback-Liste wird angezeigt. Bitte prüfen Sie Ihren API-Key.",
          variant: "destructive",
        });
        
        // Fallback to static list filtered by search query
        setSuggestions(fallbackStocks.filter(stock => 
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        ));
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
        <p className="font-medium">Tipp zur Aktiensuche:</p>
        <p>Für deutsche Aktien bitte .DE anhängen (z.B. ADS.DE für Adidas oder BAS.DE für BASF)</p>
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
                  placeholder="Aktienname oder Symbol eingeben..."
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
                              value={stock.symbol}
                              onSelect={() => selectStock(stock)}
                              className="flex justify-between"
                            >
                              <div>
                                <span className="font-medium">{display.name}</span>
                                {display.exchange && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {display.exchange}
                                  </span>
                                )}
                              </div>
                              <span className="ml-2 text-gray-500">{display.symbol}</span>
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
