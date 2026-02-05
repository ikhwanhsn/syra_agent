 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import Index from "./pages/Index";
 import DocsHome from "./pages/DocsHome";
 import GettingStarted from "./pages/docs/GettingStarted";
 import Installation from "./pages/docs/Installation";
 import CoreConcepts from "./pages/docs/CoreConcepts";
 import APIReference from "./pages/docs/APIReference";
 import Changelog from "./pages/docs/Changelog";
 import Community from "./pages/docs/Community";
 import NotFound from "./pages/NotFound";
 
 const queryClient = new QueryClient();
 
 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <Toaster />
       <Sonner />
       <BrowserRouter>
         <Routes>
           <Route path="/" element={<Navigate to="/docs" replace />} />
           <Route path="/docs" element={<DocsHome />} />
           <Route path="/docs/getting-started/what-is-syra" element={<GettingStarted />} />
           <Route path="/docs/getting-started/key-concepts" element={<GettingStarted />} />
           <Route path="/docs/getting-started/architecture" element={<GettingStarted />} />
           <Route path="/docs/getting-started/quick-start" element={<Installation />} />
           <Route path="/docs/installation/cli" element={<Installation />} />
           <Route path="/docs/installation/sdk" element={<Installation />} />
           <Route path="/docs/installation/environment" element={<Installation />} />
           <Route path="/docs/core-concepts/agents" element={<CoreConcepts />} />
           <Route path="/docs/core-concepts/multi-agent" element={<CoreConcepts />} />
           <Route path="/docs/core-concepts/memory" element={<CoreConcepts />} />
           <Route path="/docs/core-concepts/tools" element={<CoreConcepts />} />
           <Route path="/docs/core-concepts/prompts" element={<CoreConcepts />} />
           <Route path="/docs/marketplace/overview" element={<DocsHome />} />
           <Route path="/docs/marketplace/templates" element={<DocsHome />} />
           <Route path="/docs/marketplace/publishing" element={<DocsHome />} />
           <Route path="/docs/web3/wallet" element={<DocsHome />} />
           <Route path="/docs/web3/contracts" element={<DocsHome />} />
           <Route path="/docs/web3/automation" element={<DocsHome />} />
           <Route path="/docs/api-reference" element={<APIReference />} />
           <Route path="/docs/api-reference/endpoints" element={<APIReference />} />
           <Route path="/docs/api-reference/errors" element={<APIReference />} />
           <Route path="/docs/api-reference/rate-limits" element={<APIReference />} />
           <Route path="/docs/tutorials" element={<DocsHome />} />
           <Route path="/docs/tutorials/first-agent" element={<DocsHome />} />
           <Route path="/docs/tutorials/multi-agent" element={<DocsHome />} />
           <Route path="/docs/tutorials/examples" element={<DocsHome />} />
           <Route path="/docs/security/best-practices" element={<DocsHome />} />
           <Route path="/docs/security/api-keys" element={<DocsHome />} />
           <Route path="/docs/security/sandboxing" element={<DocsHome />} />
           <Route path="/docs/changelog" element={<Changelog />} />
           <Route path="/docs/community" element={<Community />} />
           <Route path="*" element={<NotFound />} />
         </Routes>
       </BrowserRouter>
     </TooltipProvider>
   </QueryClientProvider>
 );
 
 export default App;
