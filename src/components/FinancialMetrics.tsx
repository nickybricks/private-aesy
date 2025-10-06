import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, AlertTriangle, X, Info, HelpCircle, Download } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ClickableTooltip } from './ClickableTooltip';
import BuffettMetricsSummary from './BuffettMetricsSummary';
import MetricThermometer from './MetricThermometer';
import MiniSparkline from './MiniSparkline';
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
    "EPS-Wachstum (3 Jahre CAGR)": {
      whatItIs: "Das durchschnittliche jährliche Wachstum des Gewinns pro Aktie über einen Zeitraum von 3 Jahren (Compound Annual Growth Rate)",
      howCalculated: "CAGR = ((EPS aktuell ÷ EPS vor 3 Jahren)^(1/3) - 1) × 100",
      whyImportant: "Zeigt, ob das Unternehmen kontinuierlich profitabler wird und ist ein Indikator für Wachstumsstärke",
      buffettGuideline: "Buffett bevorzugt Unternehmen mit stabilem EPS-Wachstum von über 10% pro Jahr",
      goodValue: "Über 10% ist hervorragend, 5-10% gut, unter 5% unterdurchschnittlich"
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
    },
    "OCF-Qualität": {
      whatItIs: "Qualität des operativen Cashflows im Verhältnis zum Gewinn und dessen Stabilität",
      howCalculated: "OCF ÷ Nettogewinn (5-Jahres-Durchschnitt) und Vergleich der Standardabweichungen",
      whyImportant: "Zeigt, ob der Gewinn tatsächlich in Cash umgewandelt wird und wie stabil der Cashflow ist",
      buffettGuideline: "Buffett bevorzugt OCF/Nettogewinn > 1,0 und stabileren OCF als Umsatz",
      goodValue: "OCF/Nettogewinn ≥ 1,0 und Standardabw. OCF < Standardabw. Umsatz"
    },
    "FCF-Robustheit": {
      whatItIs: "Die Robustheit des freien Cashflows über einen längeren Zeitraum",
      howCalculated: "FCF ÷ Umsatz × 100 (5-Jahres-Durchschnitt) und Prüfung auf negative Werte",
      whyImportant: "Zeigt, ob das Unternehmen auch in schwierigen Zeiten positiven freien Cashflow generiert",
      buffettGuideline: "Buffett bevorzugt FCF-Marge ≥ 7% und keinen negativen FCF in Rezessionsjahren",
      goodValue: "FCF-Marge ≥ 7% und in keinem Jahr <0"
    },
    "Zinsdeckungsgrad": {
      whatItIs: "Die Fähigkeit des Unternehmens, Zinszahlungen aus dem operativen Ergebnis zu bedienen",
      howCalculated: "EBIT ÷ Zinsaufwand",
      whyImportant: "Zeigt die finanzielle Stabilität und das Risiko der Verschuldung",
      buffettGuideline: "Buffett bevorzugt einen Zinsdeckungsgrad von über 5",
      goodValue: "Über 7 ist hervorragend, 5-7 gut, 3-5 akzeptabel, unter 3 bedenklich"
    },
    "Current Ratio": {
      whatItIs: "Das Verhältnis zwischen kurzfristigem Vermögen und kurzfristigen Verbindlichkeiten",
      howCalculated: "Umlaufvermögen ÷ kurzfristige Verbindlichkeiten",
      whyImportant: "Misst die kurzfristige Zahlungsfähigkeit und Liquidität des Unternehmens",
      buffettGuideline: "Buffett bevorzugt eine Current Ratio von über 1.5",
      goodValue: "Über 2 ist hervorragend, 1.5-2 gut, 1-1.5 akzeptabel, unter 1 bedenklich"
    },
    "Schulden zu EBITDA": {
      whatItIs: "Das Verhältnis zwischen Gesamtverschuldung und operativem Ergebnis vor Zinsen, Steuern und Abschreibungen",
      howCalculated: "Gesamtverschuldung ÷ EBITDA",
      whyImportant: "Zeigt, wie viele Jahre das Unternehmen brauchen würde, um seine Schulden aus dem operativen Ergebnis zurückzuzahlen",
      buffettGuideline: "Buffett bevorzugt niedrige Verschuldung",
      goodValue: "Unter 1,0 ist hervorragend, 1,0-2,0 gut, 2,0-3,0 akzeptabel, über 3,0 bedenklich"
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

const MetricCard: React.FC<{ 
  metric: FinancialMetric; 
  currency: string;
  isHighlighted?: boolean;
  historicalValues?: number[];
}> = ({ metric, currency, isHighlighted = false, historicalValues = [] }) => {
  const { name, value, formula, explanation, threshold, status, originalValue, originalCurrency, isPercentage, isMultiplier, isAlreadyPercent } = metric;
  
  const isValueMissing = value === 'N/A' || 
                         (typeof value === 'string' && (value.includes('N/A') || value === '0.00' || value === '0.00%')) ||
                         (typeof value === 'number' && (value === 0 || isNaN(value))) ||
                         value === undefined || 
                         value === null;
  
  const displayValue = isValueMissing ? 'Keine Daten' : value;
  const detailedExplanation = getMetricDetailedExplanation(name);
  
  let cleanedDisplayValue = displayValue;
  let numericValue: number | null = null;
  let unit = '';
  
  if (!isValueMissing) {
    if (metric.isPercentage) {
      if (isAlreadyPercent) {
        numericValue = typeof displayValue === 'number' ? displayValue : null;
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${displayValue.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
          : displayValue;
        unit = '%';
      } else {
        const percentageValue = typeof displayValue === 'number' ? displayValue * 100 : null;
        numericValue = percentageValue;
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${percentageValue!.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
          : displayValue;
        unit = '%';
      }
    } else if (metric.isMultiplier) {
      numericValue = typeof displayValue === 'number' ? displayValue : null;
      cleanedDisplayValue = typeof displayValue === 'number'
        ? `${displayValue.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}×`
        : displayValue;
      unit = '×';
    } else if (originalCurrency && originalValue && shouldConvertCurrency(currency, originalCurrency)) {
      numericValue = typeof value === 'number' ? value : null;
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
      numericValue = typeof displayValue === 'number' ? displayValue : null;
      // Wenn es bereits ein Prozentsatz ist, keine Währung anhängen
      if (metric.isAlreadyPercent) {
        cleanedDisplayValue = typeof displayValue === 'number' 
          ? `${displayValue.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
          : displayValue;
      } else if (typeof displayValue === 'number' && displayValue > 1000000000) {
        // Abbreviate large numbers
        cleanedDisplayValue = `${(displayValue / 1000000000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mrd. ${currency}`;
      } else if (typeof displayValue === 'number' && displayValue > 1000000) {
        cleanedDisplayValue = `${(displayValue / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. ${currency}`;
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
  }
  
  // Calculate delta vs. 5-year average
  let deltaText = '';
  if (historicalValues.length >= 5 && numericValue !== null) {
    const last5Years = historicalValues.slice(-5);
    const avg5Y = last5Years.reduce((a, b) => a + b, 0) / last5Years.length;
    const delta = numericValue - avg5Y;
    const deltaFormatted = isPercentage 
      ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp`
      : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}${unit}`;
    deltaText = `${delta >= 0 ? '↑' : '↓'} ${deltaFormatted} ggü. 5J-Ø`;
  }
  
  // Determine if metric is "higher is better" for thermometer
  const isHigherBetter = name.includes('ROE') || 
                         name.includes('ROIC') || 
                         name.includes('Marge') ||
                         name.includes('Zinsdeckung') ||
                         name.includes('Wachstum');
  
  // Parse threshold for thermometer
  const thresholdValue = parseFloat(threshold.replace(/[^0-9.-]/g, '')) || 0;
  
  // Status badge
  const getStatusBadge = () => {
    if (isValueMissing) return null;
    
    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <Check className="h-3 w-3" />
            Erfüllt
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
            <AlertTriangle className="h-3 w-3" />
            Bedingt
          </span>
        );
      case 'fail':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            <X className="h-3 w-3" />
            Nicht erfüllt
          </span>
        );
    }
  };
  
  return (
    <Card className={`metric-card p-4 hover:shadow-lg transition-all ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}>
      {/* Top Badge: TTM / FY2024 */}
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
          TTM
        </Badge>
      </div>
      
      {/* Line 1: Titel + Info-Icon */}
      <div className="flex items-center justify-between mb-3 pr-12">
        <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
        
        {detailedExplanation && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="rounded-full p-1 hover:bg-gray-100 transition-colors">
                <Info size={14} className="text-gray-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-sm p-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{name}</h4>
                <p className="text-xs text-gray-600">{detailedExplanation.whatItIs}</p>
                
                <div className="space-y-1.5 pt-2 border-t">
                  <p className="text-xs"><span className="font-medium">Formel:</span> {formula}</p>
                  <p className="text-xs"><span className="font-medium">Berechnung:</span> {detailedExplanation.howCalculated}</p>
                  <p className="text-xs"><span className="font-medium">Warum wichtig:</span> {detailedExplanation.whyImportant}</p>
                  <p className="text-xs"><span className="font-medium">Buffett-Maßstab:</span> {detailedExplanation.buffettGuideline}</p>
                  <p className="text-xs"><span className="font-medium">Gute Werte:</span> {detailedExplanation.goodValue}</p>
                  
                  {/* Show dynamic explanation if available */}
                  {explanation && explanation !== detailedExplanation.whatItIs && (
                    <div className="pt-2 border-t">
                      <p className="text-xs"><span className="font-medium">Aktuelle Analyse:</span> {explanation}</p>
                    </div>
                  )}
                  
                  {/* Show threshold */}
                  <div className="pt-2 border-t">
                    <p className="text-xs"><span className="font-medium">Schwelle:</span> {threshold}</p>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {/* Line 2: Hauptwert + Delta + Sparkline */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900">
            {cleanedDisplayValue}
          </span>
          {deltaText && (
            <span className="text-xs text-gray-500 font-medium">
              {deltaText}
            </span>
          )}
        </div>
        {historicalValues.length > 0 && (
          <MiniSparkline data={historicalValues} />
        )}
      </div>
      
      {/* Thermometer */}
      {!isValueMissing && numericValue !== null && (
        <div className="mb-3">
          <MetricThermometer 
            value={numericValue}
            threshold={thresholdValue}
            isHigherBetter={isHigherBetter}
            unit={unit}
          />
        </div>
      )}
      
      {/* Line 3: Schwelle + Status */}
      {!isValueMissing && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <span className="text-xs text-gray-600">
            Schwelle: {threshold}
          </span>
          {getStatusBadge()}
        </div>
      )}
      
      {/* Meta-Fußnote */}
      <div className="text-xs text-gray-400 mt-3">
        {explanation}
      </div>
    </Card>
  );
};

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData, currency = 'USD' }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'impact' | 'alphabetical' | 'status'>('impact');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'warning' | 'fail'>('all');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
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
    if (metricName.includes('EPS-Wachstum') || metricName.includes('Gewinn pro Aktie') || metricName.includes('Nettomarge')) return 'profitability';
    if (metricName.includes('ROE') || metricName.includes('ROIC')) return 'returns';
    if (metricName.includes('KGV') || metricName.includes('P/B') || metricName.includes('KBV') || metricName.includes('EV/')) return 'valuation';
    if (metricName.includes('Schulden') || metricName.includes('Zinsdeckung') || metricName.includes('Deckungsgrad')) return 'balance';
    if (metricName.includes('Volumen') || metricName.includes('Cashflow') || metricName.includes('Cash Conversion') || metricName.includes('Capex')) return 'liquidity';
    return 'valuation'; // Fallback zu Bewertung statt "other"
  };
  
  const categories = {
    profitability: { title: 'Profitabilität', metrics: [] as FinancialMetric[] },
    returns: { title: 'Renditen', metrics: [] as FinancialMetric[] },
    valuation: { title: 'Bewertung', metrics: [] as FinancialMetric[] },
    balance: { title: 'Bilanz & Verschuldung', metrics: [] as FinancialMetric[] },
    liquidity: { title: 'Liquidität & Cashflow', metrics: [] as FinancialMetric[] }
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
      threshold: '< 15',
      explanation: 'Buffett bevorzugt ein niedriges KGV, idealerweise unter 15'
    });
  }
  
  // KBV / P/B
  const kbv = getMetricValue('P/B') || getMetricValue('KBV');
  if (kbv && typeof kbv.value === 'number') {
    buffettCriteria.push({
      name: 'KBV',
      status: kbv.value < 1.5 ? 'pass' : kbv.value < 3 ? 'warning' : 'fail',
      value: kbv.value.toFixed(2),
      threshold: '< 1.5',
      explanation: 'Buffett bevorzugt ein KBV nahe 1, maximal 1,5'
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
      threshold: '> 12%',
      explanation: 'Buffett bevorzugt Unternehmen mit ROIC über 12%, idealerweise über viele Jahre'
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
      threshold: '> 15%',
      explanation: 'Buffett sucht nach Unternehmen mit konstant hoher ROE über viele Jahre'
    });
  }
  
  // Schuldenquote
  const debt = getMetricValue('Schulden zu EBITDA');
  if (debt && typeof debt.value === 'number') {
    buffettCriteria.push({
      name: 'Schulden',
      status: debt.value < 1 ? 'pass' : debt.value < 2 ? 'warning' : 'fail',
      value: `${debt.value.toFixed(2)}×`,
      threshold: '< 1.0×',
      explanation: 'Buffett bevorzugt Unternehmen mit niedriger Verschuldung'
    });
  }
  
  // Zinsdeckung
  const interest = getMetricValue('Zinsdeckung');
  if (interest && typeof interest.value === 'number') {
    buffettCriteria.push({
      name: 'Zinsdeckung',
      status: interest.value > 8 ? 'pass' : interest.value > 3 ? 'warning' : 'fail',
      value: `${interest.value.toFixed(1)}×`,
      threshold: '> 8×',
      explanation: 'Hohe Zinsdeckung zeigt die Fähigkeit, Schulden komfortabel zu bedienen'
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
      threshold: '> 15%',
      explanation: 'Höhere Margen deuten auf einen stärkeren Wettbewerbsvorteil (Burggraben) hin'
    });
  }
  
  // EPS-Wachstum (3-year CAGR from historical data)
  if (historicalData?.eps && historicalData.eps.length >= 4) {
    // Get most recent and 3 years ago data
    const sortedEps = [...historicalData.eps].sort((a, b) => Number(b.year) - Number(a.year));
    const currentEps = sortedEps[0]; // Most recent
    const pastEps = sortedEps[3]; // 3 years ago
    
    let growth = 0;
    let growthExplanation = '';
    
    if (pastEps.value > 0 && currentEps.value > 0) {
      // Calculate 3-year CAGR
      const years = 3;
      growth = (Math.pow(currentEps.value / pastEps.value, 1 / years) - 1) * 100;
      growthExplanation = `${years} Jahre CAGR: ${pastEps.year} (${pastEps.value.toFixed(2)}) → ${currentEps.year} (${currentEps.value.toFixed(2)})`;
    } else if (pastEps.value !== 0) {
      // Fallback to simple growth if one value is negative
      growth = ((currentEps.value - pastEps.value) / Math.abs(pastEps.value)) * 100;
      growthExplanation = `${pastEps.year} (${pastEps.value.toFixed(2)}) → ${currentEps.year} (${currentEps.value.toFixed(2)}) [Negatives EPS]`;
    }
    
    buffettCriteria.push({
      name: 'EPS-Wachstum',
      status: growth >= 10 ? 'pass' : growth >= 5 ? 'warning' : 'fail',
      value: `${growth.toFixed(1)}%`,
      threshold: '>10%',
      explanation: `Buffett sucht stabiles oder steigendes EPS über viele Jahre. ${growthExplanation}`
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
      threshold: 'stark',
      explanation: 'Hohe und stabile Renditen deuten auf einen starken Wettbewerbsvorteil hin'
    });
  }
  
  // Handle filter from BuffettMetricsSummary
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    
    // Scroll to the metric if filter is active
    if (filter) {
      const metric = metricsArray.find(m => m.name.includes(filter));
      if (metric) {
        const category = categorizeMetric(metric.name);
        const sectionEl = sectionRefs.current[category];
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };
  
  // Sort metrics within each category
  const sortMetrics = (categoryMetrics: FinancialMetric[]) => {
    let sorted = [...categoryMetrics];
    
    switch (sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'status':
        const statusOrder = { pass: 0, warning: 1, fail: 2 };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      case 'impact':
        // Keep original order (by importance)
        break;
    }
    
    return sorted;
  };
  
  // Filter metrics by status
  const filterByStatus = (categoryMetrics: FinancialMetric[]) => {
    if (statusFilter === 'all') return categoryMetrics;
    return categoryMetrics.filter(m => m.status === statusFilter);
  };
  
  // Check if metric should be highlighted
  const isMetricHighlighted = (metricName: string): boolean => {
    if (!activeFilter) return false;
    return metricName.includes(activeFilter);
  };
  
  return (
    <Card className="buffett-card p-6 animate-fade-in">
      {hasConvertedMetrics && (
        <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-4xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 h-4 w-4 mt-0.5" />
            <div>
              <h3 className="font-medium text-xs text-yellow-700">Währungshinweis</h3>
              <p className="text-yellow-600 text-xs">
                Einige Finanzdaten werden in einer anderen Währung berichtet als der Aktienkurs ({currency}).
                Diese Werte wurden in {currency} umgerechnet.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Buffett Check Summary */}
      {buffettCriteria.length > 0 && (
        <BuffettMetricsSummary 
          criteria={buffettCriteria} 
          onFilterChange={handleFilterChange}
        />
      )}
      
      {/* Categorized Metrics */}
      {Object.entries(categories).map(([key, category]) => {
        const filteredMetrics = filterByStatus(sortMetrics(category.metrics));
        if (filteredMetrics.length === 0) return null;
        
        return (
          <div 
            key={key} 
            ref={(el) => { sectionRefs.current[key] = el; }}
            className="mb-8"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 border-b border-gray-200">
              {category.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMetrics.map((metric, index) => (
                <MetricCard 
                  key={index} 
                  metric={metric} 
                  currency={currency}
                  isHighlighted={isMetricHighlighted(metric.name)}
                  historicalValues={[]} // TODO: Extract historical data for this metric
                />
              ))}
            </div>
          </div>
        );
      })}
      
      {historicalData && historicalData.revenue && historicalData.revenue.length > 0 && (
        <div className="border-t pt-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Finanzielle Entwicklung (10 Jahre)</h3>
            <div className="flex items-center gap-2">
              <ClickableTooltip
                content={
                  <div className="space-y-1.5">
                    <p className="text-xs">
                      <span className="font-medium">Umsatz:</span> Gesamtumsatz pro Jahr (Buffett bevorzugt stabiles Wachstum)
                    </p>
                    <p className="text-xs">
                      <span className="font-medium">Gewinn:</span> Nettogewinn nach allen Kosten
                    </p>
                    <p className="text-xs">
                      <span className="font-medium">EPS:</span> Gewinn pro Aktie (Buffett achtet auf stetiges Wachstum)
                    </p>
                  </div>
                }
              >
                <button className="rounded-full p-1 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <HelpCircle size={14} className="text-gray-600" />
                </button>
              </ClickableTooltip>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Download size={14} />
                Als CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">Jahr</TableHead>
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
                      <TableCell className="font-medium sticky left-0 bg-white">{revenueItem.year}</TableCell>
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
