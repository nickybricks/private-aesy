import { QualitativeScores } from "@/context/StockContextTypes";
import { QualitativeCriterionCard } from "@/components/metrics/QualitativeCriterionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { StartDeepResearchButton } from "@/components/StartDeepResearchButton";

interface QualitativeAnalysisTabProps {
  qualitativeScores: QualitativeScores;
}

export const QualitativeAnalysisTab = ({ qualitativeScores }: QualitativeAnalysisTabProps) => {
  const percentage = (qualitativeScores.totalScore / qualitativeScores.maxTotalScore) * 100;
  
  const getOverallStatus = () => {
    if (percentage >= 80) return {
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      label: 'Exzellent'
    };
    if (percentage >= 65) return {
      color: 'text-lime-600 dark:text-lime-400',
      badge: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
      label: 'Gut'
    };
    if (percentage >= 50) return {
      color: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      label: 'Befriedigend'
    };
    return {
      color: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      label: 'Unzureichend'
    };
  };
  
  const status = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Start Analysis Button */}
      <StartDeepResearchButton compact />
      
      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Qualitative KI-Analyse</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                8 Buffett-Kriterien mit 24 Fragen | Gewichtetes Scoring-System
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold mb-1">
                {qualitativeScores.totalScore.toFixed(1)} / {qualitativeScores.maxTotalScore}
              </div>
              <Badge className={status.badge}>
                {status.label}
              </Badge>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${status.color}`}>
                {percentage.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Erfüllungsgrad
              </div>
            </div>
          </div>
          
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                percentage >= 80 ? 'bg-emerald-600' : 
                percentage >= 65 ? 'bg-lime-600' :
                percentage >= 50 ? 'bg-amber-600' : 
                'bg-rose-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Scoring-System:</span> 16 Fragen mit vollem Gewicht (1,0 Punkt), 
              8 Fragen mit halbem Gewicht (0,5 Punkte). 
              <span className="font-medium text-foreground"> Ja</span> = volle Punktzahl, 
              <span className="font-medium text-foreground"> Teilweise</span> = halbe Punktzahl, 
              <span className="font-medium text-foreground"> Nein</span> = 0 Punkte.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Criteria Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {qualitativeScores.criteria.map((criterion) => (
          <QualitativeCriterionCard 
            key={criterion.id}
            criterion={criterion}
          />
        ))}
      </div>
    </div>
  );
};
