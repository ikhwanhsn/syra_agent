import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import DocsHome from "./pages/DocsHome";
import Welcome from "./pages/Welcome";
import APIReference from "./pages/docs/APIReference";
import ApiDocPage from "./pages/docs/ApiDocPage";
import Changelog from "./pages/docs/Changelog";
import Community from "./pages/docs/Community";
import Agent from "./pages/docs/Agent";
import X402Agent from "./pages/docs/X402Agent";
import AgentCatalog from "./pages/docs/AgentCatalog";
import Token from "./pages/docs/Token";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="syra-docs-theme" enableSystem={false}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/docs" replace />} />
          <Route path="/docs" element={<DocsHome />} />
          <Route path="/docs/welcome" element={<Welcome />} />
          <Route path="/docs/api-reference" element={<APIReference />} />
          <Route path="/docs/api-reference/endpoints" element={<APIReference />} />
          <Route path="/docs/api/:slug" element={<ApiDocPage />} />
          <Route path="/docs/api-reference/errors" element={<APIReference />} />
          <Route path="/docs/api-reference/rate-limits" element={<APIReference />} />
          <Route path="/docs/agent/getting-started" element={<Agent />} />
          <Route path="/docs/agent/how-it-works" element={<Agent />} />
          <Route path="/docs/agent/features" element={<Agent />} />
          <Route path="/docs/agent/supported-tokens" element={<Agent />} />
          <Route path="/docs/agent/trading-guidance" element={<Agent />} />
          <Route path="/docs/x402-agent/getting-started" element={<X402Agent />} />
          <Route path="/docs/x402-agent/agent-catalog" element={<AgentCatalog />} />
          <Route path="/docs/token/tokenomicsv2" element={<Navigate to="/docs/token/tokenomics" replace />} />
          <Route path="/docs/token/roadmapv2" element={<Navigate to="/docs/token/roadmap" replace />} />
          <Route path="/docs/token/tokenomics" element={<Token />} />
          <Route path="/docs/token/roadmap" element={<Token />} />
          <Route path="/docs/changelog" element={<Changelog />} />
          <Route path="/docs/community" element={<Community />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
 
 export default App;
