import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { WalletContextProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Examples from "./pages/Examples";
import ExamplesGroup from "./pages/ExamplesGroup";
import Explorer from "./pages/Explorer";
import ExplorerDetail from "./pages/ExplorerDetail";
import BatchTest from "./pages/BatchTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/s/:slug" element={<Index />} />
              <Route path="/examples" element={<Examples />} />
              <Route path="/examples/:groupSlug" element={<ExamplesGroup />} />
              <Route path="/explorer" element={<Explorer />} />
              <Route path="/explorer/:slug" element={<ExplorerDetail />} />
              <Route path="/batch-test" element={<BatchTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
