
import React, { useState, useEffect } from 'react';
import { Search, Info, AlertCircle, AlertTriangle, WifiOff } from 'lucide-react';
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
  hasApiKeyError?: boolean;
  errorType?: string;
  errorMessage?: string;
}

const StockSearch: React.FC<StockSearchProps> = ({ 
  onSearch, 
  isLoading, 
  disabled = false,
  hasApiKeyError = false,
  errorType = 'unknown',
  errorMessage = ''
}) => {
  const [ticker, setTicker] = useState('');
  const [showAppleCorrection, setShowAppleCorrection] = useState(false);
  const [showGermanStockInfo, setShowGermanStockInfo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      // Check if the user entered "APPL" instead of "AAPL" (common mistake)
      if (ticker.trim().toUpperCase() === 'APPL') {
        setShowAppleCorrection(true);
        setShowGermanStockInfo(false);
        return;
      }
      
      // Check if it's a German stock but without .DE suffix
      const germanStockPattern = /^[A-Z0-9]{3,6}$/;
      const isDEStock = ticker.trim().toUpperCase().endsWith('.DE');
      
      if (!isDEStock && germanStockPattern.test(ticker.trim().toUpperCase()) && !ticker.trim().includes('.')) {
        // Show info about German stocks if they might have entered a German stock without .DE
        setShowGermanStockInfo(true);
        setShowAppleCorrection(false);
        return;
      }
      
      setShowAppleCorrection(false);
      setShowGermanStockInfo(false);
      onSearch(ticker.trim().toUpperCase());
    }
  };

  const correctSymbol = (correctTicker: string) => {
    setTicker(correctTicker);
    setShowAppleCorrection(false);
    setShowGermanStockInfo(false);
    onSearch(correctTicker);
  };
  
  const appendDEAndSearch = () => {
    const tickerWithDE = `${ticker.trim().toUpperCase()}.DE`;
    setTicker(tickerWithDE);
    setShowGermanStockInfo(false);
    onSearch(tickerWithDE);
  };

  // Hilfsfunktion zur Ermittlung des API-Fehler-Icons
  const getErrorIcon = () => {
    if (errorType === 'rate_limit') return <AlertCircle className="h-4 w-4" />;
    if (errorType === 'network') return <WifiOff className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  // Hilfsfunktion zur Ermittlung des API-Fehler-Titels
  const getErrorTitle = () => {
    if (errorType === 'rate_limit') return 'API-Limit überschritten';
    if (errorType === 'network') return 'Netzwerkfehler';
    if (errorType === 'invalid_key') return 'API-Key ungültig';
    return 'API-Verbindungsproblem';
  };

  // Liste der häufig verwendeten Aktiensymbole
  const commonTickers = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOGL', name: 'Alphabet (Google)' },
    { symbol: 'META', name: 'Meta (Facebook)' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    // Deutsche Aktien
    { symbol: 'SAP.DE', name: 'SAP' },
    { symbol: 'BMW.DE', name: 'BMW' },
    { symbol: 'BAS.DE', name: 'BASF' },
    { symbol: 'ALV.DE', name: 'Allianz' },
    { symbol: 'SIE.DE', name: 'Siemens' },
    { symbol: 'DAI.DE', name: 'Mercedes-Benz' },
    { symbol: 'VOW3.DE', name: 'Volkswagen' },
    { symbol: 'DTE.DE', name: 'Deutsche Telekom' },
    { symbol: 'BAYN.DE', name: 'Bayer' },
  ];

  return (
    <div className="buffett-card mb-8 animate-fade-in">
      <h2 className="text-2xl font-semibold mb-4">Aktienanalyse nach Warren Buffett</h2>
      <p className="text-buffett-subtext mb-4">
        Geben Sie ein Aktiensymbol ein (z.B. AAPL für Apple) oder einen Firmennamen, um die Buffett-Analyse zu starten.
      </p>
      
      {hasApiKeyError && (
        <Alert variant="destructive" className="mb-4">
          {getErrorIcon()}
          <AlertTitle>{getErrorTitle()}</AlertTitle>
          <AlertDescription>
            {errorType === 'rate_limit' ? (
              <p>Das tägliche Limit für kostenlose API-Anfragen wurde erreicht. Das Limit wird täglich um 00:00 Uhr UTC zurückgesetzt.</p>
            ) : errorType === 'network' ? (
              <p>Es scheint ein Netzwerkproblem bei der Verbindung zur Financial Modeling Prep API zu geben. Bitte überprüfen Sie Ihre Internetverbindung.</p>
            ) : errorType === 'invalid_key' ? (
              <p>Der eingegebene API-Key scheint ungültig zu sein. Bitte überprüfen Sie Ihren Financial Modeling Prep API-Key oben.</p>
            ) : (
              <p>Es scheint ein Problem mit der API-Verbindung zu geben. Bitte versuchen Sie folgende Lösungen:</p>
            )}
            
            {errorType !== 'rate_limit' && errorType !== 'network' && errorType !== 'invalid_key' && (
              <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
                <li>Überprüfen Sie, ob Ihr API-Key korrekt eingegeben wurde (keine Leerzeichen)</li>
                <li>Stellen Sie sicher, dass Sie eine stabile Internetverbindung haben</li>
                <li>Bei kostenlosem API-Plan: Überprüfen Sie, ob Ihr tägliches Limit erreicht wurde</li>
                <li>Versuchen Sie, einen neuen API-Key zu erstellen und diesen zu verwenden</li>
                <li>Probieren Sie es später noch einmal</li>
              </ol>
            )}
            
            {errorMessage && errorType === 'unknown' && (
              <p className="mt-2 text-sm italic">Fehlermeldung: {errorMessage}</p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
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
      
      {showGermanStockInfo && (
        <Alert className="mb-4 border-buffett-blue bg-buffett-blue bg-opacity-5">
          <AlertTitle>Deutsche Aktie?</AlertTitle>
          <AlertDescription>
            <p>Für deutsche Aktien benötigen Sie das Suffix ".DE" am Ende des Symbols.</p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-buffett-blue font-medium mt-1"
              onClick={appendDEAndSearch}
            >
              Mit ".DE" suchen ({ticker.trim().toUpperCase()}.DE) →
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
            placeholder="AAPL, MSFT, SAP.DE, BMW.DE..."
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="ml-2 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-4">
              <p className="font-medium mb-2">Hinweis zur API-Nutzung:</p>
              <p>Dieses Tool verwendet die Financial Modeling Prep API. Sie benötigen einen gültigen API-Schlüssel, um die Anwendung zu nutzen.</p>
              <p className="mt-2">Registrieren Sie sich für einen kostenlosen API-Schlüssel unter <a href="https://financialmodelingprep.com/developer/docs/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">financialmodelingprep.com</a>.</p>
              <p className="mt-2 text-amber-600 font-medium">Hinweis: Nicht alle deutschen Aktien werden von der Financial Modeling Prep API unterstützt.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
                setShowGermanStockInfo(false);
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
