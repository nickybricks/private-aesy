
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DCFExplanationTooltip } from './DCFExplanationTooltip';
import { BuffettScoreDisplay } from './BuffettScoreDisplay';
import { 
  BuffettCriterionProps, 
  getStatusColor, 
  getStatusBadge, 
  extractKeyInsights,
  extractGptAssessmentStatus,
  deriveScoreFromGptAnalysis
} from '@/utils/buffettUtils';
import { DCFData } from '@/context/StockContextTypes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from "@/components/ui/progress";

interface BuffettCriterionCardProps {
  criterion: BuffettCriterionProps;
  index: number;
}

export const BuffettCriterionCard: React.FC<BuffettCriterionCardProps> = ({ criterion, index }) => {
  // Parse GPT analysis to extract key information
  const { summary, points, partialFulfillment } = extractKeyInsights(criterion.gptAnalysis);
  
  // Get GPT's assessment of fulfillment
  const gptAssessment = criterion.gptAnalysis ? extractGptAssessmentStatus(criterion.gptAnalysis) : undefined;
  
  // Use GPT's assessment to determine the status for this criterion
  let displayStatus = criterion.status;
  if (gptAssessment) {
    displayStatus = gptAssessment.status;
  }
  
  // Calculate the score for this criterion
  const calculatedScore = deriveScoreFromGptAnalysis(criterion);
  
  // Show partial fulfillment visualization if we have the data
  const showPartialFulfillment = partialFulfillment !== null || 
    (gptAssessment && gptAssessment.partialFulfillment !== undefined);
  
  const fulfillmentCount = partialFulfillment?.fulfilled || 
                          (gptAssessment?.partialFulfillment || 0);
  const totalCount = partialFulfillment?.total || 3; // Default to 3 if not specified
  
  // Extract assessment details from GPT analysis
  const criteriaQuestions: {question: string, answer: string, fulfilled: boolean}[] = [];
  
  if (criterion.gptAnalysis) {
    const analysisLines = criterion.gptAnalysis.split('\n');
    let currentQuestion: string | null = null;
    let currentAnswer: string | null = null;
    
    for (const line of analysisLines) {
      // Extract questions
      if (line.includes('Frage') || line.includes('**Frage')) {
        if (currentQuestion && currentAnswer) {
          // Save previous question-answer pair
          const isPositive = 
            currentAnswer.toLowerCase().includes('ja') ||
            currentAnswer.toLowerCase().includes('gut') || 
            currentAnswer.toLowerCase().includes('stark') ||
            currentAnswer.toLowerCase().includes('✅');
          
          criteriaQuestions.push({
            question: currentQuestion,
            answer: currentAnswer,
            fulfilled: isPositive
          });
        }
        
        // Start new question
        currentQuestion = line.replace(/^\*\*Frage \d+:\*\*|^\*\*Frage \d+:\s|^Frage \d+:\s/, '').trim();
        currentAnswer = null;
      }
      // Extract answers
      else if (line.trim().startsWith('-') && currentQuestion) {
        currentAnswer = line.replace(/^-\s*/, '').trim();
      }
    }
    
    // Add the last question-answer pair if it exists
    if (currentQuestion && currentAnswer) {
      const isPositive = 
        currentAnswer.toLowerCase().includes('ja') ||
        currentAnswer.toLowerCase().includes('gut') || 
        currentAnswer.toLowerCase().includes('stark') ||
        currentAnswer.toLowerCase().includes('✅');
      
      criteriaQuestions.push({
        question: currentQuestion,
        answer: currentAnswer,
        fulfilled: isPositive
      });
    }
  }
  
  return (
    <Card key={index} className={`border-l-4 ${getStatusColor(displayStatus)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-lg">{criterion.title}</CardTitle>
            <BuffettScoreDisplay criterion={{
              ...criterion,
              status: displayStatus,
              score: calculatedScore // Use the calculated score
            }} />
            
            {criterion.title === '6. Akzeptable Bewertung' && criterion.dcfData && (
              <DCFExplanationTooltip dcfData={criterion.dcfData as DCFData} />
            )}
          </div>
          <Badge className={getStatusBadge(displayStatus)}>
            {displayStatus === 'pass' ? 'Erfüllt' : 
             displayStatus === 'warning' ? 'Teilweise erfüllt' : 
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
              
              {/* Detail which specific subcriteria are fulfilled */}
              {criteriaQuestions.length > 0 && (
                <div className="mt-2">
                  <ul className="space-y-1">
                    {criteriaQuestions.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        {item.fulfilled ? 
                          <CheckCircle className="text-green-500 h-4 w-4 mt-0.5 mr-1 flex-shrink-0" /> :
                          <XCircle className="text-red-500 h-4 w-4 mt-0.5 mr-1 flex-shrink-0" />
                        }
                        <div>
                          <span className="text-xs font-medium">{item.question}</span>
                          <p className="text-xs text-gray-600">{item.answer}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
