import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import MarginOfSafetyExplanation from './MarginOfSafetyExplanation';
import RatingExplanation from './RatingExplanation';
import { 
  calculateTotalBuffettScore, 
  getBuffettScoreInterpretation,
  BuffettCriteriaProps 
} from '@/utils/buffettUtils';
import { OverallRatingData } from '@/context/StockContextTypes';

interface OverallRatingProps {
  rating: OverallRatingData;
  buffettCriteria?: BuffettCriteriaProps;
}

const OverallRating: React.FC<OverallRatingProps> = ({ rating, buffettCriteria }) => {
  // Use unified Buffett score calculation if criteria are available
  const buffettScore = buffettCriteria ? 
    calculateTotalBuffettScore(buffettCriteria) : 
    0;
  
  const buffettInterpretation = getBuffettScoreInterpretation(buffettScore);
  
  const getRatingColor = (ratingValue: string) => {
    switch (ratingValue) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRatingDescription = (ratingValue: string) => {
    switch (ratingValue) {
      case 'A': return 'Exzellent';
      case 'B': return 'Gut';
      case 'C': return 'Durchschnittlich';
      case 'D': return 'Unter dem Durchschnitt';
      case 'F': return 'Schlecht';
      default: return 'Unbekannt';
    }
  };

  const getMarginIcon = () => {
    if (rating.marginOfSafety.status === 'pass') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (rating.marginOfSafety.status === 'warning') {
      return <Minus className="h-4 w-4 text-yellow-600" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Combined Overall Assessment */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center">
            Gesamtbewertung
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-2">
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <p className="text-sm">
                    Die Gesamtbewertung kombiniert die allgemeine Aktienanalyse mit Warren Buffetts 
                    spezifischen Investmentkriterien für eine umfassende Einschätzung.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Kombinierte Analyse aus allgemeiner Bewertung und Buffett-Kriterien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Rating */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Allgemeine Bewertung</h3>
              <Badge className={`${getRatingColor(rating.overall?.rating || 'F')} text-white`}>
                Note {rating.overall?.rating || 'F'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {getRatingDescription(rating.overall?.rating || 'F')} - {rating.summary || 'Keine Bewertung verfügbar'}
            </p>
            <RatingExplanation />
          </div>

          {/* Buffett Compatibility */}
          {buffettCriteria && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Buffett-Kompatibilität</h3>
                <span className="text-lg font-bold" style={{ color: buffettInterpretation.color }}>
                  {buffettScore.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(buffettScore, 100)} 
                className="h-3"
                style={{ 
                  backgroundColor: '#f3f4f6'
                }}
              />
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: buffettInterpretation.color }} className="font-medium">
                  {buffettInterpretation.label}
                </span>
                <span className="text-gray-500">
                  {buffettInterpretation.description}
                </span>
              </div>
            </div>
          )}

          {/* Valuation Summary */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold">Bewertungsübersicht</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Aktueller Kurs</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(rating.currentPrice, rating.currency)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Intrinsischer Wert</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(rating.intrinsicValue, rating.currency)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Fairer Kaufpreis</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(rating.bestBuyPrice, rating.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Margin of Safety */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                Sicherheitsmarge
                {getMarginIcon()}
              </h3>
              <span className={`text-lg font-bold ${
                rating.marginOfSafety.status === 'pass' ? 'text-green-600' :
                rating.marginOfSafety.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {rating.marginOfSafety.value.toFixed(1)}%
              </span>
            </div>
            <MarginOfSafetyExplanation marginOfSafety={rating.marginOfSafety} />
          </div>

          {/* Disclaimer */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Diese Bewertung stellt keine Anlageempfehlung dar und dient nur zu Informationszwecken.
              Investmententscheidungen sollten auf eigener Recherche und professioneller Beratung basieren.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverallRating;
