
import React from 'react';
import FinancialMetrics from '@/components/FinancialMetrics';
import { useStock } from '@/context/StockContext';

const MetricsSection: React.FC = () => {
  const { financialMetrics, stockCurrency, hasCriticalDataMissing } = useStock();
  
  if (!financialMetrics || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-6">
      <FinancialMetrics 
        metrics={financialMetrics.metrics} 
        historicalData={financialMetrics.historicalData} 
        currency={stockCurrency}
      />
    </div>
  );
};

export default MetricsSection;
