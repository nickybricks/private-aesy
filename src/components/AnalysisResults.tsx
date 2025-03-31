
import React from 'react';
import StockHeader from '@/components/StockHeader';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import FinancialMetrics from '@/components/FinancialMetrics';
import OverallRating from '@/components/OverallRating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface AnalysisResultsProps {
  stockInfo: any;
  buffettCriteria: any;
  financialMetrics: any;
  overallRating: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasGptApiKey: boolean;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  stockInfo,
  buffettCriteria,
  financialMetrics,
  overallRating,
  activeTab,
  setActiveTab,
  hasGptApiKey
}) => {
  if (!stockInfo) return null;

  return (
    <>
      <StockHeader stockInfo={stockInfo} />
      
      {buffettCriteria && (
        <div className="mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="standard">Standard-Analyse</TabsTrigger>
              <TabsTrigger value="gpt" disabled={!hasGptApiKey}>
                {hasGptApiKey ? 'GPT-Analyse (11 Kriterien)' : 'GPT-Analyse (Nicht verfügbar)'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="standard">
              <BuffettCriteria criteria={buffettCriteria} />
            </TabsContent>
            <TabsContent value="gpt">
              {hasGptApiKey ? (
                <BuffettCriteriaGPT criteria={buffettCriteria} />
              ) : (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>GPT-Analyse nicht verfügbar</AlertTitle>
                  <AlertDescription>
                    Bitte konfigurieren Sie Ihren OpenAI API-Key, um Zugang zur erweiterten GPT-Analyse zu erhalten.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {financialMetrics && (
        <div className="mb-10">
          <FinancialMetrics 
            metrics={financialMetrics.metrics} 
            historicalData={financialMetrics.historicalData} 
          />
        </div>
      )}
      
      {overallRating && (
        <div className="mb-10">
          <OverallRating rating={overallRating} />
        </div>
      )}
    </>
  );
};

export default AnalysisResults;
