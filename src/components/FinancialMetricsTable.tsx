import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStock } from '@/context/StockContext';
import { formatCurrency } from '@/utils/currencyConverter';

const FinancialMetricsTable: React.FC = () => {
  const { stockInfo, financialMetrics } = useStock();

  if (!stockInfo || !financialMetrics) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Keine Finanzdaten verfügbar. Bitte suchen Sie nach einem Unternehmen.
        </p>
      </Card>
    );
  }

  const currency = stockInfo.currency || 'USD';

  // Helper function to format numbers
  const formatNumber = (value: number | undefined, suffix: string = '', decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return value.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
  };

  // Helper function to format currency values
  const formatCurrencyValue = (value: number | undefined, inBillions: boolean = false): string => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    
    if (inBillions) {
      return `${(value / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}Mrd.`;
    }
    
    if (value > 1000000000) {
      return `${(value / 1000000000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}Mrd.`;
    } else if (value > 1000000) {
      return `${(value / 1000000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}Mio.`;
    }
    
    return formatNumber(value);
  };

  // Extract metrics from financialMetrics
  const metrics = financialMetrics.metrics || [];
  
  // Find specific metrics by name
  const findMetric = (name: string) => {
    return metrics.find(m => m.name.includes(name));
  };

  const roeMetric = findMetric('ROE');
  const roicMetric = findMetric('ROIC');
  const netMarginMetric = findMetric('Nettomarge');
  const epsMetric = findMetric('Gewinn pro Aktie');
  const epsGrowthMetric = findMetric('EPS-Wachstum');
  const freeCashflowMetric = findMetric('Freier Cashflow');
  const currentRatioMetric = findMetric('Current Ratio');
  const debtToEbitdaMetric = findMetric('Schulden zu EBITDA');

  // Placeholder values (these would need to be fetched from API in a real implementation)
  const fiscalYearEnd = "N/A";
  const lastQuarter = "N/A";
  const operatingMargin = "N/A";
  const roa = "N/A";
  const revenue = "N/A";
  const revenuePerShare = "N/A";
  const quarterlyRevenueGrowth = "N/A";
  const grossProfit = "N/A";
  const ebitda = "N/A";
  const netIncome = "N/A";
  const eps = epsMetric?.value !== 'N/A' ? formatNumber(Number(epsMetric?.value), '', 2) : "N/A";
  const quarterlyEarningsGrowth = "N/A";
  const totalCash = "N/A";
  const cashPerShare = "N/A";
  const totalDebt = "N/A";
  const debtToEquity = "N/A";
  const currentRatio = currentRatioMetric?.value !== 'N/A' ? formatNumber(Number(currentRatioMetric?.value), '×', 2) : "N/A";
  const bookValuePerShare = "N/A";
  const operatingCashflow = "N/A";
  const freeCashflow = freeCashflowMetric?.value !== 'N/A' ? formatCurrencyValue(Number(freeCashflowMetric?.value)) : "N/A";

  const sections = [
    {
      title: "Geschäftsjahr",
      rows: [
        { label: "Geschäftsjahresende", value: fiscalYearEnd },
        { label: "Letztes Quartal (mrq)", value: lastQuarter },
      ]
    },
    {
      title: "Rentabilität",
      rows: [
        { 
          label: "Gewinnspanne", 
          value: netMarginMetric?.value !== 'N/A' 
            ? formatNumber(Number(netMarginMetric?.value) * 100, '%', 2) 
            : "N/A" 
        },
        { label: "Operative Marge (ttm)", value: operatingMargin },
      ]
    },
    {
      title: "Management-Effizienz",
      rows: [
        { label: "Kapitalrentabilität (ttm)", value: roa },
        { 
          label: "Eigenkapitalrendite (ttm)", 
          value: roeMetric?.value !== 'N/A' 
            ? formatNumber(Number(roeMetric?.value) * 100, '%', 2) 
            : "N/A" 
        },
      ]
    },
    {
      title: "GuV",
      rows: [
        { label: "Umsatz (ttm)", value: revenue },
        { label: "Umsatz pro Aktie (ttm)", value: revenuePerShare },
        { label: "Vierteljährliches Umsatzwachstum (yoy)", value: quarterlyRevenueGrowth },
        { label: "Bruttoergebnis vom Umsatz (ttm)", value: grossProfit },
        { label: "EBITDA", value: ebitda },
        { label: "Auf Stammaktien entfallender Jahresüberschuss (ttm)", value: netIncome },
        { label: "EPS (diluted) (ttm)", value: eps },
        { label: "Vierteljährliches Gewinnwachstum (yoy)", value: quarterlyEarningsGrowth },
      ]
    },
    {
      title: "Bilanz",
      rows: [
        { label: "Cash (gesamt) (mrq)", value: totalCash },
        { label: "Cash (gesamt) pro Aktie (mrq)", value: cashPerShare },
        { label: "Schulden (gesamt) (mrq)", value: totalDebt },
        { label: "Schulden/Equity (gesamt) (mrq)", value: debtToEquity },
        { label: "Aktuelles Verhältnis (mrq)", value: currentRatio },
        { label: "Buchwert je Aktie (mrq)", value: bookValuePerShare },
      ]
    },
    {
      title: "Cashflow-Aufstellung",
      rows: [
        { label: "Cashflow aus betrieblichen Tätigkeiten (ttm)", value: operatingCashflow },
        { label: "Freier Cashflow nach Zinsen und Dividenden (ttm)", value: freeCashflow },
      ]
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Erweiterte Finanzkennzahlen</h2>
      
      <div className="space-y-8">
        {sections.map((section, index) => (
          <div key={index}>
            <h3 className="text-lg font-semibold mb-3 text-primary">{section.title}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Kennzahl</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {section.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right">{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Hinweis:</strong> Die meisten Werte sind derzeit Platzhalter und werden in einer zukünftigen Version 
          mit echten Daten aus der API gefüllt.
        </p>
      </div>
    </Card>
  );
};

export default FinancialMetricsTable;
