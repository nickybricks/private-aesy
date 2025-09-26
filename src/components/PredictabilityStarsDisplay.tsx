import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { PredictabilityResult } from '@/services/PredictabilityStarsService';

interface PredictabilityStarsDisplayProps {
  result: PredictabilityResult;
  className?: string;
}

const PredictabilityStarsDisplay: React.FC<PredictabilityStarsDisplayProps> = ({ 
  result, 
  className = '' 
}) => {
  const renderStars = (stars: number | 'NR') => {
    if (stars === 'NR') {
      return (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground font-medium">NR</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Nicht bewertet - unzureichende Datenlage</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;
    const totalStars = 5;

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: totalStars }, (_, index) => {
          const starIndex = index + 1;
          let starClass = 'text-muted-foreground/30';
          
          if (starIndex <= fullStars) {
            starClass = 'text-yellow-500 fill-yellow-500';
          } else if (starIndex === fullStars + 1 && hasHalfStar) {
            starClass = 'text-yellow-500 fill-yellow-500/50';
          }
          
          return (
            <Star key={index} size={16} className={starClass} />
          );
        })}
        <span className="ml-2 font-semibold text-lg">
          {typeof stars === 'number' ? stars.toFixed(1) : 'NR'}
        </span>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingDescription = (stars: number | 'NR') => {
    if (stars === 'NR') return 'Nicht bewertet';
    if (stars >= 4.5) return 'Sehr vorhersehbar';
    if (stars >= 3.5) return 'Gut vorhersehbar';
    if (stars >= 2.5) return 'Moderat vorhersehbar';
    if (stars >= 1.5) return 'Wenig vorhersehbar';
    return 'Nicht vorhersehbar';
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Buffett Predictability Stars</CardTitle>
          {result.flags.on_watch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle size={12} />
              On Watch
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Rating */}
        <div className="flex items-center justify-between">
          <div>
            {renderStars(result.stars)}
            <p className="text-sm text-muted-foreground mt-1">
              {getRatingDescription(result.stars)}
            </p>
          </div>
          
          {typeof result.stars === 'number' && result.score.percentile && (
            <div className="text-right">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-sm font-medium">
                      Top {(100 - result.score.percentile).toFixed(1)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Perzentil: {result.score.percentile.toFixed(1)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">{result.explain.summary}</p>
        </div>

        {/* Watch Reasons */}
        {result.flags.on_watch && result.flags.watch_reasons.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="font-medium text-yellow-800">Beobachtung erforderlich</span>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {result.flags.watch_reasons.map((reason, index) => (
                <li key={index}>
                  • {reason === 'residual_spike' ? 'Jüngste Abweichungen vom historischen Trend' : 
                     reason === 'variance_jump' ? 'Erhöhte Volatilität in letzten Jahren' : reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Metrics */}
        {typeof result.stars === 'number' && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <h4 className="font-medium text-sm mb-2">Trendstabilität (R²)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Umsatz/Aktie:</span>
                  <span className={getScoreColor(result.score.trend_r2.rps)}>
                    {(result.score.trend_r2.rps * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EBITDA/Aktie:</span>
                  <span className={getScoreColor(result.score.trend_r2.ebitda_ps)}>
                    {(result.score.trend_r2.ebitda_ps * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Wachstumsvolatilität</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Umsatz σ:</span>
                  <span className={getScoreColor(1 - result.score.sigma_growth.rps)}>
                    {(result.score.sigma_growth.rps * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EBITDA σ:</span>
                  <span className={getScoreColor(1 - result.score.sigma_growth.ebitda_ps)}>
                    {(result.score.sigma_growth.ebitda_ps * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Composite Score */}
        {typeof result.stars === 'number' && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium">Composite Score:</span>
            <span className={`font-semibold ${getScoreColor(result.score.composite)}`}>
              {result.score.composite.toFixed(3)}
            </span>
          </div>
        )}

        {/* Flags */}
        {result.flags.has_operating_loss && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            <TrendingDown size={16} />
            <span>Operatives Verlustjahr erkannt</span>
          </div>
        )}

        {/* Method Info */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 cursor-help">
                  <Info size={12} />
                  <span>
                    {result.explain.data_window_years} Jahre • {result.explain.method}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Analyse basiert auf {result.explain.data_window_years} Jahren historischer 
                  Umsatz- und EBITDA-Daten pro Aktie. Methodik umfasst lineare Trendanalyse, 
                  Volatilitätsmessung und Strukturbrucherkennug.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictabilityStarsDisplay;