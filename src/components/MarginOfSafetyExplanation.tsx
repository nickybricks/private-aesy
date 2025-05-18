
import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MarginOfSafetyExplanation: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Info size={14} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold">Margin of Safety</h4>
            <p>Eine Sicherheitsmarge zwischen Kaufpreis und innerem Wert hilft:</p>
            <ul className="list-disc pl-4">
              <li>Bewertungsfehler zu kompensieren</li>
              <li>Höhere Renditen zu ermöglichen</li>
              <li>Risiken zu minimieren</li>
            </ul>
            <p className="text-sm italic">
              "Margin of safety - meaning don't try to drive a 9,800-pound truck over a bridge 
              that says, 'Capacity: 10,000 pounds.' But go down the road a little bit and find 
              one that says, 'Capacity: 15,000 pounds.'" - Warren Buffett
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MarginOfSafetyExplanation;
