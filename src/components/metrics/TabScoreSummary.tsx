import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricScore {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface TabScoreSummaryProps {
  sector?: string;
  industry?: string;
  metrics: MetricScore[];
  title: string;
  preset?: string;
}

export const TabScoreSummary: React.FC<TabScoreSummaryProps> = ({ 
  sector, 
  industry, 
  metrics,
  title,
  preset
}) => {
  // Calculate total score (weighted)
  const totalScore = metrics.reduce((sum, m) => sum + (m.score * m.weight / m.maxScore), 0);
  const maxTotalScore = metrics.reduce((sum, m) => sum + m.weight, 0);
  const scorePercentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;

  // Determine color based on percentage
  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Card className={`border-2 ${getBgColor(scorePercentage)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {(sector || industry || preset) && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {sector && (
                  <Badge variant="secondary" className="text-xs">
                    {sector}
                  </Badge>
                )}
                {industry && sector !== industry && (
                  <Badge variant="outline" className="text-xs">
                    {industry}
                  </Badge>
                )}
                {preset && (
                  <Badge variant="default" className="text-xs">
                    Preset: {preset}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(scorePercentage)}`}>
              {totalScore.toFixed(1)}/{maxTotalScore}
            </div>
            <div className="text-sm text-muted-foreground">
              Punkte ({scorePercentage.toFixed(0)}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-semibold text-muted-foreground mb-3">
            Einzelbewertungen:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {metrics.map((metric, index) => {
              const metricPercentage = metric.maxScore > 0 ? (metric.score / metric.maxScore) * 100 : 0;
              const metricColor = getScoreColor(metricPercentage);
              const weightedScore = (metric.score * metric.weight / metric.maxScore).toFixed(1);
              
              return (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-md bg-background/50 border"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground truncate pr-2">
                      {metric.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Gewicht: {metric.weight}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-semibold ${metricColor} whitespace-nowrap`}>
                      {metric.score}/{metric.maxScore}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      = {weightedScore} Pkt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
