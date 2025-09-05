import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, query } = await req.json();
    
    if (!companyName && !query) {
      return new Response(
        JSON.stringify({ error: 'Company name or query is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const searchQuery = query || `${companyName} aktuelle Nachrichten Geschäftsergebnisse Quartalszahlen 2024 2025`;
    
    console.log('Making Perplexity API request for:', searchQuery);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein hilfreicher Assistent für Aktienanalysen. Gib präzise, aktuelle Informationen über Unternehmen zurück. Konzentriere dich auf die wichtigsten aktuellen Entwicklungen, Quartalsergebnisse, strategische Änderungen und Marktposition. Antworte auf Deutsch.'
          },
          {
            role: 'user',
            content: `Gib mir die aktuellsten und wichtigsten Nachrichten zu ${searchQuery}. Fokussiere dich auf: Geschäftsergebnisse, Quartalszahlen, strategische Entwicklungen, Management-Änderungen, Marktposition und relevante Branchennews. Strukturiere die Antwort übersichtlich.`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 0.9,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `Perplexity API error: ${response.status}` }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Perplexity API response received');

    if (data.choices && data.choices.length > 0) {
      const newsContent = data.choices[0].message.content;
      
      return new Response(
        JSON.stringify({ 
          news: newsContent,
          company: companyName,
          searchQuery: searchQuery
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'No content received from Perplexity API' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in perplexity-news function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});