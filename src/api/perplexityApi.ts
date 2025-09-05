import { supabase } from "@/integrations/supabase/client";

export interface PerplexityNewsResponse {
  news: string;
  company: string;
  searchQuery: string;
  error?: string;
}

export const getCompanyNews = async (companyName: string, customQuery?: string): Promise<PerplexityNewsResponse> => {
  try {
    console.log('Fetching news for company:', companyName);
    
    const { data, error } = await supabase.functions.invoke('perplexity-news', {
      body: { 
        companyName,
        query: customQuery 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    if (data.error) {
      console.error('Perplexity API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Successfully fetched news from Perplexity');
    return data;

  } catch (error) {
    console.error('Error fetching company news:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch company news');
  }
};

export const getCustomNews = async (query: string): Promise<PerplexityNewsResponse> => {
  try {
    console.log('Fetching custom news for query:', query);
    
    const { data, error } = await supabase.functions.invoke('perplexity-news', {
      body: { 
        query 
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to fetch news: ${error.message}`);
    }

    if (data.error) {
      console.error('Perplexity API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Successfully fetched custom news from Perplexity');
    return data;

  } catch (error) {
    console.error('Error fetching custom news:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch news');
  }
};