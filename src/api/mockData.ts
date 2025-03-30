// Mock data for Financial Modeling Prep API responses

export const mockStockInfo = {
  "AAPL": {
    name: "Apple Inc.",
    ticker: "AAPL",
    price: 191.25,
    change: 2.31,
    changePercent: 1.22,
    currency: "USD",
    marketCap: 2980000000000,
    industry: "Consumer Electronics",
    sector: "Technology",
    ceo: "Tim Cook",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, iPad, Mac, Apple Watch, and services such as Apple TV+, Apple Music, iCloud, and the App Store."
  },
  "MSFT": {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    price: 415.10,
    change: 3.50,
    changePercent: 0.85,
    currency: "USD",
    marketCap: 3120000000000,
    industry: "Software—Infrastructure",
    sector: "Technology",
    ceo: "Satya Nadella",
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing."
  }
};

export const mockBuffettCriteria = {
  "AAPL": {
    businessModel: {
      status: 'pass',
      title: '1. Verstehbares Geschäftsmodell',
      description: 'Apple Inc. ist tätig im Bereich Consumer Electronics.',
      details: [
        'Hauptgeschäftsbereich: Consumer Electronics',
        'Sektor: Technology',
        'Gründungsjahr: 1980',
        'Beschreibung: Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide...'
      ],
      gptAnalysis: "Apple's business model is highly understandable. The company designs, manufactures, and sells consumer electronics, software, and services. Their main products include the iPhone, iPad, Mac, and wearables like the Apple Watch. Their ecosystem approach creates high customer loyalty and recurring revenue through services like the App Store, Apple Music, and iCloud. Apple's focus on premium products with high margins and strong brand recognition makes it a textbook example of a business model that Warren Buffett would appreciate for its clarity and predictability."
    },
    economicMoat: {
      status: 'pass',
      title: '2. Wirtschaftlicher Burggraben (Moat)',
      description: 'Apple Inc. zeigt starke Anzeichen eines wirtschaftlichen Burggrabens.',
      details: [
        'Bruttomarge: 43.82% (Buffett bevorzugt >40%)',
        'Operative Marge: 25.32% (Buffett bevorzugt >20%)',
        'ROIC: 28.45% (Buffett bevorzugt >15%)',
        'Marktposition: Aktiv am Markt'
      ],
      gptAnalysis: "Apple possesses an exceptional economic moat built on multiple advantages. Their ecosystem creates high switching costs, as users become locked into the Apple experience across devices and services. Brand power is extraordinary, allowing premium pricing and customer loyalty. Their vertical integration of hardware and software gives them control over user experience and supply chain. Apple's scale enables negotiating power with suppliers and efficient R&D spending. Their massive cash reserves provide financial flexibility and ability to weather downturns. The App Store's network effects create a self-reinforcing advantage as more developers are attracted to the platform, bringing more users, which attracts more developers. These combined advantages create a formidable competitive position that aligns perfectly with Buffett's moat criteria."
    },
    financialMetrics: {
      status: 'pass',
      title: '3. Finanzkennzahlen (10 Jahre Rückblick)',
      description: 'Die Finanzkennzahlen von Apple Inc. sind stark.',
      details: [
        'Eigenkapitalrendite (ROE): 23.83% (Buffett bevorzugt >15%)',
        'Nettomarge: 21.84% (Buffett bevorzugt >10%)',
        'Gewinn pro Aktie: 6.14 USD',
        'Umsatz pro Aktie: 28.11 USD'
      ]
    },
    financialStability: {
      status: 'pass',
      title: '4. Finanzielle Stabilität & Verschuldung',
      description: 'Apple Inc. zeigt starke finanzielle Stabilität.',
      details: [
        'Schulden zu Vermögen: 29.85% (Buffett bevorzugt <50%)',
        'Zinsdeckungsgrad: 24.12 (Buffett bevorzugt >5)',
        'Current Ratio: 1.86 (Buffett bevorzugt >1.5)',
        'Schulden zu EBITDA: 1.32 (niedriger ist besser)'
      ]
    },
    management: {
      status: 'pass',
      title: '5. Qualität des Managements',
      description: 'Die Qualität des Managements ist hervorragend.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Insider-Beteiligungen, Kapitalallokation und Kommunikation',
        'CEO: Tim Cook',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Apple's management under Tim Cook has demonstrated exceptional stewardship and capital allocation skills. After succeeding Steve Jobs in 2011, Cook has successfully grown Apple into the world's most valuable company while maintaining its innovative culture. Management has shown remarkable financial discipline, consistently generating high returns on invested capital and maintaining pristine balance sheets. Their capital allocation includes a balanced approach of strategic R&D investments, share repurchases that have reduced outstanding shares by over 35% since 2013, and a growing dividend program. The executive team demonstrates transparency in communications with shareholders and has effectively navigated challenges like supply chain disruptions and regulatory scrutiny. Their focus on long-term value creation rather than short-term results aligns perfectly with Buffett's management criteria."
    },
    valuation: {
      status: 'warning',
      title: '6. Bewertung (nicht zu teuer kaufen)',
      description: 'Apple Inc. ist aktuell moderat bewertet.',
      details: [
        'KGV (P/E): 31.42 (Buffett bevorzugt <15)',
        'Dividendenrendite: 0.52% (Buffett bevorzugt >2%)',
        'Kurs zu Buchwert: 34.56 (niedriger ist besser)',
        'Kurs zu Cashflow: 24.32 (niedriger ist besser)'
      ]
    },
    longTermOutlook: {
      status: 'pass',
      title: '7. Langfristiger Horizont',
      description: 'Apple Inc. operiert in einer Branche mit guten langfristigen Aussichten.',
      details: [
        'Branche: Consumer Electronics',
        'Sektor: Technology',
        'Börsennotiert seit: 12/12/1980',
        'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
      ],
      gptAnalysis: "Apple's long-term prospects remain highly favorable despite operating in the competitive technology sector. Their ecosystem approach creates lasting customer relationships and recurring revenue streams through services. The company's innovation pipeline continues to explore growth areas like augmented reality, autonomous systems, and healthcare technology. Their services segment (App Store, Apple Music, iCloud, Apple Pay) has grown to represent over 20% of revenue with higher margins than hardware. Apple's financial strength allows them to weather economic cycles and invest in long-term opportunities. While smartphone market saturation presents challenges, Apple's premium positioning and customer loyalty buffer against industry fluctuations. Their commitment to privacy and security also positions them favorably as these issues grow in importance. Overall, Apple's adaptability, brand strength, and financial resources suggest continued long-term success, aligning with Buffett's preference for businesses with enduring competitive advantages."
    },
    rationalBehavior: {
      status: 'warning',
      title: '8. Rationalität & Disziplin',
      description: 'Rationalität und Disziplin erfordern tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Kapitalallokation, Akquisitionen und Ausgaben',
        'Analysieren Sie, ob das Management bewusst und diszipliniert handelt',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Apple demonstrates exceptional rationality and discipline in its business operations and capital allocation. The company maintains a focused product lineup rather than chasing every market opportunity. Their acquisition strategy is selective and strategic, typically acquiring smaller companies that enhance their technology or talent pool rather than pursuing headline-grabbing mega-mergers. Apple's R&D spending, while substantial in absolute terms, remains efficient as a percentage of revenue compared to peers. Their massive share repurchase program has been executed methodically when they believe shares are undervalued. The company maintains a substantial cash reserve that provides flexibility during economic downturns. Management communicates conservatively, typically under-promising and over-delivering on financial guidance. Overall, Apple exhibits the rational, disciplined behavior that Buffett prizes in management teams, avoiding the emotional decision-making that often destroys shareholder value."
    },
    cyclicalBehavior: {
      status: 'warning',
      title: '9. Antizyklisches Verhalten',
      description: 'Antizyklisches Verhalten erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie das Verhalten in Marktkrisen',
        'Analysieren Sie, ob das Unternehmen kauft, wenn andere verkaufen',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Apple has demonstrated strong countercyclical behavior, particularly during market downturns. During the 2008 financial crisis and the 2020 pandemic correction, Apple continued investing in product development and innovation while many competitors cut back. Their massive share repurchase program has been strategically accelerated during market dips, reflecting confidence in their long-term prospects despite short-term market pessimism. The company maintains substantial cash reserves (over $200 billion in cash and marketable securities) that allow them to capitalize on opportunities when assets are undervalued. Apple's investments in their supply chain during downturns have strengthened their competitive position coming out of recessions. Their pricing power and customer loyalty also provide significant insulation against economic cycles. This countercyclical approach to capital allocation and business strategy aligns with Buffett's preference for companies that can take advantage of market irrationality rather than fall victim to it."
    },
    oneTimeEffects: {
      status: 'warning',
      title: '10. Vergangenheit ≠ Zukunft',
      description: 'Die Nachhaltigkeit des Erfolgs erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie einmalige Ereignisse, die Ergebnisse beeinflusst haben',
        'Analysieren Sie, ob das Wachstum organisch oder durch Übernahmen getrieben ist',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Apple's financial performance has shown remarkable consistency with minimal one-time effects distorting results. Their revenue growth has been predominantly organic rather than acquisition-driven, reflecting genuine business strength. While quarterly results can be affected by product launch timing and holiday seasons, these are cyclical patterns rather than one-time distortions. The company's transition to services revenue represents a fundamental business evolution rather than a temporary boost. Tax reform in 2017 did create a one-time repatriation charge, but subsequent performance confirmed the underlying business strength. Supply chain disruptions during COVID-19 impacted short-term results but didn't alter long-term trajectories. The company provides detailed segment reporting that allows investors to distinguish between recurring business performance and unusual items. This transparency and consistency in financial reporting, along with predominantly organic growth, aligns with Buffett's preference for businesses whose past performance reliably indicates future prospects."
    },
    turnaround: {
      status: 'pass',
      title: '11. Keine Turnarounds',
      description: 'Turnaround-Status erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Anzeichen für Restrukturierung oder Sanierung',
        'Analysieren Sie, ob das Unternehmen sich in einer Erholungsphase befindet',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Apple clearly meets Buffett's criterion of avoiding turnaround situations. The company has maintained strong, consistent performance without requiring any significant restructuring or recovery efforts. Apple has experienced continuous profitability and growth over the past decade, with industry-leading margins and returns on capital. Their transition from a hardware-focused company to one with a growing services component has been a strategic evolution rather than a reactive turnaround. Apple's business model has consistently generated substantial free cash flow without interruption. Management changes, including the transition from Steve Jobs to Tim Cook, were carefully planned rather than reactive to poor performance. The company has not required divesting underperforming segments or dramatic cost-cutting initiatives that characterize turnaround situations. Apple represents exactly the type of consistently successful enterprise that Buffett prefers over companies requiring significant operational fixes or financial restructuring."
    }
  },
  "MSFT": {
    businessModel: {
      status: 'pass',
      title: '1. Verstehbares Geschäftsmodell',
      description: 'Microsoft Corporation ist tätig im Bereich Software—Infrastructure.',
      details: [
        'Hauptgeschäftsbereich: Software—Infrastructure',
        'Sektor: Technology',
        'Gründungsjahr: 1986',
        'Beschreibung: Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide...'
      ],
      gptAnalysis: "Microsoft's business model is highly understandable. The company provides essential software, cloud services, and hardware products used by businesses and consumers worldwide. Their core offerings include Windows operating system, Office productivity suite, Azure cloud platform, and LinkedIn professional network. Microsoft operates on a subscription-based model for many products, creating predictable, recurring revenue streams. Their enterprise focus provides stability as businesses rely on Microsoft products for critical operations. The clarity of their revenue sources, strong market position, and essential nature of their products create exactly the kind of understandable business model that Warren Buffett favors for investment."
    },
    economicMoat: {
      status: 'pass',
      title: '2. Wirtschaftlicher Burggraben (Moat)',
      description: 'Microsoft Corporation zeigt starke Anzeichen eines wirtschaftlichen Burggrabens.',
      details: [
        'Bruttomarge: 68.24% (Buffett bevorzugt >40%)',
        'Operative Marge: 41.85% (Buffett bevorzugt >20%)',
        'ROIC: 27.33% (Buffett bevorzugt >15%)',
        'Marktposition: Aktiv am Markt'
      ],
      gptAnalysis: "Microsoft possesses an exceptional economic moat built on multiple sustainable advantages. Their ecosystem creates high switching costs, as businesses and individuals become dependent on Windows, Office, and Azure. Network effects strengthen their position, particularly in products like Teams, LinkedIn, and GitHub where value increases with more users. Microsoft benefits from substantial scale economies in cloud infrastructure and software development. Their vast intellectual property portfolio provides significant protection. Long-term enterprise contracts create predictable revenue streams and business stability. Microsoft's financial strength allows continued investment in emerging technologies like AI. Their diversified revenue streams span consumer, enterprise, hardware, and services, reducing risk. These combined advantages create extraordinary protection against competition, allowing Microsoft to maintain high margins and returns on capital that exceed Buffett's criteria for a strong economic moat."
    },
    financialMetrics: {
      status: 'pass',
      title: '3. Finanzkennzahlen (10 Jahre Rückblick)',
      description: 'Die Finanzkennzahlen von Microsoft Corporation sind stark.',
      details: [
        'Eigenkapitalrendite (ROE): 37.25% (Buffett bevorzugt >15%)',
        'Nettomarge: 34.85% (Buffett bevorzugt >10%)',
        'Gewinn pro Aktie: 10.31 USD',
        'Umsatz pro Aktie: 26.62 USD'
      ]
    },
    financialStability: {
      status: 'pass',
      title: '4. Finanzielle Stabilität & Verschuldung',
      description: 'Microsoft Corporation zeigt starke finanzielle Stabilität.',
      details: [
        'Schulden zu Vermögen: 24.85% (Buffett bevorzugt <50%)',
        'Zinsdeckungsgrad: 32.45 (Buffett bevorzugt >5)',
        'Current Ratio: 2.15 (Buffett bevorzugt >1.5)',
        'Schulden zu EBITDA: 0.95 (niedriger ist besser)'
      ]
    },
    management: {
      status: 'pass',
      title: '5. Qualität des Managements',
      description: 'Die Qualität des Managements ist hervorragend.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Insider-Beteiligungen, Kapitalallokation und Kommunikation',
        'CEO: Satya Nadella',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Microsoft's management under Satya Nadella has demonstrated exceptional strategic vision and execution. Since becoming CEO in 2014, Nadella has transformed Microsoft from a software-centric company to a cloud-first leader. Management has shown remarkable capital allocation skills, including strategic acquisitions like LinkedIn and GitHub that have strengthened their competitive position. Their R&D investments in areas like AI and quantum computing position them for long-term growth. The executive team communicates transparently with shareholders and has effectively navigated challenges like antitrust scrutiny. Their focus on long-term value creation rather than short-term results aligns perfectly with Buffett's management criteria."
    },
    valuation: {
      status: 'warning',
      title: '6. Bewertung (nicht zu teuer kaufen)',
      description: 'Microsoft Corporation ist aktuell moderat bewertet.',
      details: [
        'KGV (P/E): 34.21 (Buffett bevorzugt <15)',
        'Dividendenrendite: 0.75% (Buffett bevorzugt >2%)',
        'Kurs zu Buchwert: 12.56 (niedriger ist besser)',
        'Kurs zu Cashflow: 28.12 (niedriger ist besser)'
      ]
    },
    longTermOutlook: {
      status: 'pass',
      title: '7. Langfristiger Horizont',
      description: 'Microsoft Corporation operiert in einer Branche mit guten langfristigen Aussichten.',
      details: [
        'Branche: Software—Infrastructure',
        'Sektor: Technology',
        'Börsennotiert seit: 13/03/1986',
        'Eine tiefere Analyse der langfristigen Branchentrends wird empfohlen'
      ],
      gptAnalysis: "Microsoft's long-term prospects remain highly favorable due to its strong position in essential technology markets. Their Azure cloud platform is poised for continued growth as businesses migrate to the cloud. The company's investments in AI position them to capitalize on emerging opportunities. Their subscription-based revenue model provides predictable, recurring revenue streams. Microsoft's diversified revenue streams span consumer, enterprise, hardware, and services, reducing risk. Their financial strength allows continued investment in emerging technologies. The company's enterprise focus provides stability as businesses rely on Microsoft products for critical operations. Overall, Microsoft's adaptability, brand strength, and financial resources suggest continued long-term success, aligning with Buffett's preference for businesses with enduring competitive advantages."
    },
    rationalBehavior: {
      status: 'warning',
      title: '8. Rationalität & Disziplin',
      description: 'Rationalität und Disziplin erfordern tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Kapitalallokation, Akquisitionen und Ausgaben',
        'Analysieren Sie, ob das Management bewusst und diszipliniert handelt',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Microsoft demonstrates exceptional rationality and discipline in its business operations and capital allocation. The company maintains a focused product lineup rather than chasing every market opportunity. Their acquisition strategy is selective and strategic, typically acquiring companies that enhance their technology or talent pool rather than pursuing headline-grabbing mega-mergers. Microsoft's R&D spending, while substantial in absolute terms, remains efficient as a percentage of revenue compared to peers. Their massive share repurchase program has been executed methodically when they believe shares are undervalued. The company maintains a substantial cash reserve that provides flexibility during economic downturns. Management communicates conservatively, typically under-promising and over-delivering on financial guidance. Overall, Microsoft exhibits the rational, disciplined behavior that Buffett prizes in management teams, avoiding the emotional decision-making that often destroys shareholder value."
    },
    cyclicalBehavior: {
      status: 'warning',
      title: '9. Antizyklisches Verhalten',
      description: 'Antizyklisches Verhalten erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie das Verhalten in Marktkrisen',
        'Analysieren Sie, ob das Unternehmen kauft, wenn andere verkaufen',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Microsoft has demonstrated strong countercyclical behavior, particularly during market downturns. During the 2008 financial crisis and the 2020 pandemic correction, Microsoft continued investing in product development and innovation while many competitors cut back. Their massive share repurchase program has been strategically accelerated during market dips, reflecting confidence in their long-term prospects despite short-term market pessimism. The company maintains substantial cash reserves (over $100 billion in cash and marketable securities) that allow them to capitalize on opportunities when assets are undervalued. Microsoft's investments in their cloud infrastructure during downturns have strengthened their competitive position coming out of recessions. Their diversified revenue streams also provide significant insulation against economic cycles. This countercyclical approach to capital allocation and business strategy aligns with Buffett's preference for companies that can take advantage of market irrationality rather than fall victim to it."
    },
    oneTimeEffects: {
      status: 'warning',
      title: '10. Vergangenheit ≠ Zukunft',
      description: 'Die Nachhaltigkeit des Erfolgs erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie einmalige Ereignisse, die Ergebnisse beeinflusst haben',
        'Analysieren Sie, ob das Wachstum organisch oder durch Übernahmen getrieben ist',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Microsoft's financial performance has shown remarkable consistency with minimal one-time effects distorting results. Their revenue growth has been predominantly organic rather than acquisition-driven, reflecting genuine business strength. While quarterly results can be affected by product launch timing and holiday seasons, these are cyclical patterns rather than one-time distortions. The company's transition to cloud services represents a fundamental business evolution rather than a temporary boost. Tax reform in 2017 did create a one-time repatriation charge, but subsequent performance confirmed the underlying business strength. Supply chain disruptions during COVID-19 impacted short-term results but didn't alter long-term trajectories. The company provides detailed segment reporting that allows investors to distinguish between recurring business performance and unusual items. This transparency and consistency in financial reporting, along with predominantly organic growth, aligns with Buffett's preference for businesses whose past performance reliably indicates future prospects."
    },
    turnaround: {
      status: 'pass',
      title: '11. Keine Turnarounds',
      description: 'Turnaround-Status erfordert tiefere Analyse.',
      details: [
        'Für eine vollständige Bewertung sind zusätzliche Daten erforderlich',
        'Beachten Sie Anzeichen für Restrukturierung oder Sanierung',
        'Analysieren Sie, ob das Unternehmen sich in einer Erholungsphase befindet',
        'Diese Bewertung sollte durch persönliche Recherche ergänzt werden'
      ],
      gptAnalysis: "Microsoft clearly meets Buffett's criterion of avoiding turnaround situations. The company has maintained strong, consistent performance without requiring any significant restructuring or recovery efforts. Microsoft has experienced continuous profitability and growth over the past decade, with industry-leading margins and returns on capital. Their transition from a software-focused company to one with a growing cloud services component has been a strategic evolution rather than a reactive turnaround. Microsoft's business model has consistently generated substantial free cash flow without interruption. Management changes, including the transition from Bill Gates to Satya Nadella, were carefully planned rather than reactive to poor performance. The company has not required divesting underperforming segments or dramatic cost-cutting initiatives that characterize turnaround situations. Microsoft represents exactly the type of consistently successful enterprise that Buffett prefers over companies requiring significant operational fixes or financial restructuring."
    }
  }
};

export const mockFinancialMetrics = {
  "AAPL": {
    metrics: {
      eps: 6.14,
      roe: 0.2383,
      netMargin: 0.2184,
      roic: 0.2845,
      debtToAssets: 0.2985,
      interestCoverage: 24.12
    },
    historicalData: {
      revenue: [365817, 394328, 274515, 260174, 229234],
      netIncome: [97283, 99803, 57411, 55256, 48351],
      eps: [6.14, 6.15, 3.31, 3.03, 2.54],
      roe: [0.2383, 0.3321, 0.3552, 0.5543, 0.4912],
      grossMargin: [0.4382, 0.4338, 0.4178, 0.3938, 0.3812],
      operatingMargin: [0.2532, 0.2512, 0.2451, 0.2432, 0.2412]
    }
  },
  "MSFT": {
    metrics: {
      eps: 10.31,
      roe: 0.3725,
      netMargin: 0.3485,
      roic: 0.2733,
      debtToAssets: 0.2485,
      interestCoverage: 32.45
    },
    historicalData: {
      revenue: [211915, 198270, 168088, 143015, 125843],
      netIncome: [72361, 67430, 61271, 44281, 39240],
      eps: [10.31, 8.91, 8.05, 5.76, 5.06],
      roe: [0.3725, 0.3986, 0.4312, 0.4231, 0.3875],
      grossMargin: [0.6824, 0.6792, 0.6754, 0.6532, 0.6491],
      operatingMargin: [0.4185, 0.4165, 0.4123, 0.3972, 0.3851]
    }
  }
};

export const mockOverallRating = {
  "AAPL": {
    overall: 'buy',
    summary: 'Nach Warren Buffetts Kriterien eine vielversprechende Investition.',
    strengths: [
      'Klares, verständliches Geschäftsmodell',
      'Starker wirtschaftlicher Burggraben (Moat)',
      'Hervorragende Finanzkennzahlen (ROE, Nettomarge)',
      'Solide finanzielle Stabilität mit geringer Verschuldung',
      'Vielversprechende langfristige Perspektiven'
    ],
    weaknesses: [
      'Hohe Bewertung im Verhältnis zu den fundamentalen Daten'
    ],
    recommendation: 'Diese Aktie erfüllt viele von Buffetts Kriterien und könnte eine gute langfristige Investition sein. Wie immer sollten Sie Ihre eigene Due Diligence durchführen und Ihr Portfolio diversifizieren.'
  },
  "MSFT": {
    overall: 'buy',
    summary: 'Nach Warren Buffetts Kriterien eine vielversprechende Investition.',
    strengths: [
      'Klares, verständliches Geschäftsmodell',
      'Starker wirtschaftlicher Burggraben (Moat)',
      'Hervorragende Finanzkennzahlen (ROE, Nettomarge)',
      'Solide finanzielle Stabilität mit geringer Verschuldung',
      'Vielversprechende langfristige Perspektiven'
    ],
    weaknesses: [
      'Hohe Bewertung im Verhältnis zu den fundamentalen Daten'
    ],
    recommendation: 'Diese Aktie erfüllt viele von Buffetts Kriterien und könnte eine gute langfristige Investition sein. Wie immer sollten Sie Ihre eigene Due Diligence durchführen und Ihr Portfolio diversifizieren.'
  }
};
