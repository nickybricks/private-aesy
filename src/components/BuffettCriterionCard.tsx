
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DCFExplanationTooltip } from './DCFExplanationTooltip';
import { BuffettScoreDisplay } from './BuffettScoreDisplay';
import { 
  BuffettCriterionProps, 
  getStatusColor, 
  getStatusBadge, 
  extractKeyInsights,
  hasInconsistentAnalysis,
  deriveScoreFromGptAnalysis,
  extractGptAssessmentStatus
} from '@/utils/buffettUtils';
import { DCFData } from '@/context/StockContextTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from "@/components/ui/progress";

interface BuffettCriterionCardProps {
  criterion: BuffettCriterionProps;
  index: number;
}

export const BuffettCriterionCard: React.FC<BuffettCriterionCardProps> = ({ criterion, index }) => {
  const { summary, points, partialFulfillment } = extractKeyInsights(criterion.gptAnalysis);
  const inconsistent = hasInconsistentAnalysis(criterion);
  const derivedScore = inconsistent ? deriveScoreFromGptAnalysis(criterion) : undefined;
  
  // Calculate partial fulfillment from GPT analysis if not already available
  const gptAssessment = criterion.gptAnalysis ? extractGptAssessmentStatus(criterion.gptAnalysis) : undefined;
  const showPartialFulfillment = criterion.status === 'warning' && 
    (partialFulfillment || (gptAssessment && gptAssessment.status === 'warning' && gptAssessment.partialFulfillment));
  
  const fulfillmentCount = partialFulfillment?.fulfilled || 
                           (gptAssessment?.partialFulfillment || 0);
  const totalCount = partialFulfillment?.total || 3; // Default to 3 if not specified
  
  return (
    <Card key={index} className={`border-l-4 ${getStatusColor(criterion.status)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-lg">{criterion.title}</CardTitle>
            <BuffettScoreDisplay criterion={criterion} />
            
            {inconsistent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2">
                      <AlertTriangle size={16} className="text-yellow-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-medium">Mögliche Inkonsistenz erkannt</p>
                      <p className="text-sm">
                        Die GPT-Analyse deutet auf {derivedScore === 3 ? 'Erfüllung' : derivedScore === 2 ? 'teilweise Erfüllung' : 'Nichterfüllung'} hin, 
                        aber der Kriterium-Status ist {criterion.status === 'pass' ? 'Erfüllt' : criterion.status === 'warning' ? 'Teilweise erfüllt' : 'Nicht erfüllt'}.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {criterion.title === '6. Akzeptable Bewertung' && criterion.dcfData && (
              <DCFExplanationTooltip dcfData={criterion.dcfData as DCFData} />
            )}
          </div>
          <Badge className={getStatusBadge(criterion.status)}>
            {criterion.status === 'pass' ? 'Erfüllt' : 
             criterion.status === 'warning' ? 'Teilweise erfüllt' : 
             'Nicht erfüllt'}
          </Badge>
        </div>
        <CardDescription>{criterion.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <ul className="list-disc pl-5 space-y-1 mb-3">
            {criterion.details.map((detail, i) => (
              <li key={i} className="text-gray-700">{detail}</li>
            ))}
          </ul>
          
          {showPartialFulfillment && (
            <div className="mt-2 mb-3">
              <div className="flex items-center justify-between mb-1 text-xs text-gray-700">
                <span>Erfüllte Teilaspekte:</span>
                <span className="font-medium">{fulfillmentCount} von {totalCount}</span>
              </div>
              <Progress 
                value={(fulfillmentCount / totalCount) * 100} 
                className="h-2" 
              />
            </div>
          )}
          
          {inconsistent && (
            <div className="mt-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-500" />
                <p className="text-sm text-yellow-700">
                  Die Textanalyse und die Bewertung scheinen widersprüchlich zu sein. Bitte prüfen Sie die Details.
                </p>
              </div>
            </div>
          )}
          
          {criterion.title === '7. Langfristige Perspektive' && criterion.status === 'pass' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-700 font-medium">Zu beachtende Langzeitrisiken:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1 text-sm text-gray-600">
                <li>Mögliche ESG-Regulierungen könnten Rüstungsunternehmen beeinflussen</li>
                <li>Politische Änderungen könnten Verteidigungsbudgets beeinflussen</li>
                <li>Technologischer Wandel könnte bestehende Produkte obsolet machen</li>
              </ul>
            </div>
          )}
          
          {criterion.gptAnalysis && (
            <Collapsible className="mt-3 pt-3 border-t border-gray-200">
              <CollapsibleTrigger className="flex items-center gap-2 mb-2 w-full">
                <Bot size={16} className="text-blue-500" />
                <span className="font-medium text-blue-700">GPT-Analyse</span>
                <ChevronDown className="h-4 w-4 text-blue-500 ml-auto transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-gray-700 gpt-analysis prose prose-sm max-w-none">
                  <ReactMarkdown components={{
                    strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                    p: ({ node, ...props }) => <div className="mb-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-1 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-1 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />
                  }}>
                    {criterion.gptAnalysis}
                  </ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
