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
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllPress, setShowAllPress] = useState(false);
  
  // Combine and sort all news by date
  const allNews = useMemo(() => {
    const combined = [...newsItems, ...pressReleases];
    return combined.sort((a, b) => 
      new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }, [newsItems, pressReleases]);
  
  const displayedNews = showAllNews ? allNews : allNews.slice(0, 6);
  
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Nachrichten & Press Releases</h2>
        {allNews.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllNews(!showAllNews)}
            className="text-primary hover:text-primary/80"
          >
            {showAllNews ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedNews.map((item, index) => (
          <Card
            key={`${item.url}-${index}`}
            className="group cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
            onClick={() => handleNewsClick(item.url)}
          >
            <CardContent className="p-0">
              <div className="flex flex-col">
                {item.image && (
                  <div className="relative w-full h-48 overflow-hidden bg-muted">
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
                
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  
                  {item.text && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.text}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span className="font-medium">{item.site}</span>
                    <div className="flex items-center gap-2">
                      <span>{formatTimeAgo(item.publishedDate)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {!showAllNews && allNews.length > 6 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAllNews(true)}
            className="w-full md:w-auto"
          >
            {allNews.length - 6} weitere Nachrichten anzeigen
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsSection;