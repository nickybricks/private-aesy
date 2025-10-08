import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const BuffettScoreSpiderChart: React.FC = () => {
  // Mock data - replace with actual data from context
  const data = [
    { criterion: 'Profitabilität', score: 85 },
    { criterion: 'Fin. Stärke', score: 70 },
    { criterion: 'Bewertung', score: 60 },
    { criterion: 'Growth', score: 90 },
    { criterion: 'KI Analyse', score: 75 },
  ];

  // Calculate total score (each criterion worth 20 points max)
  const totalScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreFillColor = (score: number) => {
    if (score >= 90) return 'hsl(142, 76%, 36%)'; // green
    if (score >= 80) return 'hsl(48, 96%, 53%)'; // yellow
    if (score >= 70) return 'hsl(25, 95%, 53%)'; // orange
    return 'hsl(0, 84%, 60%)'; // red
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Aesy Score:</CardTitle>
          <div className="text-lg font-bold">
            <span className={getScoreColor(totalScore)}>{totalScore.toFixed(0)}</span>
            <span className="text-foreground"> /100</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="criterion" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke={getScoreFillColor(totalScore)}
              fill={getScoreFillColor(totalScore)}
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BuffettScoreSpiderChart;
