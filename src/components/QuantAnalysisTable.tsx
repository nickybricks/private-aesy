
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, AlertTriangle, X, Info, HelpCircle, AlertCircle, CheckCircle2, XCircle, ArrowUp, ArrowDown, MoreHorizontal, TrendingUp, Plus, Download } from 'lucide-react';
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
import { QuantAnalysisResult, exportToExcel } from '@/api/quantAnalyzerApi';
import { useUserStocks } from '@/hooks/useUserStocks';
import { addStockToWatchlist } from '@/utils/watchlistService';

interface QuantAnalysisTableProps {
  results: QuantAnalysisResult[];
  isLoading: boolean;
}

const metricsDefinitions = {
  yearsOfProfitability: {
    name: "Profitabilität",
    definition: "Anzahl profitabler Jahre in den letzten 10 Jahren",
    target: "≥ 8/10 oder ≥ 6/10 + keine Verluste in letzten 3J",
    formula: "Anzahl Jahre mit NetIncome > 0"
  },
  pe: {
    name: "KGV",
    definition: "Kurs-Gewinn-Verhältnis mit Growth-Exception",
    target: "< 20 (Reife) oder > 20 bei Growth-Kriterien",
    formula: "Preis ÷ EPS"
  },
  roic: {
    name: "ROIC",
    definition: "Return on Invested Capital",
    target: "≥ 12%",
    formula: "NOPAT ÷ Investiertes Kapital"
  },
  roe: {
    name: "ROE",
    definition: "Eigenkapitalrendite",
    target: "≥ 15%",
    formula: "Nettogewinn ÷ Eigenkapital"
  },
  dividendYield: {
    name: "Dividende",
    definition: "Dividendenrendite",
    target: "> 2%",
    formula: "Jährliche Dividende ÷ Preis"
  },
  epsGrowth: {
    name: "EPS-Wachstum",
    definition: "5-Jahres EPS CAGR mit Stabilitäts-Check",
    target: "5-J CAGR ≥ 5% & 3-J Median nicht negativ",
    formula: "EPS CAGR über 5 Jahre"
  },
  revenueGrowth: {
    name: "Umsatz-Wachstum",
    definition: "5-Jahres Umsatz CAGR",
    target: "≥ 5%",
    formula: "Umsatz CAGR über 5 Jahre"
  },
  netDebtToEbitda: {
    name: "Verschuldung",
    definition: "Nettoverschuldung zu EBITDA",
    target: "< 2,5",
    formula: "(Total Debt - Cash) ÷ EBITDA"
  },
  netMargin: {
    name: "Nettomarge",
    definition: "Gewinnmarge",
    target: "≥ 10%",
    formula: "Nettogewinn ÷ Umsatz"
  },
  intrinsicValue: {
    name: "Innerer Wert",
    definition: "Geschätzter fairer Wert (nur Info, keine Bewertung)",
    target: "-",
    formula: "Graham + DCF vereinfacht"
  }
};

const BuffettScoreBadge = ({ score }: { score: number }) => {
  if (score >= 7) { // 7-9
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Kandidat</Badge>;
  } else if (score >= 5) { // 5-6
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Beobachten</Badge>;
  } else { // 0-4
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Vermeiden</Badge>;
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
    <div className="cursor-pointer select-none" onClick={handleHeaderClick}>
      <div className="flex items-center space-x-1">
        <span className="font-medium text-muted-foreground text-left">{name}</span>
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
    </div>
  );
};

const QuantAnalysisTable: React.FC<QuantAnalysisTableProps> = ({ 
  results, 
  isLoading 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { watchlists, createWatchlist } = useWatchlists();
  const [sortField, setSortField] = useState('buffettScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showNewWatchlistDialog, setShowNewWatchlistDialog] = useState(false);
  const [selectedStock, setSelectedStock] = useState<QuantAnalysisResult | null>(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  
  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort the results using useMemo for performance
  const sortedResults = useMemo(() => {
    const sorted = [...results];
    
    sorted.sort((a, b) => {
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
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'intrinsicValue':
          valueA = a.intrinsicValue || -9999;
          valueB = b.intrinsicValue || -9999;
          break;
        case 'yearsOfProfitability':
          valueA = a.criteria.yearsOfProfitability.value || -1;
          valueB = b.criteria.yearsOfProfitability.value || -1;
          break;
        case 'pe':
          valueA = a.criteria.pe.value || 9999;
          valueB = b.criteria.pe.value || 9999;
          break;
        case 'roic':
          valueA = a.criteria.roic.value || -9999;
          valueB = b.criteria.roic.value || -9999;
          break;
        case 'roe':
          valueA = a.criteria.roe.value || -9999;
          valueB = b.criteria.roe.value || -9999;
          break;
        case 'dividendYield':
          valueA = a.criteria.dividendYield.value || -9999;
          valueB = b.criteria.dividendYield.value || -9999;
          break;
        case 'epsGrowth':
          valueA = a.criteria.epsGrowth.value || -9999;
          valueB = b.criteria.epsGrowth.value || -9999;
          break;
        case 'revenueGrowth':
          valueA = a.criteria.revenueGrowth.value || -9999;
          valueB = b.criteria.revenueGrowth.value || -9999;
          break;
        case 'netDebtToEbitda':
          valueA = a.criteria.netDebtToEbitda.value || 9999;
          valueB = b.criteria.netDebtToEbitda.value || 9999;
          break;
        case 'netMargin':
          valueA = a.criteria.netMargin.value || -9999;
          valueB = b.criteria.netMargin.value || -9999;
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
    
    return sorted;
  }, [results, sortField, sortDirection]);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: sortedResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  // Format a numeric value with optional percentage and decimal places
  const formatValue = (value: number | null, decimals = 2, isPercent = true) => {
    if (value === null) return 'N/A';
    return isPercent 
      ? `${value.toFixed(decimals)}%`  // Values are already in percentage form from API
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

  const renderRow = (stock: QuantAnalysisResult) => (
    <div className="flex items-center border-b hover:bg-muted/50 transition-colors">
      <div className="w-12 flex items-center justify-center">
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
      </div>
      <div className="min-w-[100px] px-4 py-2 font-medium">{stock.symbol}</div>
      <div className="min-w-[200px] px-4 py-2">{stock.name}</div>
      <div className="min-w-[150px] px-4 py-2">{stock.sector}</div>
      <div className="min-w-[150px] px-4 py-2">
        <div className="flex items-center">
          <span className="mr-2">{stock.buffettScore}/9</span>
          <BuffettScoreBadge score={stock.buffettScore} />
        </div>
      </div>
      <div className="min-w-[120px] px-4 py-2">
        {stock.price?.toFixed(2)} {stock.currency}
      </div>
      <div className="min-w-[120px] px-4 py-2">
        <span>{stock.intrinsicValue ? stock.intrinsicValue.toFixed(2) : 'N/A'}</span>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.yearsOfProfitability.pass} value={stock.criteria.yearsOfProfitability.value} />
          <span>{stock.criteria.yearsOfProfitability.value || 'N/A'}/10</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.pe.pass} value={stock.criteria.pe.value} />
          <span>{formatValue(stock.criteria.pe.value, 1, false)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.roic.pass} value={stock.criteria.roic.value} />
          <span>{formatValue(stock.criteria.roic.value)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.roe.pass} value={stock.criteria.roe.value} />
          <span>{formatValue(stock.criteria.roe.value)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.dividendYield.pass} value={stock.criteria.dividendYield.value} />
          <span>{formatValue(stock.criteria.dividendYield.value)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.epsGrowth.pass} value={stock.criteria.epsGrowth.value} />
          <span>{formatValue(stock.criteria.epsGrowth.value)}</span>
        </div>
      </div>
      <div className="min-w-[120px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.revenueGrowth.pass} value={stock.criteria.revenueGrowth.value} />
          <span>{formatValue(stock.criteria.revenueGrowth.value)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.netDebtToEbitda.pass} value={stock.criteria.netDebtToEbitda.value} />
          <span>{formatValue(stock.criteria.netDebtToEbitda.value, 2, false)}</span>
        </div>
      </div>
      <div className="min-w-[100px] px-4 py-2">
        <div className="flex items-center space-x-1">
          <StatusIcon passed={stock.criteria.netMargin.pass} value={stock.criteria.netMargin.value} />
          <span>{formatValue(stock.criteria.netMargin.value)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full overflow-hidden">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Buffett Aktienbewertung</h2>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => exportToExcel(sortedResults)}
              variant="outline"
              size="sm"
              disabled={sortedResults.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Excel Export
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-2">
          {sortedResults.length} Aktien gefunden
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {/* Table Header */}
        <div className="border-b">
          <div className="flex items-center bg-muted/50">
            <div className="w-12"></div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="symbol" 
                name="Symbol" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[200px] px-4 py-3">
              <SortableHeader 
                field="name" 
                name="Unternehmen" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[150px] px-4 py-3">
              <SortableHeader 
                field="sector" 
                name="Sektor" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[150px] px-4 py-3">
              <SortableHeader 
                field="buffettScore" 
                name="Score" 
                tooltipText="Erfüllte Kriterien (max. 9)"
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[120px] px-4 py-3">
              <SortableHeader
                field="price" 
                name="Preis" 
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[120px] px-4 py-3">
              <SortableHeader 
                field="intrinsicValue" 
                name="Innerer Wert" 
                tooltipText={metricsDefinitions.intrinsicValue.definition}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="yearsOfProfitability" 
                name="Jahre +" 
                tooltipText={`${metricsDefinitions.yearsOfProfitability.definition} Ziel: ${metricsDefinitions.yearsOfProfitability.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader
                field="pe" 
                name="KGV" 
                tooltipText={`${metricsDefinitions.pe.definition} Ziel: ${metricsDefinitions.pe.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="roic" 
                name="ROIC" 
                tooltipText={`${metricsDefinitions.roic.definition} Ziel: ${metricsDefinitions.roic.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="roe" 
                name="ROE" 
                tooltipText={`${metricsDefinitions.roe.definition} Ziel: ${metricsDefinitions.roe.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="dividendYield" 
                name="Div %" 
                tooltipText={`${metricsDefinitions.dividendYield.definition} Ziel: ${metricsDefinitions.dividendYield.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="epsGrowth" 
                name="EPS ↑" 
                tooltipText={`${metricsDefinitions.epsGrowth.definition} Ziel: ${metricsDefinitions.epsGrowth.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[120px] px-4 py-3">
              <SortableHeader 
                field="revenueGrowth" 
                name="Umsatz ↑" 
                tooltipText={`${metricsDefinitions.revenueGrowth.definition} Ziel: ${metricsDefinitions.revenueGrowth.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="netDebtToEbitda" 
                name="Schulden" 
                tooltipText={`${metricsDefinitions.netDebtToEbitda.definition} Ziel: ${metricsDefinitions.netDebtToEbitda.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
            <div className="min-w-[100px] px-4 py-3">
              <SortableHeader 
                field="netMargin" 
                name="Marge" 
                tooltipText={`${metricsDefinitions.netMargin.definition} Ziel: ${metricsDefinitions.netMargin.target}`}
                sortField={sortField}
                sortDirection={sortDirection}
                setSortField={setSortField}
                setSortDirection={setSortDirection}
              />
            </div>
          </div>
        </div>

        {/* Virtualized Table Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin mb-2"></div>
            <span>Analyse läuft...</span>
          </div>
        ) : sortedResults.length === 0 ? (
          <div className="text-center py-8">
            Keine Ergebnisse gefunden
          </div>
        ) : (
          <div
            ref={parentRef}
            className="h-[600px] overflow-auto"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {renderRow(sortedResults[virtualRow.index])}
                </div>
              ))}
            </div>
          </div>
        )}
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
