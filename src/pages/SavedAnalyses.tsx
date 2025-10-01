import React from 'react';
import { SavedAnalysesTable } from '@/components/SavedAnalysesTable';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import AppFooter from '@/components/AppFooter';

const SavedAnalyses: React.FC = () => {
  return (
    <main id="main-content" className="flex-1 overflow-auto bg-background">
      <Shell>
        <ShellHeader>
          <ShellTitle>Verlauf</ShellTitle>
          <ShellDescription>Zugriff auf deine gespeicherten Analyse-Snapshots</ShellDescription>
        </ShellHeader>
        
        <ShellContent>
          <SavedAnalysesTable />
        </ShellContent>
      </Shell>
      
      {/* Footer */}
      <div className="border-t border-border mt-12">
        <div className="max-w-[1440px] mx-auto">
          <AppFooter />
        </div>
      </div>
    </main>
  );
};

export default SavedAnalyses;