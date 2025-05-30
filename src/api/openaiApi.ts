
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
    
    if (!apiKey || apiKey.length === 0) {
      throw new Error('OpenAI API-Key ist nicht konfiguriert. Bitte ersetzen Sie den Platzhalter in der openaiApi.ts Datei mit Ihrem tatsächlichen API-Key.');
    }
    
    const response = await axios.post<OpenAIResponse>(
      OPENAI_API_URL,
      {
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
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
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
    
    Beurteile ausschließlich die Verständlichkeit des **Kerngeschäftsmodells** – also: Wie verdient das Unternehmen Geld?
    
    ⚠️ Berücksichtige **nicht**:
    - Markenvielfalt
    - internationale Märkte
    - technische Begriffe
    - Prozesse oder Skalierung
    
    📌 Warren Buffett fragt: „Kann ich in 1–2 Sätzen erklären, wie dieses Unternehmen Geld verdient – und versteht das auch ein 12-Jähriger?“
    
    —
    
    Gib dann strukturierte Stichpunkte mit diesen Anforderungen:
    
    1. Beginne mit der Hauptfrage: **Ist das Geschäftsmodell leicht verständlich?**
    2. Führe 3 klare Stichpunkte auf, die jeweils mit "- " beginnen und das **Geschäftsmodell in einfachen Worten** erklären.
    3. Schließe mit einer klaren Bewertung ab:  
    **Bewertung:** Einfach verständlich (Pass), Moderat komplex (Warning), Zu komplex (Fail)
    
    **Falls die Bewertung "Moderat komplex (Warning)" lautet**, gib zusätzlich an:  
    → **Von 3 Teilaspekten wurden X erfüllt.**
  `;
  
  return await queryGPT(prompt);
};

// Function to analyze economic moat using GPT
export const analyzeEconomicMoat = async (companyName: string, industry: string, grossMargin: number, operatingMargin: number, roic: number): Promise<string> => {
  const prompt = `
    Analysiere den wirtschaftlichen Burggraben (Moat) von ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterien.

    Hier sind quantitative Kennzahlen:
    - Bruttomarge: ${grossMargin.toFixed(2)}%
    - Betriebsmarge: ${operatingMargin.toFixed(2)}%
    - ROIC: ${roic.toFixed(2)}%
    
    1. Berücksichtige bei deiner Einschätzung folgende qualitative Moat-Faktoren:
       - **Netzwerkeffekt**
       - **Markenstärke / Kundenbindung**
       - **Skaleneffekte / Effizienz**
       - **Kosten- oder Technologievorteile**
    
    2. Berücksichtige außerdem die Kennzahlen:
       - Bruttomarge > 40 % = positiv
       - Betriebsmarge > 20 % = positiv
       - ROIC > 15 % = positiv
    
    3. Beurteile, wie viele dieser 3 Teilaspekte (qualitativ & quantitativ gemischt) erfüllt sind.
    
    Gib strukturierte Stichpunkte mit folgenden Anforderungen:
    - 3 konkrete Moat-Aspekte, jeweils beginnend mit "- "
    - Jeder Aspekt soll **klar als erfüllt oder nicht erfüllt erkennbar** sein
    
    Am Ende:
    - **Zähle genau auf:** "Von 3 Teilaspekten wurden X erfüllt."
    - **Gib eine klare Bewertung ab:**  
    **Bewertung:** Starker Moat (Pass), Moderater Moat (Warning), Schwacher/Kein Moat (Fail)

  `;
  
  return await queryGPT(prompt);
};

// Function to analyze management quality using GPT
export const analyzeManagementQuality = async (companyName: string, ceo: string): Promise<string> => {
  const prompt = `
    Analysiere die Qualität des Managements von ${companyName} unter CEO ${ceo || 'dem aktuellen Management'} nach Warren Buffetts Kriterien.

    Fokussiere dich auf die folgenden drei Kernfragen:
    
    1. **Ist das Management ehrlich und transparent?**
    2. **Handelt es im Sinne der Aktionäre?**
    3. **Zeigt es eine gute Kapitalallokation?**
    
    💡 Bewerte jeden Aspekt unabhängig und mit Blick auf Buffetts Philosophie:
    - Ehrlich = klare Kommunikation, transparente Zahlen, kein unnötiges Marketing
    - Aktionärsorientiert = Rückkäufe, Dividenden, langfristiger Fokus
    - Kapitalallokation = Investitionen, Übernahmen, Eigenkapitalverwendung
    
    Wenn der CEO neu ist und noch keine klare Kapitalallokation erkennbar ist, bewerte neutral (nicht erfüllt, aber auch kein Minuspunkt). Schreibe in diesem Fall: "Noch nicht bewertbar – neutral".
    
    ⚠️ Berücksichtige Buffett's Ansatz: „Wenn ich nichts Negatives sehe, ist das Management okay – nicht jedes Unternehmen braucht einen Superstar.“
    
    —
    
    Gib zu jedem Teilaspekt:
    - 1–2 Stichpunkte
    - Markiere am Ende jeden Punkt mit: **(Erfüllt)**, **(Nicht erfüllt)** oder **(Neutral)**
    
    Am Ende:
    - Zähle exakt auf:  
    **"Von 3 Teilaspekten: 2 erfüllt, 1 neutral."**
    
    - Gib eine klare Bewertung ab:  
    **Bewertung:** Gutes Management (Pass), Durchschnittliches Management (Warning), Problematisches Management (Fail)

  `;
  
  return await queryGPT(prompt);
};

// Function to analyze long-term prospects using GPT
export const analyzeLongTermProspects = async (companyName: string, industry: string, sector: string): Promise<string> => {
  const prompt = `
    Analysiere die langfristigen Perspektiven von ${companyName} (Branche: ${industry}, Sektor: ${sector}) nach Warren Buffetts Kriterium "Langfristiger Horizont".
    
    Beantworte die folgenden drei Kernfragen aus Sicht eines langfristigen Investors:
    
    1. **Wird das Unternehmen mit seinem aktuellen Geschäftsmodell auch in 20 Jahren noch eine relevante Rolle spielen?**
       → Berücksichtige dabei nur die Stabilität und den Bedarf der Kernleistung – nicht aktuelle Marktanteile.
    
    2. **Wird die Branche des Unternehmens durch nachhaltige Megatrends getragen (z. B. Digitalisierung, Demografie, Regulierung, Automatisierung)?**
       → Nenne konkrete Megatrends, die das Geschäftsmodell langfristig stützen.
    
    3. **Hat das Unternehmen eine glaubwürdige Strategie, um auf Veränderungen im Markt langfristig zu reagieren (z. B. Innovationskraft, Plattformstrategie, Technologieführerschaft)?**
    
    —
    
    Gib zu jeder Frage:
    - 1–2 kurze, konkrete Stichpunkte
    - Markiere am Ende jeden Aspekt als: **(Erfüllt)**, **(Nicht erfüllt)** oder **(Unklar)**
    
    Am Ende:
    - Zähle die Bewertung zusammen:  
      **Von 3 Teilaspekten: 3 erfüllt** (Beispiel)
    - Gib eine klare Bewertung ab:  
      **Bewertung:** Starke Langzeitperspektive (Pass), Moderate Langzeitperspektive (Warning), Schwache Langzeitperspektive (Fail)

  `;
  
  return await queryGPT(prompt);
};

// Function to analyze cyclical behavior using GPT
export const analyzeCyclicalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere das Verhalten von ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium „Antizyklisches Verhalten“.
    
    Fokussiere dich nicht nur auf die zyklische Natur des Geschäftsmodells, sondern vor allem auf das **Verhalten des Managements in Krisenzeiten**.
    
    Beantworte diese drei Fragen:
    
    1. **Ist das Geschäftsmodell grundsätzlich zyklisch oder antizyklisch?**
       → Nur informativ, kein automatischer Punktabzug – zyklisch ist erlaubt
    
    2. **Wie verhält sich das Unternehmen in Krisen oder wirtschaftlichen Abschwüngen?**
       → Achte auf Stabilität, langfristige Planung, Zurückhaltung bei Expansionen, keine Panikreaktionen
    
    3. **Kauft das Unternehmen gezielt Aktien zurück, wenn der Markt schwach ist?**
       → Das ist für Buffett ein Zeichen von Antizyklik und rationaler Kapitalallokation
    
    Für jede Frage:
    - Gib 1–2 Stichpunkte
    - Bewerte mit: **(Erfüllt)**, **(Nicht erfüllt)** oder **(Neutral)**
    
    Am Ende:
    - Zähle: „Von 3 Teilaspekten: X erfüllt“
    - Bewertung:  
    **Antizyklisches Verhalten (Pass)**  
    **Neutrales Verhalten (Warning)**  
    **Zyklisches Verhalten (Fail)**

  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if success is based on one-time effects
export const analyzeOneTimeEffects = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium „Vergangenheit ≠ Zukunft“.

    Bewerte dabei nicht, **ob das Wachstum spektakulär war**, sondern ob der bisherige Erfolg **dauerhaft wiederholbar und nachhaltig** ist.
    
    Beantworte diese 3 konkreten Fragen:
    
    1. **Beruhte der bisherige Erfolg auf einmaligen oder außergewöhnlichen Effekten, die sich voraussichtlich nicht wiederholen?**  
       → Beispiele: Sondergewinne, steuerliche Vorteile, extreme Sondereffekte (nicht: Megatrends wie Corona-Digitalisierung)
    
    2. **Gab es starke Wachstumsphasen, die vor allem durch untypische externe Faktoren (z. B. Marktverzerrung, kurzfristige Regulierung, aggressive Subventionen) erklärt werden können?**  
       → Achtung: Wettbewerb oder Regulierung allein zählen **nicht** als negativ
    
    3. **Ist das Wachstum dauerhaft möglich – basierend auf einem stabilen, nachvollziehbaren Geschäftsmodell (egal ob organisch oder durch Übernahmen)?**
    
    Für jeden Punkt:
    - Antworte mit 1–2 Stichpunkten
    - Kennzeichne am Ende jeden Punkt mit: (Erfüllt), (Nicht erfüllt), (Neutral)
    
    Am Ende:
    - Zähle: „Von 3 Teilaspekten wurden X erfüllt“
    - Gib eine Bewertung:  
      **Nachhaltige Geschäftsentwicklung (Pass)**  
      **Teilweise nachhaltig (Warning)**  
      **Erfolg stark von Einmaleffekten abhängig (Fail)**

  `;
  
  return await queryGPT(prompt);
};

// Function to analyze if the company is a turnaround case
export const analyzeTurnaround = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium „Keine Turnarounds“.

    Warren Buffett vermeidet Unternehmen, die sich **in echter Schieflage** befinden und „wieder auf die Beine kommen“ müssen – **nicht** Unternehmen mit normalen Veränderungen oder Strategieanpassungen.
    
    Beantworte die folgenden Fragen aus dieser Perspektive:
    
    1. **Gibt es Hinweise auf operative Probleme, Verluste oder strategische Verzweiflung, die auf einen echten Turnaround hindeuten?**
       → Achte auf Entlassungen, Desinvestitionen, panische Strategieänderungen
    
    2. **Gab es kürzlich eine tiefgreifende Restrukturierung oder einen CEO-Wechsel mit radikaler Neuausrichtung?**
       → Normale Führungswechsel zählen **nicht automatisch** als negativ
    
    3. **Ist das Unternehmen stabil und profitabel – oder kämpft es darum, wieder Vertrauen, Kunden oder Marktanteile zu gewinnen?**
    
    Für jede Frage:
    - Beantworte mit 1–2 Stichpunkten
    - Kennzeichne jede Antwort mit: (Erfüllt), (Nicht erfüllt), (Neutral)
    
    Am Ende:
    - Zähle: „Von 3 Teilaspekten: X erfüllt“
    - Gib eine klare Bewertung:
      **Stabiles Unternehmen (Pass)**  
      **Leichte Umstrukturierung (Warning)**  
      **Klarer Turnaround-Fall (Fail)**

`;
  
  return await queryGPT(prompt);
};

// Function to analyze rational behavior
export const analyzeRationalBehavior = async (companyName: string, industry: string): Promise<string> => {
  const prompt = `
    Analysiere ${companyName} (Branche: ${industry}) nach Warren Buffetts Kriterium "Rationalität & Disziplin".

    Fokussiere dich auf diese 3 Fragen – aus Sicht von Warren Buffett:
    
    1. **Handelt das Management diszipliniert und langfristig denkend?**
       → Achte auf Fokus auf Kernbereiche, langfristige Strategien, keine Modetrends
    
    2. **Gab es in der Vergangenheit überteuerte Übernahmen, unklare Strategiewechsel oder panikartige Reaktionen?**
       → Nur solche Handlungen gelten als irrational
    
    3. **Werden Ressourcen sinnvoll eingesetzt (z. B. F&E, Rückkäufe, Personal, CapEx)?**
       → Achte auf Kostenkontrolle, Investitionsqualität, keine Verschwendung
    
    Für jede Frage:
    - Antworte mit 1–2 Stichpunkten
    - Beende jede Antwort mit (Erfüllt), (Nicht erfüllt) oder (Unklar)
    
    Am Ende:
    - Zähle exakt: „Von 3 Teilaspekten wurden X erfüllt“
    - Gib eine klare Bewertung ab:  
    **Bewertung:** Rationales Verhalten (Pass), Gemischtes Bild (Warning), Irrationales Verhalten (Fail)

  `;
  
  return await queryGPT(prompt);
};
