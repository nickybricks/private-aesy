
import React from 'react';
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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantAnalysisResult, exportToCsv } from '@/api/quantAnalyzerApi';

interface QuantAnalysisTableProps {
  results: QuantAnalysisResult[];
  isLoading: boolean;
}

const QuantAnalysisTable: React.FC<QuantAnalysisTableProps> = ({ 
  results, 
  isLoading 
}) => {
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

  // Zeige das passende Icon für bestanden/nicht bestanden
  const StatusIcon = ({ passed }: { passed: boolean }) => (
    passed ? 
      <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />
  );

  // Formatiere Zahlenwerte mit Prozent oder Dezimalstellen
  const formatValue = (value: number | null, isPercentage: boolean = false) => {
    if (value === null) return "N/A";
    return isPercentage ? `${value.toFixed(2)}%` : value.toFixed(2);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Analyseergebnisse ({results.length} Aktien)</h2>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Als CSV exportieren
        </Button>
      </div>
      
      <div className="rounded-md border overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Buffett-Score</TableHead>
              <TableHead className="text-right">ROE</TableHead>
              <TableHead className="text-right">ROIC</TableHead>
              <TableHead className="text-right">Nettomarge</TableHead>
              <TableHead className="text-right">KGV</TableHead>
              <TableHead className="text-right">P/B</TableHead>
              <TableHead className="text-right">Preis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((stock) => (
              <TableRow key={stock.symbol}>
                <TableCell className="font-medium">{stock.symbol}</TableCell>
                <TableCell>{stock.name}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                    ${stock.buffettScore >= 7 ? 'bg-green-100 text-green-800' :
                      stock.buffettScore >= 5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {stock.buffettScore}
                  </span>
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-1">
                  {formatValue(stock.criteria.roe.value, true)}
                  <StatusIcon passed={stock.criteria.roe.pass} />
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-1">
                  {formatValue(stock.criteria.roic.value, true)}
                  <StatusIcon passed={stock.criteria.roic.pass} />
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-1">
                  {formatValue(stock.criteria.netMargin.value, true)}
                  <StatusIcon passed={stock.criteria.netMargin.pass} />
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-1">
                  {formatValue(stock.criteria.pe.value)}
                  <StatusIcon passed={stock.criteria.pe.pass} />
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-1">
                  {formatValue(stock.criteria.pb.value)}
                  <StatusIcon passed={stock.criteria.pb.pass} />
                </TableCell>
                <TableCell className="text-right">
                  {stock.price} {stock.currency}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border mb-6">
        <h3 className="font-semibold mb-2">Legende: Buffett-Kriterien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><StatusIcon passed={true} /> ROE (Eigenkapitalrendite) &gt; 15%</div>
          <div><StatusIcon passed={true} /> ROIC (Kapitalrendite) &gt; 10%</div>
          <div><StatusIcon passed={true} /> Nettomarge &gt; 10%</div>
          <div><StatusIcon passed={true} /> Stabiles EPS-Wachstum (positiv)</div>
          <div><StatusIcon passed={true} /> Stabiles Umsatzwachstum (positiv)</div>
          <div><StatusIcon passed={true} /> Zinsdeckungsgrad &gt; 5</div>
          <div><StatusIcon passed={true} /> Schuldenquote &lt; 70%</div>
          <div><StatusIcon passed={true} /> KGV (P/E) &lt; 15</div>
          <div><StatusIcon passed={true} /> P/B &lt; 1.5 (oder &lt; 3 bei starker Marge)</div>
          <div><StatusIcon passed={true} /> Dividendenrendite &gt; 2%</div>
        </div>
      </div>
    </div>
  );
};

export default QuantAnalysisTable;
