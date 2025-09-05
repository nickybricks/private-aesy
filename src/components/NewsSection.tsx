import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Newspaper, Search, Loader2 } from "lucide-react";
import { getCompanyNews, getCustomNews } from "@/api/perplexityApi";
import { useToast } from "@/components/ui/use-toast";

interface NewsSectionProps {
  companyName?: string;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ companyName }) => {
  const [news, setNews] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const { toast } = useToast();

  const fetchCompanyNews = async () => {
    if (!companyName) return;
    
    setIsLoading(true);
    try {
      const response = await getCompanyNews(companyName);
      setNews(response.news);
      toast({
        title: "Nachrichten geladen",
        description: `Aktuelle Nachrichten zu ${companyName} wurden abgerufen`,
      });
    } catch (error) {
      console.error('Error fetching company news:', error);
      toast({
        title: "Fehler",
        description: "Nachrichten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomNews = async () => {
    if (!customQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await getCustomNews(customQuery);
      setNews(response.news);
      toast({
        title: "Nachrichten geladen",
        description: "Custom Nachrichten wurden abgerufen",
      });
    } catch (error) {
      console.error('Error fetching custom news:', error);
      toast({
        title: "Fehler",
        description: "Nachrichten konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Aktuelle Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {companyName && (
            <Button 
              onClick={fetchCompanyNews}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Newspaper className="h-4 w-4" />
              )}
              Nachrichten zu {companyName}
            </Button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Custom Suchanfrage eingeben..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && fetchCustomNews()}
          />
          <Button 
            onClick={fetchCustomNews}
            disabled={isLoading || !customQuery.trim()}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Suchen
          </Button>
        </div>

        {news && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="whitespace-pre-wrap text-sm">
              {news}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};