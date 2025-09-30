import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  icon: Icon,
  label,
  description,
  badge,
  disabled = false,
}) => {
  if (disabled || badge) {
    return (
      <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl text-muted-foreground/70 bg-muted/30 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <div className="text-sm font-medium">{label}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
        </div>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200',
          isActive
            ? 'nav-pill text-foreground font-medium'
            : 'text-muted-foreground hover:nav-pill-hover hover:text-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5', isActive && 'text-foreground')} />
          <div>
            <div className="text-sm font-medium">{label}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
        </>
      )}
    </NavLink>
  );
};
