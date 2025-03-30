
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

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);

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
    }
  };

  const correctSymbol = (correctTicker: string) => {
    setTicker(correctTicker);
    setShowAppleCorrection(false);
    onSearch(correctTicker);
  };

  const commonTickers = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOGL', name: 'Alphabet (Google)' },
    { symbol: 'META', name: 'Meta (Facebook)' },
    { symbol: 'TSLA', name: 'Tesla' },
  ];

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-4">
        Geben Sie ein Aktiensymbol ein (z.B. AAPL für Apple) oder einen Firmennamen, um die Buffett-Analyse zu starten.
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
          <Input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL, MSFT, AMZN, META..."
            className="apple-input pl-10"
            disabled={disabled || isLoading}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
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
        <p>{disabled 
          ? "Bitte konfigurieren Sie zuerst einen API-Key oben, um die Analyse zu starten." 
          : "Das Tool analysiert automatisch alle 7 Buffett-Kriterien und gibt eine Gesamtbewertung."}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info size={16} className="ml-2 cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-4">
            <p className="font-medium mb-2">Hinweis zur API-Nutzung:</p>
            <p>Dieses Tool verwendet die Financial Modeling Prep API. Sie benötigen einen gültigen API-Schlüssel, um die Anwendung zu nutzen.</p>
            <p className="mt-2">Registrieren Sie sich für einen kostenlosen API-Schlüssel unter <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">financialmodelingprep.com</a>.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Häufig verwendete Aktiensymbole */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Häufig verwendete Symbole:</p>
        <div className="flex flex-wrap gap-2">
          {commonTickers.map((item) => (
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
