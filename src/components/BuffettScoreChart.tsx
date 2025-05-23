
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getBuffettScoreInterpretation } from '@/utils/buffettUtils';

interface BuffettScoreChartProps {
  score: number;
}

export const BuffettScoreChart: React.FC<BuffettScoreChartProps> = ({ score }) => {
  const roundedScore = Math.round(score * 10) / 10;
  const interpretation = getBuffettScoreInterpretation(roundedScore);
  
  const COLORS = [interpretation.color, '#f0f0f0'];
  const data = [
    { name: 'Score', value: roundedScore },
    { name: 'Remaining', value: 100 - roundedScore },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
      <h3 className="text-lg font-semibold mb-4">Buffett-Kompatibilität Visualisierung</h3>
      <div className="flex flex-col md:flex-row items-center">
        <div className="h-48 w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={index === 0 ? 2 : 0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 p-4">
          <div className="text-center md:text-left">
            <h4 className="text-2xl font-bold">{roundedScore}%</h4>
            <p className="text-gray-500 mb-2">Buffett-Kompatibilität</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: interpretation.color }}></div>
                <span>Erfüllte Kriterien</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                <span>Ausbaufähig</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600" style={{ color: interpretation.color }}>
              {interpretation.label}
            </p>
            <p className="text-xs mt-1 text-gray-500">
              {interpretation.description}
            </p>
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Diese Analyse basiert auf öffentlich verfügbaren Daten und ist als Informationsquelle, nicht als Anlageempfehlung zu verstehen.
      </div>
    </div>
  );
};
