import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import LeftNavigation from "./components/LeftNavigation";
import AppHeader from "./components/AppHeader";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import BuffettAnalyzer from "./pages/BuffettAnalyzer";
import BuffettQuantAnalyzer from "./pages/BuffettQuantAnalyzer";
import Watchlists from "./pages/Watchlists";
import WatchlistDetail from "./pages/WatchlistDetail";
import SavedAnalyses from "./pages/SavedAnalyses";
import AdminDashboard from "./pages/AdminDashboard";
import DesignSystem from "./pages/DesignSystem";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/AdminRoute";
import ImpersonationBanner from "./components/ImpersonationBanner";
import { AuthProvider } from "./context/AuthContext";
import { StockProvider } from "./context/StockContext";
import { MobileMenuProvider, useMobileMenu } from "./context/MobileMenuContext";
import { SidebarProvider } from "./components/ui/sidebar";

const queryClient = new QueryClient();

const App = () => {
  // Component to access location
  const AppContent = () => {
    const location = useLocation();
    const { isMobileMenuOpen, isMobile, closeMobileMenu } = useMobileMenu();
    
    const isAuthPage = location.pathname === "/auth";
    
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          {/* Check if we're on auth page */}
          {!isAuthPage && (
            <>
              {/* App Header - Fixed at top */}
              <AppHeader />
              
              {/* Left Navigation - Collapsible Sidebar */}
              <LeftNavigation onMobileClose={closeMobileMenu} />
              
              {/* Mobile overlay */}
              {isMobile && isMobileMenuOpen && (
                <div 
                  className="fixed inset-0 bg-black/20 z-35"
                  onClick={closeMobileMenu}
                />
              )}
            </>
          )}

          {/* Main content area */}
          <main className={`
            ${!isAuthPage ? 'pt-18' : ''}
            min-h-screen flex-1 w-full
          `}>
            {/* Impersonation Banner */}
            {!isAuthPage && (
              <div className="px-4 pt-4">
                <ImpersonationBanner />
              </div>
            )}
            
            <Routes>
              <Route path="/" element={<BuffettAnalyzer />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/analyzer" element={<BuffettAnalyzer />} />
              <Route path="/quant" element={<BuffettQuantAnalyzer />} />
              <Route path="/watchlists" element={<Watchlists />} />
              <Route path="/watchlists/:id" element={<WatchlistDetail />} /> 
              <Route path="/saved-analyses" element={<SavedAnalyses />} />
              <Route path="/design-system" element={<DesignSystem />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </SidebarProvider>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MobileMenuProvider>
          <StockProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </StockProvider>
        </MobileMenuProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;