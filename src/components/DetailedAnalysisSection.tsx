
import React from 'react';
import { CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface DetailedAnalysisSectionProps {
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
}

export const DetailedAnalysisSection: React.FC<DetailedAnalysisSectionProps> = ({
  strengths,
  weaknesses,
  reasoning
}) => {
  return (
    <div className="mb-8 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <h3 className="font-semibold mb-4 text-lg">Detailanalyse</h3>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            Stärken
          </h4>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
            <XCircle size={16} className="text-red-600" />
            Schwächen
          </h4>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 size={16} className="text-blue-600" />
          <span className="font-medium">Fazit:</span>
          <span className="text-gray-700">{reasoning}</span>
        </div>
      </div>
    </div>
  );
};
