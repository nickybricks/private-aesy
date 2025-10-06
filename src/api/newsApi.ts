import { supabase } from '@/integrations/supabase/client';
import { NewsItem } from '@/context/StockContextTypes';

export async function fetchNewsFromNewsAPI(
  ticker: string,
  companyName: string
): Promise<{ newsItems: NewsItem[]; pressReleases: NewsItem[] }> {
  try {
    console.log(`🔍 Fetching NewsAPI articles for ${ticker} (${companyName})`);

    // Get browser language for Accept-Language header
    const userLang = navigator.language || 'en-US';
    
    const { data, error } = await supabase.functions.invoke('fetch-news', {
      body: { ticker, companyName },
      headers: {
        'Accept-Language': userLang
      }
    });

    if (error) {
      console.error('❌ NewsAPI error:', error);
      return { newsItems: [], pressReleases: [] };
    }

    console.log(`✅ NewsAPI returned ${data.newsItems.length} news, ${data.pressReleases.length} press releases`);
    
    return {
      newsItems: data.newsItems || [],
      pressReleases: data.pressReleases || []
    };
  } catch (error) {
    console.error('❌ Error fetching from NewsAPI:', error);
    return { newsItems: [], pressReleases: [] };
  }
}

// Deduplicate news items by URL
export function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}

// Merge and deduplicate news from multiple sources
export function mergeNewsSources(
  fmpNews: NewsItem[],
  newsApiNews: NewsItem[]
): NewsItem[] {
  const combined = deduplicateNews([...fmpNews, ...newsApiNews]);
  return combined.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
}
