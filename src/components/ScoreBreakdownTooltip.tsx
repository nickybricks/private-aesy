
import React from 'react';

interface ScoreBreakdownTooltipProps {
  buffettScore: number;
}

const ScoreBreakdownTooltip: React.FC<ScoreBreakdownTooltipProps> = ({ buffettScore }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Was ist der Buffett-Score?</h4>
      <p>Der Buffett-Score misst die prozentuale Übereinstimmung eines Unternehmens mit Warren Buffetts Investitionskriterien.</p>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <h5 className="font-medium">Bewertungsskala:</h5>
        <ul className="space-y-1 mt-1">
          <li className={`${buffettScore >= 75 ? 'font-medium' : ''}`}>
            <span className={`inline-block w-3 h-3 rounded-full ${buffettScore >= 75 ? 'bg-green-500' : 'bg-gray-200'} mr-1`}></span>
            75-100%: Ausgezeichnete Übereinstimmung
          </li>
          <li className={`${buffettScore >= 60 && buffettScore < 75 ? 'font-medium' : ''}`}>
            <span className={`inline-block w-3 h-3 rounded-full ${buffettScore >= 60 && buffettScore < 75 ? 'bg-yellow-500' : 'bg-gray-200'} mr-1`}></span>
            60-74%: Solide Übereinstimmung
          </li>
          <li className={`${buffettScore < 60 ? 'font-medium' : ''}`}>
            <span className={`inline-block w-3 h-3 rounded-full ${buffettScore < 60 ? 'bg-red-500' : 'bg-gray-200'} mr-1`}></span>
            0-59%: Mangelhafte Übereinstimmung
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ScoreBreakdownTooltip;
