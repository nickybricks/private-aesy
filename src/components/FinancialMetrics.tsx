
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
import { formatCurrency } from '@/helpers/currencyConverter';

interface FinancialMetric {
  name: string;
  value: number | string;
  formula: string;
  explanation: string;
  threshold: string;
  status: 'pass' | 'warning' | 'fail';
}

interface FinancialMetricsProps {
  metrics: FinancialMetric[] | null;
  historicalData: {
    revenue: { year: string; value: number }[];
    earnings: { year: string; value: number }[];
    eps: { year: string; value: number }[];
  } | null;
  currencyInfo?: any;
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

const MetricStatus: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pass':
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

const MetricCard: React.FC<{ metric: FinancialMetric; currencyInfo?: any }> = ({ metric, currencyInfo }) => {
  const { name, value, formula, explanation, threshold, status } = metric;
  
  const isValueMissing = value === 'N/A' || 
                         (typeof value === 'string' && (value.includes('N/A') || value === '0.00' || value === '0.00%')) ||
                         (typeof value === 'number' && (value === 0 || isNaN(value))) ||
                         value === undefined || 
                         value === null;
  
  const displayValue = isValueMissing ? 'Keine Daten' : value;
  const detailedExplanation = getMetricDetailedExplanation(name);
  
  let cleanedDisplayValue = displayValue;
  if (typeof displayValue === 'string') {
    cleanedDisplayValue = displayValue
      .replace(/USD USD/g, 'USD')
      .replace(/EUR EUR/g, 'EUR')
      .replace(/€ €/g, '€')
      .replace(/\$ \$/g, '$');
  }
  
  const needsCurrencyIndicator = 
    currencyInfo && 
    currencyInfo.conversionNeeded && 
    (name.includes("Gewinn") || 
     name.includes("Cashflow") || 
     name.includes("Umsatz") ||
     name.includes("Wert") ||
     name.includes("Kurs"));
  
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
      
      <div className="text-2xl font-semibold mb-2">
        {cleanedDisplayValue}
        {needsCurrencyIndicator && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center justify-center ml-1 rounded-full bg-yellow-100">
                  <Info size={14} className="text-yellow-600" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Umgerechnet von {currencyInfo.originalCurrency} in {currencyInfo.targetCurrency}</p>
                <p className="text-xs text-gray-500">Wechselkurs: 1 {currencyInfo.targetCurrency} = {currencyInfo.conversionRate} {currencyInfo.originalCurrency}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
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

const BuffettCriteriaSection: React.FC = () => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">11 Buffett-Kriterien Übersicht</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">1</span>
            </div>
            <div>
              <h4 className="font-medium">Verstehbares Geschäftsmodell</h4>
              <p className="text-sm text-buffett-subtext">Ist das Geschäftsmodell in wenigen Sätzen erklärbar?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">2</span>
            </div>
            <div>
              <h4 className="font-medium">Wirtschaftlicher Burggraben</h4>
              <p className="text-sm text-buffett-subtext">Hat das Unternehmen einen dauerhaften Wettbewerbsvorteil?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">3</span>
            </div>
            <div>
              <h4 className="font-medium">Finanzkennzahlen (10 Jahre)</h4>
              <p className="text-sm text-buffett-subtext">Zeigt konstantes Wachstum und Rentabilität</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">4</span>
            </div>
            <div>
              <h4 className="font-medium">Finanzielle Stabilität</h4>
              <p className="text-sm text-buffett-subtext">Gesunde Bilanzstruktur ohne übermäßige Verschuldung</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">5</span>
            </div>
            <div>
              <h4 className="font-medium">Managementqualität</h4>
              <p className="text-sm text-buffett-subtext">Ehrliches und rational handelndes Management</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">6</span>
            </div>
            <div>
              <h4 className="font-medium">Bewertung</h4>
              <p className="text-sm text-buffett-subtext">Ist die Aktie zu einem angemessenen Preis erhältlich?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">7</span>
            </div>
            <div>
              <h4 className="font-medium">Langfristiger Horizont</h4>
              <p className="text-sm text-buffett-subtext">Ist das Unternehmen auch in 20 Jahren noch relevant?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">8</span>
            </div>
            <div>
              <h4 className="font-medium">Rationalität & Disziplin</h4>
              <p className="text-sm text-buffett-subtext">Handelt das Unternehmen vernünftig und diszipliniert?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">9</span>
            </div>
            <div>
              <h4 className="font-medium">Antizyklisches Verhalten</h4>
              <p className="text-sm text-buffett-subtext">Kauft, wenn andere verkaufen?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">10</span>
            </div>
            <div>
              <h4 className="font-medium">Vergangenheit ≠ Zukunft</h4>
              <p className="text-sm text-buffett-subtext">Beruht der Erfolg auf nachhaltigen Faktoren?</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="mt-1 bg-buffett-blue p-1 rounded-full">
              <span className="text-white text-xs font-medium">11</span>
            </div>
            <div>
              <h4 className="font-medium">Keine Turnarounds</h4>
              <p className="text-sm text-buffett-subtext">Bewährte Unternehmen statt Restrukturierungsfälle</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData, currencyInfo }) => {
  // Early return if no metrics are provided
  if (!metrics) return null;
  
  // Ensure metrics is an array before attempting to map over it
  const metricsArray = Array.isArray(metrics) ? metrics : [];
  
  const formatHistoricalValue = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value) || value === 0) return 'N/A';
    
    if (currencyInfo && currencyInfo.conversionNeeded && currencyInfo.conversionRate) {
      value = value / currencyInfo.conversionRate;
    }
    
    return value.toFixed(2);
  };
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Buffett-Analyse Framework</h2>
      
      {currencyInfo && currencyInfo.conversionNeeded && (
        <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <Info className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium">Währungsumrechnung aktiviert</h3>
          </div>
          <p className="mt-1 text-yellow-700">
            Die Finanzdaten für diese Aktie wurden automatisch von {currencyInfo.originalCurrency} in {currencyInfo.targetCurrency} umgerechnet.
            Dies sichert eine korrekte Analyse und verhindert unrealistische Werte.
          </p>
          <p className="mt-1 text-sm text-yellow-600">
            Wechselkurs: 1 {currencyInfo.targetCurrency} = {currencyInfo.conversionRate} {currencyInfo.originalCurrency}
          </p>
        </div>
      )}
      
      <BuffettCriteriaSection />
      
      <h2 className="text-2xl font-semibold mb-6">Finanzkennzahlen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metricsArray.map((metric, index) => (
          <MetricCard key={index} metric={metric} currencyInfo={currencyInfo} />
        ))}
      </div>
      
      {/* Debug section for metrics data */}
      <Card className="buffett-card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Debug: API-Rohdaten</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-[500px]">
          <pre className="text-xs whitespace-pre-wrap break-words">
            <strong>Metrics-Daten:</strong>
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      </Card>
      
      {historicalData && (
        <Card className="buffett-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Debug: Historische Daten</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-[500px]">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(historicalData, null, 2)}
            </pre>
          </div>
        </Card>
      )}
      
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
          
          {currencyInfo && currencyInfo.conversionNeeded && (
            <div className="mb-4 text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                <span>Die historischen Daten wurden von {currencyInfo.originalCurrency} in {currencyInfo.targetCurrency} umgerechnet.</span>
              </div>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jahr</TableHead>
                <TableHead className="text-right">Umsatz (Mio. {currencyInfo?.targetCurrency || '€'})</TableHead>
                <TableHead className="text-right">Gewinn (Mio. {currencyInfo?.targetCurrency || '€'})</TableHead>
                <TableHead className="text-right">EPS ({currencyInfo?.targetCurrency || '€'})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalData.revenue.map((item, i) => {
                const epsDataForYear = historicalData.eps && historicalData.eps.find(e => e.year === item.year);
                const earningsDataForYear = historicalData.earnings && historicalData.earnings.find(e => e.year === item.year);
                
                return (
                  <TableRow key={item.year || i}>
                    <TableCell>{item.year || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {formatHistoricalValue(item.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatHistoricalValue(earningsDataForYear?.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatHistoricalValue(epsDataForYear?.value)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="mt-4 text-sm text-buffett-subtext">
            <p>Hinweis: 'N/A' bedeutet, dass keine Daten verfügbar sind.</p>
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
