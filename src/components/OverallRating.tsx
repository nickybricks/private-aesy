
import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  TrendingDown,
  Eye
} from 'lucide-react';

type Rating = 'buy' | 'watch' | 'avoid';

interface OverallRatingProps {
  rating: {
    overall: Rating;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
    // Optional fields for additional metrics
    buffettScore?: number;
    marginOfSafety?: {
      value: number;
      status: 'pass' | 'warning' | 'fail';
    };
    bestBuyPrice?: number;
  } | null;
}

const RatingIcon: React.FC<{ rating: Rating }> = ({ rating }) => {
  switch (rating) {
    case 'buy':
      return <CheckCircle size={40} className="text-buffett-green" />;
    case 'watch':
      return <AlertTriangle size={40} className="text-buffett-yellow" />;
    case 'avoid':
      return <XCircle size={40} className="text-buffett-red" />;
    default:
      return null;
  }
};

const OverallRating: React.FC<OverallRatingProps> = ({ rating }) => {
  if (!rating) return null;
  
  const { overall, summary, strengths, weaknesses, recommendation, buffettScore, marginOfSafety, bestBuyPrice } = rating;
  
  const ratingTitle = {
    buy: 'Kaufen',
    watch: 'Beobachten',
    avoid: 'Vermeiden'
  }[overall];
  
  const ratingColor = {
    buy: 'bg-buffett-green bg-opacity-10 border-buffett-green',
    watch: 'bg-buffett-yellow bg-opacity-10 border-buffett-yellow',
    avoid: 'bg-buffett-red bg-opacity-10 border-buffett-red'
  }[overall];

  // Interpret the rating to show a primary decision factor
  const decisionFactor = overall === 'avoid' && marginOfSafety && marginOfSafety.value < 0 
    ? 'Preis killt das Investment' 
    : overall === 'avoid' && buffettScore && buffettScore < 50
    ? 'Zu wenige Buffett-Kriterien erfüllt'
    : overall === 'watch'
    ? 'Fundamentalwerte gut, aber nicht optimal'
    : 'Preis und Qualität im Einklang';
  
  return (
    <div className="buffett-card animate-fade-in">
      <h2 className="text-2xl font-semibold mb-6">Gesamtbewertung</h2>
      
      <div className={`rounded-xl p-6 border ${ratingColor} mb-6`}>
        <div className="flex items-center gap-4">
          <RatingIcon rating={overall} />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{ratingTitle}</h3>
            <p className="text-buffett-subtext">{summary}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-1 gap-4">
        {buffettScore !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Buffett-Kompatibilität</h4>
            </div>
            <div className="text-2xl font-bold mb-2">{buffettScore}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" 
                   style={{
                     width: `${buffettScore}%`,
                     backgroundColor: buffettScore >= 70 ? '#10b981' : buffettScore >= 40 ? '#f59e0b' : '#ef4444'
                   }}></div>
            </div>
            <div className="text-sm mt-1 text-gray-600">
              {buffettScore >= 70 ? 'Hohe Übereinstimmung mit Buffetts Kriterien' :
              buffettScore >= 40 ? 'Mittlere Übereinstimmung, weitere Analyse empfohlen' :
              'Geringe Übereinstimmung mit Buffetts Investitionskriterien'}
            </div>
          </div>
        )}
        
        {marginOfSafety !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className="text-buffett-blue" />
              <h4 className="font-semibold">Margin of Safety</h4>
            </div>
            <div className="text-2xl font-bold mb-2"
                 style={{
                   color: marginOfSafety.value >= 20 ? '#10b981' : 
                         marginOfSafety.value >= 10 ? '#f59e0b' : '#ef4444'
                 }}>
              {marginOfSafety.value >= 0 ? `+${marginOfSafety.value.toFixed(1)}%` : `${marginOfSafety.value.toFixed(1)}%`}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full" 
                   style={{
                     width: `${Math.min(Math.max(marginOfSafety.value + 30, 0), 100)}%`,
                     backgroundColor: marginOfSafety.value >= 20 ? '#10b981' : 
                                     marginOfSafety.value >= 10 ? '#f59e0b' : '#ef4444'
                   }}></div>
            </div>
            <div className="text-sm">
              {marginOfSafety.status === 'pass' ? 
                'Signifikante Sicherheitsmarge' : 
                marginOfSafety.status === 'warning' ? 
                  'Moderate Sicherheitsmarge' : 
                  'Keine ausreichende Sicherheitsmarge'}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={18} className="text-buffett-blue" />
            <h4 className="font-semibold">Entscheidungsgewichtung</h4>
          </div>
          <div className="text-lg font-medium">{decisionFactor}</div>
          
          {bestBuyPrice && overall !== 'buy' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm font-medium">Empfohlener Kaufpreis:</div>
              <div className="text-lg font-bold text-buffett-green">{bestBuyPrice.toFixed(2)} €</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-3 text-buffett-green">Stärken</h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-buffett-green">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3 text-buffett-red">Schwächen</h3>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-buffett-red">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Konkrete Empfehlung:</h3>
        <p className="whitespace-pre-line">{recommendation}</p>
      </div>
    </div>
  );
};

export default OverallRating;
