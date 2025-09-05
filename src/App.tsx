import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import LeftNavigation from "./components/LeftNavigation";
import AppHeader from "./components/AppHeader";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import BuffettAnalyzer from "./pages/BuffettAnalyzer";
import BuffettQuantAnalyzer from "./pages/BuffettQuantAnalyzer";
import Watchlists from "./pages/Watchlists";
import WatchlistDetail from "./pages/WatchlistDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Component to access location
  const AppContent = () => {
    const location = useLocation();
    
    return (
      <div className="min-h-screen bg-background flex">
        {/* Check if we're on auth page */}
        {location.pathname !== "/auth" && (
          <>
            <div className={`${isMobile ? 'fixed inset-0 z-50 transform transition-transform' : ''} ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : ''}`}>
              <LeftNavigation onMobileClose={handleMobileMenuClose} />
            </div>
            
            {/* Mobile overlay */}
            {isMobile && isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={handleMobileMenuClose}
              />
            )}
          </>
        )}

        <div className={`flex-1 flex flex-col ${location.pathname !== "/auth" ? (isMobile ? 'w-full' : 'ml-0') : 'w-full'}`}>
          {location.pathname !== "/auth" && isMobile && (
            <AppHeader 
              onMobileMenuToggle={handleMobileMenuToggle}
              isMobileMenuOpen={isMobileMenuOpen}
            />
          )}
          
          <Routes>
            <Route path="/" element={<BuffettAnalyzer />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/analyzer" element={<BuffettAnalyzer />} />
            <Route path="/quant" element={<BuffettQuantAnalyzer />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/watchlists/:id" element={<WatchlistDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;