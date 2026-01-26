import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Navbar from "@/components/Navbar";
import WalletModal from "@/components/WalletModal";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Conditionally import SolanaWalletProvider
let SolanaWalletProvider: React.FC<{ children: React.ReactNode }> | null = null;
try {
  const solanaProvider = require('@/contexts/SolanaWalletProvider');
  SolanaWalletProvider = solanaProvider.SolanaWalletProvider;
} catch (error) {
  // Solana packages not installed, use passthrough provider
  SolanaWalletProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

const App = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {SolanaWalletProvider ? (
          <SolanaWalletProvider>
            <WalletProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Navbar onOpenWalletModal={() => setWalletModalOpen(true)} />
                  <WalletModal 
                    isOpen={walletModalOpen} 
                    onClose={() => setWalletModalOpen(false)} 
                  />
                  <Routes>
                    <Route path="/" element={<Index onOpenWalletModal={() => setWalletModalOpen(true)} />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create" element={<CreateEvent />} />
                    <Route path="/event/:id" element={<EventDetail />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </WalletProvider>
          </SolanaWalletProvider>
        ) : (
          <WalletProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Navbar onOpenWalletModal={() => setWalletModalOpen(true)} />
                <WalletModal 
                  isOpen={walletModalOpen} 
                  onClose={() => setWalletModalOpen(false)} 
                />
                <Routes>
                  <Route path="/" element={<Index onOpenWalletModal={() => setWalletModalOpen(true)} />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create" element={<CreateEvent />} />
                  <Route path="/event/:id" element={<EventDetail />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WalletProvider>
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
