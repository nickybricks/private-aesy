import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  BarChart3, 
  User, 
  Star, 
  Plus,
  Settings,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const LeftNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    {
      title: 'Tools',
      items: [
        {
          name: 'Buffett Benchmark',
          path: '/',
          icon: LineChart,
          description: 'Aktienanalyse nach Buffett-Prinzipien'
        },
        {
          name: 'Quant Analyzer',
          path: '/quant-analyzer',
          icon: BarChart3,
          description: 'Erweiterte quantitative Analyse'
        }
      ]
    },
    {
      title: 'Watchlists',
      items: [
        {
          name: 'Watchlists',
          path: '/watchlists',
          icon: Bookmark,
          description: 'Verwalte deine Aktien-Watchlists',
          badge: 'Soon'
        }
      ]
    },
    {
      title: 'Einstellungen',
      items: [
        {
          name: 'Profil',
          path: '/profile',
          icon: User,
          description: 'API-Keys und Einstellungen',
          badge: 'Soon'
        }
      ]
    }
  ];

  return (
    <nav className="w-64 h-full bg-card border-r border-border flex flex-col">
      {/* Tool Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Buffett Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Investment Analysis Platform
        </p>
      </div>
      
      {/* Navigation Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {navigationItems.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-3">
            {sectionIndex > 0 && <Separator className="my-4" />}
            
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <div key={item.path}>
                    {item.badge ? (
                      <div className="flex items-center justify-between p-3 rounded-lg text-muted-foreground/70 bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <div className="text-sm font-medium">
                              {item.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-primary' : ''}`} />
                        <div>
                          <div className="text-sm font-medium">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default LeftNavigation;