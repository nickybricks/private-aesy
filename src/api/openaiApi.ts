
import axios from 'axios';

// OpenAI API Key handling
const getOpenAiApiKey = () => {
  const savedApiKey = localStorage.getItem('openai_api_key');
  if (savedApiKey) {
    return savedApiKey;
  }
  return null;
};

export const setOpenAiApiKey = (key: string) => {
  localStorage.setItem('openai_api_key', key);
  // Wir lösen ein Storage-Event aus, damit andere Komponenten darauf reagieren können
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'openai_api_key',
    newValue: key
  }));
};

export const hasOpenAiApiKey = (): boolean => {
  return !!localStorage.getItem('openai_api_key');
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
    
    if (!apiKey) {
      throw new Error('OpenAI API-Key ist nicht konfiguriert. Bitte geben Sie Ihren OpenAI API-Key ein.');
    }
    
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Assistent, der Aktienunternehmen nach Warren Buffetts Investmentprinzipien analysiert. Deine Antworten sollen präzise, faktenbasiert und neutral sein.'
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
      throw new Error('OpenAI API-Key ist ungültig. Bitte überprüfen Sie Ihren API-Key.');
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
    
    Beschreibe das Geschäftsmodell in zwei einfachen Sätzen und bewerte, ob es leicht verständlich ist.
    Bewerte auf einer Skala: Einfach verständlich (Pass), Moderat komplex (Warning), Zu komplex (Fail).
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
    
    Hat das Unternehmen einen starken wirtschaftlichen Burggraben? Begründe deine Einschätzung kurz und bewerte:
    Starker Moat (Pass), Moderater Moat (Warning), Schwacher/Kein Moat (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using GPT
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere die Qualität des Managements von ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterien.
    
    Bewerte nach folgenden Aspekten:
    - Ist das Management ehrlich und transparent?
    - Handelt es zum Wohle der Aktionäre?
    - Hat es eine gute Kapitalallokation gezeigt?
    
    Gib eine kurze Einschätzung und bewerte:
    Gutes Management (Pass), Durchschnittliches Management (Warning), Problematisches Management (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using GPT
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere die langfristigen Perspektiven von ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    
    Ist das Unternehmen auch in 20 Jahren noch relevant? Beantworte folgende Fragen:
    - Ist die Branche Teil langfristiger Megatrends?
    - Ist das Geschäftsmodell zukunftssicher?
    - Hat das Unternehmen langfristige Wettbewerbsvorteile?
    
    Gib eine kurze Einschätzung und bewerte:
    Starke Langzeitperspektive (Pass), Moderate Langzeitperspektive (Warning), Schwache Langzeitperspektive (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using GPT
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) in Bezug auf Warren Buffetts Kriterium "Antizyklisches Verhalten".
    
    Beantworte folgende Fragen:
    - Ist das Unternehmen zyklisch oder antizyklisch?
    - Wie verhält sich das Unternehmen in Krisen oder Marktabschwüngen?
    - Kauft das Management Aktien zurück, wenn andere verkaufen?
    
    Gib eine kurze Einschätzung und bewerte:
    Antizyklisches Verhalten (Pass), Neutrales Verhalten (Warning), Stark zyklisches Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Vergangenheit ≠ Zukunft".
    
    Beantworte folgende Fragen:
    - Beruht der Erfolg des Unternehmens auf Einmaleffekten?
    - Gibt es Anzeichen für nicht nachhaltige Wachstumstreiber?
    - Ist das Wachstum organisch oder durch Übernahmen/externe Faktoren getrieben?
    
    Gib eine kurze Einschätzung und bewerte:
    Nachhaltige Geschäftsentwicklung (Pass), Teilweise nachhaltig (Warning), Stark von Einmaleffekten abhängig (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Keine Turnarounds".
    
    Beantworte folgende Fragen:
    - Handelt es sich um ein Unternehmen in einer Umbruchsphase?
    - Gab es kürzlich eine Restrukturierung oder einen Managementwechsel?
    - Muss sich das Unternehmen "wieder fangen" oder ist es bereits stabil?
    
    Gib eine kurze Einschätzung und bewerte:
    Stabiles Unternehmen (Pass), Leichte Umstrukturierung (Warning), Klarer Turnaround-Fall (Fail).
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".
    
    Beantworte folgende Fragen:
    - Handelt das Management rational und diszipliniert?
    - Gab es in der Vergangenheit irrationale Entscheidungen oder übertriebene Ausgaben?
    - Werden Ressourcen effizient eingesetzt?
    
    Gib eine kurze Einschätzung und bewerte:
    Rationales Verhalten (Pass), Gemischtes Bild (Warning), Irrationales Verhalten (Fail).
  `;
  
  return await queryGPT(prompt);
};
