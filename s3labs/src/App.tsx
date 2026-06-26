import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SolanaWalletProvider } from "@/providers/SolanaWalletProvider";
import { PostAccessGuard } from "@/components/post/PostAccessGuard";
import { AdminAccessGuard } from "@/components/AdminAccessGuard";
import { RoutePageLoader } from "@/components/PageLoader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Programs = lazy(() => import("./pages/Programs"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Community = lazy(() => import("./pages/Community"));
const About = lazy(() => import("./pages/About"));
const Apply = lazy(() => import("./pages/Apply"));
const Kol = lazy(() => import("./pages/Kol"));
const JobsPage = lazy(() => import("./pages/JobsPage"));
const KolProfile = lazy(() => import("./pages/KolProfile"));
const CampaignComingSoon = lazy(() =>
  import("./pages/ComingSoon").then((m) => ({ default: m.CampaignComingSoon })),
);
const ContestComingSoon = lazy(() =>
  import("./pages/ComingSoon").then((m) => ({ default: m.ContestComingSoon })),
);
const Hackathon = lazy(() => import("./pages/Hackathon"));
const EventsAdmin = lazy(() => import("./pages/EventsAdmin"));
const InternalPage = lazy(() => import("./pages/InternalPage"));

const PostPage = lazy(() => import("./pages/PostPage"));
const PostVideoPage = lazy(() => import("./pages/PostVideoPage"));
const PostPhotoPage = lazy(() => import("./pages/PostPhotoPage"));
const PostStudioLayout = lazy(() =>
  import("./components/post/PostStudioLayout").then((m) => ({ default: m.PostStudioLayout })),
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RoutePageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/community" element={<Community />} />
              <Route path="/about" element={<About />} />
              <Route path="/apply" element={<Apply />} />
              <Route path="/kol" element={<Kol />} />
              <Route path="/kol/:username" element={<KolProfile />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/campaign" element={<CampaignComingSoon />} />
              <Route path="/contest" element={<ContestComingSoon />} />
              <Route path="/hackathon" element={<Hackathon />} />
              <Route path="/events" element={<EventsAdmin />} />
              <Route element={<AdminAccessGuard />}>
                <Route path="/internal" element={<InternalPage />} />
              </Route>
              <Route element={<PostAccessGuard />}>
                <Route path="/post" element={<PostPage />} />
                <Route element={<PostStudioLayout />}>
                  <Route path="/post/video/:updateNumber?" element={<PostVideoPage />} />
                  <Route path="/post/photo/:updateNumber?" element={<PostPhotoPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
