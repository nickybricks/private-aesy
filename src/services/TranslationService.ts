import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  text: string;
  timestamp: number;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const translateCompanyDescription = async (
  description: string,
  ticker: string,
  targetLanguage: string = 'de'
): Promise<string> => {
  if (!description) return '';

  // Check cache first
  const cacheKey = `translation_${ticker}_${targetLanguage}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const parsedCache: TranslationCache = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
        return parsedCache.text;
      }
    } catch (e) {
      // Invalid cache, proceed with translation
    }
  }

  // Get browser language for translation
  const browserLang = navigator.language.split('-')[0];
  
  // If description is already in target language or English is the target, return as-is
  if (browserLang === 'en' || targetLanguage === 'en') {
    return description;
  }

  try {
    const prompt = `Übersetze folgenden englischen Unternehmenstext präzise ins Deutsche. Behalte Fachbegriffe bei, wenn sie im Deutschen gebräuchlich sind (z.B. "GLP-1", "AI", "Cloud Computing"). Antworte NUR mit der Übersetzung, ohne zusätzlichen Text oder Erklärungen:

${description}`;

    const { data, error } = await supabase.functions.invoke('perplexity-news', {
      body: {
        prompt,
        analysisType: 'translation'
      }
    });

    if (error) throw error;

    const translatedText = data?.content || description;

    // Cache the translation
    const cacheData: TranslationCache = {
      text: translatedText,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to original text
    return description;
  }
};
