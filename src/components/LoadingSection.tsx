
import React from 'react';
import { useStock } from '@/context/StockContext';

const LoadingSection: React.FC = () => {
  const { isLoading } = useStock();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="md:flex md:items-center md:justify-center md:py-12 fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto bg-background md:bg-transparent border-t md:border-t-0 border-border p-4 md:p-0 z-50 md:z-auto">
      <div className="text-center max-w-md w-full">
        {/* Animated Wave Graph */}
        <div className="mb-3 md:mb-6 flex justify-center">
          <svg width="80" height="40" viewBox="0 0 120 60" className="opacity-80 md:w-[120px] md:h-[60px]">
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
        
        <p className="text-sm md:text-lg font-medium text-foreground">
          Analysiere Aktie nach bewährten Kriterien...
        </p>
      </div>
    </div>
  );
};

export default LoadingSection;
