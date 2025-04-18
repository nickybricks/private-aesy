
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
import { Check, AlertTriangle, X, Info, HelpCircle, AlertCircle, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  }
};

const BuffettScoreBadge = ({ score }: { score: number }) => {
  if (score >= 7) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">🟢 Kandidat</Badge>;
  } else if (score >= 5) {
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
  
  return (
    <TableHead className="cursor-pointer select-none" onClick={() => {
      if (isCurrentSort) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
    }}>
      <div className="flex items-center space-x-1">
        <span>{name}</span>
        {isCurrentSort && <SortIcon className="h-4 w-4" />}
        {tooltipText && (
          <Popover>
            <PopoverTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 ml-1 cursor-pointer" />
            </PopoverTrigger>
            <PopoverContent>
              <p className="max-w-xs">{tooltipText}</p>
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
  const [filteredResults, setFilteredResults] = useState<QuantAnalysisResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('buffettScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
                tooltipText="Erfüllte Buffett-Kriterien (max. 10 Punkte)"
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
              <TableHead>Preis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                    <span>Analyse läuft...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  Keine Ergebnisse gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredResults.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell>{stock.sector}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{stock.buffettScore}/10</span>
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
                    {stock.price?.toFixed(2)} {stock.currency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default QuantAnalysisTable;
