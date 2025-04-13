import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Info,
  Search,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QuantAnalysisResult, exportToCsv } from '@/api/quantAnalyzerApi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const QuantAnalysisTable: React.FC<QuantAnalysisTableProps> = ({ 
  results, 
  isLoading 
}) => {
  const [sortField, setSortField] = useState<string>("buffettScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [minScore, setMinScore] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState<QuantAnalysisResult[]>([]);
  
  useEffect(() => {
    if (results.length === 0) {
      setFilteredResults([]);
      return;
    }

    const sortedData = [...results].sort((a, b) => {
      const getNestedValue = (obj: any, path: string) => {
        const parts = path.split('.');
        let value = obj;
        for (const part of parts) {
          if (value === null || value === undefined) return null;
          value = value[part];
          if (part.endsWith('value') && (value === null || value === undefined)) return null;
        }
        return value;
      };

      let valueA = getNestedValue(a, sortField);
      let valueB = getNestedValue(b, sortField);
      
      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return 1;
      if (valueB === null) return -1;
      
      return sortDirection === "asc" 
        ? (valueA < valueB ? -1 : valueA > valueB ? 1 : 0)
        : (valueA > valueB ? -1 : valueA < valueB ? 1 : 0);
    });

    let filtered = sortedData.filter(result => result.buffettScore >= minScore);
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        stock => stock.symbol.toLowerCase().includes(term) || 
                stock.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredResults(filtered);
  }, [results, sortField, sortDirection, minScore, searchTerm]);
  
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-buffett-blue rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Analysiere Aktien nach Buffett-Kriterien...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
        <h3 className="text-lg font-semibold mb-2">Keine Analyseergebnisse</h3>
        <p className="text-gray-600">
          Wählen Sie eine Börse aus und klicken Sie auf "Analysieren", um Aktien nach Buffett-Kriterien zu bewerten.
        </p>
      </div>
    );
  }

  const handleExport = () => {
    exportToCsv(results);
  };

  const StatusIcon = ({ passed, value }: { passed: boolean, value: number | null }) => {
    if (value === null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span><AlertCircle className="h-5 w-5 text-gray-400" /></span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keine Daten verfügbar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return passed ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const formatValue = (value: number | null, isPercentage: boolean = false) => {
    if (value === null) return "N/A";
    return isPercentage ? `${value.toFixed(2)}%` : value.toFixed(2);
  };

  const SortableHeader = ({ 
    field, 
    name, 
    tooltipText 
  }: { 
    field: string, 
    name: string, 
    tooltipText?: string 
  }) => {
    const isCurrentSort = sortField === field;
    const icon = sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
    
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
          {isCurrentSort && icon}
          {tooltipText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableHead>
    );
  };

  const getPassedCriteriaList = (stock: QuantAnalysisResult) => {
    const criteria = [
      { name: "ROE > 15%", passed: stock.criteria.roe.pass },
      { name: "ROIC > 10%", passed: stock.criteria.roic.pass },
      { name: "Nettomarge > 10%", passed: stock.criteria.netMargin.pass },
      { name: "EPS-Wachstum positiv", passed: stock.criteria.epsGrowth.pass },
      { name: "Umsatzwachstum positiv", passed: stock.criteria.revenueGrowth.pass },
      { name: "Zinsdeckungsgrad > 5", passed: stock.criteria.interestCoverage.pass },
      { name: "Schuldenquote < 70%", passed: stock.criteria.debtRatio.pass },
      { name: "KGV < 15", passed: stock.criteria.pe.pass },
      { name: "P/B < 1.5 oder < 3 bei Moat", passed: stock.criteria.pb.pass },
      { name: "Dividendenrendite > 2%", passed: stock.criteria.dividendYield.pass }
    ];
    
    return (
      <div className="space-y-1 p-1">
        <h4 className="font-semibold text-sm mb-2">Erfüllte Buffett-Kriterien:</h4>
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            {criterion.passed ? 
              <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />}
            <span className={criterion.passed ? "" : "text-gray-500"}>{criterion.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const getStockUrl = (symbol: string) => {
    return `https://finance.yahoo.com/quote/${symbol}`;
  };

  const getProfileUrl = (symbol: string) => {
    return `https://financialmodelingprep.com/financial-summary/${symbol}`;
  };

  const scoreFilterOptions = [0, 5, 6, 7, 8, 9];

  return (
    <div>
      <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
        <div className="flex items-center space-x-2 mb-1">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="font-medium">Buffett-Score Bewertung:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800">🟢 Kandidat</Badge>
            <span>Score 7-10</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800">🟡 Beobachten</Badge>
            <span>Score 5-6</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-100 text-red-800">🔴 Vermeiden</Badge>
            <span>Score &lt;5</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">Analyseergebnisse ({filteredResults.length} von {results.length} Aktien)</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex flex-1 items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Symbol oder Name suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="min-score" className="text-sm whitespace-nowrap">Min. Score:</label>
            <select 
              id="min-score"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="rounded border px-2 py-1 text-sm"
            >
              {scoreFilterOptions.map(score => (
                <option key={score} value={score}>
                  {score === 0 ? 'Alle' : `≥ ${score}`}
                </option>
              ))}
            </select>
          </div>
          
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Als CSV exportieren
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="symbol" name="Symbol" />
                <SortableHeader field="name" name="Name" />
                <SortableHeader 
                  field="buffettScore" 
                  name="Score" 
                  tooltipText="Buffett-Score: Je höher, desto mehr Buffett-Kriterien werden erfüllt (max. 10)"
                />
                <SortableHeader 
                  field="criteria.roe.value" 
                  name="ROE" 
                  tooltipText={`${metricsDefinitions.roe.definition} Ziel: ${metricsDefinitions.roe.target}`}
                />
                <SortableHeader 
                  field="criteria.roic.value" 
                  name="ROIC" 
                  tooltipText={`${metricsDefinitions.roic.definition} Ziel: ${metricsDefinitions.roic.target}`}
                />
                <SortableHeader 
                  field="criteria.netMargin.value" 
                  name="Nettomarge" 
                  tooltipText={`${metricsDefinitions.netMargin.definition} Ziel: ${metricsDefinitions.netMargin.target}`}
                />
                <SortableHeader 
                  field="criteria.epsGrowth.value" 
                  name="EPS-Wachst."
                  tooltipText={`${metricsDefinitions.epsGrowth.definition} Ziel: ${metricsDefinitions.epsGrowth.target}`}
                />
                <SortableHeader 
                  field="criteria.revenueGrowth.value" 
                  name="Umsatz-Wachst." 
                  tooltipText={`${metricsDefinitions.revenueGrowth.definition} Ziel: ${metricsDefinitions.revenueGrowth.target}`}
                />
                <SortableHeader 
                  field="criteria.pe.value" 
                  name="KGV" 
                  tooltipText={`${metricsDefinitions.pe.definition} Ziel: ${metricsDefinitions.pe.target}`}
                />
                <SortableHeader 
                  field="criteria.pb.value" 
                  name="P/B" 
                  tooltipText={`${metricsDefinitions.pb.definition} Ziel: ${metricsDefinitions.pb.target}`}
                />
                <SortableHeader 
                  field="criteria.dividendYield.value" 
                  name="Div-Rendite" 
                  tooltipText={`${metricsDefinitions.dividendYield.definition} Ziel: ${metricsDefinitions.dividendYield.target}`}
                />
                <SortableHeader field="price" name="Preis" />
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell className="font-medium">
                    <a href={getStockUrl(stock.symbol)} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600">
                      {stock.symbol}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {stock.name}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{stock.name}</p>
                          <a 
                            href={getProfileUrl(stock.symbol)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 flex items-center mt-1 hover:underline"
                          >
                            Weitere Informationen
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                            ${stock.buffettScore >= 7 ? 'bg-green-100 text-green-800' :
                              stock.buffettScore >= 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}>
                            {stock.buffettScore}
                          </span>
                          <BuffettScoreBadge score={stock.buffettScore} />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        {getPassedCriteriaList(stock)}
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.roe.value, true)}
                      <StatusIcon passed={stock.criteria.roe.pass} value={stock.criteria.roe.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.roic.value, true)}
                      <StatusIcon passed={stock.criteria.roic.pass} value={stock.criteria.roic.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.netMargin.value, true)}
                      <StatusIcon passed={stock.criteria.netMargin.pass} value={stock.criteria.netMargin.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.epsGrowth.value, true)}
                      <StatusIcon passed={stock.criteria.epsGrowth.pass} value={stock.criteria.epsGrowth.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.revenueGrowth.value, true)}
                      <StatusIcon passed={stock.criteria.revenueGrowth.pass} value={stock.criteria.revenueGrowth.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.pe.value)}
                      <StatusIcon passed={stock.criteria.pe.pass} value={stock.criteria.pe.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.pb.value)}
                      <StatusIcon passed={stock.criteria.pb.pass} value={stock.criteria.pb.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {formatValue(stock.criteria.dividendYield.value, true)}
                      <StatusIcon passed={stock.criteria.dividendYield.pass} value={stock.criteria.dividendYield.value} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {stock.price.toFixed(2)} {stock.currency}
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Mehr Optionen</span>
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-3">
                          <h4 className="font-medium">{stock.name} ({stock.symbol})</h4>
                          <div className="grid gap-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Buffett-Score:</span>
                              <span className="font-medium">{stock.buffettScore}/10</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Bewertung:</span>
                              <BuffettScoreBadge score={stock.buffettScore} />
                            </div>
                          </div>
                          <div className="pt-2">
                            {getPassedCriteriaList(stock)}
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                            <a 
                              href={getStockUrl(stock.symbol)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              Yahoo Finance
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            <a 
                              href={getProfileUrl(stock.symbol)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              FMP Profil
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <h3 className="font-semibold mb-2">Legende: Buffett-Kriterien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> ROE (Eigenkapitalrendite) &gt; 15%</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> ROIC (Kapitalrendite) &gt; 10%</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Nettomarge &gt; 10%</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Stabiles EPS-Wachstum (positiv)</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Stabiles Umsatzwachstum (positiv)</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Zinsdeckungsgrad &gt; 5</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Schuldenquote &lt; 70%</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> KGV (P/E) &lt; 15</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> P/B &lt; 1.5 (oder &lt; 3 bei starker Marge)</div>
          <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" /> Dividendenrendite &gt; 2%</div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span>
              "N/A" zeigt an, dass ein Datenpunkt fehlt und daher nicht in die Bewertung eingeflossen ist.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantAnalysisTable;
