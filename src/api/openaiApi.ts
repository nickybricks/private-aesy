import axios from 'axios';

// OpenAI API Key - Fest im Code eingebaut
const OPENAI_API_KEY = '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';

// OpenAI API Key handling
const getOpenAiApiKey = () => {
  return OPENAI_API_KEY;
};

export const hasOpenAiApiKey = (): boolean => {
  // Instead of comparing with empty string, check if the key exists and has a length
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 0;
};

// OpenAI API Service - Updated to use Responses API
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

// Updated interface for OpenAI Responses API
export interface OpenAIResponse {
  id: string;
  output_text?: string;
  items?: Array<{
    type: string;
    id: string;
    status: string;
    role?: string;
    content?: Array<{
      type: string;
      text: string;
      annotations?: Array<{
        type: string;
        start_index: number;
        end_index: number;
        url: string;
        title: string;
      }>;
    }>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Function to query the OpenAI API using the Responses API with web search
export const queryGPT = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getOpenAiApiKey();
    
    if (!apiKey || apiKey.length === 0) {
      throw new Error('OpenAI API-Key ist nicht konfiguriert. Bitte ersetzen Sie den Platzhalter in der openaiApi.ts Datei mit Ihrem tatsächlichen API-Key.');
    }
    
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: 'gpt-4.1',
        tools: [
          {
            type: 'web_search_preview',
            search_context_size: 'medium'  // Ausgewogenes Verhältnis von Geschwindigkeit, Kosten und Qualität
          }
        ],
        tool_choice: { type: 'web_search_preview' }, // Erzwingt Websuche
        system: 'Du bist ein hilfreicher Assistent für Aktienanalysen nach Warren Buffetts Kriterien.',
        input: prompt,
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract output text from the response
    if (response.data && response.data.items) {
      // Find the message response item
      const messageItem = response.data.items.find(item => 
        item.type === 'message' && item.content && item.content.length > 0
      );
      
      if (messageItem && messageItem.content && messageItem.content.length > 0) {
        const textContent = messageItem.content[0].text;
        if (textContent) {
          return textContent.trim();
        }
      }
      
      // If output_text directly available (some API versions)
      if (response.data.output_text) {
        return response.data.output_text.trim();
      }
    }
    
    throw new Error('Unerwartetes Antwortformat von der OpenAI-API');
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
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Ist das Geschäftsmodell leicht verständlich?**
    2. Führe 3-4 aussagekräftige Stichpunkte auf, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    3. Schließe mit einer klaren Bewertung ab: **Bewertung:** Einfach verständlich (Pass), Moderat komplex (Warning), Zu komplex (Fail).
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
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Hat das Unternehmen einen starken wirtschaftlichen Burggraben?**
    2. Führe 3-4 aussagekräftige Stichpunkte auf, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    3. Schließe mit einer klaren Bewertung ab: **Bewertung:** Starker Moat (Pass), Moderater Moat (Warning), Schwacher/Kein Moat (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using GPT
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere die Qualität des Managements von ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterien.
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Ist das Management ehrlich und transparent?**
    2. Füge eine zweite wichtige Frage hinzu: **Handelt es zum Wohle der Aktionäre?**
    3. Füge eine dritte wichtige Frage hinzu: **Zeigt es gute Kapitalallokation?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Gutes Management (Pass), Durchschnittliches Management (Warning), Problematisches Management (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using GPT
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere die langfristigen Perspektiven von ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Ist das Unternehmen auch in 20 Jahren noch relevant?**
    2. Füge eine zweite wichtige Frage hinzu: **Ist die Branche Teil langfristiger Megatrends?**
    3. Füge eine dritte wichtige Frage hinzu: **Hat das Unternehmen langfristige Wettbewerbsvorteile?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Starke Langzeitperspektive (Pass), Moderate Langzeitperspektive (Warning), Schwache Langzeitperspektive (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using GPT
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) in Bezug auf Warren Buffetts Kriterium "Antizyklisches Verhalten".
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Ist das Unternehmen zyklisch oder antizyklisch?**
    2. Füge eine zweite wichtige Frage hinzu: **Wie verhält es sich in Krisen oder Marktabschwüngen?**
    3. Füge eine dritte wichtige Frage hinzu: **Kauft das Management Aktien zurück, wenn der Markt schwach ist?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Antizyklisches Verhalten (Pass), Neutrales Verhalten (Warning), Stark zyklisches Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Vergangenheit ≠ Zukunft".
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Beruht der Erfolg auf Einmaleffekten?**
    2. Füge eine zweite wichtige Frage hinzu: **Gibt es Anzeichen für nicht nachhaltige Wachstumstreiber?**
    3. Füge eine dritte wichtige Frage hinzu: **Ist das Wachstum organisch oder durch Übernahmen/externe Faktoren getrieben?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Nachhaltige Geschäftsentwicklung (Pass), Teilweise nachhaltig (Warning), Stark von Einmaleffekten abhängig (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Keine Turnarounds".
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Handelt es sich um ein Unternehmen in einer Umbruchsphase?**
    2. Füge eine zweite wichtige Frage hinzu: **Gab es kürzlich eine Restrukturierung oder einen Managementwechsel?**
    3. Füge eine dritte wichtige Frage hinzu: **Ist das Unternehmen stabil oder muss es "wieder auf die Beine kommen"?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Stabiles Unternehmen (Pass), Leichte Umstrukturierung (Warning), Klarer Turnaround-Fall (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".
    
    Gib strukturierte Stichpunkte mit diesen Anforderungen:
    1. Beginne mit der Hauptfrage: **Handelt das Management rational und diszipliniert?**
    2. Füge eine zweite wichtige Frage hinzu: **Gab es in der Vergangenheit irrationale Entscheidungen?**
    3. Füge eine dritte wichtige Frage hinzu: **Werden Ressourcen effizient eingesetzt?**
    4. Beantworte jede Frage mit 1-2 aussagekräftigen Stichpunkten, die jeweils mit "- " beginnen und in einer neuen Zeile stehen.
    5. Schließe mit einer klaren Bewertung ab: **Bewertung:** Rationales Verhalten (Pass), Gemischtes Bild (Warning), Irrationales Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};
