
import { useState, useEffect, useCallback } from 'react';

interface ApiKeyCheckResult {
  hasApiKey: boolean;
  hasGptApiKey: boolean;
  apiKeyCheckCompleted: boolean;
  checkApiKeys: () => Promise<void>;
}

export const useApiKeyCheck = (): ApiKeyCheckResult => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGptApiKey, setHasGptApiKey] = useState(false);
  const [apiKeyCheckCompleted, setApiKeyCheckCompleted] = useState(false);

  const checkApiKeys = useCallback(async () => {
    let fmpKeyExists = false;
    let openAiKeyExists = false;
    
    try {
      const fmpApiKey = localStorage.getItem('fmp_api_key');
      fmpKeyExists = !!fmpApiKey && fmpApiKey.trim().length > 0;
      
      const openAiKey = localStorage.getItem('openai_api_key');
      openAiKeyExists = !!openAiKey && openAiKey.trim().length > 0;
      
      setHasApiKey(fmpKeyExists);
      setHasGptApiKey(openAiKeyExists);
      
      console.log('API-Keys geprüft:', { 
        fmp: fmpKeyExists, 
        openai: openAiKeyExists 
      });
    } catch (error) {
      console.error('Error in checkApiKeys:', error);
      setHasApiKey(false);
      setHasGptApiKey(false);
    }
    
    setApiKeyCheckCompleted(true);
  }, []);

  useEffect(() => {
    const initialCheck = async () => {
      await checkApiKeys();
    };
    
    initialCheck();
    
    // Listen for API key changes
    window.addEventListener('fmp_api_key_change', checkApiKeys);
    window.addEventListener('openai_api_key_change', checkApiKeys);
    
    return () => {
      window.removeEventListener('fmp_api_key_change', checkApiKeys);
      window.removeEventListener('openai_api_key_change', checkApiKeys);
    };
  }, [checkApiKeys]);

  return {
    hasApiKey,
    hasGptApiKey,
    apiKeyCheckCompleted,
    checkApiKeys
  };
};
