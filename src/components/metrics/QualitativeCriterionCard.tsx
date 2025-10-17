import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { QualitativeCriterion } from "@/context/StockContextTypes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface QualitativeCriterionCardProps {
  criterion: QualitativeCriterion;
}

export const QualitativeCriterionCard = ({ criterion }: QualitativeCriterionCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const percentage = (criterion.score / criterion.maxScore) * 100;
  
  const getStatusColor = () => {
    if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };
  
  const getStatusBadge = () => {
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    if (percentage >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
  };
  
  const getAnswerIcon = (answer: string) => {
    switch (answer) {
      case 'yes':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
      case 'no':
        return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />;
      default:
        return <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />;
    }
  };
  
  const getAnswerPoints = (answer: string, weight: number) => {
    if (answer === 'yes') return weight;
    if (answer === 'partial') return weight / 2;
    return 0;
  };

  return (
    <Card className="overflow-hidden border-border/60 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-base font-semibold leading-tight">
            {criterion.title}
          </CardTitle>
          <Badge variant="secondary" className={getStatusBadge()}>
            {criterion.score.toFixed(1)} / {criterion.maxScore.toFixed(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                percentage >= 80 ? 'bg-emerald-600' : 
                percentage >= 50 ? 'bg-amber-600' : 
                'bg-rose-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {criterion.questions.map((q, index) => {
          const points = getAnswerPoints(q.answer, q.weight);
          
          return (
            <Collapsible key={index}>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                {getAnswerIcon(q.answer)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium leading-tight">
                      {q.question}
                    </p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {points.toFixed(1)} / {q.weight.toFixed(1)}
                    </Badge>
                  </div>
                  
                  {q.evidence && (
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                      <span>Begründung anzeigen</span>
                      {isOpen ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </CollapsibleTrigger>
                  )}
                  
                  <CollapsibleContent>
                    <div className="mt-2 p-2 bg-background/50 rounded text-xs text-muted-foreground border border-border/40">
                      {q.evidence}
                    </div>
                  </CollapsibleContent>
                </div>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};
