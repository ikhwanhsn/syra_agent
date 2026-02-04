import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SolanaWalletProvider } from "@/contexts/SolanaWalletProvider";
import { AgentWalletProvider } from "@/contexts/AgentWalletContext";
import Index from "./pages/Index";
import MarketplaceLayout from "./pages/MarketplaceLayout";
import MarketplacePrompts from "./pages/MarketplacePrompts";
import MarketplaceAgents from "./pages/MarketplaceAgents";
import MarketplaceTools from "./pages/MarketplaceTools";
import MarketplaceMore from "./pages/MarketplaceMore";
import ShareableChatRoute from "./pages/ShareableChatRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <AgentWalletProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<MarketplaceLayout />}>
              <Route index element={<Navigate to="prompts" replace />} />
              <Route path="prompts" element={<MarketplacePrompts />} />
              <Route path="agents" element={<MarketplaceAgents />} />
              <Route path="tools" element={<MarketplaceTools />} />
              <Route path="more" element={<MarketplaceMore />} />
            </Route>
            <Route path="/c/:shareId" element={<ShareableChatRoute />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AgentWalletProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
