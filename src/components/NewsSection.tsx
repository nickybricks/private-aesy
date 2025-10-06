import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Newspaper } from 'lucide-react';
import { NewsItem } from '@/context/StockContextTypes';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface NewsSectionProps {
  newsItems: NewsItem[];
  pressReleases: NewsItem[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ newsItems, pressReleases }) => {
  const [displayCount, setDisplayCount] = useState(10);
  const [activeFilter, setActiveFilter] = useState<'all' | 'news' | 'press'>('all');
  
  // Combine and sort all news by date
  const allNews = useMemo(() => {
    const combined = [...newsItems, ...pressReleases];
    return combined.sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }, [newsItems, pressReleases]);
  
  // Filter based on active filter
  const filteredNews = useMemo(() => {
    if (activeFilter === 'news') {
      return newsItems.sort((a, b) => 
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      );
    }
    if (activeFilter === 'press') {
      return pressReleases.sort((a, b) => 
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      );
    }
    return allNews;
  }, [activeFilter, newsItems, pressReleases, allNews]);
  
  const displayedNews = filteredNews.slice(0, displayCount);
  const hasMore = displayCount < filteredNews.length;
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: de 
      });
    } catch {
      return dateString;
    }
  };
  
  const handleNewsClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const hasPressReleases = pressReleases.length > 0;
  const hasNewsItems = newsItems.length > 0;

  if (allNews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Keine Nachrichten verfügbar</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveFilter('all');
            setDisplayCount(10);
          }}
          className="text-sm h-9 px-4"
        >
          Alle ({allNews.length})
        </Button>
        <Button
          variant={activeFilter === 'news' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveFilter('news');
            setDisplayCount(10);
          }}
          className="text-sm h-9 px-4"
        >
          Nachrichten ({newsItems.length})
        </Button>
        <Button
          variant={activeFilter === 'press' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setActiveFilter('press');
            setDisplayCount(10);
          }}
          className="text-sm h-9 px-4"
          disabled={!hasPressReleases}
          title={!hasPressReleases ? 'Keine Pressemitteilungen verfügbar' : ''}
        >
          Pressemitteilungen ({pressReleases.length})
        </Button>
      </div>

      {activeFilter === 'press' && !hasPressReleases && hasNewsItems && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Für dieses Unternehmen sind derzeit keine Pressemitteilungen verfügbar.
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedNews.map((item, index) => (
          <Card
            key={`${item.url}-${index}`}
            className="group cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
            onClick={() => handleNewsClick(item.url)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {item.image && (
                  <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase">
                    {item.site}
                  </div>
                  
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  
                  {item.text && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.text}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(item.publishedDate)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 10)}
            className="w-full md:w-auto"
          >
            Weitere Nachrichten anzeigen
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsSection;