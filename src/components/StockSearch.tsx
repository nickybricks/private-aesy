
import React, { useState } from 'react';
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

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

// Suggest common stocks with their names and symbols
const suggestedStocks = [
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

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);
  const [open, setOpen] = useState(false);
  
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

  const selectStock = (stock: string) => {
    setTicker(stock);
    setOpen(false);
  };

  const filteredStocks = ticker
    ? suggestedStocks.filter(stock => 
        stock.name.toLowerCase().includes(ticker.toLowerCase()) || 
        stock.symbol.toLowerCase().includes(ticker.toLowerCase()))
    : suggestedStocks;

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-4">
        Geben Sie einen Firmennamen oder ein Aktiensymbol ein (z.B. "Apple" oder "AAPL"), um die Buffett-Analyse zu starten.
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
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="Aktienname oder Symbol eingeben..."
                  className="apple-input pl-10"
                  disabled={disabled || isLoading}
                  onClick={() => setOpen(true)}
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full" align="start">
              <Command>
                <CommandInput 
                  placeholder="Suche nach Aktien..." 
                  value={ticker}
                  onValueChange={setTicker}
                />
                <CommandList>
                  <CommandEmpty>Keine passenden Aktien gefunden</CommandEmpty>
                  <CommandGroup heading="Vorschläge">
                    {filteredStocks.map((stock) => (
                      <CommandItem 
                        key={stock.symbol} 
                        value={stock.symbol}
                        onSelect={() => selectStock(stock.symbol)}
                      >
                        <span className="font-medium">{stock.name}</span>
                        <span className="ml-2 text-gray-500">({stock.symbol})</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={16} className="ml-2 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-4">
            <p className="font-medium mb-2">Hinweis zur API-Nutzung:</p>
            <p>Dieses Tool verwendet die Financial Modeling Prep API und OpenAI GPT für detaillierte Analysen.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Häufig verwendete Aktiensymbole */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Häufig verwendete Symbole:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedStocks.slice(0, 6).map((item) => (
            <Button
              key={item.symbol}
              variant="outline"
              size="sm"
              className="text-xs py-1 h-auto"
              onClick={() => {
                setTicker(item.symbol);
                setShowAppleCorrection(false);
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
