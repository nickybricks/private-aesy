
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
          <TabsTrigger value="gpt">
            KI-Analyse (11 Kriterien)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="standard">
          <BuffettCriteria criteria={buffettCriteria} analysisMode="standard" />
        </TabsContent>
        <TabsContent value="gpt">
          <div className="relative">
            <BuffettCriteriaGPT criteria={buffettCriteria} />
            {!deepResearchPerformed && (
              <div className="absolute inset-0 backdrop-blur-md bg-white/40 rounded-lg flex items-center justify-center">
                <div className="text-center px-6 py-8 bg-white/80 rounded-xl shadow-lg max-w-md">
                  <InfoIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    KI-Analyse erforderlich
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Starten Sie die KI-Analyse im oberen Bereich, um alle 11 Buffett-Kriterien detailliert zu sehen.
                  </p>
                  <p className="text-sm text-gray-500">
                    Die KI analysiert qualitative Faktoren wie Geschäftsmodell, Burggraben und Management-Qualität.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CriteriaTabsSection;
