
import axios from 'axios';

// OpenAI API Key - Fest im Code eingebaut
const OPENAI_API_KEY = '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';

// OpenAI API Key handling
const getOpenAiApiKey = () => {
  return OPENAI_API_KEY;
};

export const hasOpenAiApiKey = (): boolean => {
  // Instead of comparing with empty string, check if the key exists and has a length
  return !!OPENAI_API_KEY && OPENAI_API_KEY.length > 0 && !OPENAI_API_KEY.includes('IHR-OPENAI-API-KEY-HIER');
};

// OpenAI API Service - Standard Chat Completion API ohne Websearch
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Interface für Chat Completion API Response
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Function to query the OpenAI API using the standard Chat Completions API (kein Websearch)
export const queryGPT = async (prompt: string): Promise<string> => {
  try {
    const apiKey = getOpenAiApiKey();
    
    console.log('API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 7) : 'none',
      isPlaceholder: apiKey ? apiKey.includes('IHR-OPENAI-API-KEY-HIER') : false
    });
    
    if (!apiKey || apiKey.length === 0 || apiKey.includes('IHR-OPENAI-API-KEY-HIER')) {
      throw new Error('OpenAI API-Key ist nicht konfiguriert. Bitte ersetzen Sie den Platzhalter in der openaiApi.ts Datei mit Ihrem tatsächlichen API-Key.');
    }

    
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Als hilfreicher Assistent für Aktienanalysen nach Warren Buffetts Kriterien, beantworte folgende Frage präzise und strukturiert.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    };

    

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    };

    console.log('Making OpenAI request with headers:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': `Bearer ${apiKey.substring(0, 7)}...` // Log only first part for security
    });

    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      requestBody,
      { headers }
    );
    
    console.log('Raw OpenAI response received:', JSON.stringify(response.data, null, 2));
    
    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      if (content) {
        return content.trim();
      }
    }
    
    throw new Error('Unerwartetes Antwortformat von der OpenAI-API - keine Textdaten gefunden');
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('OpenAI API-Key ist ungültig. Bitte überprüfen Sie Ihren API-Key in der openaiApi.ts Datei.');
      }
      
      if (error.response?.data?.error?.message) {
        throw new Error(`OpenAI API Fehler: ${error.response.data.error.message}`);
      }
    }
    
    throw new Error('Fehler bei der Anfrage an OpenAI. Bitte versuchen Sie es später erneut.');
  }
};

// Function to analyze business model using GPT
export const analyzeBusinessModel = async (companyName: string, industry: string, description: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Verstehbares Geschäftsmodell".

    Hier ist eine kurze Beschreibung des Unternehmens:
    ${description}
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Wird klar, womit das Unternehmen Geld verdient?
    2. Ist das Geschäftsmodell einfach in wenigen Sätzen erklärbar?
    3. Ist das Geschäftsmodell auch für Laien oder junge Menschen verständlich?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Wird klar, womit das Unternehmen Geld verdient?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Ist das Geschäftsmodell einfach in wenigen Sätzen erklärbar?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Ist das Geschäftsmodell auch für Laien oder junge Menschen verständlich?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Einfach verständlich (Pass)
      - Moderat komplex (Warning)
      - Zu komplex (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze economic moat using GPT
export const analyzeEconomicMoat = async (companyName: string, industry: string, grossMargin: number, operatingMargin: number, roic: number): Promise<string> => {
  const prompt = `
   Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Wirtschaftlicher Burggraben (Moat)".

    Hier sind quantitative Kennzahlen:
    - Bruttomarge: ${grossMargin.toFixed(2)}%
    - Betriebsmarge: ${operatingMargin.toFixed(2)}%
    - ROIC: ${roic.toFixed(2)}%
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Hat das Unternehmen strukturelle Wettbewerbsvorteile (z. B. Netzwerkeffekt, Marke, Technologievorsprung)?
    2. Werden diese Vorteile durch die Kennzahlen gestützt?
    3. Ist der Burggraben gegenüber Wettbewerbern langfristig verteidigbar?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Hat das Unternehmen strukturelle Wettbewerbsvorteile (z. B. Netzwerkeffekt, Marke, Technologievorsprung)?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Werden diese Vorteile durch die Kennzahlen gestützt?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Ist der Burggraben gegenüber Wettbewerbern langfristig verteidigbar?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Starker Moat (Pass)
      - Moderater Moat (Warning)
      - Schwacher/Kein Moat (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using GPT
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterium "Qualität des Managements".

    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Ist das Management ehrlich und transparent?
    2. Handelt es im Sinne der Aktionäre?
    3. Zeigt es eine disziplinierte Kapitalallokation?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Ist das Management ehrlich und transparent?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Handelt es im Sinne der Aktionäre?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Zeigt es eine disziplinierte Kapitalallokation?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Gutes Management (Pass)
      - Durchschnittliches Management (Warning)
      - Problematisches Management (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    - Wenn der CEO neu ist und keine Kapitalallokation erkennbar ist, schreibe bei Punkt 3: "Noch nicht bewertbar – neutral".
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using GPT
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Wird das Unternehmen mit seinem aktuellen Geschäftsmodell auch in 20 Jahren noch eine relevante Rolle spielen?
    2. Wird die Branche durch langfristige Megatrends getragen?
    3. Verfügt das Unternehmen über eine glaubwürdige Zukunftsstrategie?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Wird das Unternehmen mit seinem aktuellen Geschäftsmodell auch in 20 Jahren noch eine relevante Rolle spielen?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Wird die Branche durch langfristige Megatrends getragen?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Verfügt das Unternehmen über eine glaubwürdige Zukunftsstrategie?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Starke Langzeitperspektive (Pass)
      - Moderate Langzeitperspektive (Warning)
      - Schwache Langzeitperspektive (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using GPT
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Handelt das Management diszipliniert und langfristig denkend?
    2. Gab es in der Vergangenheit überteuerte Übernahmen oder strategische Sprunghaftigkeit?
    3. Werden Ressourcen sinnvoll und effizient eingesetzt?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Handelt das Management diszipliniert und langfristig denkend?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Gab es in der Vergangenheit überteuerte Übernahmen oder strategische Sprunghaftigkeit?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Werden Ressourcen sinnvoll und effizient eingesetzt?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Rationales Verhalten (Pass)
      - Gemischtes Bild (Warning)
      - Irrationales Verhalten (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Antizyklisches Verhalten".
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Ist das Geschäftsmodell grundsätzlich zyklisch oder antizyklisch?
    2. Wie verhält sich das Unternehmen in wirtschaftlichen Krisen oder Abschwüngen?
    3. Kauft das Management gezielt Aktien zurück, wenn der Markt schwach ist?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Ist das Geschäftsmodell grundsätzlich zyklisch oder antizyklisch?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Wie verhält sich das Unternehmen in wirtschaftlichen Krisen oder Abschwüngen?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Kauft das Management gezielt Aktien zurück, wenn der Markt schwach ist?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Antizyklisches Verhalten (Pass)
      - Neutrales Verhalten (Warning)
      - Stark zyklisches Verhalten (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Vergangenheit ≠ Zukunft".
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Beruhte der bisherige Erfolg auf einmaligen oder außergewöhnlichen Effekten?
    2. Gab es starke Wachstumsphasen durch untypische externe Faktoren?
    3. Ist das Wachstum langfristig wiederholbar und basiert auf einem stabilen Geschäftsmodell?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Beruhte der bisherige Erfolg auf einmaligen oder außergewöhnlichen Effekten?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Gab es starke Wachstumsphasen durch untypische externe Faktoren?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Ist das Wachstum langfristig wiederholbar und basiert auf einem stabilen Geschäftsmodell?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Nachhaltige Geschäftsentwicklung (Pass)
      - Teilweise nachhaltig (Warning)
      - Stark von Einmaleffekten abhängig (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Keine Turnarounds".
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Gibt es Hinweise auf operative Probleme oder strategische Verzweiflung?
    2. Gab es kürzlich eine tiefgreifende Restrukturierung oder einen CEO-Wechsel mit radikaler Neuausrichtung?
    3. Ist das Unternehmen stabil und profitabel – oder kämpft es darum, wieder Vertrauen oder Marktanteile zu gewinnen?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Gibt es Hinweise auf operative Probleme oder strategische Verzweiflung?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **2. Gab es kürzlich eine tiefgreifende Restrukturierung oder einen CEO-Wechsel mit radikaler Neuausrichtung?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **3. Ist das Unternehmen stabil und profitabel – oder kämpft es darum, wieder Vertrauen oder Marktanteile zu gewinnen?**  
    - [Aussage 1]  
    - [Aussage 2]
    
    **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    
    Hinweise:
    - Verwende exakt die Formulierung am Ende:  
      **Bewertung:** <Bewertungstext>. Von 3 Teilaspekten wurden <x> erfüllt.
    - Bewertungstext **muss** eine der folgenden Optionen sein:
      - Stabiles Unternehmen (Pass)
      - Leichte Umstrukturierung (Warning)
      - Klarer Turnaround-Fall (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.“)
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};
