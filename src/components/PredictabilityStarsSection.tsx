import React from 'react';
import { useStock } from '@/context/StockContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

const PredictabilityStarsSection: React.FC = () => {
  const { predictabilityStars, isLoading, hasCriticalDataMissing } = useStock();
  
  // Don't render if loading, has critical data missing, or no predictability data
  if (isLoading || hasCriticalDataMissing || !predictabilityStars) {
    return null;
  }

  const renderStars = (stars: number | 'NR') => {
    if (stars === 'NR') {
      return <span className="text-muted-foreground font-medium">NR</span>;
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

  const getRatingDescription = (stars: number | 'NR') => {
    if (stars === 'NR') return 'Nicht bewertet';
    if (stars >= 4.5) return 'Sehr vorhersehbar';
    if (stars >= 3.5) return 'Gut vorhersehbar';
    if (stars >= 2.5) return 'Moderat vorhersehbar';
    if (stars >= 1.5) return 'Wenig vorhersehbar';
    return 'Nicht vorhersehbar';
  };

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Buffett Predictability Stars</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {renderStars(predictabilityStars.stars)}
              <p className="text-sm text-muted-foreground mt-1">
                {getRatingDescription(predictabilityStars.stars)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">{predictabilityStars.explain.summary}</p>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-2">
            <span>
              {predictabilityStars.explain.data_window_years} Jahre • {predictabilityStars.explain.method}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictabilityStarsSection;