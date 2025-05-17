
import React from 'react';

const AppHeader: React.FC = () => {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold mb-2">Buffett Benchmark Tool</h1>
      <p className="text-buffett-subtext">
        Analysieren Sie Aktien nach Warren Buffetts Investmentprinzipien
      </p>
    </header>
  );
};

export default AppHeader;
