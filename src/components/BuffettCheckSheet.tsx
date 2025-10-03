import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';

interface BuffettCriterion {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  value: string;
  threshold: string;
  explanation: string;
}

interface BuffettCheckSheetProps {
  criteria: BuffettCriterion[];
  children: React.ReactNode;
}

const BuffettCheckSheet: React.FC<BuffettCheckSheetProps> = ({ criteria, children }) => {
  const passCount = criteria.filter(c => c.status === 'pass').length;
  
  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <X className="h-4 w-4 text-red-600" />;
    }
  };
  
  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
    }
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Buffett-Kriterien im Detail</SheetTitle>
          <SheetDescription>
            {passCount} von {criteria.length} Kriterien erfüllt
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {criteria.map((criterion, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getStatusColor(criterion.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(criterion.status)}
                  <h4 className="font-semibold text-sm">{criterion.name}</h4>
                </div>
                <Badge variant="outline" className="text-xs">
                  {criterion.value}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs">
                <p className="text-gray-700">
                  <span className="font-medium">Schwelle:</span> {criterion.threshold}
                </p>
                <p className="text-gray-600">{criterion.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BuffettCheckSheet;
