
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

interface RatingExplanationProps {
  rating?: 'buy' | 'watch' | 'avoid';
}

const RatingExplanation: React.FC<RatingExplanationProps> = ({ rating }) => {
  const getExplanationText = () => {
    switch (rating) {
      case 'buy':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Kaufempfehlung</h4>
            <p>Diese Aktie erfüllt die Buffett-Kriterien für Qualität und wird unter ihrem inneren Wert gehandelt.</p>
            <p>Zu beachten:</p>
            <ul className="list-disc pl-4">
              <li>Hoher Buffett-Score (≥75%)</li>
              <li>Signifikante Sicherheitsmarge (>20%)</li>
              <li>Günstiger Preis im Verhältnis zum inneren Wert</li>
            </ul>
          </div>
        );
      case 'watch':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Beobachten</h4>
            <p>Diese Aktie hat gute Fundamentaldaten, aber der Preis bietet nicht genug Sicherheitsmarge.</p>
            <p>Zu beachten:</p>
            <ul className="list-disc pl-4">
              <li>Guter bis sehr guter Buffett-Score</li>
              <li>Aktuell zu teuer oder nur leicht unterbewertet</li>
              <li>Beobachten und bei Kursrückgang neu bewerten</li>
            </ul>
          </div>
        );
      case 'avoid':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Vermeiden</h4>
            <p>Diese Aktie entspricht nicht Buffetts Investmentstil oder ist deutlich überbewertet.</p>
            <p>Zu beachten:</p>
            <ul className="list-disc pl-4">
              <li>Niedriger Buffett-Score oder</li>
              <li>Keine Sicherheitsmarge (überbewertet)</li>
              <li>Bessere Alternativen suchen</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">Bewertungssystem</h4>
            <p>Die Gesamtbewertung basiert auf:</p>
            <ul className="list-disc pl-4">
              <li>Buffett-Kompatibilität: Qualitätskriterien</li>
              <li>Margin of Safety: Unterbewertung</li>
              <li>Kombination aus beiden Faktoren</li>
            </ul>
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
            <HelpCircle size={16} className="text-gray-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {getExplanationText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RatingExplanation;
