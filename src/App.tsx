
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeftNavigation from "./components/LeftNavigation";
import Index from "./pages/Index";
import BuffettQuantAnalyzer from "./pages/BuffettQuantAnalyzer";
import Watchlists from "./pages/Watchlists";
import NotFound from "./pages/NotFound";

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex h-screen w-full bg-background">
            {/* Mobile Menu Overlay */}
            {isMobile && isMobileMenuOpen && (
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
            
            {/* Left Navigation */}
            <div className={`
              ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
              ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
              transition-transform duration-300 ease-in-out
            `}>
              <LeftNavigation onMobileClose={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile Header */}
              {isMobile && (
                <header className="h-14 bg-card border-b border-border flex items-center px-4 lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="mr-3"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="text-lg font-semibold text-foreground">Buffett Tools</h1>
                </header>
              )}
              
              {/* Page Content */}
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/quant-analyzer" element={<BuffettQuantAnalyzer />} />
                  <Route path="/watchlists" element={<Watchlists />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
