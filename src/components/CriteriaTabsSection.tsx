
import React from 'react';
import { Button } from '@/components/ui/button';
import BuffettCriteria from '@/components/BuffettCriteria';
import BuffettCriteriaGPT from '@/components/BuffettCriteriaGPT';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Bot, Calculator } from 'lucide-react';
import { useStock } from '@/context/StockContext';

const CriteriaTabsSection: React.FC = () => {
  const { 
    buffettCriteria, 
    activeTab, 
    setActiveTab, 
    gptAvailable,
    hasCriticalDataMissing,
    stockInfo
  } = useStock();
  
  // Show toggle always when we have stock info, hide content if no criteria
  if (!stockInfo) {
    return null;
  }

  return (
    <div className="mb-10">
      {/* Button Toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={activeTab === 'standard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('standard')}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Standard-Analyse
        </Button>
        <Button
          variant={activeTab === 'gpt' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('gpt')}
          disabled={!gptAvailable}
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          {gptAvailable ? 'KI-Analyse' : 'KI nicht verfügbar'}
        </Button>
      </div>

      {/* Content */}
      {!buffettCriteria || hasCriticalDataMissing ? (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Analyse noch nicht verfügbar</AlertTitle>
          <AlertDescription>
            {hasCriticalDataMissing 
              ? "Die Analyse kann aufgrund fehlender kritischer Daten nicht durchgeführt werden."
              : "Bitte warten Sie, während die Daten geladen werden."
            }
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {activeTab === 'standard' && (
            <BuffettCriteria criteria={buffettCriteria} />
          )}
          
          {activeTab === 'gpt' && (
            gptAvailable ? (
              <BuffettCriteriaGPT criteria={buffettCriteria} />
            ) : (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>GPT-Analyse nicht verfügbar</AlertTitle>
                <AlertDescription>
                  Bitte konfigurieren Sie Ihren OpenAI API-Key in der Datei src/api/openaiApi.ts, um Zugang zur erweiterten GPT-Analyse zu erhalten.
                </AlertDescription>
              </Alert>
            )
          )}
        </>
      )}
    </div>
  );
};

export default CriteriaTabsSection;
