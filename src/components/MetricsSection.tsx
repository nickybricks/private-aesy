
import React from 'react';
import FinancialMetrics from '@/components/FinancialMetrics';
import { useStock } from '@/context/StockContext';

const MetricsSection: React.FC = () => {
  const { financialMetrics, stockCurrency, hasCriticalDataMissing, dcfData } = useStock();
  
  if (!financialMetrics || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-10">
      <FinancialMetrics 
        metrics={financialMetrics.metrics} 
        historicalData={financialMetrics.historicalData} 
        currency={stockCurrency}
        dcfData={dcfData}
      />
    </div>
  );
};

export default MetricsSection;
