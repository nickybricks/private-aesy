import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Dot } from 'recharts';

// Helper function to create smooth curved path using Catmull-Rom splines
const createSmoothPath = (points: Array<{x: number, y: number}>) => {
  if (points.length < 3) return '';
  
  const tension = 0.4; // Controls curve smoothness
  
  // Helper to get point with wrapping for closed path
  const getPoint = (index: number) => {
    const wrappedIndex = ((index % points.length) + points.length) % points.length;
    return points[wrappedIndex];
  };
  
  // Start path
  let path = `M ${points[0].x},${points[0].y}`;
  
  // Create smooth curves through all points
  for (let i = 0; i < points.length; i++) {
    const p0 = getPoint(i - 1);
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(i + 2);
    
    // Calculate control points using Catmull-Rom to Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
    
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  
  return path + ' Z';
};

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
    if (score >= 95) return 'text-green-700';
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreFillColor = (score: number) => {
    if (score >= 95) return 'hsl(142, 70%, 30%)'; // dark green
    if (score >= 85) return 'hsl(142, 76%, 36%)'; // green
    if (score >= 75) return 'hsl(48, 96%, 53%)'; // yellow
    if (score >= 60) return 'hsl(25, 95%, 53%)'; // orange
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
            <PolarGrid 
              stroke="hsl(var(--border))" 
              gridType="circle"
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
            <Radar
              name="Score"
              dataKey="score"
              stroke={getScoreFillColor(totalScore)}
              fill={getScoreFillColor(totalScore)}
              fillOpacity={0.3}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
              shape={(props: any) => {
                const { points } = props;
                if (!points || points.length === 0) return null;
                
                const path = createSmoothPath(points);
                return (
                  <path
                    d={path}
                    fill={getScoreFillColor(totalScore)}
                    fillOpacity={0.3}
                    stroke={getScoreFillColor(totalScore)}
                    strokeWidth={2}
                  />
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BuffettScoreSpiderChart;
