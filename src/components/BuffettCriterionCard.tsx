
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DCFExplanationTooltip } from './DCFExplanationTooltip';
import { BuffettScoreDisplay } from './BuffettScoreDisplay';
import { BuffettCriterionProps, getStatusColor, getStatusBadge, extractKeyInsights } from '@/utils/buffettUtils';

interface BuffettCriterionCardProps {
  criterion: BuffettCriterionProps;
  index: number;
}

export const BuffettCriterionCard: React.FC<BuffettCriterionCardProps> = ({ criterion, index }) => {
  const { summary, points } = extractKeyInsights(criterion.gptAnalysis);
  
  return (
    <Card key={index} className={`border-l-4 ${getStatusColor(criterion.status)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-lg">{criterion.title}</CardTitle>
            <BuffettScoreDisplay criterion={criterion} />
            
            {criterion.title === '6. Akzeptable Bewertung' && criterion.dcfData && (
              <DCFExplanationTooltip dcfData={criterion.dcfData} />
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
