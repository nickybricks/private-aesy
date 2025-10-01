import React from 'react';
import { useStock } from '@/context/StockContext';
import { Card } from '@/components/ui/card';
import StockChart from './StockChart';

const StockChartSection: React.FC = () => {
  const { stockInfo, isLoading, hasCriticalDataMissing } = useStock();

  if (isLoading || hasCriticalDataMissing || !stockInfo) {
    return null;
  }

  const { ticker, currency, intrinsicValue } = stockInfo;

  return (
    <Card className="mb-6 p-6 lg:w-1/2">
      <StockChart 
        symbol={ticker} 
        currency={currency} 
        intrinsicValue={intrinsicValue}
      />
    </Card>
  );
};

export default StockChartSection;
