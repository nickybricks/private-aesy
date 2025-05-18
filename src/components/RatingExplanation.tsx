
import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Rating = 'buy' | 'watch' | 'avoid';

interface RatingExplanationProps {
  rating: Rating;
}

const RatingExplanation: React.FC<RatingExplanationProps> = ({ rating }) => {
  const explanationText = {
    buy: 'Diese Aktie erfüllt Warren Buffetts Qualitäts- und Bewertungskriterien. Ein Kauf könnte jetzt attraktiv sein.',
    watch: 'Die Aktie zeigt Qualität, bietet aber aktuell keine ausreichende Sicherheitsmarge oder hat Schwächen. Beobachten Sie den Kurs für einen besseren Einstieg.',
    avoid: 'Dieser Wert entspricht nicht ausreichend Buffetts Kriterien oder ist zu teuer. Eine Investition wird nicht empfohlen.'
  }[rating];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Info size={16} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <h4 className="font-semibold mb-1">Was bedeutet "{rating === 'buy' ? 'Kaufen' : rating === 'watch' ? 'Beobachten' : 'Vermeiden'}"?</h4>
          <p>{explanationText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RatingExplanation;
