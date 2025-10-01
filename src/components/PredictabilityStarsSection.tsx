import React, { useState } from 'react';
import { useStock } from '@/context/StockContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PredictabilityStarsSection: React.FC = () => {
  const { predictabilityStars, isLoading, hasCriticalDataMissing } = useStock();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Don't render if loading, has critical data missing, or no predictability data
  if (isLoading || hasCriticalDataMissing || !predictabilityStars) {
    return null;
  }

  const renderStars = (stars: number | 'NR', clickable: boolean = false) => {
    if (stars === 'NR') {
      return <span className="text-muted-foreground font-medium">NR</span>;
    }

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;
    const totalStars = 5;

    return (
      <div 
        className={`flex items-center gap-1 ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={clickable ? () => setDialogOpen(true) : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => e.key === 'Enter' && setDialogOpen(true) : undefined}
      >
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
        {clickable && <Info size={14} className="ml-1 text-muted-foreground" />}
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
    <>
      <div className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Buffett Predictability Stars</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {renderStars(predictabilityStars.stars, true)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={20} />
              Buffett Predictability Stars - Berechnungsmethode
            </DialogTitle>
            <DialogDescription>
              So wird die Vorhersagbarkeit der Unternehmensgewinne berechnet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2">Bewertung</h4>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {renderStars(predictabilityStars.stars)}
                <span className="text-sm text-muted-foreground">
                  {getRatingDescription(predictabilityStars.stars)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Zusammenfassung</h4>
              <p className="text-sm text-muted-foreground">
                {predictabilityStars.explain.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-1">Analysezeitraum</h4>
                <p className="text-sm text-muted-foreground">
                  {predictabilityStars.explain.data_window_years} Jahre
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Methode</h4>
                <p className="text-sm text-muted-foreground">
                  {predictabilityStars.explain.method}
                </p>
              </div>
            </div>

            {(predictabilityStars.explain as any).calculation_details && (
              <div>
                <h4 className="font-semibold mb-2">Berechnungsdetails</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  {Object.entries((predictabilityStars.explain as any).calculation_details).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-muted/30 rounded">
                      <span className="font-medium">{key}:</span>
                      <span>{typeof value === 'number' ? (value as number).toFixed(2) : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Bewertungsskala</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span>≥ 4.5 Sterne: Sehr vorhersehbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 4 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span>≥ 3.5 Sterne: Gut vorhersehbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 3 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span>≥ 2.5 Sterne: Moderat vorhersehbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 2 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span>≥ 1.5 Sterne: Wenig vorhersehbar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 1 }, (_, i) => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />)}</div>
                  <span>&lt; 1.5 Sterne: Nicht vorhersehbar</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setDialogOpen(false)} 
              className="w-full"
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PredictabilityStarsSection;