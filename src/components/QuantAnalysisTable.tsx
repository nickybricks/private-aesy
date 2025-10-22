
import React, { useState, useEffect, useMemo } from 'react';
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
    name: "ROIC (TTM)",
    definition: "Return on Invested Capital (Trailing Twelve Months) - Quick-Screening Metrik",
    target: "≥ 12%",
    formula: "NOPAT ÷ Investiertes Kapital (TTM)"
  },
  roe: {
    name: "ROE (TTM)",
    definition: "Eigenkapitalrendite (Trailing Twelve Months) - Quick-Screening Metrik",
    target: "≥ 15%",
    formula: "Nettogewinn ÷ Eigenkapital (TTM)"
  },
  dividendYield: {
    name: "Dividende",
    definition: "Dividendenrendite (aktuell)",
    target: "> 2%",
    formula: "Jährliche Dividende ÷ Preis"
  },
  epsGrowth: {
    name: "EPS-Wachstum (5J)",
    definition: "5-Jahres EPS CAGR (Standard-EPS, nicht bereinigt) - Quick-Screening Metrik",
    target: "5-J CAGR ≥ 5% & 3-J Median nicht negativ",
    formula: "Standard-EPS CAGR über 5 Jahre"
  },
  revenueGrowth: {
    name: "Umsatz-Wachstum (5J)",
    definition: "5-Jahres Umsatz CAGR - Quick-Screening Metrik",
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
    name: "Gewinnmarge",
    definition: "Gewinnmarge (Nettomarge)",
    target: "≥ 10%",
    formula: "Nettogewinn ÷ Umsatz"
  },
  fcfMargin: {
    name: "FCF-Marge",
    definition: "Free Cash Flow Marge",
    target: "≥ 8%",
    formula: "FCF ÷ Umsatz"
  }
};

const BuffettScoreBadge = ({ score }: { score: number }) => {
  // Adjusted thresholds for 14-point scale
  // 10-14 = Kandidat, 6-9 = Beobachten, 0-5 = Vermeiden
  if (score >= 10) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Kandidat</Badge>;
  } else if (score >= 6) {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Beobachten</Badge>;
  } else {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Vermeiden</Badge>;
  }
};

// Helper to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const countryMap: { [key: string]: string } = {
    'US': '🇺🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
    'DE': '🇩🇪', 'Germany': '🇩🇪', 'Deutschland': '🇩🇪',
    'GB': '🇬🇧', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
    'FR': '🇫🇷', 'France': '🇫🇷',
    'JP': '🇯🇵', 'Japan': '🇯🇵',
    'CN': '🇨🇳', 'China': '🇨🇳',
    'CA': '🇨🇦', 'Canada': '🇨🇦',
    'CH': '🇨🇭', 'Switzerland': '🇨🇭',
    'NL': '🇳🇱', 'Netherlands': '🇳🇱',
    'IT': '🇮🇹', 'Italy': '🇮🇹',
    'ES': '🇪🇸', 'Spain': '🇪🇸',
    'SE': '🇸🇪', 'Sweden': '🇸🇪',
    'DK': '🇩🇰', 'Denmark': '🇩🇰',
    'NO': '🇳🇴', 'Norway': '🇳🇴',
    'FI': '🇫🇮', 'Finland': '🇫🇮',
    'AU': '🇦🇺', 'Australia': '🇦🇺',
    'IN': '🇮🇳', 'India': '🇮🇳',
    'BR': '🇧🇷', 'Brazil': '🇧🇷',
    'MX': '🇲🇽', 'Mexico': '🇲🇽',
    'KR': '🇰🇷', 'South Korea': '🇰🇷',
    'HK': '🇭🇰', 'Hong Kong': '🇭🇰',
    'SG': '🇸🇬', 'Singapore': '🇸🇬',
    'AT': '🇦🇹', 'Austria': '🇦🇹',
    'BE': '🇧🇪', 'Belgium': '🇧🇪',
    'IE': '🇮🇪', 'Ireland': '🇮🇪',
    'PT': '🇵🇹', 'Portugal': '🇵🇹',
    'PL': '🇵🇱', 'Poland': '🇵🇱',
    'IL': '🇮🇱', 'Israel': '🇮🇱',
    'ZA': '🇿🇦', 'South Africa': '🇿🇦',
  };
  
  return countryMap[countryCode] || '🌐';
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
        <span className="font-medium text-muted-foreground text-left text-xs whitespace-nowrap">{name}</span>
        {isCurrentSort && <SortIcon className="h-3 w-3" />}
        {tooltipText && (
          <Popover>
            <PopoverTrigger asChild>
              <Info 
                className="h-3 w-3 text-gray-400 ml-1 cursor-pointer hover:text-gray-600" 
                onClick={handleTooltipClick}
              />
            </PopoverTrigger>
            <PopoverContent className="max-w-sm">
              <p className="text-xs">{tooltipText}</p>
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
        case 'exchange':
          valueA = a.exchange;
          valueB = b.exchange;
          break;
        case 'sector':
          valueA = a.sector;
          valueB = b.sector;
          break;
        case 'price':
          valueA = a.price;
          valueB = b.price;
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
        case 'epsGrowth3y':
          valueA = a.criteria.epsGrowth.cagr3y || -9999;
          valueB = b.criteria.epsGrowth.cagr3y || -9999;
          break;
        case 'epsGrowth10y':
          valueA = a.criteria.epsGrowth.cagr10y || -9999;
          valueB = b.criteria.epsGrowth.cagr10y || -9999;
          break;
        case 'revenueGrowth':
          valueA = a.criteria.revenueGrowth.value || -9999;
          valueB = b.criteria.revenueGrowth.value || -9999;
          break;
        case 'revenueGrowth3y':
          valueA = a.criteria.revenueGrowth.cagr3y || -9999;
          valueB = b.criteria.revenueGrowth.cagr3y || -9999;
          break;
        case 'revenueGrowth10y':
          valueA = a.criteria.revenueGrowth.cagr10y || -9999;
          valueB = b.criteria.revenueGrowth.cagr10y || -9999;
          break;
        case 'netDebtToEbitda':
          valueA = a.criteria.netDebtToEbitda.value || 9999;
          valueB = b.criteria.netDebtToEbitda.value || 9999;
          break;
        case 'netMargin':
          valueA = a.criteria.netMargin.value || -9999;
          valueB = b.criteria.netMargin.value || -9999;
          break;
        case 'fcfMargin':
          valueA = a.criteria.fcfMargin?.value || -9999;
          valueB = b.criteria.fcfMargin?.value || -9999;
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

  // Paginate results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  }, [sortedResults, currentPage]);

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  // Format a numeric value with optional percentage and decimal places
  const formatValue = (value: number | null | undefined, decimals = 2, isPercent = true) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Aesy Aktienbewertung</h2>
          
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
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Gesamt: {sortedResults.length}</span>
          </div>
          <span>Seite {currentPage} von {totalPages}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
            <TableRow className="h-10">
              <TableHead className="w-12 h-10 py-2 sticky left-0 z-40 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableHead>
              <TableHead className="min-w-[250px] px-4 py-2 h-10 sticky left-12 z-30 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <SortableHeader 
                  field="name" 
                  name="Unternehmen" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="exchange" 
                  name="Börse" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[150px] px-4 py-2 h-10">
                <SortableHeader 
                  field="sector" 
                  name="Sektor" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[150px] px-4 py-2 h-10">
                <SortableHeader 
                  field="buffettScore" 
                  name="Score" 
                  tooltipText="Erfüllte Kriterien (max. 10)"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader
                  field="price" 
                  name="Preis" 
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="yearsOfProfitability" 
                  name="Jahre +" 
                  tooltipText={`${metricsDefinitions.yearsOfProfitability.definition} Ziel: ${metricsDefinitions.yearsOfProfitability.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader
                  field="pe" 
                  name="KGV" 
                  tooltipText={`${metricsDefinitions.pe.definition} Ziel: ${metricsDefinitions.pe.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="roic" 
                  name="ROIC (TTM)" 
                  tooltipText={`${metricsDefinitions.roic.definition} Ziel: ${metricsDefinitions.roic.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="roe" 
                  name="ROE (TTM)" 
                  tooltipText={`${metricsDefinitions.roe.definition} Ziel: ${metricsDefinitions.roe.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="dividendYield" 
                  name="Div %" 
                  tooltipText={`${metricsDefinitions.dividendYield.definition} Ziel: ${metricsDefinitions.dividendYield.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="epsGrowth3y" 
                  name="EPS (3J)" 
                  tooltipText="3-Jahres EPS CAGR - Ziel: ≥ 5%"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="epsGrowth" 
                  name="EPS (5J)" 
                  tooltipText={`${metricsDefinitions.epsGrowth.definition} Ziel: ${metricsDefinitions.epsGrowth.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="epsGrowth10y" 
                  name="EPS (10J)" 
                  tooltipText="10-Jahres EPS CAGR - Ziel: ≥ 5%"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="revenueGrowth3y" 
                  name="Umsatz (3J)" 
                  tooltipText="3-Jahres Umsatz CAGR - Ziel: ≥ 5%"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="revenueGrowth" 
                  name="Umsatz (5J)" 
                  tooltipText={`${metricsDefinitions.revenueGrowth.definition} Ziel: ${metricsDefinitions.revenueGrowth.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[120px] px-4 py-2 h-10">
                <SortableHeader 
                  field="revenueGrowth10y" 
                  name="Umsatz (10J)" 
                  tooltipText="10-Jahres Umsatz CAGR - Ziel: ≥ 5%"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="netDebtToEbitda" 
                  name="Schulden" 
                  tooltipText={`${metricsDefinitions.netDebtToEbitda.definition} Ziel: ${metricsDefinitions.netDebtToEbitda.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="netMargin" 
                  name="Gewinnmarge" 
                  tooltipText={`${metricsDefinitions.netMargin.definition} Ziel: ${metricsDefinitions.netMargin.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
              <TableHead className="min-w-[100px] px-4 py-2 h-10">
                <SortableHeader 
                  field="fcfMargin" 
                  name="FCF-Marge" 
                  tooltipText={`${metricsDefinitions.fcfMargin.definition} Ziel: ${metricsDefinitions.fcfMargin.target}`}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  setSortField={setSortField}
                  setSortDirection={setSortDirection}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={19} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                    <span>Analyse läuft...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={19} className="text-center py-8">
                  Keine Ergebnisse gefunden
                </TableCell>
              </TableRow>
            ) : (
              paginatedResults.map((stock) => (
                <TableRow key={stock.symbol} className="h-10">
                  <TableCell className="py-1 sticky left-0 z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <DropdownMenu>
...
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="py-1 sticky left-12 z-10 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(stock.country)}</span>
                      <span>{stock.name} ({stock.symbol})</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">{stock.exchange}</TableCell>
                  <TableCell className="py-1">{stock.sector}</TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center">
                      <span className="mr-2">{stock.buffettScore}/14</span>
                      <BuffettScoreBadge score={stock.buffettScore} />
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    {stock.price?.toFixed(2)} {stock.currency}
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.yearsOfProfitability.pass} value={stock.criteria.yearsOfProfitability.value} />
                      <span>{stock.criteria.yearsOfProfitability.value !== null ? stock.criteria.yearsOfProfitability.value : 0}/10</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.pe.pass} value={stock.criteria.pe.value} />
                      <span>{formatValue(stock.criteria.pe.value, 1, false)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.roic.pass} value={stock.criteria.roic.value} />
                      <span>{formatValue(stock.criteria.roic.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.roe.pass} value={stock.criteria.roe.value} />
                      <span>{formatValue(stock.criteria.roe.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.dividendYield.pass} value={stock.criteria.dividendYield.value} />
                      <span>{formatValue(stock.criteria.dividendYield.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.epsGrowth.cagr3y !== null && stock.criteria.epsGrowth.cagr3y >= 5} value={stock.criteria.epsGrowth.cagr3y} />
                      <span>{formatValue(stock.criteria.epsGrowth.cagr3y)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.epsGrowth.pass} value={stock.criteria.epsGrowth.value} />
                      <span>{formatValue(stock.criteria.epsGrowth.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.epsGrowth.cagr10y !== null && stock.criteria.epsGrowth.cagr10y >= 5} value={stock.criteria.epsGrowth.cagr10y} />
                      <span>{formatValue(stock.criteria.epsGrowth.cagr10y)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.revenueGrowth.cagr3y !== null && stock.criteria.revenueGrowth.cagr3y >= 5} value={stock.criteria.revenueGrowth.cagr3y} />
                      <span>{formatValue(stock.criteria.revenueGrowth.cagr3y)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.revenueGrowth.pass} value={stock.criteria.revenueGrowth.value} />
                      <span>{formatValue(stock.criteria.revenueGrowth.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.revenueGrowth.cagr10y !== null && stock.criteria.revenueGrowth.cagr10y >= 5} value={stock.criteria.revenueGrowth.cagr10y} />
                      <span>{formatValue(stock.criteria.revenueGrowth.cagr10y)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.netDebtToEbitda.pass} value={stock.criteria.netDebtToEbitda.value} />
                      <span>{formatValue(stock.criteria.netDebtToEbitda.value, 2, false)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.netMargin.pass} value={stock.criteria.netMargin.value} />
                      <span>{formatValue(stock.criteria.netMargin.value)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="flex items-center space-x-1">
                      <StatusIcon passed={stock.criteria.fcfMargin?.pass ?? false} value={stock.criteria.fcfMargin?.value ?? null} />
                      <span>{formatValue(stock.criteria.fcfMargin?.value ?? null)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {!isLoading && sortedResults.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Vorherige
          </Button>
          <span className="text-sm text-muted-foreground">
            Seite {currentPage} von {totalPages} ({sortedResults.length} Aktien)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Nächste
          </Button>
        </div>
      )}

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
