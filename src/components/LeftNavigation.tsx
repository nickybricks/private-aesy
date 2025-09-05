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
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface LeftNavigationProps {
  onMobileClose?: () => void;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ onMobileClose }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    onMobileClose?.();
  };

  const navigationItems = [
    {
      title: 'Tools',
      items: [
        {
          name: 'Aesy',
          path: '/analyzer',
          icon: LineChart,
          description: 'Aktienanalyse nach bewährten Prinzipien'
        },
        {
          name: 'Quant Analyzer',
          path: '/quant',
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
          description: 'Verwalte deine Aktien-Watchlists'
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
    <nav className="w-64 h-full bg-card border-r border-border flex flex-col shadow-lg lg:shadow-none">
      {/* Tool Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Investment Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Investment Analysis Platform
          </p>
        </div>
        
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
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
                        onClick={handleLinkClick}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                            : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:shadow-sm'
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
        
        {/* User Section */}
        {user && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LeftNavigation;