
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

const MarginOfSafetyExplanation: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <HelpCircle size={14} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <h4 className="font-semibold">Sicherheitsmarge (Margin of Safety)</h4>
            <p>Nach Benjamin Graham und Warren Buffett sollten Aktien nur mit einem Abschlag zum inneren Wert gekauft werden.</p>
            <ul className="list-disc pl-4 text-sm">
              <li>Schützt vor Bewertungsfehlern</li>
              <li>Erhöht langfristiges Renditepotential</li>
              <li>Reduziert Verlustrisiko</li>
            </ul>
            <p className="text-sm font-medium">Buffett empfiehlt mindestens 20% Sicherheitsmarge.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MarginOfSafetyExplanation;
