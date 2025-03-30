
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

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const StockSearch: React.FC<StockSearchProps> = ({ onSearch, isLoading, disabled = false }) => {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSearch(ticker.trim().toUpperCase());
    }
  };

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-6">
        Geben Sie ein Aktiensymbol ein (z.B. AAPL für Apple) oder einen Firmennamen, um die Buffett-Analyse zu starten.
      </p>
      
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
    </div>
  );
};

export default StockSearch;
