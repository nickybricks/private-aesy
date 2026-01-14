import { de } from './translations/de';
import { en } from './translations/en';

export type Language = 'de' | 'en';
export type TranslationKeys = typeof de;

export const translations: Record<Language, TranslationKeys> = {
  de,
  en,
};

/**
 * Detects the user's preferred language from the browser
 * Returns 'de' for German, 'en' for everything else
 */
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  // Check for German language
  if (browserLang.startsWith('de')) {
    return 'de';
  }
  
  // Default to English for all other languages
  return 'en';
};

/**
 * Get a nested translation value by dot-notation path
 */
export const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current[key] === undefined) {
      console.warn(`Translation key not found: ${path}`);
      return path;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : path;
};

/**
 * Replace placeholders in translation strings
 * Supports {placeholder} syntax
 */
export const interpolate = (template: string, values: Record<string, string | number>): string => {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return values[key]?.toString() ?? `{${key}}`;
  });
};
