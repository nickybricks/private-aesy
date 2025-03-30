
// This is a mock API for the MVP. In a real implementation, this would
// connect to Yahoo Finance, FinancialModelingPrep, or another finance API

// Mock function to simulate fetching stock data
export const fetchStockInfo = async (ticker: string) => {
  console.log(`Fetching stock info for ${ticker}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For the MVP, return mock data for Apple as default
  // In a real implementation, this would fetch actual data based on the ticker
  if (ticker === 'AAPL' || ticker === 'APPLE' || ticker === 'APPLE INC') {
    return {
      name: 'Apple Inc.',
      ticker: 'AAPL',
      price: 191.56,
      change: 1.78,
      changePercent: 0.94,
      currency: '$',
      marketCap: 2970000000000,
    };
  }
  
  // Add a few more examples for testing
  if (ticker === 'MSFT') {
    return {
      name: 'Microsoft Corporation',
      ticker: 'MSFT',
      price: 386.64,
      change: -2.31,
      changePercent: -0.59,
      currency: '$',
      marketCap: 2870000000000,
    };
  }
  
  if (ticker === 'AMZN') {
    return {
      name: 'Amazon.com, Inc.',
      ticker: 'AMZN',
      price: 178.15,
      change: 1.25,
      changePercent: 0.71,
      currency: '$',
      marketCap: 1850000000000,
    };
  }
  
  // Return a generic response for any other ticker
  return {
    name: `${ticker} Corporation`,
    ticker: ticker,
    price: 150 + Math.random() * 100,
    change: Math.random() > 0.5 ? Math.random() * 5 : -Math.random() * 5,
    changePercent: Math.random() > 0.5 ? Math.random() * 3 : -Math.random() * 3,
    currency: '$',
    marketCap: Math.random() * 1000000000000,
  };
};

// Mock function to simulate analyzing stock with Buffett criteria
export const analyzeBuffettCriteria = async (ticker: string) => {
  console.log(`Analyzing ${ticker} with Buffett criteria`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For Apple (AAPL), return detailed positive analysis as an example
  if (ticker === 'AAPL' || ticker === 'APPLE' || ticker === 'APPLE INC') {
    return {
      businessModel: {
        status: 'pass',
        title: 'Geschäftsmodell verstehen',
        description: 'Apple entwickelt, produziert und verkauft Premium-Hardware, Software und Services mit einem starken Ökosystem.',
        details: [
          'Klares, leicht verständliches Geschäftsmodell',
          'Starke Marke mit loyaler Kundenbasis',
          'Wiederkehrende Einnahmen durch Services (App Store, Apple Music, iCloud)',
          'Vertikale Integration von Hardware und Software'
        ]
      },
      economicMoat: {
        status: 'pass',
        title: 'Wirtschaftlicher Burggraben (Moat)',
        description: 'Apple besitzt einen starken wirtschaftlichen Burggraben durch Marke, Ökosystem und Kundenbindung.',
        details: [
          'Starke Marke mit Premium-Positionierung',
          'Geschlossenes Ökosystem erhöht Wechselkosten',
          'Exzellente Produktintegration und Benutzererfahrung',
          'Starke Patentportfolio und kontinuierliche Innovation'
        ]
      },
      financialMetrics: {
        status: 'pass',
        title: 'Finanzkennzahlen',
        description: 'Apples Finanzkennzahlen sind stark mit stabilem Wachstum, hoher Profitabilität und soliden Margen.',
        details: [
          'Kontinuierliches Umsatz- und Gewinnwachstum',
          'Hohe Eigenkapitalrendite (ROE) > 15%',
          'Starke Nettomarge von über 20%',
          'Positiver und wachsender operativer Cashflow'
        ]
      },
      financialStability: {
        status: 'pass',
        title: 'Finanzielle Stabilität',
        description: 'Apple verfügt über eine außerordentlich starke Bilanz mit niedriger Verschuldung und hohen Liquiditätsreserven.',
        details: [
          'Sehr niedrige Schuldenquote',
          'Hoher Zinsdeckungsgrad',
          'Enorme Liquiditätsreserven',
          'Konstant positiver Free Cashflow'
        ]
      },
      management: {
        status: 'pass',
        title: 'Qualität des Managements',
        description: 'Das Management hat sich als kompetent erwiesen mit langfristiger Ausrichtung und solider Kapitalallokation.',
        details: [
          'Fokus auf langfristige Wertschöpfung',
          'Konsistente Strategie über die Jahre',
          'Aktive Aktienrückkaufprogramme',
          'Transparente Kommunikation mit Investoren'
        ]
      },
      valuation: {
        status: 'warning',
        title: 'Bewertung',
        description: 'Die Aktie ist nicht günstig bewertet, aber angesichts der Qualität des Unternehmens akzeptabel.',
        details: [
          'KGV leicht über historischem Durchschnitt',
          'Moderater Bewertungsaufschlag gegenüber Markt',
          'DCF-Modell zeigt begrenzte Margin of Safety',
          'Wachsende Dividendenrendite, aber unter 2%'
        ]
      },
      longTermOutlook: {
        status: 'pass',
        title: 'Langfristiger Horizont',
        description: 'Apple hat gute langfristige Aussichten mit starker Marktposition in bestehenden und neuen Technologiebereichen.',
        details: [
          'Starke Position in wachsenden Märkten (Wearables, Services)',
          'Kontinuierliche Innovation in neuen Produktkategorien',
          'Marke und Ökosystem schaffen langfristige Stabilität',
          'Gut positioniert für kommende Technologietrends'
        ]
      }
    };
  } else if (ticker === 'MSFT') {
    // For Microsoft, return mostly positive analysis
    return {
      businessModel: {
        status: 'pass',
        title: 'Geschäftsmodell verstehen',
        description: 'Microsoft bietet Software, Cloud-Services und Hardware mit starkem B2B- und B2C-Fokus.',
        details: [
          'Klares, gut verständliches Geschäftsmodell mit mehreren Einnahmequellen',
          'Starke Marktposition bei Betriebssystemen und Produktivitätssoftware',
          'Wiederkehrende Einnahmen durch Abonnementmodelle (Microsoft 365, Azure)',
          'Erfolgreiche Transformation zum Cloud-Anbieter'
        ]
      },
      economicMoat: {
        status: 'pass',
        title: 'Wirtschaftlicher Burggraben (Moat)',
        description: 'Microsoft verfügt über einen breiten Burggraben durch seine Softwareprodukte und Cloud-Plattform.',
        details: [
          'Netzwerkeffekte durch weit verbreitete Softwarestandards',
          'Hohe Wechselkosten für Unternehmenskunden',
          'Starke Integration zwischen Produkten schafft Lock-in-Effekte',
          'Umfangreiche Patente und technisches Know-how'
        ]
      },
      // Continue with other criteria...
      financialMetrics: {
        status: 'pass',
        title: 'Finanzkennzahlen',
        description: 'Microsofts Finanzkennzahlen sind hervorragend mit starkem Wachstum und hoher Profitabilität.',
        details: [
          'Starkes und konsistentes Umsatz- und Gewinnwachstum',
          'Hohe Eigenkapitalrendite (ROE > 20%)',
          'Exzellente Margen, besonders im Cloud-Geschäft',
          'Konstant hoher und wachsender freier Cashflow'
        ]
      },
      financialStability: {
        status: 'pass',
        title: 'Finanzielle Stabilität',
        description: 'Microsoft hat eine sehr starke Bilanz mit moderater Verschuldung und hohen Liquiditätsreserven.',
        details: [
          'Niedrige Schuldenquote im Verhältnis zum Cashflow',
          'Sehr hoher Zinsdeckungsgrad',
          'Starke Liquiditätsposition',
          'Stabile Kapitalstruktur'
        ]
      },
      management: {
        status: 'pass',
        title: 'Qualität des Managements',
        description: 'Das Management unter Satya Nadella hat eine erfolgreiche Transformation des Unternehmens durchgeführt.',
        details: [
          'Klare strategische Vision mit Fokus auf Cloud und AI',
          'Erfolgreiche Pivot zum Cloud-Geschäft',
          'Aktionärsfreundliche Kapitalallokation',
          'Fokus auf Innovation und langfristiges Wachstum'
        ]
      },
      valuation: {
        status: 'warning',
        title: 'Bewertung',
        description: 'Die Aktie ist nicht günstig bewertet, aber die Qualität des Unternehmens rechtfertigt einen Aufschlag.',
        details: [
          'Höheres KGV im Vergleich zum historischen Durchschnitt',
          'Premium-Bewertung im Vergleich zum Gesamtmarkt',
          'Begrenzte Margin of Safety beim aktuellen Preis',
          'Moderate aber wachsende Dividendenrendite'
        ]
      },
      longTermOutlook: {
        status: 'pass',
        title: 'Langfristiger Horizont',
        description: 'Microsoft ist hervorragend für langfristiges Wachstum in Cloud, AI und Enterprise-Software positioniert.',
        details: [
          'Führend in wachstumsstarken Zukunftsmärkten (Cloud, KI)',
          'Starke Position im Unternehmenssektor',
          'Kontinuierliche Innovation und Anpassungsfähigkeit',
          'Diversifizierte Einnahmequellen erhöhen die Stabilität'
        ]
      }
    };
  } else if (ticker === 'AMZN') {
    // For Amazon, return mixed analysis
    return {
      businessModel: {
        status: 'pass',
        title: 'Geschäftsmodell verstehen',
        description: 'Amazon betreibt einen führenden E-Commerce-Marktplatz, Cloud-Services (AWS) und digitale Produkte/Services.',
        details: [
          'Diversifiziertes Geschäftsmodell mit mehreren Einnahmequellen',
          'Führende Position im E-Commerce und Cloud-Computing',
          'Starkes Ökosystem durch Prime-Mitgliedschaft',
          'Kontinuierliche Expansion in neue Geschäftsfelder'
        ]
      },
      economicMoat: {
        status: 'pass',
        title: 'Wirtschaftlicher Burggraben (Moat)',
        description: 'Amazon hat einen starken Burggraben durch Größenvorteile, Kundendaten und Infrastruktur.',
        details: [
          'Massive Skalen- und Netzwerkeffekte',
          'Umfangreiche Logistik- und Fulfillment-Infrastruktur',
          'Datenvorteile durch Kundenverhalten',
          'Starke Kundenbindung durch Prime-Ökosystem'
        ]
      },
      financialMetrics: {
        status: 'warning',
        title: 'Finanzkennzahlen',
        description: 'Amazons Umsatzwachstum ist stark, aber die Rentabilität ist volatil und teilweise unter Buffett-Schwellen.',
        details: [
          'Beeindruckendes Umsatzwachstum über lange Zeit',
          'Schwankende Gewinnmargen, besonders im Retail-Segment',
          'ROE unter Buffetts bevorzugter 15%-Schwelle in einigen Jahren',
          'Starker operativer Cashflow, aber hohe Reinvestitionen'
        ]
      },
      financialStability: {
        status: 'pass',
        title: 'Finanzielle Stabilität',
        description: 'Amazon verfügt über gute finanzielle Stabilität mit moderater Verschuldung und starker Marktposition.',
        details: [
          'Angemessene Schuldenquoten im Verhältnis zum Cashflow',
          'Ausreichende Liquidität',
          'Starke Kapitalposition',
          'Positiver und wachsender freier Cashflow'
        ]
      },
      management: {
        status: 'pass',
        title: 'Qualität des Managements',
        description: 'Das Management hat eine starke Erfolgsbilanz bei langfristiger Innovation und Marktexpansion.',
        details: [
          'Langfristige Vision und Bereitschaft zu Investitionen',
          'Kundenorientierte Unternehmenskultur',
          'Erfolgreiche Entwicklung neuer Geschäftsfelder (AWS)',
          'Guter Übergang von Gründer zu neuem CEO'
        ]
      },
      valuation: {
        status: 'fail',
        title: 'Bewertung',
        description: 'Amazon ist hoch bewertet mit geringer Margin of Safety nach Buffetts konservativen Kriterien.',
        details: [
          'Hohes KGV im Vergleich zu traditionellen Buffett-Investments',
          'Eingeschränkte Vorhersehbarkeit zukünftiger Gewinne',
          'Geringe bis keine Margin of Safety',
          'Keine Dividende'
        ]
      },
      longTermOutlook: {
        status: 'pass',
        title: 'Langfristiger Horizont',
        description: 'Amazon ist gut positioniert für langfristiges Wachstum in E-Commerce, Cloud und weiteren Bereichen.',
        details: [
          'Starke Position in wachsenden Märkten (E-Commerce, Cloud)',
          'Kontinuierliche Innovation und Expansion',
          'Anpassungsfähiges Geschäftsmodell',
          'Solide Wettbewerbsposition in Kernmärkten'
        ]
      }
    };
  } else {
    // For any other ticker, return a generic mixed analysis
    return {
      businessModel: {
        status: Math.random() > 0.5 ? 'pass' : 'warning',
        title: 'Geschäftsmodell verstehen',
        description: `Das Geschäftsmodell von ${ticker} ist relativ verständlich, bedarf aber tieferer Analyse.`,
        details: [
          'Grundlegendes Geschäftsmodell ist nachvollziehbar',
          'Mittlere Komplexität der Einnahmequellen',
          'Moderates Kundenbindungspotential',
          'Durchschnittliche Marktposition'
        ]
      },
      economicMoat: {
        status: Math.random() > 0.5 ? 'warning' : 'fail',
        title: 'Wirtschaftlicher Burggraben (Moat)',
        description: `${ticker} zeigt einige Anzeichen eines wirtschaftlichen Burggrabens, aber die Nachhaltigkeit ist fraglich.`,
        details: [
          'Begrenzte Differenzierung gegenüber Wettbewerbern',
          'Moderate Markteintrittsbarrieren',
          'Durchschnittliche Preissetzungsmacht',
          'Mittlere Kundenbindung'
        ]
      },
      financialMetrics: {
        status: Math.random() > 0.7 ? 'pass' : 'warning',
        title: 'Finanzkennzahlen',
        description: `Die Finanzkennzahlen von ${ticker} sind gemischt mit einigen Stärken und Schwächen.`,
        details: [
          'Uneinheitliches Umsatz- und Gewinnwachstum',
          'ROE nahe an Buffetts 15%-Schwelle',
          'Durchschnittliche Margen für die Branche',
          'Volatiler operativer Cashflow'
        ]
      },
      financialStability: {
        status: Math.random() > 0.5 ? 'warning' : 'pass',
        title: 'Finanzielle Stabilität',
        description: `${ticker} zeigt eine angemessene finanzielle Stabilität mit einigen Risikofaktoren.`,
        details: [
          'Moderate Verschuldung',
          'Akzeptabler Zinsdeckungsgrad',
          'Ausreichende Liquidität für normale Bedingungen',
          'Durchschnittlicher Free Cashflow'
        ]
      },
      management: {
        status: 'warning',
        title: 'Qualität des Managements',
        description: `Das Management von ${ticker} zeigt gemischte Ergebnisse bei Strategie und Kapitalallokation.`,
        details: [
          'Durchschnittliche Leistungsbilanz',
          'Gelegentliche strategische Richtungswechsel',
          'Moderate Insider-Beteiligung',
          'Akzeptable, aber nicht herausragende Kommunikation'
        ]
      },
      valuation: {
        status: Math.random() > 0.7 ? 'fail' : 'warning',
        title: 'Bewertung',
        description: `${ticker} erscheint nach Buffetts konservativen Kriterien tendenziell überbewertet.`,
        details: [
          'KGV über historischem Durchschnitt',
          'Begrenzte Margin of Safety',
          'Niedrige Dividendenrendite',
          'Höhere Bewertung im Vergleich zu ähnlichen Unternehmen'
        ]
      },
      longTermOutlook: {
        status: Math.random() > 0.5 ? 'warning' : 'pass',
        title: 'Langfristiger Horizont',
        description: `Die langfristigen Aussichten für ${ticker} sind moderat mit einigen Chancen und Risiken.`,
        details: [
          'Mittlere Position in Wachstumsmärkten',
          'Durchschnittliche Innovationskraft',
          'Mäßige Anpassungsfähigkeit',
          'Akzeptable, aber nicht dominante Marktposition'
        ]
      }
    };
  }
};

// Mock function to get financial metrics
export const getFinancialMetrics = async (ticker: string) => {
  console.log(`Getting financial metrics for ${ticker}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For Apple (AAPL), return detailed metrics as an example
  if (ticker === 'AAPL' || ticker === 'APPLE' || ticker === 'APPLE INC') {
    return {
      metrics: [
        {
          name: 'Return on Equity (ROE)',
          value: '131.8%',
          formula: 'Jahresgewinn / Eigenkapital',
          explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
          threshold: '>15%',
          status: 'pass'
        },
        {
          name: 'Nettomarge',
          value: '25.31%',
          formula: 'Nettogewinn / Umsatz',
          explanation: 'Gibt an, wie viel vom Umsatz als Gewinn übrig bleibt.',
          threshold: '>10%',
          status: 'pass'
        },
        {
          name: 'ROIC',
          value: '42.5%',
          formula: 'NOPAT / (Eigenkapital + langfristige Schulden)',
          explanation: 'Zeigt, wie effizient das investierte Kapital eingesetzt wird.',
          threshold: '>10%',
          status: 'pass'
        },
        {
          name: 'Schuldenquote',
          value: '56.7%',
          formula: 'Gesamtschulden / Gesamtvermögen',
          explanation: 'Gibt an, wie stark das Unternehmen fremdfinanziert ist.',
          threshold: '<70%',
          status: 'pass'
        },
        {
          name: 'Zinsdeckungsgrad',
          value: '42.3',
          formula: 'EBIT / Zinsaufwand',
          explanation: 'Zeigt, wie oft die Zinsen aus dem Gewinn bezahlt werden können.',
          threshold: '>5',
          status: 'pass'
        },
        {
          name: 'Current Ratio',
          value: '1.3',
          formula: 'Umlaufvermögen / Kurzfristige Verbindlichkeiten',
          explanation: 'Misst die kurzfristige Liquidität des Unternehmens.',
          threshold: '>1',
          status: 'pass'
        },
        {
          name: 'Insider Ownership',
          value: '0.06%',
          formula: 'Aktien im Besitz des Managements / Ausstehende Aktien',
          explanation: 'Zeigt, wie stark das Management am Unternehmen beteiligt ist.',
          threshold: '>5%',
          status: 'fail'
        },
        {
          name: 'KGV',
          value: '31.4',
          formula: 'Aktienkurs / Gewinn pro Aktie',
          explanation: 'Gibt an, wie hoch die Aktie im Verhältnis zum Gewinn bewertet ist.',
          threshold: '<25 (für Wachstumsunternehmen)',
          status: 'warning'
        },
        {
          name: 'Dividendenrendite',
          value: '0.51%',
          formula: 'Jahresdividende / Aktienkurs',
          explanation: 'Zeigt, wie viel Dividendenertrag im Verhältnis zum Aktienkurs ausgezahlt wird.',
          threshold: '>2%',
          status: 'fail'
        }
      ],
      historicalData: {
        revenue: [
          { year: '2014', value: 182795 },
          { year: '2015', value: 233715 },
          { year: '2016', value: 215639 },
          { year: '2017', value: 229234 },
          { year: '2018', value: 265595 },
          { year: '2019', value: 260174 },
          { year: '2020', value: 274515 },
          { year: '2021', value: 365817 },
          { year: '2022', value: 394328 },
          { year: '2023', value: 383933 }
        ],
        earnings: [
          { year: '2014', value: 39510 },
          { year: '2015', value: 53394 },
          { year: '2016', value: 45687 },
          { year: '2017', value: 48351 },
          { year: '2018', value: 59531 },
          { year: '2019', value: 55256 },
          { year: '2020', value: 57411 },
          { year: '2021', value: 94680 },
          { year: '2022', value: 99803 },
          { year: '2023', value: 96995 }
        ],
        eps: [
          { year: '2014', value: 2.27 },
          { year: '2015', value: 3.03 },
          { year: '2016', value: 2.71 },
          { year: '2017', value: 2.91 },
          { year: '2018', value: 3.00 },
          { year: '2019', value: 2.97 },
          { year: '2020', value: 3.28 },
          { year: '2021', value: 5.61 },
          { year: '2022', value: 6.11 },
          { year: '2023', value: 6.14 }
        ]
      }
    };
  } else {
    // Return generic mock data for other tickers
    return {
      metrics: [
        {
          name: 'Return on Equity (ROE)',
          value: `${(10 + Math.random() * 20).toFixed(1)}%`,
          formula: 'Jahresgewinn / Eigenkapital',
          explanation: 'Zeigt, wie effizient das Unternehmen das Eigenkapital einsetzt.',
          threshold: '>15%',
          status: Math.random() > 0.5 ? 'pass' : 'warning'
        },
        {
          name: 'Nettomarge',
          value: `${(5 + Math.random() * 15).toFixed(1)}%`,
          formula: 'Nettogewinn / Umsatz',
          explanation: 'Gibt an, wie viel vom Umsatz als Gewinn übrig bleibt.',
          threshold: '>10%',
          status: Math.random() > 0.5 ? 'pass' : 'warning'
        },
        {
          name: 'ROIC',
          value: `${(8 + Math.random() * 15).toFixed(1)}%`,
          formula: 'NOPAT / (Eigenkapital + langfristige Schulden)',
          explanation: 'Zeigt, wie effizient das investierte Kapital eingesetzt wird.',
          threshold: '>10%',
          status: Math.random() > 0.5 ? 'pass' : 'warning'
        },
        {
          name: 'Schuldenquote',
          value: `${(40 + Math.random() * 50).toFixed(1)}%`,
          formula: 'Gesamtschulden / Gesamtvermögen',
          explanation: 'Gibt an, wie stark das Unternehmen fremdfinanziert ist.',
          threshold: '<70%',
          status: Math.random() > 0.5 ? 'pass' : 'warning'
        },
        {
          name: 'Zinsdeckungsgrad',
          value: `${(3 + Math.random() * 10).toFixed(1)}`,
          formula: 'EBIT / Zinsaufwand',
          explanation: 'Zeigt, wie oft die Zinsen aus dem Gewinn bezahlt werden können.',
          threshold: '>5',
          status: Math.random() > 0.5 ? 'pass' : 'warning'
        },
        {
          name: 'Current Ratio',
          value: `${(0.8 + Math.random()).toFixed(1)}`,
          formula: 'Umlaufvermögen / Kurzfristige Verbindlichkeiten',
          explanation: 'Misst die kurzfristige Liquidität des Unternehmens.',
          threshold: '>1',
          status: Math.random() > 0.5 ? 'pass' : 'fail'
        },
        {
          name: 'Insider Ownership',
          value: `${(Math.random() * 10).toFixed(2)}%`,
          formula: 'Aktien im Besitz des Managements / Ausstehende Aktien',
          explanation: 'Zeigt, wie stark das Management am Unternehmen beteiligt ist.',
          threshold: '>5%',
          status: Math.random() > 0.7 ? 'pass' : 'fail'
        }
      ],
      historicalData: {
        revenue: Array.from({ length: 10 }, (_, i) => ({
          year: `${2014 + i}`,
          value: 50000 + Math.random() * 10000 * i
        })),
        earnings: Array.from({ length: 10 }, (_, i) => ({
          year: `${2014 + i}`,
          value: 5000 + Math.random() * 1000 * i
        })),
        eps: Array.from({ length: 10 }, (_, i) => ({
          year: `${2014 + i}`,
          value: 1 + Math.random() * 0.5 * i
        }))
      }
    };
  }
};

// Mock function to get overall rating
export const getOverallRating = async (ticker: string) => {
  console.log(`Getting overall rating for ${ticker}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For Apple (AAPL), return detailed rating as an example
  if (ticker === 'AAPL' || ticker === 'APPLE' || ticker === 'APPLE INC') {
    return {
      overall: 'watch',
      summary: 'Apple ist ein außergewöhnliches Unternehmen mit starkem Burggraben, aber die aktuelle Bewertung bietet nur begrenzten Spielraum für langfristige Überrenditen.',
      strengths: [
        'Hervorragendes Geschäftsmodell mit starkem Ökosystem und Kundenbindung',
        'Außergewöhnliche Finanzkennzahlen und finanzielle Stabilität',
        'Kompetentes Management mit nachgewiesener Innovationsfähigkeit',
        'Starker Burggraben durch Marke, Patente und Kundenloyalität',
        'Gute langfristige Wachstumsaussichten'
      ],
      weaknesses: [
        'Relativ hohe Bewertung mit KGV über dem historischen Durchschnitt',
        'Begrenzte Margin of Safety beim aktuellen Preis',
        'Geringe Dividendenrendite von unter 1%',
        'Abhängigkeit vom iPhone als Hauptumsatzquelle',
        'Zunehmender Wettbewerb in Kernmärkten'
      ],
      recommendation: 'Apple ist ein erstklassiges Unternehmen, das viele von Buffetts Kriterien erfüllt. Die aktuelle Bewertung ist jedoch etwas anspruchsvoll. Anleger sollten Apple auf ihre Beobachtungsliste setzen und bei Kursrückgängen kaufen, die eine größere Margin of Safety bieten.'
    };
  } else if (ticker === 'MSFT') {
    // For Microsoft, return watch rating
    return {
      overall: 'watch',
      summary: 'Microsoft ist ein hervorragendes Unternehmen mit starker Marktposition und Wachstum, aber die Bewertung ist relativ hoch.',
      strengths: [
        'Dominante Marktposition bei Betriebssystemen und Produktivitätssoftware',
        'Starkes Wachstum im Cloud-Geschäft (Azure)',
        'Hervorragende Finanzkennzahlen und stabile Bilanz',
        'Wiederkehrende Einnahmen durch Abonnementmodelle',
        'Kompetentes Management mit klarer Strategie'
      ],
      weaknesses: [
        'Premium-Bewertung mit KGV über dem langfristigen Durchschnitt',
        'Begrenzte Margin of Safety beim aktuellen Preis',
        'Moderate Dividendenrendite',
        'Zunehmender Wettbewerb im Cloud-Markt',
        'Regulatorische Risiken durch Marktdominanz'
      ],
      recommendation: 'Microsoft erfüllt die meisten von Buffetts Qualitätskriterien, ist aber derzeit nicht günstig bewertet. Anleger sollten Microsoft beobachten und bei signifikanten Kursrückgängen in Betracht ziehen, die eine bessere Margin of Safety bieten.'
    };
  } else if (ticker === 'AMZN') {
    // For Amazon, return avoid rating
    return {
      overall: 'avoid',
      summary: 'Amazon ist ein innovatives Unternehmen mit starkem Wachstum, aber nach Buffetts konservativen Kriterien zu hoch bewertet mit volatiler Profitabilität.',
      strengths: [
        'Starkes Umsatzwachstum und Marktposition im E-Commerce',
        'Führende Position im Cloud-Computing (AWS)',
        'Starkes Ökosystem und Kundenbindung durch Prime',
        'Exzellente Logistik- und Fulfillment-Infrastruktur',
        'Innovationsfreudiges Unternehmen mit Expansion in neue Märkte'
      ],
      weaknesses: [
        'Hohe Bewertung mit begrenzter Vorhersehbarkeit zukünftiger Gewinne',
        'Volatile Rentabilität, besonders im Retail-Segment',
        'Keine Dividende',
        'Regulatorische Risiken durch Marktmacht',
        'Geringe bis keine Margin of Safety'
      ],
      recommendation: 'Obwohl Amazon ein außergewöhnliches Unternehmen ist, entspricht es nicht Buffetts konservativen Anlagekriterien, insbesondere in Bezug auf Bewertung und konsistente Profitabilität. Buffett-orientierte Anleger sollten Amazon meiden oder höchstens eine sehr kleine Position in Betracht ziehen.'
    };
  } else {
    // For any other ticker, return a generic mixed rating
    const ratingOptions = ['buy', 'watch', 'avoid'];
    const rating = ratingOptions[Math.floor(Math.random() * ratingOptions.length)];
    
    let summary, recommendation, strengths, weaknesses;
    
    if (rating === 'buy') {
      summary = `${ticker} erfüllt die meisten von Buffetts Kriterien und ist zu einem angemessenen Preis bewertet.`;
      strengths = [
        'Solides Geschäftsmodell mit guter Marktstellung',
        'Angemessene Finanzkennzahlen mit stabiler Bilanz',
        'Gute langfristige Wachstumsaussichten',
        'Faire Bewertung mit ausreichender Margin of Safety',
        'Kompetentes Management mit klarer Strategie'
      ];
      weaknesses = [
        'Begrenzte Differenzierung in einigen Produktbereichen',
        'Moderate Wettbewerbsintensität in der Branche',
        'Etwas zyklisches Geschäftsmodell',
        'Entwicklungspotenzial bei einigen Finanzkennzahlen'
      ];
      recommendation = `${ticker} erscheint nach Buffetts Kriterien als solide Investition mit guter Qualität und angemessener Bewertung. Langfristig orientierte Anleger können einen Kauf in Betracht ziehen.`;
    } else if (rating === 'watch') {
      summary = `${ticker} zeigt einige positive Eigenschaften, aber entweder die Bewertung oder bestimmte fundamentale Aspekte entsprechen nicht vollständig Buffetts Kriterien.`;
      strengths = [
        'Verständliches Geschäftsmodell mit durchschnittlicher Marktposition',
        'Akzeptable finanzielle Stabilität',
        'Einige Anzeichen eines wirtschaftlichen Burggrabens',
        'Moderate langfristige Wachstumsaussichten'
      ];
      weaknesses = [
        'Herausfordernde Bewertung mit begrenzter Margin of Safety',
        'Finanzkennzahlen teilweise unter Buffetts Schwellenwerten',
        'Durchschnittliche Kapitalallokation durch das Management',
        'Moderate Wettbewerbsintensität'
      ];
      recommendation = `${ticker} sollte auf die Beobachtungsliste gesetzt werden. Ein Kauf könnte bei einer besseren Bewertung oder verbesserten Fundamentaldaten in Betracht gezogen werden.`;
    } else {
      summary = `${ticker} entspricht nicht ausreichend Buffetts Investitionskriterien, insbesondere in Bezug auf Qualität oder Bewertung.`;
      strengths = [
        'Einige positive Aspekte im Geschäftsmodell',
        'Wachstumspotenzial in bestimmten Bereichen',
        'Moderate Marktposition in Teilbereichen'
      ];
      weaknesses = [
        'Unzureichender wirtschaftlicher Burggraben',
        'Schwache oder volatile Finanzkennzahlen',
        'Hohe Bewertung ohne ausreichende Margin of Safety',
        'Unklare langfristige Wettbewerbsfähigkeit',
        'Herausforderndes Branchenumfeld'
      ];
      recommendation = `Nach Buffetts konservativen Anlagekriterien erscheint ${ticker} nicht als attraktive Investition. Anleger sollten nach Alternativen mit besserem Qualitäts-Preis-Verhältnis suchen.`;
    }
    
    return {
      overall: rating,
      summary,
      strengths,
      weaknesses,
      recommendation
    };
  }
};
