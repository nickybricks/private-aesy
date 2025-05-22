
import React from 'react';

interface BuffettScoreSummaryProps {
  score: number;
}

export const BuffettScoreSummary: React.FC<BuffettScoreSummaryProps> = ({ score }) => {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold mb-2">
        Buffett-Kompatibilität: {score}%
      </h3>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="h-2.5 rounded-full" 
             style={{
               width: `${score}%`,
               backgroundColor: score >= 75 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
             }}></div>
      </div>
      <p className="text-sm mt-2 text-gray-600">
        {score >= 75 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
        score >= 60 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
        'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
      </p>
      <p className="text-xs mt-2 text-gray-500">
        Die Bewertung spiegelt nicht unbedingt die Qualität des Investments wider und stellt keine Anlageempfehlung dar.
      </p>
    </div>
  );
};
