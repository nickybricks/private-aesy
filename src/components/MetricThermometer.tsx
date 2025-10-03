import React from 'react';

interface MetricThermometerProps {
  value: number;
  threshold: number;
  isHigherBetter: boolean; // true = higher is better (ROE, ROIC), false = lower is better (KGV, KBV)
  unit?: string;
}

const MetricThermometer: React.FC<MetricThermometerProps> = ({ 
  value, 
  threshold, 
  isHigherBetter,
  unit = ''
}) => {
  // Calculate position (0-100%)
  const maxValue = isHigherBetter ? threshold * 2 : threshold * 2;
  const minValue = 0;
  const range = maxValue - minValue;
  const position = Math.min(100, Math.max(0, ((value - minValue) / range) * 100));
  const thresholdPosition = ((threshold - minValue) / range) * 100;
  
  // Determine status
  const isGood = isHigherBetter ? value >= threshold : value <= threshold;
  const isWarning = isHigherBetter 
    ? value >= threshold * 0.7 && value < threshold
    : value > threshold && value <= threshold * 1.3;
  
  const markerColor = isGood ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="w-full">
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Good zone */}
        {isHigherBetter ? (
          <div 
            className="absolute h-full bg-green-100"
            style={{ 
              left: `${thresholdPosition}%`, 
              right: 0 
            }}
          />
        ) : (
          <div 
            className="absolute h-full bg-green-100"
            style={{ 
              left: 0, 
              right: `${100 - thresholdPosition}%` 
            }}
          />
        )}
        
        {/* Threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
          style={{ left: `${thresholdPosition}%` }}
        />
        
        {/* Value marker */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-1 h-4 ${markerColor} rounded-full`}
          style={{ left: `${position}%`, marginLeft: '-2px' }}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{minValue}{unit}</span>
        <span className="text-gray-700 font-medium">{threshold}{unit}</span>
        <span>{maxValue}{unit}</span>
      </div>
    </div>
  );
};

export default MetricThermometer;
