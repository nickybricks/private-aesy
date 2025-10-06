
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
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
  getUnifiedCriterionScore
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
  
  // Use the unified scoring function to get the consistent score
  const unifiedScore = getUnifiedCriterionScore(criterion);
  
  console.log(`BuffettCriterionCard - ${criterion.title}: unified score=${unifiedScore}`);
  
  // Determine status: Use GPT assessment if available, otherwise derive from score for financial criteria
  let displayStatus = criterion.status;
  
  if (gptAssessment) {
    displayStatus = gptAssessment.status;
  } else {
    // For ALL criteria without GPT analysis, determine status from score
    const criterionNumber = criterion.title.match(/^\d+/)?.[0];
    const criterionNum = criterionNumber ? parseInt(criterionNumber, 10) : 0;
    
    if ([3, 4, 6].includes(criterionNum)) {
      // Financial criteria thresholds
      if (unifiedScore >= 10) {
        displayStatus = 'pass';
      } else if (unifiedScore >= 6.5) { // Changed from 7 to 6.5 to include 6.67
        displayStatus = 'warning';
      } else {
        displayStatus = 'fail';
      }
      
      console.log(`Financial criterion ${criterionNum}: score=${unifiedScore}, status=${displayStatus}`);
    }
  }
  
  // ADDITIONAL FIX: For ALL criteria, if we have a score, validate status consistency
  if (unifiedScore !== undefined && !gptAssessment) {
    // Apply universal thresholds for consistency
    if (unifiedScore >= 10) {
      displayStatus = 'pass';
    } else if (unifiedScore > 0 && unifiedScore < 10) { // Any partial score should be warning
      displayStatus = 'warning';
    } else if (unifiedScore === 0) {
      displayStatus = 'fail';
    }
    
    console.log(`Universal threshold applied for ${criterion.title}: score=${unifiedScore}, status=${displayStatus}`);
  }
  
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
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-base">{criterion.title}</CardTitle>
            <BuffettScoreDisplay criterion={{
              ...criterion,
              status: displayStatus,
              score: unifiedScore // Use the unified score
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
        <CardDescription className="text-xs">{criterion.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-1 text-xs">
          <ul className="list-disc pl-4 space-y-0.5 mb-2">
            {criterion.details.map((detail, i) => (
              <li key={i} className="text-gray-700">{detail}</li>
            ))}
          </ul>
          
          {showPartialFulfillment && (
            <div className="mt-1.5 mb-2">
              <div className="flex items-center justify-between mb-0.5 text-2xs text-gray-700">
                <span>Erfüllte Teilaspekte:</span>
                <span className="font-medium">{fulfillmentCount} von {totalCount}</span>
              </div>
              <Progress 
                value={(fulfillmentCount / totalCount) * 100} 
                className="h-1.5" 
              />
              
              {/* Score from unified scoring */}
              <div className="flex justify-end mt-0.5">
                <span className="text-2xs font-medium text-gray-700">
                  {unifiedScore.toFixed(1)}/10 Punkten
                </span>
              </div>
              
              {/* Detail which specific subcriteria are fulfilled */}
              {criteriaQuestions.length > 0 && (
                <div className="mt-1.5">
                  <ul className="space-y-0.5">
                    {criteriaQuestions.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        {item.fulfilled ? 
                          <CheckCircle className="text-green-500 h-3 w-3 mt-0.5 mr-1 flex-shrink-0" /> :
                          <XCircle className="text-red-500 h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                        }
                        <div>
                          <span className="text-2xs font-medium">{item.question}</span>
                          <p className="text-2xs text-gray-600">{item.answer}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {criterion.gptAnalysis && (
            <Collapsible className="mt-2 pt-2 border-t border-gray-200">
              <CollapsibleTrigger className="flex items-center gap-1.5 mb-1.5 w-full">
                <Bot size={14} className="text-blue-500" />
                <span className="font-medium text-xs text-blue-700">KI-Analyse</span>
                <ChevronDown className="h-3.5 w-3.5 text-blue-500 ml-auto transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="text-gray-700 ki-analysis prose prose-sm max-w-none text-xs">
                  <ReactMarkdown components={{
                    strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                    p: ({ node, ...props }) => <div className="mb-1.5" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mt-0.5 mb-1.5" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mt-0.5 mb-1.5" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-0.5" {...props} />
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
