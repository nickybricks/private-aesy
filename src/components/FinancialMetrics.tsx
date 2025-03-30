
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
      return <span className="text-buffett-green font-medium">✓ Erfüllt</span>;
    case 'warning':
      return <span className="text-buffett-yellow font-medium">! Bedingt erfüllt</span>;
    case 'fail':
      return <span className="text-buffett-red font-medium">✗ Nicht erfüllt</span>;
    default:
      return null;
  }
};

const MetricCard: React.FC<{ metric: FinancialMetric }> = ({ metric }) => {
  const { name, value, formula, explanation, threshold, status } = metric;
  
  // Prüfen ob der Wert "N/A" ist (String) oder ob es ein numerischer Wert im String-Format ist
  const displayValue = value === 'N/A' || 
                       (typeof value === 'string' && value.includes('N/A')) ? 
                       'Keine Daten' : value;
  
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
        <MetricStatus status={status} />
      </div>
    </Card>
  );
};

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ metrics, historicalData }) => {
  if (!metrics) return null;
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Finanzkennzahlen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
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
