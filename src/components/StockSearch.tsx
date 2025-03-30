
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

// Konfiguration für Mock-Daten-Modus
const USE_MOCK_DATA = true; // Sollte mit der Konfiguration in stockApi.ts übereinstimmen

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
  ];

  if (USE_MOCK_DATA) {
    // Im Mock-Modus beschränken wir die Auswahl auf die verfügbaren Mock-Daten
    // und zeigen einen Hinweis an
    return (
      <div className="buffett-card mb-8 animate-fade-in">
        <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
        <p className="text-buffett-subtext mb-4">
          Im Demo-Modus stehen vorbereitete Daten für die folgenden Aktien zur Verfügung:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {commonTickers.map((stock) => (
            <div 
              key={stock.symbol}
              className="border rounded-lg p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSearch(stock.symbol)}
            >
              <div className="font-medium text-lg">{stock.name}</div>
              <div className="text-buffett-subtext">{stock.symbol}</div>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700">Demo-Modus aktiv</p>
              <p className="mt-1 text-blue-600">
                Es werden vordefinierte Beispieldaten verwendet. Die API wird nicht aufgerufen.
                Wählen Sie eine der oben angezeigten Aktien aus, um die Analyse zu starten.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normaler Modus mit API-Aufrufen
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
      
      <div className="mt-4 text-sm text-buffett-subtext flex items-start space-x-2">
        <InfoIcon className="h-5 w-5 text-gray-400 mt-0.5" />
        <p>{disabled 
          ? "Bitte konfigurieren Sie zuerst einen API-Key oben, um die Analyse zu starten." 
          : "Das Tool analysiert automatisch alle 7 Buffett-Kriterien und gibt eine Gesamtbewertung."}
        </p>
      </div>
      
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
