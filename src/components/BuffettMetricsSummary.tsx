import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle } from 'lucide-react';
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
}

interface BuffettMetricsSummaryProps {
  criteria: BuffettCriterion[];
}

const BuffettMetricsSummary: React.FC<BuffettMetricsSummaryProps> = ({ criteria }) => {
  const passCount = criteria.filter(c => c.status === 'pass').length;
  const totalCount = criteria.length;
  
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
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Buffett-Check</h3>
          <Badge variant="outline" className="bg-white">
            {passCount}/{totalCount} ✓
          </Badge>
        </div>
      </div>
      
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {criteria.map((criterion, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`cursor-help transition-colors ${getStatusColor(criterion.status)}`}
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
    </div>
  );
};

export default BuffettMetricsSummary;
