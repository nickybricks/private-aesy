
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useStock } from '@/context/StockContext';

const CriteriaTabsSection: React.FC = () => {
  const { 
    buffettCriteria, 
    activeTab, 
    setActiveTab, 
    deepResearchPerformed,
    hasCriticalDataMissing
  } = useStock();
  
  if (!buffettCriteria || hasCriticalDataMissing) {
    return null;
  }

  // Set default tab based on deep research status
  const defaultTab = deepResearchPerformed ? 'gpt' : 'standard';
  const currentTab = activeTab || defaultTab;

  return (
    <div className="mb-10">
      <Tabs value={currentTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="standard">Standard-Analyse (3 Kriterien)</TabsTrigger>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <TabsTrigger value="gpt" disabled={!deepResearchPerformed}>
                    {deepResearchPerformed ? 'KI-Analyse (11 Kriterien)' : 'KI-Analyse (Nicht verfügbar)'}
                  </TabsTrigger>
                </div>
              </TooltipTrigger>
              {!deepResearchPerformed && (
                <TooltipContent>
                  <p>Starten Sie die KI-Analyse, um alle 11 Buffett-Kriterien zu sehen</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </TabsList>
        <TabsContent value="standard">
          <BuffettCriteria criteria={buffettCriteria} analysisMode="standard" />
        </TabsContent>
        <TabsContent value="gpt">
          {deepResearchPerformed ? (
            <BuffettCriteriaGPT criteria={buffettCriteria} />
          ) : (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>KI-Analyse nicht durchgeführt</AlertTitle>
              <AlertDescription>
                Starten Sie die KI-Analyse im oberen Bereich, um alle 11 Buffett-Kriterien zu sehen.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CriteriaTabsSection;
