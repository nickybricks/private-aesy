
import React from 'react';

interface BuffettScoreChartProps {
  score: number;
}

export const BuffettScoreChart: React.FC<BuffettScoreChartProps> = ({ score }) => {
  return (
    <div className="text-xs text-gray-500 mt-2">
      Die dargestellte Bewertung ist keine Anlageempfehlung.
    </div>
  );
};
