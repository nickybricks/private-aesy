import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  isMobile: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const MobileMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <MobileMenuContext.Provider value={{ isMobileMenuOpen, isMobile, toggleMobileMenu, closeMobileMenu }}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (context === undefined) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  return context;
};
