import { lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SolanaWalletProvider } from "@/providers/SolanaWalletProvider";
import { AdminAccessGuard } from "@/components/AdminAccessGuard";
import { SiteLayout } from "@/components/landing/SitePageShell";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Community = lazy(() => import("./pages/Community"));
const About = lazy(() => import("./pages/About"));
const Kol = lazy(() => import("./pages/Kol"));
const JobsPage = lazy(() => import("./pages/JobsPage"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const KolProfile = lazy(() => import("./pages/KolProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const CampaignComingSoon = lazy(() =>
  import("./pages/ComingSoon").then((m) => ({ default: m.CampaignComingSoon })),
);
const ContestComingSoon = lazy(() =>
  import("./pages/ComingSoon").then((m) => ({ default: m.ContestComingSoon })),
);
const Hackathon = lazy(() => import("./pages/Hackathon"));
const HackathonDetail = lazy(() => import("./pages/HackathonDetail"));
const EventsAdmin = lazy(() => import("./pages/EventsAdmin"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const InternalPage = lazy(() => import("./pages/InternalPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SolanaWalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/community" element={<Community />} />
                <Route path="/about" element={<About />} />
                <Route path="/kol" element={<Kol />} />
                <Route path="/kol/:username" element={<KolProfile />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/campaign" element={<CampaignComingSoon />} />
                <Route path="/contest" element={<ContestComingSoon />} />
                <Route path="/hackathon" element={<Hackathon />} />
                <Route path="/hackathon/:id" element={<HackathonDetail />} />
                <Route path="/events" element={<EventsAdmin />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route element={<AdminAccessGuard />}>
                  <Route path="/internal" element={<InternalPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SolanaWalletProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
