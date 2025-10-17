import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface BuffettScoreSpiderChartProps {
  onTabChange?: (tab: string) => void;
  profitabilityScore?: number;  // 0-20
  financialStrengthScore?: number; // 0-20
  valuationScore?: number; // 0-20
}

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

const BuffettScoreSpiderChart: React.FC<BuffettScoreSpiderChartProps> = ({ 
  onTabChange,
  profitabilityScore = 0,
  financialStrengthScore = 0,
  valuationScore = 0
}) => {
  // Mix of real data (Profitability, Financial Strength, Valuation) and mock data (Growth, KI)
  const data = [
    { criterion: 'Profitabilität', score: profitabilityScore, tabValue: 'profitability' },
    { criterion: 'Fin. Stärke', score: financialStrengthScore, tabValue: 'financial-strength' },
    { criterion: 'Bewertung', score: valuationScore, tabValue: 'valuation' },
    { criterion: 'Growth', score: 18, tabValue: 'growth-rank' },
    { criterion: 'KI Analyse', score: 15, tabValue: 'ai-analysis' },
  ];

  const handleLabelClick = (tabValue: string) => {
    if (onTabChange) {
      onTabChange(tabValue);
    }
  };

  // Calculate total score (sum of all 5 criteria, max 100 points)
  const totalScore = data.reduce((sum, item) => sum + item.score, 0);

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
    <div className="relative w-full h-[220px]">
      <ResponsiveContainer width="100%" height={200}>
          <RadarChart 
            data={data}
            cx={150} 
            cy={100}
          >
            <PolarGrid 
              stroke="hsl(var(--border))" 
              gridType="circle"
            />
            
            <PolarAngleAxis 
              dataKey="criterion" 
              tick={(props: any) => {
                const { x, y, payload, index } = props;
                const centerX = 150;
                const centerY = 100;
                
                // Calculate angle for this label
                const numSlices = data.length;
                const angleStep = (2 * Math.PI) / numSlices;
                const startAngle = -Math.PI / 2; // Start at top
                const angle = startAngle + (index * angleStep);
                
                // Position label further out (around the polar grid)
                const labelRadius = 95; // Distance from center
                const labelX = centerX + labelRadius * Math.cos(angle);
                const labelY = centerY + labelRadius * Math.sin(angle);
                
                // Calculate rotation angle (in degrees) to follow the circle
                const rotationDeg = (angle * 180 / Math.PI) + 90;
                
                // Determine if text should be upside down and flip it
                const shouldFlip = rotationDeg > 90 && rotationDeg < 270;
                const finalRotation = shouldFlip ? rotationDeg + 180 : rotationDeg;
                
                return (
                  <g>
                    <text
                      x={labelX}
                      y={labelY}
                      fill="hsl(var(--foreground))"
                      fontSize={11}
                      fontWeight="500"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${finalRotation}, ${labelX}, ${labelY})`}
                      style={{ letterSpacing: '0.5px' }}
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 20]}
              tick={false}
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
                
                const centerX = 150;
                const centerY = 100;
                const outerRadius = 85; // Distance to outer grid
                const numSlices = data.length;
                const angleStep = (2 * Math.PI) / numSlices;
                const startAngle = -Math.PI / 2; // Start at top (12 o'clock)
                
                const path = createSmoothPath(points);
                return (
                  <>
                    {/* Render clickable pizza slices centered on labels */}
                    {data.map((item, index) => {
                      // Calculate angles for this slice (centered on the label)
                      const baseAngle = startAngle + (index * angleStep);
                      const sliceStartAngle = baseAngle - (angleStep / 2);
                      const sliceEndAngle = baseAngle + (angleStep / 2);
                      
                      // Calculate outer points
                      const startX = centerX + outerRadius * Math.cos(sliceStartAngle);
                      const startY = centerY + outerRadius * Math.sin(sliceStartAngle);
                      const endX = centerX + outerRadius * Math.cos(sliceEndAngle);
                      const endY = centerY + outerRadius * Math.sin(sliceEndAngle);
                      
                      // Create arc path for pizza slice
                      const pathData = `
                        M ${centerX},${centerY}
                        L ${startX},${startY}
                        A ${outerRadius} ${outerRadius} 0 0 1 ${endX},${endY}
                        Z
                      `;
                      
                      return (
                        <path
                          key={`slice-${index}`}
                          d={pathData}
                          fill="transparent"
                          className="cursor-pointer hover:fill-muted/70 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLabelClick(item.tabValue);
                          }}
                        />
                      );
                    })}
                    
                    {/* The actual radar shape on top */}
                    <path
                      d={path}
                      fill={getScoreFillColor(totalScore)}
                      fillOpacity={0.3}
                      stroke={getScoreFillColor(totalScore)}
                      strokeWidth={2}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default BuffettScoreSpiderChart;
