import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RatingSection from '@/components/RatingSection';
import CriteriaTabsSection from '@/components/CriteriaTabsSection';
import { useStock } from '@/context/StockContext';

export const BuffettTab: React.FC = () => {
  const { buffettCriteria, hasCriticalDataMissing } = useStock();

  if (hasCriticalDataMissing) {
    return (
      <Card className="glass">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            Unzureichende Daten für Buffett-Analyse. Bitte wählen Sie eine andere Aktie.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <RatingSection />

      {/* Detailed Criteria Analysis */}
      <CriteriaTabsSection />
    </div>
  );
};
