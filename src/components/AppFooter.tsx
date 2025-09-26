
import React from 'react';

const AppFooter: React.FC = () => {
  return (
    <footer className="mt-12 pt-8 border-t border-gray-200 text-buffett-subtext text-sm text-center">
      <p className="mb-2">
        Aesy - Analysieren Sie Aktien nach bewährten Investmentprinzipien
      </p>
      <p className="mb-2">
        Dieses Tool analysiert Aktien in Echtzeit mit aktuellen Finanzdaten.
      </p>
      <p>
        Dieses Tool bietet keine Anlageberatung. Alle Analysen dienen nur zu Informationszwecken.
      </p>
    </footer>
  );
};

export default AppFooter;
