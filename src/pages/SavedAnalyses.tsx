import React from 'react';
import { SavedAnalysesPanel } from '@/components/SavedAnalysesPanel';
import AppFooter from '@/components/AppFooter';

const SavedAnalyses: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-8 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Gespeicherte Analysen
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre gespeicherten Aktienanalysen und laden Sie diese bei Bedarf wieder.
            </p>
          </div>

          <SavedAnalysesPanel />
        </div>
        
        {/* Footer */}
        <div className="border-t border-border mt-12">
          <div className="w-full">
            <AppFooter />
          </div>
        </div>
      </div>
    </main>
  );
};

export default SavedAnalyses;