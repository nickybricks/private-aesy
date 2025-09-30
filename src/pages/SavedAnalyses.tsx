import React from 'react';
import { SavedAnalysesPanel } from '@/components/SavedAnalysesPanel';
import AppFooter from '@/components/AppFooter';

const SavedAnalyses: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="h-full">
        <div className="p-6 w-full">

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