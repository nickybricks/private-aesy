
import React, { useState, useEffect } from 'react';
import { useStock } from '@/context/StockContext';
import { Progress } from '@/components/ui/progress';

const LoadingSection: React.FC = () => {
  const { isLoading, loadingProgress, loadingStartTime } = useStock();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading || !loadingStartTime) {
      setElapsedTime(0);
      setEstimatedTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - loadingStartTime) / 1000);
      setElapsedTime(elapsed);

      // Schätze verbleibende Zeit basierend auf Fortschritt
      if (loadingProgress > 0 && loadingProgress < 100) {
        const totalEstimatedTime = (elapsed / loadingProgress) * 100;
        const remaining = Math.max(0, Math.ceil(totalEstimatedTime - elapsed));
        setEstimatedTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, loadingStartTime, loadingProgress]);

  if (!isLoading) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center max-w-md w-full">
        <div 
          className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-6" 
          role="status"
        ></div>
        
        <p className="text-lg font-medium mb-2">Analysiere Aktie nach Warren Buffett's Kriterien...</p>
        
        <div className="mb-4">
          <Progress value={loadingProgress} className="w-full mb-2" />
          <p className="text-sm text-muted-foreground">
            {Math.round(loadingProgress)}% abgeschlossen
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Verstrichene Zeit: {formatTime(elapsedTime)}</p>
          {estimatedTimeRemaining !== null && (
            <p>Geschätzte verbleibende Zeit: {formatTime(estimatedTimeRemaining)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingSection;
