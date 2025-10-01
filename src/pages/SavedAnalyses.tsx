import React from 'react';
import { SavedAnalysesPanel } from '@/components/SavedAnalysesPanel';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent, ShellFooter } from '@/components/layout/Shell';

const SavedAnalyses: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <Shell>
        <ShellHeader>
          <ShellTitle>Gespeicherte Analysen</ShellTitle>
          <ShellDescription>
            Alle deine gespeicherten Aktienanalysen an einem Ort
          </ShellDescription>
        </ShellHeader>

        <ShellContent>
          <SavedAnalysesPanel />
        </ShellContent>

        <ShellFooter>
          Hinweis: Diese Analysen stellen keine Anlageberatung dar. Bitte beachte die BaFin-Richtlinien.
        </ShellFooter>
      </Shell>
    </main>
  );
};

export default SavedAnalyses;