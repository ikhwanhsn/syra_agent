import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletProvider";
import { WalletProvider } from "@/contexts/WalletContext";
import { StakingProvider } from "@/contexts/StakingContext";
import Navbar from "@/components/Navbar";
import WalletModal from "@/components/WalletModal";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import Staking from "./pages/Staking";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <SolanaWalletProvider>
          <WalletProvider>
            <StakingProvider>
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
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            </StakingProvider>
          </WalletProvider>
        </SolanaWalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
