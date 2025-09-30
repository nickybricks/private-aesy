import React from 'react';
import PeterLynchChart from '@/components/PeterLynchChart';
import { useStock } from '@/context/StockContext';

const PeterLynchSection: React.FC = () => {
  const { stockInfo, hasCriticalDataMissing } = useStock();
  
  if (!stockInfo || hasCriticalDataMissing) {
    return null;
  }

  return (
    <div className="mb-10">
      <PeterLynchChart
        ticker={stockInfo.ticker}
        currency={stockInfo.currency}
        currentPrice={stockInfo.price}
        defaultPE={15}
        defaultLogScale={false}
      />
    </div>
  );
};

export default PeterLynchSection;
