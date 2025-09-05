import { supabase } from "@/integrations/supabase/client";

// Perplexity API Key handling via Supabase
export const hasOpenAiApiKey = (): boolean => {
  // Always return true since we use Perplexity via Supabase edge functions
  return true;
};

// Interface für Perplexity API Response
export interface PerplexityResponse {
  content: string;
  company?: string;
  analysisType?: string;
  error?: string;
}

// Function to query Perplexity via Supabase edge function for qualitative analysis
export const queryGPT = async (prompt: string): Promise<string> => {
  try {
    console.log('Making Perplexity request via Supabase edge function');
    
    const { data, error } = await supabase.functions.invoke('perplexity-news', {
      body: { 
        prompt,
        analysisType: 'qualitative'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Fehler bei der Perplexity-Anfrage: ${error.message}`);
    }

    if (data.error) {
      console.error('Perplexity API error:', data.error);
      throw new Error(data.error);
    }

    if (data.content) {
      console.log('Successfully received Perplexity analysis');
      return data.content.trim();
    }
    
    throw new Error('Unerwartetes Antwortformat von der Perplexity-API - keine Textdaten gefunden');
  } catch (error) {
    console.error('Error querying Perplexity:', error);
    throw new Error(error instanceof Error ? error.message : 'Fehler bei der Anfrage an Perplexity. Bitte versuchen Sie es später erneut.');
  }
};

// Function to analyze business model using Perplexity with current news data
export const analyzeBusinessModel = async (companyName: string, industry: string, description: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Verstehbares Geschäftsmodell".
    Nutze die aktuellsten verfügbaren Informationen und Nachrichten über das Unternehmen für deine Analyse.

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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze economic moat using Perplexity with current market data
export const analyzeEconomicMoat = async (companyName: string, industry: string, grossMargin: number, operatingMargin: number, roic: number): Promise<string> => {
  const prompt = `
   Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Wirtschaftlicher Burggraben (Moat)".
   Nutze die aktuellsten verfügbaren Informationen und Nachrichten über das Unternehmen für deine Analyse.

    Hier sind quantitative Kennzahlen:
    - Bruttomarge: ${grossMargin.toFixed(2)}%
    - Betriebsmarge: ${operatingMargin.toFixed(2)}%
    - ROIC: ${roic.toFixed(2)}%
    
    Beantworte dazu exakt die folgenden 3 Teilaspekte, jeweils mit einer kurzen Einschätzung:
    
    1. Hat das Unternehmen strukturelle Wettbewerbsvorteile (z. B. Netzwerkeffekt, Marke, Technologievorsprung)?
    2. Werden diese Vorteile durch die Kennzahlen gestützt?
    3. Ist der Burggraben gegenüber Wettbewerbern langfristig verteidigbar?
    
    Gib deine Antworten **ausschließlich** in folgender Struktur zurück:
    
    **1. Hat das Unternehmen strukturelle Wettbewerbsvorteile (z. B. Netzwerkeffekt, Marke, Technologievorsprung)?**  
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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using Perplexity with current management news
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterium "Qualität des Managements".
    Nutze die aktuellsten verfügbaren Informationen und Nachrichten über das Management für deine Analyse.

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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    - Wenn der CEO neu ist und keine Kapitalallokation erkennbar ist, schreibe bei Punkt 3: "Noch nicht bewertbar – neutral".
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using Perplexity with current market trends
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    Nutze die aktuellsten verfügbaren Informationen über Markttrends und Zukunftsaussichten für deine Analyse.
    
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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using Perplexity with current business strategy news
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".
    Nutze die aktuellsten verfügbaren Informationen über Unternehmensstrategie und Managemententscheidungen für deine Analyse.
    
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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects using Perplexity with current market behavior
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Antizyklisches Verhalten".
    Nutze die aktuellsten verfügbaren Informationen über das Marktverhalten des Unternehmens für deine Analyse.
    
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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case using Perplexity with current business developments
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Vergangenheit ≠ Zukunft".
    Nutze die aktuellsten verfügbaren Informationen über die Geschäftsentwicklung des Unternehmens für deine Analyse.
    
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
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior using Perplexity with current corporate developments
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Keine Turnarounds".
    Nutze die aktuellsten verfügbaren Informationen über Unternehmensentwicklungen und Restrukturierungen für deine Analyse.
    
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
      - Kein Turnaround (Pass)
      - Fraglich (Warning)
      - Offensichtlicher Turnaround (Fail)
    - Wenn du "Warning" gibst, **musst du die erfüllten Teilaspekte angeben** (z. B. „Von 3 Teilaspekten wurden 2 erfüllt.")
    - Mach keine Interpretationen oder Zusammenfassungen außerhalb der Struktur.
    `;
  
  return await queryGPT(prompt);
};