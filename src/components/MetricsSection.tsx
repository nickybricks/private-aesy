
import React from 'react';
import CompactFinancialMetrics from '@/components/CompactFinancialMetrics';
import { useStock } from '@/context/StockContext';

const MetricsSection: React.FC = () => {
  const { financialMetrics, stockCurrency, hasCriticalDataMissing } = useStock();
  
  if (!financialMetrics || hasCriticalDataMissing) {
    return null;
  }

  return (
    <CompactFinancialMetrics 
      metrics={financialMetrics.metrics} 
      currency={stockCurrency}
    />
  );
};

export default MetricsSection;
