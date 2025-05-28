
import React from 'react';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Building2, 
  Castle, 
  LineChart, 
  Landmark, 
  Users, 
  DollarSign, 
  Clock,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { extractGptAssessmentStatus } from '@/utils/buffettUtils';

interface CriteriaResult {
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  details: string[];
  gptAnalysis?: string | null;
}

interface BuffettCriteriaProps {
  criteria: {
    businessModel: CriteriaResult;
    economicMoat: CriteriaResult;
    financialMetrics: CriteriaResult;
    financialStability: CriteriaResult;
    management: CriteriaResult;
    valuation: CriteriaResult;
    longTermOutlook: CriteriaResult;
  } | null;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pass':
      return <Check className="text-buffett-green" />;
    case 'warning':
      return <AlertTriangle className="text-buffett-yellow" />;
    case 'fail':
      return <X className="text-buffett-red" />;
    default:
      return null;
  }
};

const CriterionIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'businessModel':
      return <Building2 size={24} className="text-buffett-blue" />;
    case 'economicMoat':
      return <Castle size={24} className="text-buffett-blue" />;
    case 'financialMetrics':
      return <LineChart size={24} className="text-buffett-blue" />;
    case 'financialStability':
      return <Landmark size={24} className="text-buffett-blue" />;
    case 'management':
      return <Users size={24} className="text-buffett-blue" />;
    case 'valuation':
      return <DollarSign size={24} className="text-buffett-blue" />;
    case 'longTermOutlook':
      return <Clock size={24} className="text-buffett-blue" />;
    default:
      return null;
  }
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusStyles = {
    pass: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    fail: "bg-red-100 text-red-800 border-red-300"
  };
  
  const statusLabels = {
    pass: "Erfüllt",
    warning: "Teilweise erfüllt",
    fail: "Nicht erfüllt"
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusStyles[status as keyof typeof statusStyles]}`}>
      {statusLabels[status as keyof typeof statusLabels]}
    </span>
  );
};

// Function to provide explanations for criteria
const getCriteriaExplanation = (name: string) => {
  const explanations = {
    businessModel: "Buffett investiert nur in Unternehmen mit leicht verständlichen Geschäftsmodellen. Komplexe Modelle = höheres Risiko.",
    economicMoat: "Ein wirtschaftlicher Burggraben (Wettbewerbsvorteil) schützt das Unternehmen vor Konkurrenz und sichert langfristige Profitabilität.",
    financialMetrics: "Buffett sucht nach konsistent steigenden Gewinnen, hoher Eigenkapitalrendite und stabilen Margen über mindestens 10 Jahre.",
    financialStability: "Geringe Verschuldung und hohe Liquidität sind entscheidend. Buffett vermeidet übermäßig verschuldete Unternehmen.",
    management: "Das Management sollte aktionärsfreundlich, transparent und rational handeln. Integrität und Kompetenz sind zentral.",
    valuation: "Selbst großartige Unternehmen können zu teuer sein. Buffett kauft nur, wenn der Preis deutlich unter dem inneren Wert liegt.",
    longTermOutlook: "Die Geschäftsgrundlage sollte auch in 10-20 Jahren noch relevant sein. Buffett meidet kurzlebige Trends.",
  };

  return explanations[name as keyof typeof explanations] || "";
};

// Explains how scoring works
const getScoringExplanation = (name: string) => {
  const scoringExplanations = {
    businessModel: "Einfach verständlich (3/3), moderat komplex (2/3), komplex/schwer verständlich (0-1/3)",
    economicMoat: "Starker Burggraben (3/3), moderater Burggraben (2/3), schwacher/kein Burggraben (0-1/3)",
    financialMetrics: "Bewertet nach: ROE (0-3 P.), Gewinnwachstum (0-3 P.), Marge (0-3 P.), EPS (0-3 P.)",
    financialStability: "Bewertet nach: Schulden/EBITDA (0-3 P.), Liquidität (0-3 P.), Kapitalstruktur (0-3 P.)",
    management: "Bewertet nach: Kapitalallokation (0-4 P.), Aktionärsorientierung (0-4 P.), Transparenz (0-4 P.)",
    valuation: "Bewertet nach: KGV (0-3 P.), P/B (0-3 P.), P/CF (0-3 P.), Dividendenrendite (0-3 P.)",
    longTermOutlook: "Bewertet nach: Zukunftsfähigkeit (0-4 P.), Innovationskraft (0-4 P.), Marktposition (0-4 P.)",
  };

  return scoringExplanations[name as keyof typeof scoringExplanations] || "";
};

// Key metrics explanation for tooltips
const getMetricExplanation = (metricName: string) => {
  const explanations: Record<string, { description: string, buffettGuideline: string }> = {
    "ROE": {
      description: "Eigenkapitalrendite: Gewinn pro investiertem Euro Eigenkapital",
      buffettGuideline: "Buffett bevorzugt >15%, je höher desto besser"
    },
    "ROIC": {
      description: "Rendite auf investiertes Kapital: Effizienz der Kapitalnutzung",
      buffettGuideline: "Buffett bevorzugt >12%, sollte über Kapitalkosten liegen"
    },
    "Nettomarge": {
      description: "Gewinn nach Steuern pro Euro Umsatz",
      buffettGuideline: "Buffett bevorzugt >10%, höhere Margen = besserer Burggraben"
    },
    "Schulden zu EBITDA": {
      description: "Zeigt, wie schnell Schulden aus Gewinnen zurückgezahlt werden könnten",
      buffettGuideline: "Buffett bevorzugt <2,0, Werte unter 1 sind sehr gut"
    },
    "EPS": {
      description: "Gewinn pro Aktie: Der auf eine einzelne Aktie entfallende Gewinn",
      buffettGuideline: "Buffett sucht stabiles oder steigendes EPS über viele Jahre"
    },
    "KGV": {
      description: "Kurs-Gewinn-Verhältnis: Preis der Aktie im Verhältnis zum Gewinn",
      buffettGuideline: "Buffett bevorzugt KGV <15, idealerweise <12"
    },
    "P/B": {
      description: "Kurs-Buchwert-Verhältnis: Preis im Verhältnis zum Buchwert",
      buffettGuideline: "Buffett bevorzugt P/B <1,5, nahe 1 ist ideal"
    },
    "Turnaround": {
      description: "Unternehmen in Restrukturierung oder grundlegender Neuausrichtung",
      buffettGuideline: "Buffett meidet Turnaround-Situationen, bevorzugt stabile Unternehmen"
    }
  };
  
  return explanations[metricName];
};

const CriterionCard: React.FC<{ 
  name: string, 
  criterion: CriteriaResult,
  index: number
}> = ({ name, criterion, index }) => {
  const { title, description, details } = criterion;
  
  // FIXED: Proper status determination for financial metrics
  let displayStatus = criterion.status;
  
  // For financialMetrics (Criterion 3), force warning status if GPT analysis indicates partial fulfillment
  if (name === 'financialMetrics' && criterion.gptAnalysis) {
    const analysisLower = criterion.gptAnalysis.toLowerCase();
    
    // Look for patterns indicating partial fulfillment (2 von 3 erfüllt)
    if (analysisLower.includes('2 von 3') || 
        analysisLower.includes('von 3 teilaspekten wurden 2 erfüllt') ||
        analysisLower.includes('eps-wachstum nicht erfüllt') ||
        (analysisLower.includes('roe') && analysisLower.includes('nettomarge') && 
         analysisLower.includes('eps') && analysisLower.includes('nicht erfüllt'))) {
      displayStatus = 'warning'; // Force warning status for partial fulfillment
      console.log('Forcing warning status for financial metrics due to partial fulfillment');
    }
  }
  
  // If no specific override, try to get GPT assessment
  if (displayStatus === criterion.status && criterion.gptAnalysis) {
    const gptAssessment = extractGptAssessmentStatus(criterion.gptAnalysis);
    if (gptAssessment) {
      displayStatus = gptAssessment.status;
    }
  }
  
  // Status-basierte Farben für die Karte
  const cardBorderColor = {
    pass: "border-green-300",
    warning: "border-yellow-300",
    fail: "border-red-300"
  }[displayStatus];
  
  const criteriaExplanation = getCriteriaExplanation(name);
  const scoringExplanation = getScoringExplanation(name);
  
  return (
    <div className={`buffett-card mb-4 animate-slide-up ${cardBorderColor}`} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <CriterionIcon name={name} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            <StatusIcon status={displayStatus} />
            <StatusBadge status={displayStatus} />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <Info size={14} className="text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <div className="space-y-2">
                    <p className="font-medium">Buffett-Kriterium: {title}</p>
                    <p>{criteriaExplanation}</p>
                    <div className="text-sm pt-2 border-t border-gray-100 mt-1">
                      <p className="font-medium mb-1">Bewertungssystem:</p>
                      <p>{scoringExplanation}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <p className="text-buffett-subtext mb-4">{description}</p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Details:</h4>
            <ul className="space-y-2">
              {details.map((detail, idx) => {
                // Check if detail contains metrics that need explanation
                const metricsToCheck = ["ROE", "ROIC", "Nettomarge", "Schulden zu EBITDA", "EPS", "KGV", "P/B", "Turnaround"];
                const foundMetric = metricsToCheck.find(metric => detail.includes(metric));
                const hasMetricExplanation = foundMetric && getMetricExplanation(foundMetric);
                
                // FIXED: Fix double USD issue
                let displayDetail = detail;
                if (detail.includes("USD USD")) {
                  displayDetail = detail.replace("USD USD", "USD");
                }
                
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-buffett-subtext mt-0.5">•</span>
                    <div>
                      <span>{displayDetail}</span>
                      
                      {/* Add note for EPS */}
                      {detail.includes("Gewinn pro Aktie:") && (
                        <div className="text-sm text-gray-600 mt-1">
                          → Hinweis: Keine feste Schwelle, dient nur zur Einordnung der Profitabilität
                        </div>
                      )}
                      
                      {hasMetricExplanation && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="ml-1 inline-flex items-center justify-center rounded-full p-0.5 bg-gray-100 hover:bg-gray-200 transition-colors">
                                <HelpCircle size={12} className="text-gray-500" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs p-3">
                              <div className="space-y-2">
                                <p className="font-medium">{foundMetric}</p>
                                <p>{hasMetricExplanation.description}</p>
                                <p className="text-sm pt-2 border-t border-gray-100 mt-1">
                                  <span className="font-medium">Buffett-Richtwert:</span> {hasMetricExplanation.buffettGuideline}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const BuffettCriteria: React.FC<BuffettCriteriaProps> = ({ criteria }) => {
  if (!criteria) return null;
  
  const criteriaEntries = Object.entries(criteria) as [
    keyof typeof criteria, 
    CriteriaResult
  ][];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Buffett-Kriterien Analyse</h2>
      
      {criteriaEntries.map(([name, criterion], index) => (
        <CriterionCard 
          key={name} 
          name={name} 
          criterion={criterion} 
          index={index}
        />
      ))}
    </div>
  );
};

export default BuffettCriteria;
