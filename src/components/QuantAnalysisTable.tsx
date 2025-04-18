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
import { Check, AlertTriangle, X, Info, HelpCircle } from 'lucide-react';
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

const SortableHeader = ({ field, name, tooltipText }: { field: string, name: string, tooltipText?: string }) => {
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
  // ... keep existing code (rest of the component implementation)
};

export default QuantAnalysisTable;
