
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
import { LineChart } from 'recharts';

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
  
  return (
    <Card className="metric-card">
      <h3 className="text-lg font-medium mb-1">{name}</h3>
      <div className="text-2xl font-semibold mb-2">{value}</div>
      
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
  
  // In a real implementation, we would use the historicalData to render charts
  // but for the MVP, we'll just display the metrics in a grid
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Finanzkennzahlen</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
      
      {historicalData && (
        <Card className="buffett-card">
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
              {historicalData.revenue.map((item, i) => (
                <TableRow key={item.year}>
                  <TableCell>{item.year}</TableCell>
                  <TableCell className="text-right">{item.value.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{historicalData.earnings[i]?.value.toFixed(2) || '-'}</TableCell>
                  <TableCell className="text-right">{historicalData.eps[i]?.value.toFixed(2) || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* In a full implementation, we'd render charts here using recharts */}
        </Card>
      )}
    </div>
  );
};

export default FinancialMetrics;
