import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const BuffettScoreSpiderChart: React.FC = () => {
  // Mock data - replace with actual data from context
  const baseData = [
    { criterion: 'Profitabilität', score: 85 },
    { criterion: 'Fin. Stärke', score: 70 },
    { criterion: 'Bewertung', score: 60 },
    { criterion: 'Growth', score: 90 },
    { criterion: 'KI Analyse', score: 75 },
  ];

  // Add background zones to data
  const data = baseData.map(item => ({
    ...item,
    zone100: 100,
    zone90: 90,
    zone80: 80,
    zone70: 70,
  }));

  // Calculate total score (each criterion worth 20 points max)
  const totalScore = baseData.reduce((sum, item) => sum + item.score, 0) / baseData.length;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
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
            {/* Background layers for color zones - Green (outermost) */}
            <Radar
              dataKey="zone100"
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.15}
              stroke="none"
            />
            {/* Yellow zone */}
            <Radar
              dataKey="zone90"
              fill="hsl(48, 96%, 53%)"
              fillOpacity={0.15}
              stroke="none"
            />
            {/* Orange zone */}
            <Radar
              dataKey="zone80"
              fill="hsl(25, 95%, 53%)"
              fillOpacity={0.15}
              stroke="none"
            />
            {/* Red zone (innermost) */}
            <Radar
              dataKey="zone70"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.15}
              stroke="none"
            />
            <PolarAngleAxis 
              dataKey="criterion" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            {/* Actual data */}
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.5}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BuffettScoreSpiderChart;
