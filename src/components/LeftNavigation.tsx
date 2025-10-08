import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Home,
  BarChart3, 
  User,
  Bookmark,
  History,
  X,
  LogOut,
  Shield,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NavItem } from '@/components/ui/nav-item';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  useSidebar 
} from '@/components/ui/sidebar';

interface LeftNavigationProps {
  onMobileClose?: () => void;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ onMobileClose }) => {
  const location = useLocation();
  const { user, signOut, isAdmin, userRole } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    onMobileClose?.();
  };

  const navigationItems = [
    {
      title: 'Navigation',
      items: [
        {
          name: 'Home',
          path: '/',
          icon: Home,
          description: 'Übersicht und Dashboard',
          badge: 'Soon'
        }
      ]
    },
    {
      title: 'Tools',
      items: [
        {
          name: 'Analyzer',
          path: '/analyzer',
          icon: BarChart3,
          description: 'Aktienanalyse nach bewährten Prinzipien'
        },
        {
          name: 'Boersen Analyzer',
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
        },
        {
          name: 'Gespeicherte Analysen',
          path: '/saved-analyses',
          icon: History,
          description: 'Zugriff auf gespeicherte Momentaufnahmen'
        }
      ]
    },
    {
      title: 'Einstellungen',
      items: [
        {
          name: 'Design System',
          path: '/design-system',
          icon: Palette,
          description: 'Designmerkmale und Richtlinien'
        },
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

  // Add admin section if user is admin
  if (isAdmin) {
    navigationItems.push({
      title: 'Administration',
      items: [
        {
          name: 'Admin Dashboard',
          path: '/admin',
          icon: Shield,
          description: 'Benutzer und System verwalten'
        }
      ]
    });
  }

  const handleLinkClick = () => {
    onMobileClose?.();
  };

  const { open } = useSidebar();

  return (
    <Sidebar 
      collapsible="icon"
      className="fixed left-0 top-18 h-[calc(100vh-4.5rem)] border-r z-30"
    >
      <SidebarContent>
        {/* Navigation Content */}
        <div className="flex-1 px-4 pt-6 overflow-y-auto">
          <div className="space-y-8">
            {navigationItems.map((section, sectionIndex) => (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {section.title}
                </SidebarGroupLabel>
                
                <SidebarGroupContent>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem
                        key={item.path}
                        to={item.path}
                        icon={item.icon}
                        label={item.name}
                        description={open ? item.description : undefined}
                        badge={item.badge}
                        disabled={!!item.badge}
                      />
                    ))}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        </div>

        {/* User Section */}
        {user && (
          <div className="p-4 border-t border-border/50 mt-auto">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                {open && (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {userRole && userRole !== 'customer' ? (
                        userRole === 'super_admin' ? 'Super Admin' : userRole
                      ) : (
                        user.email
                      )}
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 shrink-0"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default LeftNavigation;