
import React from 'react';
import FinancialMetrics from '@/components/FinancialMetrics';
import { useStock } from '@/context/StockContext';

const MetricsSection: React.FC = () => {
  const { financialMetrics, stockCurrency, hasCriticalDataMissing } = useStock();
  
  if (!financialMetrics || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6 max-w-[1400px] mx-auto px-0 sm:px-2 md:px-4">
      <FinancialMetrics 
        metrics={financialMetrics.metrics} 
        historicalData={financialMetrics.historicalData} 
        currency={stockCurrency}
      />
    </div>
  );
};

export default MetricsSection;
