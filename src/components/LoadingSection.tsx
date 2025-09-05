
import React from 'react';
import { useStock } from '@/context/StockContext';

const LoadingSection: React.FC = () => {
  const { isLoading } = useStock();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md w-full">
        {/* Animated Wave Graph */}
        <div className="mb-6 flex justify-center">
          <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-80">
            <path
              d="M0,30 Q15,10 30,30 T60,30 T90,30 T120,30"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className="animate-wave"
            />
            <path
              d="M0,30 Q15,50 30,30 T60,30 T90,30 T120,30"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
              className="animate-wave-reverse"
            />
          </svg>
        </div>
        
        <p className="text-lg font-medium text-foreground">
          Analysiere Aktie nach bewährten Kriterien...
        </p>
      </div>
    </div>
  );
};

export default LoadingSection;
