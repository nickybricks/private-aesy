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
import { Check, AlertTriangle, X, Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  formatCurrency, 
  shouldConvertCurrency,
  getCurrencyDecimalPlaces,
  formatScaledNumber,
  needsCurrencyConversion
} from '@/utils/currencyConverter';

interface FinancialMetric {
  name: string;
  value: number | string;
  formula: string;
  explanation: string;
  threshold: string;
  status: 'pass' | 'warning' | 'fail';
  originalValue?: number | string;
  originalCurrency?: string;
  isPercentage?: boolean;
  isMultiplier?: boolean;
}

interface HistoricalDataItem {
  year: string;
  value: number;
  originalValue?: number;
  originalCurrency?: string;
}

interface FinancialMetricsProps {
  metrics: FinancialMetric[] | null;
  historicalData: {
    revenue: HistoricalDataItem[];
    earnings: HistoricalDataItem[];
    eps: HistoricalDataItem[];
  } | null;
  currency?: string;
}

const getMetricDetailedExplanation = (metricName: string) => {
  const explanations: Record<string, { 
    whatItIs: string, 
    howCalculated: string,
    whyImportant: string,
    buffettGuideline: string,
    goodValue: string
  }> = {
    "ROE (Eigenkapitalrendite)": {
      whatItIs: "Return on Equity - Die Rendite auf das eingesetzte Eigenkapital",
      howCalculated: "Jahresüberschuss ÷ Eigenkapital × 100",
      whyImportant: "Zeigt, wie effizient das Unternehmen Kapital der Aktionäre in Gewinn umwandelt",
      buffettGuideline: "Buffett sucht nach Unternehmen mit konstant hoher ROE über viele Jahre",
      goodValue: "Über 15% ist hervorragend, 10-15% gut, unter 10% unterdurchschnittlich"
    },
    "ROIC (Kapitalrendite)": {
      whatItIs: "Return on Invested Capital - Die Rendite auf das gesamte investierte Kapital",
      howCalculated: "NOPAT ÷ (Eigenkapital + Finanzverbindlichkeiten)",
      whyImportant: "Misst die Effizienz des Gesamtkapitals und ist weniger durch Verschuldung beeinflussbar als ROE",
      buffettGuideline: "Buffett bevorzugt Unternehmen mit ROIC > 12%, idealerweise über viele Jahre",
      goodValue: "Über 12% ist hervorragend, 8-12% gut, unter 8% unterdurchschnittlich"
    },
    "Nettomarge": {
      whatItIs: "Der Anteil des Umsatzes, der als Gewinn übrig bleibt",
      howCalculated: "Jahresüberschuss ÷ Umsatz × 100",
      whyImportant: "Höhere Margen deuten auf einen stärkeren Wettbewerbsvorteil (Burggraben) hin",
      buffettGuideline: "Buffett sucht nach Unternehmen mit stabilen oder steigenden Margen",
      goodValue: "Über 15% ist hervorragend, 10-15% gut, 5-10% durchschnittlich"
    },
    "Gewinn pro Aktie": {
      whatItIs: "Der auf eine einzelne Aktie entfallende Unternehmensgewinn (EPS)",
      howCalculated: "Jahresüberschuss ÷ Anzahl ausstehender Aktien",
      whyImportant: "Zeigt, wie profitabel das Unternehmen pro Aktie ist und ist Basis für KGV-Berechnung",
      buffettGuideline: "Buffett sucht stabiles oder steigendes EPS über viele Jahre",
      goodValue: "Die absolute Höhe ist weniger wichtig als das kontinuierliche Wachstum"
    },
    "Schulden zu EBITDA": {
      whatItIs: "Verhältnis der Gesamtverschuldung zum operativen Ergebnis vor Zinsen, Steuern und Abschreibungen",
      howCalculated: "Gesamtverschuldung ÷ EBITDA",
      whyImportant: "Zeigt, wie viele Jahre das Unternehmen brauchen würde, um seine Schulden aus dem operativen Ergebnis zurückzuzahlen",
      buffettGuideline: "Buffett bevorzugt Unternehmen mit niedriger Verschuldung",
      goodValue: "Unter 1,0 ist hervorragend, 1,0-2,0 gut, 2,0-3,0 akzeptabel, über 3,0 bedenklich"
    },
    "KGV (Kurs-Gewinn-Verhältnis)": {
      whatItIs: "Das Verhältnis zwischen Aktienkurs und Gewinn pro Aktie",
      howCalculated: "Aktienkurs ÷ Gewinn pro Aktie",
      whyImportant: "Zeigt, wie teuer eine Aktie im Verhältnis zu ihrem Gewinn ist",
      buffettGuideline: "Buffett bevorzugt ein niedriges KGV, idealerweise unter 15",
      goodValue: "Unter 12 günstig, 12-20 fair, über 20 teuer (abhängig von Branche und Wachstumsrate)"
    },
    "P/B (Kurs-Buchwert-Verhältnis)": {
      whatItIs: "Das Verhältnis zwischen Aktienkurs und Buchwert pro Aktie",
      howCalculated: "Aktienkurs ÷ Buchwert pro Aktie",
      whyImportant: "Zeigt, wie teuer eine Aktie im Verhältnis zu ihrem Buchwert ist",
      buffettGuideline: "Buffett bevorzugt ein P/B nahe 1, maximal 1,5",
      goodValue: "Unter 1,0 potenziell unterbewertet, 1,0-3,0 fair, über 3,0 teuer"
    },
    "Dividendenrendite": {
      whatItIs: "Die jährliche Dividende im Verhältnis zum Aktienkurs",
      howCalculated: "Jährliche Dividende pro Aktie ÷ Aktienkurs × 100",
      whyImportant: "Zeigt, wie viel Prozent des Aktienkurses als Dividende ausgeschüttet wird",
      buffettGuideline: "Buffett bevorzugt stabile oder steigende Dividenden, aber nicht zu hohe Ausschüttungen",
      goodValue: "2-4% ist solide, über 4% kann auf Unterbewertung oder Probleme hindeuten"
    },
    "Freier Cashflow": {
      whatItIs: "Der Bargeldüberschuss, der nach allen operativen Ausgaben und Investitionen übrig bleibt",
      howCalculated: "Operativer Cashflow − Investitionsausgaben",
      whyImportant: "Zeigt die tatsächliche Fähigkeit, Bargeld zu generieren, das für Dividenden, Aktienrückkäufe oder Schuldenabbau verwendet werden kann",
      buffettGuideline: "Buffett bevorzugt Unternehmen mit stabilem oder wachsendem freiem Cashflow",
      goodValue: "Positiv und idealerweise steigend über die Jahre"
    }
  };
  
  return explanations[metricName];
};

const MetricStatus: React.FC<{ status: 'pass' | 'warning' | 'fail' | 'positive' | 'negative' }> = ({ status }) => {
  switch (status) {
    case 'pass':
    case 'positive':
      return (
        <div className="flex items-center gap-1">
          <Check className="text-buffett-green h-4 w-4" />
          <span className="text-buffett-green font-medium">Erfüllt</span>
        </div>
      );
    case 'warning':
      return (
        <div className="flex items-center gap-1">
          <AlertTriangle className="text-buffett-yellow h-4 w-4" />
          <span className="text-buffett-yellow font-medium">Bedingt erfüllt</span>
        </div>
      );
    case 'fail':
    case 'negative':
      return (
        <div className="flex items-center gap-1">
          <X className="text-buffett-red h-4 w-4" />
          <span className="text-buffett-red font-medium">Nicht erfüllt</span>
        </div>
      );
    default:
      return null;
  }
};

const MetricCard: React.FC<{ metric: FinancialMetric; currency: string }> = ({ metric, currency }) => {
  const { name, value, formula, explanation, threshold, status, originalValue, originalCurrency, isPercentage, isMultiplier } = metric;
  
  const isValueMissing = value === 'N/A' || 
                         (typeof value === 'string' && (value.includes('N/A') || value === '0.00' || value === '0.00%')) ||
                         (typeof value === 'number' && (value === 0 || isNaN(value))) ||
                         value === undefined || 
                         value === null;
  
  const displayValue = isValueMissing ? 'Keine Daten' : value;
  const detailedExplanation = getMetricDetailedExplanation(name);
  
  let cleanedDisplayValue = displayValue;
  
  if (!isValueMissing) {
    if (metric.isPercentage) {
      cleanedDisplayValue = typeof displayValue === 'number' 
        ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`
        : displayValue;
    } else if (metric.isMultiplier) {
      cleanedDisplayValue = typeof displayValue === 'number'
        ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x`
        : displayValue;
    } else if (originalCurrency && originalValue && needsCurrencyConversion(originalCurrency)) {
      cleanedDisplayValue = formatCurrency(
        value, 
        currency, 
        true, 
        originalValue, 
        originalCurrency,
        metric.isPercentage,
        metric.isMultiplier
      );
    } else {
      cleanedDisplayValue = formatCurrency(
        displayValue, 
        currency,
        false,
        undefined,
        undefined,
        metric.isPercentage,
        metric.isMultiplier
      );
    }
  }
  
  return (
    <Card className="metric-card p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-medium">{name}</h3>
        
        {detailedExplanation && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Info size={14} className="text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">{name}</h4>
                  <p>{detailedExplanation.whatItIs}</p>
                  
                  <div className="space-y-1 pt-2">
                    <p><span className="font-medium">Berechnung:</span> {detailedExplanation.howCalculated}</p>
                    <p><span className="font-medium">Warum wichtig:</span> {detailedExplanation.whyImportant}</p>
                    <p><span className="font-medium">Buffett-Maßstab:</span> {detailedExplanation.buffettGuideline}</p>
                    <p><span className="font-medium">Gute Werte:</span> {detailedExplanation.goodValue}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="text-2xl font-semibold mb-2">{cleanedDisplayValue}</div>
      
      <div className="text-sm text-buffett-subtext mb-1">
        <span className="font-medium">Formel:</span> {formula}
      </div>
      
      <p className="text-sm mb-3">{explanation}</p>
      
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-medium">Buffett-Schwelle:</span> {threshold}
        </div>
        {!isValueMissing ? (
          <MetricStatus status={status} />
        ) : (
          <span className="text-gray-500 font-medium">Nicht bewertbar</span>
        )}
      </div>
    </Card>
  );
};

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData, currency = 'EUR' }) => {
  if (!metrics) return null;
  
  const metricsArray = Array.isArray(metrics) ? metrics.map(metric => {
    const isRatio = metric.name.includes('ROE') || 
                    metric.name.includes('ROIC') || 
                    metric.name.includes('Marge') || 
                    metric.name.includes('Rendite') || 
                    metric.name.includes('Wachstum') ||
                    metric.name.includes('zu EBITDA') ||
                    metric.name.includes('zu Vermögen') ||
                    metric.name.includes('Schulden') ||
                    metric.name.includes('Zinsdeckungsgrad') ||
                    metric.name.includes('Deckungsgrad') ||
                    metric.name.includes('quote');
    
    return {
      ...metric,
      isRatio
    };
  }) : [];
  
  const decimalPlaces = getCurrencyDecimalPlaces(currency);
  
  const hasConvertedMetrics = metricsArray.some(
    metric => metric.originalCurrency && metric.originalCurrency !== currency
  );
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Finanzkennzahlen</h2>
      
      {hasConvertedMetrics && (
        <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-700">Währungshinweis</h3>
              <p className="text-yellow-600 text-sm">
                Einige Finanzdaten werden in einer anderen Währung berichtet als der Aktienkurs ({currency}).
                Diese Werte wurden in {currency} umgerechnet, um eine korrekte Analyse zu ermöglichen.
                Die Originalwerte werden in Klammern angezeigt.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricsArray.map((metric, index) => (
          <MetricCard key={index} metric={metric} currency={currency} />
        ))}
      </div>
      
      {historicalData && historicalData.revenue && historicalData.revenue.length > 0 && (
        <Card className="buffett-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Finanzielle Entwicklung (10 Jahre)</h3>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                    <HelpCircle size={16} className="text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <div className="space-y-2">
                    <p className="font-medium">Warum diese Daten wichtig sind:</p>
                    <p>Warren Buffett analysiert die finanzielle Entwicklung über mindestens 10 Jahre, 
                       um langfristige Trends und die Beständigkeit des Geschäftsmodells zu bewerten.</p>
                    <p className="mt-1">Besonders achtet er auf:</p>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      <li>Stabiles Umsatzwachstum</li>
                      <li>Steigende Gewinne</li>
                      <li>Kontinuierlichen Anstieg des Gewinns pro Aktie</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jahr</TableHead>
                <TableHead className="text-right">Umsatz</TableHead>
                <TableHead className="text-right">Gewinn</TableHead>
                <TableHead className="text-right">EPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalData.revenue.map((item, i) => {
                const epsDataForYear = historicalData.eps && historicalData.eps.find(e => e.year === item.year);
                const earningsDataForYear = historicalData.earnings && historicalData.earnings.find(e => e.year === item.year);
                
                let revenueValue = item.value;
                let earningsValue = earningsDataForYear?.value;
                let epsValue = epsDataForYear?.value;
                
                const originalRevenueValue = item.originalValue || item.value;
                const originalEarningsValue = earningsDataForYear?.originalValue || earningsDataForYear?.value;
                const originalEpsValue = epsDataForYear?.originalValue || epsDataForYear?.value;
                
                const showOriginal = item.originalValue && item.originalValue !== item.value;
                
                return (
                  <TableRow key={item.year || i}>
                    <TableCell>{item.year || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {typeof revenueValue === 'number' && revenueValue !== 0 
                        ? (showOriginal 
                           ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted cursor-help">
                                      {formatScaledNumber(revenueValue, currency)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Originalwert: {formatScaledNumber(originalRevenueValue, item.originalCurrency || currency)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                           : formatScaledNumber(revenueValue, currency))
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {earningsValue && 
                      typeof earningsValue === 'number' && 
                      earningsValue !== 0
                        ? (earningsDataForYear?.originalValue && earningsDataForYear.originalValue !== earningsValue
                           ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted cursor-help">
                                      {formatScaledNumber(earningsValue, currency)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Originalwert: {formatScaledNumber(originalEarningsValue, earningsDataForYear.originalCurrency || currency)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                           : formatScaledNumber(earningsValue, currency))
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {epsValue && 
                      typeof epsValue === 'number' && 
                      epsValue !== 0
                        ? (epsDataForYear?.originalValue && epsDataForYear.originalValue !== epsValue
                           ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="underline decoration-dotted cursor-help">
                                      {epsValue.toFixed(decimalPlaces)} {currency}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Originalwert: {originalEpsValue.toLocaleString('de-DE', {
                                      maximumFractionDigits: getCurrencyDecimalPlaces(epsDataForYear.originalCurrency || currency)
                                    })} {epsDataForYear.originalCurrency || currency}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                           : `${epsValue.toFixed(decimalPlaces)} ${currency}`)
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="mt-4 text-sm text-buffett-subtext">
            <p>Hinweis: 'N/A' bedeutet, dass keine Daten verfügbar sind.</p>
            {hasConvertedMetrics && (
              <p className="mt-2 font-medium text-buffett-subtext">
                Diese Werte wurden in {currency} umgerechnet, um eine bessere Vergleichbarkeit zu gewährleisten.
              </p>
            )}
            <p className="mt-2">
              <span className="font-medium">EPS (Earnings Per Share):</span> Der Gewinn pro Aktie zeigt, wie viel Gewinn auf eine einzelne Aktie entfällt.
              Buffett achtet besonders auf einen stabilen oder wachsenden EPS über viele Jahre.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialMetrics;
