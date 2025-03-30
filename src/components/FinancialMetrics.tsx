
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
import { Check, AlertTriangle, X } from 'lucide-react';

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
}

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

const MetricCard: React.FC<{ metric: FinancialMetric }> = ({ metric }) => {
  const { name, value, formula, explanation, threshold, status } = metric;
  
  // Verbesserte Prüfung für fehlende Werte
  const isValueMissing = value === 'N/A' || 
                         (typeof value === 'string' && (value.includes('N/A') || value === '0.00' || value === '0.00%')) ||
                         (typeof value === 'number' && (value === 0 || isNaN(value))) ||
                         value === undefined || 
                         value === null;
  
  const displayValue = isValueMissing ? 'Keine Daten' : value;
  
  return (
    <Card className="metric-card p-4">
      <h3 className="text-lg font-medium mb-1">{name}</h3>
      <div className="text-2xl font-semibold mb-2">{displayValue}</div>
      
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

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData }) => {
  if (!metrics) return null;
  
  // Check if metrics is an array, if not, log an error and return null
  if (!Array.isArray(metrics)) {
    console.error('Expected metrics to be an array but received:', metrics);
    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-semibold mb-6">Buffett-Analyse Framework</h2>
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Fehler bei der Datenverarbeitung</h3>
          <p>Die Finanzkennzahlen konnten nicht korrekt geladen werden. Bitte versuchen Sie es später erneut.</p>
        </Card>
        
        {/* Show debug data */}
        <Card className="buffett-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Debug: API-Rohdaten</h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded overflow-auto max-h-[500px]">
            <pre className="text-xs whitespace-pre-wrap break-words">
              <strong>Metrics-Daten:</strong>
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Buffett-Analyse Framework</h2>
      
      <BuffettCriteriaSection />
      
      <h2 className="text-2xl font-semibold mb-6">Finanzkennzahlen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
      {/* Debug-Ansicht für die API-Daten */}
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
          <h3 className="text-lg font-semibold mb-4">Finanzielle Entwicklung (10 Jahre)</h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jahr</TableHead>
                <TableHead className="text-right">Umsatz (Mio. $)</TableHead>
                <TableHead className="text-right">Gewinn (Mio. $)</TableHead>
                <TableHead className="text-right">EPS ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalData.revenue.map((item, i) => {
                // Entsprechende EPS-Daten finden
                const epsDataForYear = historicalData.eps && historicalData.eps.find(e => e.year === item.year);
                // Entsprechende Gewinn-Daten finden
                const earningsDataForYear = historicalData.earnings && historicalData.earnings.find(e => e.year === item.year);
                
                return (
                  <TableRow key={item.year || i}>
                    <TableCell>{item.year || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {typeof item.value === 'number' && item.value !== 0 
                        ? item.value.toFixed(2) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {earningsDataForYear && 
                      typeof earningsDataForYear.value === 'number' && 
                      earningsDataForYear.value !== 0
                        ? earningsDataForYear.value.toFixed(2) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {epsDataForYear && 
                      typeof epsDataForYear.value === 'number' && 
                      epsDataForYear.value !== 0
                        ? epsDataForYear.value.toFixed(2) 
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="mt-4 text-sm text-buffett-subtext">
            <p>Hinweis: 'N/A' bedeutet, dass keine Daten verfügbar sind.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialMetrics;
