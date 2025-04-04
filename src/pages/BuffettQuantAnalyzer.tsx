
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, BarChart3 } from 'lucide-react';

const BuffettQuantAnalyzer = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <header className="mb-8">
        <div className="flex items-center mb-2">
          <Link to="/" className="text-buffett-blue hover:text-blue-700 mr-4 flex items-center">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Zurück
          </Link>
          <h1 className="text-3xl font-bold">Buffett Quant Analyzer</h1>
        </div>
        <p className="text-buffett-subtext">
          Quantitative Aktienanalyse nach Warren Buffetts Investmentprinzipien
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center mb-4">
            <Calculator className="h-6 w-6 text-buffett-blue mr-2" />
            <h2 className="text-xl font-semibold">Quantitative Kennzahlen</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Detaillierte Analyse der finanziellen Kennzahlen basierend auf Buffetts Investmentkriterien.
          </p>
          <div className="p-8 flex items-center justify-center">
            <p className="text-gray-500">Coming soon</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-buffett-blue mr-2" />
            <h2 className="text-xl font-semibold">Performance-Vergleich</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Vergleichen Sie die Performance verschiedener Aktien nach dem Buffett-Framework.
          </p>
          <div className="p-8 flex items-center justify-center">
            <p className="text-gray-500">Coming soon</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Über den Quant Analyzer</h2>
        <p className="text-gray-600 mb-2">
          Der Buffett Quant Analyzer ist ein erweitertes Tool, das Warren Buffetts Investmentprinzipien 
          in quantitative Modelle übersetzt. Es ermöglicht Ihnen, Aktien anhand von:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600">
          <li>Langfristiger Rentabilität und Kapitaleffizienz</li>
          <li>Unternehmensstabilität und Wettbewerbsvorteilen</li>
          <li>Bewertungsmetriken wie Margin of Safety</li>
          <li>Historischer Performance im Vergleich zum Markt</li>
        </ul>
        <p className="text-gray-600">
          Diese Seite befindet sich noch in der Entwicklung. Weitere Funktionen werden in Kürze hinzugefügt.
        </p>
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200 text-buffett-subtext text-sm text-center">
        <p>
          Buffett Quant Analyzer - Erweiterte quantitative Analysewerkzeuge
        </p>
      </footer>
    </div>
  );
};

export default BuffettQuantAnalyzer;
