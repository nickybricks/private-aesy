import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  BarChart3, 
  User, 
  Star, 
  Plus,
  Settings,
  Bookmark,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface LeftNavigationProps {
  onMobileClose?: () => void;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ onMobileClose }) => {
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

  const handleLinkClick = () => {
    onMobileClose?.();
  };

  return (
    <nav className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg lg:shadow-none">
      {/* Tool Header */}
      <div className="p-6 border-b border-sidebar-border/50 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-sidebar-foreground tracking-tight">
            Buffett Tools
          </h1>
          <p className="text-sm text-muted-foreground">
            Investment Analysis Platform
          </p>
        </div>
        
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="lg:hidden hover:bg-sidebar-accent rounded-xl"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Navigation Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-8">
        {navigationItems.map((section, sectionIndex) => (
          <div key={section.title} className="space-y-3">
            <h3 className="apple-section-header">
              {section.title}
            </h3>
            
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <div key={item.path}>
                    {item.badge ? (
                      <div className="apple-nav-item opacity-60 cursor-not-allowed">
                        <Icon className="apple-nav-icon" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0 bg-muted/70">
                          {item.badge}
                        </Badge>
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={handleLinkClick}
                        className={`apple-nav-item ${active ? 'active' : ''}`}
                      >
                        <Icon className="apple-nav-icon" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
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
    </nav>
  );
};

export default LeftNavigation;