
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface StockHeaderProps {
  stockInfo: {
    name: string;
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    marketCap: number;
  } | null;
}

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1000000000000) {
    return `${(marketCap / 1000000000000).toFixed(2)} Bio. ${marketCap > 0 ? '$' : ''}`;
  } else if (marketCap >= 1000000000) {
    return `${(marketCap / 1000000000).toFixed(2)} Mrd. ${marketCap > 0 ? '$' : ''}`;
  } else if (marketCap >= 1000000) {
    return `${(marketCap / 1000000).toFixed(2)} Mio. ${marketCap > 0 ? '$' : ''}`;
  } else {
    return `${marketCap.toFixed(2)} ${marketCap > 0 ? '$' : ''}`;
  }
};

const StockHeader: React.FC<StockHeaderProps> = ({ stockInfo }) => {
  if (!stockInfo) return null;

  const { name, ticker, price, change, changePercent, currency, marketCap } = stockInfo;
  const isPositive = change >= 0;

  return (
    <div className="buffett-card mb-6 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="text-buffett-subtext">{ticker}</div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col items-end">
          <div className="text-3xl font-semibold">{price.toFixed(2)} {currency}</div>
          <div className={`flex items-center ${isPositive ? 'text-buffett-green' : 'text-buffett-red'}`}>
            {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            <span>{change.toFixed(2)} ({changePercent.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
        <DollarSign size={16} className="mr-2 text-buffett-subtext" />
        <span className="text-buffett-subtext">Marktkapitalisierung: {formatMarketCap(marketCap)}</span>
      </div>
    </div>
  );
};

export default StockHeader;
