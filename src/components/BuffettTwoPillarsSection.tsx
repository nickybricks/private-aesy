
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type Rating = 'buy' | 'watch' | 'avoid';

interface BuffettAnalysis {
  isBuffettConform: boolean;
  rating: Rating;
  reasoning: string;
  qualityMet: boolean;
  priceMet: boolean;
  qualityAssessment: {
    qualityDescription: string;
  };
}

interface BuffettTwoPillarsSectionProps {
  buffettAnalysis: BuffettAnalysis;
  marginOfSafetyValue: number;
  dynamicSummary: string;
}

const RatingIcon: React.FC<{ isBuffettConform: boolean; rating: Rating }> = ({ 
  isBuffettConform, 
  rating 
}) => {
  if (isBuffettConform) {
    return <CheckCircle size={32} className="text-green-600" />;
  }
  
  switch (rating) {
    case 'watch':
      return <AlertTriangle size={32} className="text-orange-500" />;
    case 'avoid':
      return <XCircle size={32} className="text-red-500" />;
    default:
      return <CheckCircle size={32} className="text-green-600" />;
  }
};

export const BuffettTwoPillarsSection: React.FC<BuffettTwoPillarsSectionProps> = ({
  buffettAnalysis,
  marginOfSafetyValue,
  dynamicSummary
}) => {
  return (
    <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
      <div className="flex items-start gap-4 mb-4">
        <RatingIcon rating={buffettAnalysis.rating} isBuffettConform={buffettAnalysis.isBuffettConform} />
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            {buffettAnalysis.isBuffettConform ? "✅ Buffett-konform" : "Warren Buffetts Zwei-Säulen-Prinzip"}
          </h3>
          <p className="text-gray-700 mb-4">{dynamicSummary}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className={`p-4 rounded-lg border-2 ${buffettAnalysis.qualityMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="font-semibold mb-2">
            {buffettAnalysis.qualityMet ? '✅' : '❌'} 1. Qualität (das Unternehmen)
          </div>
          <div className="text-gray-600 mb-1">
            {buffettAnalysis.qualityAssessment.qualityDescription}
          </div>
          <div className="text-xs text-gray-500">
            Standard: ≥ 85% für "Qualität erfüllt"
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border-2 ${buffettAnalysis.priceMet ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="font-semibold mb-2">
            {buffettAnalysis.priceMet ? '✅' : '❌'} 2. Preis (die Bewertung)
          </div>
          <div className="text-gray-600 mb-1">
            Sicherheitsmarge: {marginOfSafetyValue.toFixed(1)}% 
            {buffettAnalysis.priceMet ? ' (≥ 0% erfüllt)' : ' (< 0%, überbewertet)'}
          </div>
          <div className="text-xs text-gray-500">
            Standard: Positive Sicherheitsmarge
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-600 italic text-center">
          "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price." - Warren Buffett
        </p>
      </div>
    </div>
  );
};
