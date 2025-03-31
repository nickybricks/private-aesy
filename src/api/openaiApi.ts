import axios from 'axios';

// OpenAI API Key - Fest im Code eingebaut
const OPENAI_API_KEY = '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';

// OpenAI API Key handling
const getOpenAiApiKey = () => {
  return OPENAI_API_KEY;
};

export const hasOpenAiApiKey = (): boolean => {
  return OPENAI_API_KEY !== '';
};

// OpenAI API Service
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

// Function to query the OpenAI API
export const queryGPT = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getOpenAiApiKey();
    
    if (apiKey === '') {
      throw new Error('OpenAI API-Key ist nicht konfiguriert. Bitte ersetzen Sie den Platzhalter in der openaiApi.ts Datei mit Ihrem tatsächlichen API-Key.');
    }
    
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Assistent, der Aktienunternehmen nach Warren Buffetts Investmentprinzipien analysiert. Gib nur kurze, prägnante Stichpunkte. Verwende Markdown für die Formatierung und setze wichtige Fragen in Fettdruck mit ** **.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error('OpenAI API-Key ist ungültig. Bitte überprüfen Sie Ihren API-Key in der openaiApi.ts Datei.');
    }
    throw new Error('Fehler bei der Anfrage an OpenAI. Bitte versuchen Sie es später erneut.');
  }
};

// Function to analyze business model using GPT
export const analyzeBusinessModel = async (companyName: string, industry: string, description: string): Promise<string> => {
  const prompt = `
    Analysiere das Geschäftsmodell von ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Verstehbares Geschäftsmodell".
    
    Hier ist eine kurze Beschreibung des Unternehmens:
    ${description}
    
    Gib nur 3-4 prägnante Stichpunkte. Verwende für die Hauptfrage **Ist das Geschäftsmodell leicht verständlich?** Fettdruck.
    Bewerte zum Schluss auf einer Skala: Einfach verständlich (Pass), Moderat komplex (Warning), Zu komplex (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze economic moat using GPT
export const analyzeEconomicMoat = async (companyName: string, industry: string, grossMargin: number, operatingMargin: number, roic: number): Promise<string> => {
  const prompt = `
    Analysiere den wirtschaftlichen Burggraben (Economic Moat) von ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterien.
    
    Hier sind einige Kennzahlen:
    - Bruttomarge: ${grossMargin.toFixed(2)}%
    - Betriebsmarge: ${operatingMargin.toFixed(2)}%
    - ROIC: ${roic.toFixed(2)}%
    
    Gib nur 3-4 prägnante Stichpunkte mit deiner Einschätzung. Verwende für die Hauptfrage **Hat das Unternehmen einen starken wirtschaftlichen Burggraben?** Fettdruck.
    Bewerte zum Schluss: Starker Moat (Pass), Moderater Moat (Warning), Schwacher/Kein Moat (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using GPT
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere die Qualität des Managements von ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterien.
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Ist das Management ehrlich und transparent?**
    **Handelt es zum Wohle der Aktionäre?**
    **Zeigt es gute Kapitalallokation?**
    
    Bewerte zum Schluss: Gutes Management (Pass), Durchschnittliches Management (Warning), Problematisches Management (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using GPT
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere die langfristigen Perspektiven von ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Ist das Unternehmen auch in 20 Jahren noch relevant?**
    **Ist die Branche Teil langfristiger Megatrends?**
    **Hat das Unternehmen langfristige Wettbewerbsvorteile?**
    
    Bewerte zum Schluss: Starke Langzeitperspektive (Pass), Moderate Langzeitperspektive (Warning), Schwache Langzeitperspektive (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using GPT
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) in Bezug auf Warren Buffetts Kriterium "Antizyklisches Verhalten".
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Ist das Unternehmen zyklisch oder antizyklisch?**
    **Wie verhält es sich in Krisen oder Marktabschwüngen?**
    **Kauft das Management Aktien zurück, wenn der Markt schwach ist?**
    
    Bewerte zum Schluss: Antizyklisches Verhalten (Pass), Neutrales Verhalten (Warning), Stark zyklisches Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Vergangenheit ≠ Zukunft".
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Beruht der Erfolg auf Einmaleffekten?**
    **Gibt es Anzeichen für nicht nachhaltige Wachstumstreiber?**
    **Ist das Wachstum organisch oder durch Übernahmen/externe Faktoren getrieben?**
    
    Bewerte zum Schluss: Nachhaltige Geschäftsentwicklung (Pass), Teilweise nachhaltig (Warning), Stark von Einmaleffekten abhängig (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Keine Turnarounds".
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Handelt es sich um ein Unternehmen in einer Umbruchsphase?**
    **Gab es kürzlich eine Restrukturierung oder einen Managementwechsel?**
    **Ist das Unternehmen stabil oder muss es "wieder auf die Beine kommen"?**
    
    Bewerte zum Schluss: Stabiles Unternehmen (Pass), Leichte Umstrukturierung (Warning), Klarer Turnaround-Fall (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".
    
    Gib nur 3-4 prägnante Stichpunkte und verwende für diese Hauptfragen Fettdruck:
    **Handelt das Management rational und diszipliniert?**
    **Gab es in der Vergangenheit irrationale Entscheidungen?**
    **Werden Ressourcen effizient eingesetzt?**
    
    Bewerte zum Schluss: Rationales Verhalten (Pass), Gemischtes Bild (Warning), Irrationales Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};
