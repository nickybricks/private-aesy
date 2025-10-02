import { useMemo } from 'react';

interface ValuationGaugeProps {
  marginOfSafety: number;
  fairValue: number;
  currentPrice: number;
}

export const ValuationGauge = ({ marginOfSafety, fairValue, currentPrice }: ValuationGaugeProps) => {
  // Calculate position on gauge (-100% to +100%)
  const normalizedPosition = useMemo(() => {
    // Clamp between -100 and +100 for display
    return Math.max(-100, Math.min(100, marginOfSafety));
  }, [marginOfSafety]);

  // Calculate rotation for needle (-90deg to +90deg)
  const needleRotation = (normalizedPosition / 100) * 90;

  // Determine color based on margin of safety
  const getColor = () => {
    if (marginOfSafety >= 30) return 'text-green-600 dark:text-green-400';
    if (marginOfSafety >= 10) return 'text-yellow-600 dark:text-yellow-400';
    if (marginOfSafety >= 0) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getFillColor = () => {
    if (marginOfSafety >= 30) return '#16a34a';
    if (marginOfSafety >= 10) return '#ca8a04';
    if (marginOfSafety >= 0) return '#ea580c';
    return '#dc2626';
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* SVG Gauge */}
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background arc - Red (overvalued) */}
        <path
          d="M 20 100 A 80 80 0 0 1 60 30"
          fill="none"
          stroke="#dc2626"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Orange zone */}
        <path
          d="M 60 30 A 80 80 0 0 1 100 20"
          fill="none"
          stroke="#ea580c"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Yellow zone */}
        <path
          d="M 100 20 A 80 80 0 0 1 140 30"
          fill="none"
          stroke="#ca8a04"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Green zone (undervalued) */}
        <path
          d="M 140 30 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#16a34a"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />
        
        {/* Needle */}
        <g transform={`translate(100, 100) rotate(${needleRotation})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-70"
            stroke={getFillColor()}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="0" cy="0" r="6" fill={getFillColor()} />
        </g>
        
        {/* Center labels */}
        <text x="100" y="90" textAnchor="middle" className="text-xs fill-muted-foreground" fontSize="8">
          Fair: ${fairValue.toFixed(0)}
        </text>
        <text x="100" y="100" textAnchor="middle" className="text-xs fill-muted-foreground" fontSize="8">
          Aktuell: ${currentPrice.toFixed(0)}
        </text>
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>-100%</span>
        <span className={getColor() + ' font-bold text-lg'}>
          {marginOfSafety.toFixed(1)}%
        </span>
        <span>+100%</span>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Überbewertet</span>
        <span>Unterbewertet</span>
      </div>
    </div>
  );
};
