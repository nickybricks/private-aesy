import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import BuffettCheckSheet from './BuffettCheckSheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BuffettCriterion {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  threshold: string;
  explanation?: string;
}

interface BuffettMetricsSummaryProps {
  criteria: BuffettCriterion[];
  onFilterChange?: (filter: string | null) => void;
}

const BuffettMetricsSummary: React.FC<BuffettMetricsSummaryProps> = ({ criteria, onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const passCount = criteria.filter(c => c.status === 'pass').length;
  const totalCount = criteria.length;
  const progressValue = (passCount / totalCount) * 100;
  
  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <Check className="h-3 w-3" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3" />;
      case 'fail':
        return <X className="h-3 w-3" />;
    }
  };
  
  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
    }
  };
  
  const handlePillClick = (criterionName: string) => {
    const newFilter = activeFilter === criterionName ? null : criterionName;
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };
  
  // Enrich criteria with explanations
  const enrichedCriteria = criteria.map(c => ({
    ...c,
    explanation: c.explanation || `Buffett bevorzugt ${c.name} ${c.threshold}`
  }));
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Buffett-Check</h3>
          <Badge variant="outline" className="bg-white font-semibold">
            {passCount}/{totalCount} Kriterien erfüllt
          </Badge>
          <BuffettCheckSheet criteria={enrichedCriteria}>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              Warum {passCount}?
            </button>
          </BuffettCheckSheet>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <Progress value={progressValue} className="h-2" />
        <p className="text-xs text-gray-600 mt-1">
          {progressValue.toFixed(0)}% der Buffett-Kriterien erfüllt
        </p>
      </div>
      
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {criteria.map((criterion, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`cursor-pointer transition-all ${getStatusColor(criterion.status)} ${
                    activeFilter === criterion.name ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                  }`}
                  onClick={() => handlePillClick(criterion.name)}
                >
                  <span className="flex items-center gap-1">
                    {getStatusIcon(criterion.status)}
                    <span className="text-xs font-medium">{criterion.name}</span>
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="text-xs font-semibold">{criterion.name}</p>
                  <p className="text-xs">Wert: {criterion.value}</p>
                  <p className="text-xs text-gray-600">Schwelle: {criterion.threshold}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      
      {activeFilter && (
        <p className="text-xs text-blue-700 mt-3">
          Gefiltert nach: <span className="font-semibold">{activeFilter}</span> • Klicken Sie erneut, um den Filter zu entfernen
        </p>
      )}
    </div>
  );
};

export default BuffettMetricsSummary;
