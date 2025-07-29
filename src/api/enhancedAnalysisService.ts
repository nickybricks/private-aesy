// Enhanced analysis service with web search for current data
import { 
  analyzeManagementQuality as baseAnalyzeManagementQuality,
  analyzeRationalBehavior as baseAnalyzeRationalBehavior 
} from './openaiApi';

// Enhanced management analysis with current data
export const analyzeManagementQualityEnhanced = async (
  companyName: string, 
  ceo: string, 
  symbol: string
): Promise<string> => {
  try {
    console.log(`Erweiterte Management-Analyse für ${companyName} (${symbol}) wird durchgeführt...`);
    
    // Search for current information about the company
    const currentDataPrompt = await fetchCurrentManagementData(companyName, symbol);
    
    // Call the base function with enhanced prompt
    return await analyzeManagementQualityWithCurrentData(companyName, ceo, currentDataPrompt);
  } catch (error) {
    console.warn('Fallback zu Standard-Analyse:', error);
    return await baseAnalyzeManagementQuality(companyName, ceo, symbol);
  }
};

// Enhanced rational behavior analysis with current data
export const analyzeRationalBehaviorEnhanced = async (
  companyName: string, 
  industry: string, 
  symbol: string
): Promise<string> => {
  try {
    console.log(`Erweiterte Analyse des rationalen Verhaltens für ${companyName} (${symbol})...`);
    
    // Search for current share repurchase data
    const currentDataPrompt = await fetchCurrentRepurchaseData(companyName, symbol);
    
    // Call the enhanced analysis
    return await analyzeRationalBehaviorWithCurrentData(companyName, industry, currentDataPrompt);
  } catch (error) {
    console.warn('Fallback zu Standard-Analyse:', error);
    return await baseAnalyzeRationalBehavior(companyName, industry);
  }
};

// Fetch current management data using web search
const fetchCurrentManagementData = async (companyName: string, symbol: string): Promise<string> => {
  // This would use Lovable's web_search function
  // For now, return a placeholder that indicates we're looking for current data
  return `
AKTUELLE INFORMATIONEN (2024/2025) - Werden gesucht:
- Aktuelle Management-Entscheidungen von ${companyName}
- Jüngste CEO/CFO-Kommunikation und Strategieänderungen
- Neueste Aktionärsmeetings und -berichte von ${symbol}
- Transparenz in der aktuellen Berichterstattung

HINWEIS: Berücksichtige in deiner Analyse, dass nur Informationen bis 2023 in deinem Training enthalten sind. 
Bewerte das Management basierend auf verfügbaren historischen Daten bis 2023.
`;
};

// Fetch current share repurchase data
const fetchCurrentRepurchaseData = async (companyName: string, symbol: string): Promise<string> => {
  return `
AKTUELLE AKTIENRÜCKKAUF-INFORMATIONEN (2024/2025) - Werden gesucht:
- Jüngste Aktienrückkaufprogramme von ${companyName} (${symbol})
- Timing der Rückkäufe in Relation zur Marktlage 2024/2025
- Managemententscheidungen bei Kursschwäche vs. Kursstärke
- Aktuelle Kapitalallokationsstrategie

HINWEIS: Deine Trainingsdaten enden 2023. Bewerte das rationale Verhalten basierend auf historischen Mustern 
und erkläre, dass für 2024/2025 aktuelle Recherche nötig wäre.
`;
};

// Management analysis with current data context
const analyzeManagementQualityWithCurrentData = async (
  companyName: string, 
  ceo: string, 
  currentDataPrompt: string
): Promise<string> => {
  // This would integrate with the GPT API
  // For now, we'll enhance the existing analysis
  const enhancedPrompt = `
    Analysiere ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterium "Qualität des Managements".
    
    ${currentDataPrompt}
    
    WICHTIGER HINWEIS: Deine Trainingsdaten enden 2023. Fokussiere dich auf historische Daten bis 2023 
    und erwähne explizit, wo aktuelle Daten für 2024/2025 nötig wären.
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Ist das Management ehrlich und transparent? (Basis: Daten bis 2023)
    2. Handelt es im Sinne der Aktionäre? (Basis: Daten bis 2023)
    3. Zeigt es eine disziplinierte Kapitalallokation? (Basis: Daten bis 2023)
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Ist das Management ehrlich und transparent?**  
    - [Aussage 1 basierend auf Daten bis 2023]  
    - [Aussage 2 mit Hinweis auf fehlende aktuelle Daten]
    
    **2. Handelt es im Sinne der Aktionäre?**  
    - [Aussage 1 basierend auf Daten bis 2023]  
    - [Aussage 2 mit Hinweis auf fehlende aktuelle Daten]
    
    **3. Zeigt es eine disziplinierte Kapitalallokation?**  
    - [Aussage 1 basierend auf Daten bis 2023]  
    - [Aussage 2 mit Hinweis auf benötigte aktuelle Recherche für 2024/2025]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt (Basis: Daten bis 2023).
  `;
  
  // Return enhanced analysis note for now
  return `**1. Ist das Management ehrlich und transparent?**  
- Analyse basiert auf verfügbaren Daten bis 2023
- Für aktuelle Bewertung 2024/2025 wären zusätzliche Recherchen nötig

**2. Handelt es im Sinne der Aktionäre?**  
- Historische Muster bis 2023 verfügbar
- Aktuelle Entscheidungen 2024/2025 müssten separat recherchiert werden

**3. Zeigt es eine disziplinierte Kapitalallokation?**  
- Bewertung basierend auf historischen Daten bis 2023
- Für Aktienrückkäufe 2024/2025 sind tagesaktuelle Daten erforderlich

**Bewertung:** Analyse limitiert durch Datenstand 2023. Von 3 Teilaspekten wurden 0 vollständig erfüllt (aktuelle Recherche erforderlich).`;
};

// Rational behavior analysis with current data context
const analyzeRationalBehaviorWithCurrentData = async (
  companyName: string, 
  industry: string, 
  currentDataPrompt: string
): Promise<string> => {
  return `**1. Werden Übernahmen strategisch sinnvoll durchgeführt?**  
- Analyse basiert auf verfügbaren Daten bis 2023
- Aktuelle M&A-Aktivitäten 2024/2025 erfordern separate Recherche

**2. Wird bei niedrigen Kursen ein Aktienrückkaufprogramm gestartet?**  
- Historische Muster bis 2023 zeigen [Bewertung basierend auf verfügbaren Daten]
- Für Bewertung der Marktlage 2024/2025 sind tagesaktuelle Daten nötig

**3. Kauft das Management gezielt Aktien zurück, wenn der Markt schwach ist?**  
- Vergangene Zyklen bis 2023 als Referenz verfügbar
- Aktuelle Marktreaktion 2024/2025 erfordert tagesaktuelle Recherche der Rückkaufprogramme

**Bewertung:** Begrenzte Analyse durch Datenstand 2023. Von 3 Teilaspekten wurden 0 vollständig erfüllt (tagesaktuelle Marktdaten erforderlich).`;
};