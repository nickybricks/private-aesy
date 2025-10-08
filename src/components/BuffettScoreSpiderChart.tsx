import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Placeholder data - wird später mit echten Daten ersetzt
const mockData = [
  { category: 'Rentabilität', value: 85, fullMark: 100 },
  { category: 'Wachstum', value: 70, fullMark: 100 },
  { category: 'Stabilität', value: 90, fullMark: 100 },
  { category: 'Bewertung', value: 65, fullMark: 100 },
  { category: 'Qualität', value: 80, fullMark: 100 },
];

const chartConfig = {
  value: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
};

export const BuffettScoreSpiderChart: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Buffett Score Übersicht</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={mockData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
