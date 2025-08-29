
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, AlertTriangle, X, Info, HelpCircle, AlertCircle, CheckCircle2, XCircle, ArrowUp, ArrowDown, MoreHorizontal, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { QuantAnalysisResult } from '@/api/quantAnalyzerApi';
import { useUserStocks } from '@/hooks/useUserStocks';
import { addStockToWatchlist } from '@/utils/watchlistService';

interface QuantAnalysisTableProps {
  results: QuantAnalysisResult[];
  isLoading: boolean;
}

const metricsDefinitions = {
  roe: {
    name: "ROE (Eigenkapitalrendite)",
    definition: "Misst, wie effizient das Eigenkapital für die Generierung von Gewinnen genutzt wird.",
    target: "> 15%",
    formula: "Jahresüberschuss ÷ Eigenkapital"
  },
  roic: {
    name: "ROIC (Kapitalrendite)",
    definition: "Zeigt, wie effizient das Gesamtkapital (inkl. Fremdkapital) eingesetzt wird.",
    target: "> 10%",
    formula: "NOPAT ÷ Investiertes Kapital"
  },
  netMargin: {
    name: "Nettomarge",
    definition: "Prozentsatz des Umsatzes, der als Gewinn übrig bleibt.",
    target: "> 10%",
    formula: "Jahresüberschuss ÷ Umsatz"
  },
  epsGrowth: {
    name: "EPS-Wachstum",
    definition: "Wachstum des Gewinns pro Aktie über Zeit.",
    target: "positiv",
    formula: "Aktueller EPS ÷ Vorjahres-EPS - 1"
  },
  revenueGrowth: {
    name: "Umsatzwachstum",
    definition: "Wachstum des Gesamtumsatzes über Zeit.",
    target: "positiv",
    formula: "Aktueller Umsatz ÷ Vorjahres-Umsatz - 1"
  },
  interestCoverage: {
    name: "Zinsdeckungsgrad",
    definition: "Fähigkeit des Unternehmens, Zinsen aus dem operativen Gewinn zu bedienen.",
    target: "> 5",
    formula: "EBIT ÷ Zinsaufwand"
  },
  debtRatio: {
    name: "Schuldenquote",
    definition: "Verhältnis der Gesamtverschuldung zur Bilanzsumme.",
    target: "< 70%",
    formula: "Gesamtschulden ÷ Bilanzsumme"
  },
  pe: {
    name: "KGV (Kurs-Gewinn-Verhältnis)",
    definition: "Verhältnis zwischen Aktienkurs und Gewinn pro Aktie.",
    target: "< 15",
    formula: "Aktienkurs ÷ Gewinn pro Aktie"
  },
  pb: {
    name: "P/B (Kurs-Buchwert-Verhältnis)",
    definition: "Verhältnis zwischen Aktienkurs und Buchwert pro Aktie.",
    target: "< 1.5 (bis 3 bei starken Margen)",
    formula: "Aktienkurs ÷ Buchwert pro Aktie"
  },
  dividendYield: {
    name: "Dividendenrendite",
    definition: "Jährliche Dividendenzahlung im Verhältnis zum Aktienkurs.",
    target: "> 2%",
    formula: "Jährliche Dividende pro Aktie ÷ Aktienkurs"
  },
  intrinsicValue: {
    name: "Innerer Wert",
    definition: "Vereinfachte Berechnung des intrinsischen Wertes mittels Graham-Zahl und P/E-basierter Bewertung.",
    target: "Innerer Wert > Aktienkurs",
    formula: "Median aus Graham-Zahl, P/E-basiert (12x), Umsatz-basiert"
  },
  intrinsicValueWithMargin: {
    name: "Sicherheitsmarge (20%)",
    definition: "Innerer Wert mit 20% Sicherheitsmarge nach Buffetts Prinzip.",
    target: "Innerer Wert × 0.8 > Aktienkurs", 
    formula: "Innerer Wert × 0.8"
  }
};

const BuffettScoreBadge = ({ score }: { score: number }) => {
  if (score >= 9) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🟢 Kandidat</Badge>;
  } else if (score >= 6) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">🟡 Beobachten</Badge>;
  } else {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">🔴 Vermeiden</Badge>;
  }
};

const StatusIcon = ({ passed, value }: { passed: boolean, value: number | null }) => {
  if (value === null) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <span><AlertCircle className="h-5 w-5 text-gray-400 cursor-pointer" /></span>
        </PopoverTrigger>
        <PopoverContent>
          <p>Keine Daten verfügbar</p>
        </PopoverContent>
      </Popover>
    );
  }
  
  return passed ? 
    <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
    <XCircle className="h-5 w-5 text-red-500" />;
};

const SortableHeader = ({ field, name, tooltipText, sortField, sortDirection, setSortField, setSortDirection }: { 
  field: string, 
  name: string, 
  tooltipText?: string,
  sortField: string,
  sortDirection: "asc" | "desc",
  setSortField: (field: string) => void,
  setSortDirection: (direction: "asc" | "desc") => void
}) => {
  const isCurrentSort = sortField === field;
  const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;
  
  const handleHeaderClick = () => {
    if (isCurrentSort) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleTooltipClick = (e: React.MouseEvent) => {
    // Verhindere das Sortieren, wenn auf den Tooltip geklickt wird
    e.stopPropagation();
  };
  
  return (
    <TableHead className="cursor-pointer select-none" onClick={handleHeaderClick}>
      <div className="flex items-center space-x-1">
        <span>{name}</span>
        {isCurrentSort && <SortIcon className="h-4 w-4" />}
        {tooltipText && (
          <Popover>
            <PopoverTrigger asChild>
              <Info 
                className="h-4 w-4 text-gray-400 ml-1 cursor-pointer hover:text-gray-600" 
                onClick={handleTooltipClick}
              />
            </PopoverTrigger>
            <PopoverContent className="max-w-sm">
              <p className="text-sm">{tooltipText}</p>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableHead>
  );
};

const QuantAnalysisTable: React.FC<QuantAnalysisTableProps> = ({ 
  results, 
  isLoading 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { watchlists, createWatchlist } = useWatchlists();
  const [filteredResults, setFilteredResults] = useState<QuantAnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('buffettScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showNewWatchlistDialog, setShowNewWatchlistDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<QuantAnalysisResult | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  // Filter and sort the results when they change
  useEffect(() => {
    let filtered = [...results];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(stock => 
        stock.symbol.toLowerCase().includes(term) || 
        stock.name.toLowerCase().includes(term) ||
        stock.sector.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      // Handle different fields for sorting
      switch (sortField) {
        case 'buffettScore':
          valueA = a.buffettScore;
          valueB = b.buffettScore;
          break;
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'symbol':
          valueA = a.symbol;
          valueB = b.symbol;
          break;
        case 'sector':
          valueA = a.sector;
          valueB = b.sector;
          break;
        case 'roe':
          valueA = a.criteria.roe.value || -9999;
          valueB = b.criteria.roe.value || -9999;
          break;
        case 'roic':
          valueA = a.criteria.roic.value || -9999;
          valueB = b.criteria.roic.value || -9999;
          break;
        case 'netMargin':
          valueA = a.criteria.netMargin.value || -9999;
          valueB = b.criteria.netMargin.value || -9999;
          break;
        case 'epsGrowth':
          valueA = a.criteria.epsGrowth.value || -9999;
          valueB = b.criteria.epsGrowth.value || -9999;
          break;
        case 'revenueGrowth':
          valueA = a.criteria.revenueGrowth.value || -9999;
          valueB = b.criteria.revenueGrowth.value || -9999;
          break;
        case 'interestCoverage':
          valueA = a.criteria.interestCoverage.value || -9999;
          valueB = b.criteria.interestCoverage.value || -9999;
          break;
        case 'debtRatio':
          valueA = a.criteria.debtRatio.value || 9999;
          valueB = b.criteria.debtRatio.value || 9999;
          break;
        case 'pe':
          valueA = a.criteria.pe.value || 9999;
          valueB = b.criteria.pe.value || 9999;
          break;
        case 'pb':
          valueA = a.criteria.pb.value || 9999;
          valueB = b.criteria.pb.value || 9999;
          break;
        case 'dividendYield':
          valueA = a.criteria.dividendYield.value || -9999;
          valueB = b.criteria.dividendYield.value || -9999;
          break;
        case 'intrinsicValue':
          valueA = a.criteria.intrinsicValue.value || -9999;
          valueB = b.criteria.intrinsicValue.value || -9999;
          break;
        case 'intrinsicValueWithMargin':
          valueA = a.criteria.intrinsicValueWithMargin.value || -9999;
          valueB = b.criteria.intrinsicValueWithMargin.value || -9999;
          break;
        default:
          valueA = a.buffettScore;
          valueB = b.buffettScore;
      }
      
      // String comparison for text fields
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Numeric comparison for number fields
      return sortDirection === 'asc' 
        ? (valueA as number) - (valueB as number) 
        : (valueB as number) - (valueA as number);
    });
    
    setFilteredResults(filtered);
  }, [results, searchTerm, sortField, sortDirection]);

  // Format a numeric value with optional percentage and decimal places
  const formatValue = (value: number | null, decimals = 2, isPercent = true) => {
    if (value === null) return 'N/A';
    return isPercent 
      ? `${value.toFixed(decimals)}%`
      : value.toFixed(decimals);
  };

  const handleAnalyzeStock = (stock: QuantAnalysisResult) => {
    // Navigate to analyzer with stock symbol
    navigate(`/analyzer?ticker=${stock.symbol}`);
  };

  const handleAddToWatchlist = async (stock: QuantAnalysisResult, watchlistId?: string) => {
    if (!watchlistId) {
      setSelectedStock(stock);
      setShowNewWatchlistDialog(true);
      return;
    }

    try {
      await addStockToWatchlist(
        {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          currency: stock.currency,
        },
        watchlistId
      );

      toast({
        title: "Aktie hinzugefügt",
        description: `${stock.symbol} wurde zur Watchlist hinzugefügt.`,
      });
    } catch (error: any) {
      const message = error.message || "Die Aktie konnte nicht zur Watchlist hinzugefügt werden.";
      toast({
        title: "Fehler",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCreateNewWatchlist = async () => {
    if (!selectedStock || !newWatchlistName.trim()) return;

    try {
      await createWatchlist(newWatchlistName.trim());
      toast({
        title: "Watchlist erstellt",
        description: `Neue Watchlist "${newWatchlistName}" wurde erstellt.`,
      });
      setShowNewWatchlistDialog(false);
      setNewWatchlistName('');
      setSelectedStock(null);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Watchlist konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Buffett Aktienbewertung</h2>
          
          <div className="w-64">
            <Input
              type="text"
              placeholder="Suche nach Aktie oder Sektor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-2">
          {filteredResults.length} Aktien gefunden
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <SortableHeader 
                field="symbol" 
                name="Symbol" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="name" 
                name="Unternehmen" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="sector" 
                name="Sektor" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="buffettScore" 
                name="Buffett Score" 
                tooltipText="Erfüllte Buffett-Kriterien (max. 12 Punkte)"
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="roe" 
                name="ROE" 
                tooltipText={`${metricsDefinitions.roe.definition} Ziel: ${metricsDefinitions.roe.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="roic" 
                name="ROIC" 
                tooltipText={`${metricsDefinitions.roic.definition} Ziel: ${metricsDefinitions.roic.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="netMargin" 
                name="Marge" 
                tooltipText={`${metricsDefinitions.netMargin.definition} Ziel: ${metricsDefinitions.netMargin.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="epsGrowth" 
                name="EPS ↑" 
                tooltipText={`${metricsDefinitions.epsGrowth.definition} Ziel: ${metricsDefinitions.epsGrowth.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="revenueGrowth" 
                name="Umsatz ↑" 
                tooltipText={`${metricsDefinitions.revenueGrowth.definition} Ziel: ${metricsDefinitions.revenueGrowth.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="interestCoverage" 
                name="Zinsdeckung" 
                tooltipText={`${metricsDefinitions.interestCoverage.definition} Ziel: ${metricsDefinitions.interestCoverage.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="debtRatio" 
                name="Schulden %" 
                tooltipText={`${metricsDefinitions.debtRatio.definition} Ziel: ${metricsDefinitions.debtRatio.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader
                field="pe" 
                name="KGV" 
                tooltipText={`${metricsDefinitions.pe.definition} Ziel: ${metricsDefinitions.pe.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="pb" 
                name="KBV" 
                tooltipText={`${metricsDefinitions.pb.definition} Ziel: ${metricsDefinitions.pb.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="dividendYield" 
                name="Div %" 
                tooltipText={`${metricsDefinitions.dividendYield.definition} Ziel: ${metricsDefinitions.dividendYield.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="intrinsicValue" 
                name="Innerer Wert" 
                tooltipText={`${metricsDefinitions.intrinsicValue.definition} Ziel: ${metricsDefinitions.intrinsicValue.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <SortableHeader 
                field="intrinsicValueWithMargin" 
                name="Sicherheit" 
                tooltipText={`${metricsDefinitions.intrinsicValueWithMargin.definition} Ziel: ${metricsDefinitions.intrinsicValueWithMargin.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
              <TableHead>Preis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                    <span>Analyse läuft...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-8">
                  Keine Ergebnisse gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAnalyzeStock(stock)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          In Buffett Analyzer analysieren
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Plus className="mr-2 h-4 w-4" />
                            Zu Watchlist hinzufügen
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {watchlists.map((watchlist) => (
                              <DropdownMenuItem
                                key={watchlist.id}
                                onClick={() => handleAddToWatchlist(stock, watchlist.id)}
                              >
                                {watchlist.name}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAddToWatchlist(stock)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Neue Watchlist erstellen
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>{stock.sector}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{stock.buffettScore}/12</span>
                      <BuffettScoreBadge score={stock.buffettScore} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.roe.pass} value={stock.criteria.roe.value} />
                      <span>{formatValue(stock.criteria.roe.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.roic.pass} value={stock.criteria.roic.value} />
                      <span>{formatValue(stock.criteria.roic.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.netMargin.pass} value={stock.criteria.netMargin.value} />
                      <span>{formatValue(stock.criteria.netMargin.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.epsGrowth.pass} value={stock.criteria.epsGrowth.value} />
                      <span>{formatValue(stock.criteria.epsGrowth.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.revenueGrowth.pass} value={stock.criteria.revenueGrowth.value} />
                      <span>{formatValue(stock.criteria.revenueGrowth.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.interestCoverage.pass} value={stock.criteria.interestCoverage.value} />
                      <span>{formatValue(stock.criteria.interestCoverage.value, 1, false)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.debtRatio.pass} value={stock.criteria.debtRatio.value} />
                      <span>{formatValue(stock.criteria.debtRatio.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.pe.pass} value={stock.criteria.pe.value} />
                      <span>{formatValue(stock.criteria.pe.value, 1, false)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.pb.pass} value={stock.criteria.pb.value} />
                      <span>{formatValue(stock.criteria.pb.value, 1, false)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.dividendYield.pass} value={stock.criteria.dividendYield.value} />
                      <span>{formatValue(stock.criteria.dividendYield.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.intrinsicValue.pass} value={stock.criteria.intrinsicValue.value} />
                      <span className="text-xs">
                        {stock.criteria.intrinsicValue.value !== null ? 
                          `${stock.criteria.intrinsicValue.value.toFixed(2)} vs ${stock.price.toFixed(2)}` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.intrinsicValueWithMargin.pass} value={stock.criteria.intrinsicValueWithMargin.value} />
                      <span className="text-xs">
                        {stock.marginOfSafety !== null ? 
                          `${stock.marginOfSafety.toFixed(1)}%` : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {stock.price?.toFixed(2)} {stock.currency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog for creating new watchlist */}
      <Dialog open={showNewWatchlistDialog} onOpenChange={setShowNewWatchlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Watchlist erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Watchlist für {selectedStock?.symbol} ({selectedStock?.name}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="watchlist-name">Name der Watchlist</Label>
              <Input
                id="watchlist-name"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                placeholder="z.B. Tech-Aktien, Dividenden-Titel..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewWatchlistDialog(false);
                setNewWatchlistName('');
                setSelectedStock(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateNewWatchlist}
              disabled={!newWatchlistName.trim()}
            >
              Watchlist erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuantAnalysisTable;
