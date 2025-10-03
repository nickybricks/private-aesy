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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ClickableTooltip } from './ClickableTooltip';
import BuffettMetricsSummary from './BuffettMetricsSummary';
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
  isAlreadyPercent?: boolean; // Flag to indicate if value is already in percentage format
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
  const { name, value, formula, explanation, threshold, status, originalValue, originalCurrency, isPercentage, isMultiplier, isAlreadyPercent } = metric;
  
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
      // Check if value is already in percentage format or needs conversion
      if (isAlreadyPercent) {
        // Value is already a percentage (e.g., 15.5 for 15.5%)
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`
          : displayValue;
      } else {
        // Value is decimal and needs conversion to percentage (e.g., 0.155 for 15.5%)
        const percentageValue = typeof displayValue === 'number' ? displayValue * 100 : displayValue;
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${percentageValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })} %`
          : displayValue;
      }
    } else if (metric.isMultiplier) {
      cleanedDisplayValue = typeof displayValue === 'number'
        ? `${displayValue.toLocaleString('de-DE', { maximumFractionDigits: 2 })}x`
        : displayValue;
    } else if (originalCurrency && originalValue && shouldConvertCurrency(currency, originalCurrency)) {
      cleanedDisplayValue = formatCurrency(
        value, 
        currency, 
        true, 
        originalValue, 
        originalCurrency,
        metric.isPercentage,
        metric.isMultiplier,
        metric.isAlreadyPercent
      );
    } else {
      cleanedDisplayValue = formatCurrency(
        displayValue, 
        currency,
        false,
        undefined,
        undefined,
        metric.isPercentage,
        metric.isMultiplier,
        metric.isAlreadyPercent
      );
    }
  }
  
  return (
    <Card className="metric-card p-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-medium">{name}</h3>
        
        {detailedExplanation && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                <Info size={12} className="text-gray-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-sm p-3">
              <div className="space-y-1.5">
                <h4 className="font-semibold text-sm">{name}</h4>
                <p className="text-xs">{detailedExplanation.whatItIs}</p>
                
                <div className="space-y-1 pt-1.5">
                  <p className="text-xs"><span className="font-medium">Berechnung:</span> {detailedExplanation.howCalculated}</p>
                  <p className="text-xs"><span className="font-medium">Warum wichtig:</span> {detailedExplanation.whyImportant}</p>
                  <p className="text-xs"><span className="font-medium">Buffett-Maßstab:</span> {detailedExplanation.buffettGuideline}</p>
                  <p className="text-xs"><span className="font-medium">Gute Werte:</span> {detailedExplanation.goodValue}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      <div className="text-xl font-semibold mb-1.5">{cleanedDisplayValue}</div>
      
      <div className="text-xs text-buffett-subtext mb-1">
        <span className="font-medium">Formel:</span> {formula}
      </div>
      
      <p className="text-xs mb-2">{explanation}</p>
      
      <div className="flex items-center justify-between text-xs">
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

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData, currency = 'USD' }) => {
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
    metric => metric.originalCurrency && shouldConvertCurrency(currency, metric.originalCurrency)
  );
  
  // Categorize metrics
  const categorizeMetric = (metricName: string): string => {
    if (metricName.includes('Gewinn pro Aktie') || metricName.includes('Nettomarge')) return 'profitability';
    if (metricName.includes('ROE') || metricName.includes('ROIC')) return 'returns';
    if (metricName.includes('KGV') || metricName.includes('P/B') || metricName.includes('KBV') || metricName.includes('EV/')) return 'valuation';
    if (metricName.includes('Schulden') || metricName.includes('Zinsdeckung') || metricName.includes('Deckungsgrad')) return 'balance';
    if (metricName.includes('Volumen') || metricName.includes('Cashflow') || metricName.includes('Liquidität')) return 'liquidity';
    return 'other';
  };
  
  const categories = {
    profitability: { title: 'Profitabilität', metrics: [] as FinancialMetric[] },
    returns: { title: 'Renditen', metrics: [] as FinancialMetric[] },
    valuation: { title: 'Bewertung', metrics: [] as FinancialMetric[] },
    balance: { title: 'Bilanz & Verschuldung', metrics: [] as FinancialMetric[] },
    liquidity: { title: 'Liquidität & Cashflow', metrics: [] as FinancialMetric[] },
    other: { title: 'Weitere Kennzahlen', metrics: [] as FinancialMetric[] }
  };
  
  metricsArray.forEach(metric => {
    const category = categorizeMetric(metric.name);
    categories[category as keyof typeof categories].metrics.push(metric);
  });
  
  // Generate Buffett criteria
  const getMetricValue = (name: string): FinancialMetric | undefined => {
    return metricsArray.find(m => m.name.includes(name));
  };
  
  const buffettCriteria = [];
  
  // KGV
  const kgv = getMetricValue('KGV');
  if (kgv && typeof kgv.value === 'number') {
    buffettCriteria.push({
      name: 'KGV',
      status: kgv.value < 15 ? 'pass' : kgv.value < 20 ? 'warning' : 'fail',
      value: kgv.value.toFixed(1),
      threshold: '< 15'
    });
  }
  
  // KBV / P/B
  const kbv = getMetricValue('P/B') || getMetricValue('KBV');
  if (kbv && typeof kbv.value === 'number') {
    buffettCriteria.push({
      name: 'KBV',
      status: kbv.value < 1.5 ? 'pass' : kbv.value < 3 ? 'warning' : 'fail',
      value: kbv.value.toFixed(2),
      threshold: '< 1.5'
    });
  }
  
  // ROIC
  const roic = getMetricValue('ROIC');
  if (roic && typeof roic.value === 'number') {
    const roicPct = roic.isAlreadyPercent ? roic.value : roic.value * 100;
    buffettCriteria.push({
      name: 'ROIC',
      status: roicPct > 12 ? 'pass' : roicPct > 8 ? 'warning' : 'fail',
      value: `${roicPct.toFixed(1)}%`,
      threshold: '> 12%'
    });
  }
  
  // ROE
  const roe = getMetricValue('ROE');
  if (roe && typeof roe.value === 'number') {
    const roePct = roe.isAlreadyPercent ? roe.value : roe.value * 100;
    buffettCriteria.push({
      name: 'ROE',
      status: roePct > 15 ? 'pass' : roePct > 10 ? 'warning' : 'fail',
      value: `${roePct.toFixed(1)}%`,
      threshold: '> 15%'
    });
  }
  
  // Schuldenquote
  const debt = getMetricValue('Schulden zu EBITDA');
  if (debt && typeof debt.value === 'number') {
    buffettCriteria.push({
      name: 'Schulden',
      status: debt.value < 1 ? 'pass' : debt.value < 2 ? 'warning' : 'fail',
      value: `${debt.value.toFixed(2)}x`,
      threshold: '< 1.0x'
    });
  }
  
  // Zinsdeckung
  const interest = getMetricValue('Zinsdeckung');
  if (interest && typeof interest.value === 'number') {
    buffettCriteria.push({
      name: 'Zinsdeckung',
      status: interest.value > 8 ? 'pass' : interest.value > 3 ? 'warning' : 'fail',
      value: `${interest.value.toFixed(1)}x`,
      threshold: '> 8x'
    });
  }
  
  // Nettomarge
  const margin = getMetricValue('Nettomarge');
  if (margin && typeof margin.value === 'number') {
    const marginPct = margin.isAlreadyPercent ? margin.value : margin.value * 100;
    buffettCriteria.push({
      name: 'Marge',
      status: marginPct > 15 ? 'pass' : marginPct > 10 ? 'warning' : 'fail',
      value: `${marginPct.toFixed(1)}%`,
      threshold: '> 15%'
    });
  }
  
  // EPS-Wachstum (from historical data)
  if (historicalData?.eps && historicalData.eps.length >= 2) {
    const recentEps = historicalData.eps[historicalData.eps.length - 1].value;
    const oldEps = historicalData.eps[0].value;
    const growth = ((recentEps - oldEps) / Math.abs(oldEps)) * 100;
    buffettCriteria.push({
      name: 'EPS-Wachstum',
      status: growth > 5 ? 'pass' : growth > 0 ? 'warning' : 'fail',
      value: `${growth.toFixed(1)}%`,
      threshold: 'positiv'
    });
  }
  
  // Moat-Proxy (average of ROIC and ROE consistency)
  if (roic && roe && typeof roic.value === 'number' && typeof roe.value === 'number') {
    const roicPct = roic.isAlreadyPercent ? roic.value : roic.value * 100;
    const roePct = roe.isAlreadyPercent ? roe.value : roe.value * 100;
    const avgReturn = (roicPct + roePct) / 2;
    buffettCriteria.push({
      name: 'Moat',
      status: avgReturn > 15 ? 'pass' : avgReturn > 10 ? 'warning' : 'fail',
      value: `${avgReturn.toFixed(1)}%`,
      threshold: 'stark'
    });
  }
  
  return (
    <Card className="buffett-card p-4 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Finanzkennzahlen</h2>
      
      {hasConvertedMetrics && (
        <div className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 h-4 w-4 mt-0.5" />
            <div>
              <h3 className="font-medium text-xs text-yellow-700">Währungshinweis</h3>
              <p className="text-yellow-600 text-2xs">
                Einige Finanzdaten werden in einer anderen Währung berichtet als der Aktienkurs ({currency}).
                Diese Werte wurden in {currency} umgerechnet, um eine korrekte Analyse zu ermöglichen.
                Die Originalwerte werden in Klammern angezeigt.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Buffett Check Summary */}
      {buffettCriteria.length > 0 && <BuffettMetricsSummary criteria={buffettCriteria} />}
      
      {/* Categorized Metrics */}
      {Object.entries(categories).map(([key, category]) => {
        if (category.metrics.length === 0) return null;
        
        return (
          <div key={key} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{category.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {category.metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} currency={currency} />
              ))}
            </div>
          </div>
        );
      })}
      
      {historicalData && historicalData.revenue && historicalData.revenue.length > 0 && (
        <div className="border-t pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Finanzielle Entwicklung (10 Jahre)</h3>
            <ClickableTooltip
              content={
                <div className="space-y-1.5">
                  <p className="text-xs">
                    <span className="font-medium">Umsatz (Revenue):</span> Der Gesamtumsatz des Unternehmens pro Jahr.
                    Buffett bevorzugt Unternehmen mit stabilem oder wachsendem Umsatz.
                  </p>
                  <p className="text-xs">
                    <span className="font-medium">Gewinn (Earnings):</span> Der Nettogewinn nach allen Kosten und Steuern.
                    Idealerweise sollte der Gewinn über die Jahre steigen.
                  </p>
                  <p className="text-xs">
                    <span className="font-medium">EPS (Earnings Per Share):</span> Der Gewinn pro Aktie zeigt, wie viel Gewinn auf eine einzelne Aktie entfällt.
                    Buffett achtet besonders auf einen stabilen oder wachsenden EPS über viele Jahre.
                  </p>
                </div>
              }
            >
              <button className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                <HelpCircle size={14} className="text-gray-600" />
              </button>
            </ClickableTooltip>
          </div>
          
          <div className="overflow-x-auto">
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
                {historicalData.revenue.slice().reverse().map((revenueItem, index) => {
                  const earningsItem = historicalData.earnings?.slice().reverse()[index];
                  const epsItem = historicalData.eps?.slice().reverse()[index];
                  
                  const revenueValue = revenueItem.originalCurrency && shouldConvertCurrency(currency, revenueItem.originalCurrency)
                    ? formatCurrency(revenueItem.value, currency, true, revenueItem.originalValue, revenueItem.originalCurrency)
                    : formatScaledNumber(revenueItem.value, currency);
                    
                  const earningsValue = earningsItem?.originalCurrency && shouldConvertCurrency(currency, earningsItem.originalCurrency)
                    ? formatCurrency(earningsItem.value, currency, true, earningsItem.originalValue, earningsItem.originalCurrency)
                    : formatScaledNumber(earningsItem?.value || 0, currency);
                    
                  const epsValue = epsItem?.originalCurrency && shouldConvertCurrency(currency, epsItem.originalCurrency)
                    ? formatCurrency(epsItem.value, currency, true, epsItem.originalValue, epsItem.originalCurrency)
                    : formatCurrency(epsItem?.value || 0, currency);
                  
                  return (
                    <TableRow key={revenueItem.year}>
                      <TableCell className="font-medium">{revenueItem.year}</TableCell>
                      <TableCell className="text-right">{revenueValue}</TableCell>
                      <TableCell className="text-right">{earningsValue}</TableCell>
                      <TableCell className="text-right">{epsValue}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FinancialMetrics;
