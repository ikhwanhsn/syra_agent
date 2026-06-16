import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Arena from "./pages/Arena";
import ArenaTokenDetail from "./pages/ArenaTokenDetail";
import NotFound from "./pages/NotFound";

const PostPage = lazy(() => import("./pages/PostPage"));
const PostVideoPage = lazy(() => import("./pages/PostVideoPage"));
const PostPhotoPage = lazy(() => import("./pages/PostPhotoPage"));
const PostStudioLayout = lazy(() =>
  import("./components/post/PostStudioLayout").then((m) => ({ default: m.PostStudioLayout })),
);

const queryClient = new QueryClient();

function PostRouteFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(222,47%,4%)]">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">Loading studio…</p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PostRouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/arenass" element={<Arena />} />
            <Route path="/arenass/:mint" element={<ArenaTokenDetail />} />
            <Route path="/post" element={<PostPage />} />
            <Route element={<PostStudioLayout />}>
              <Route path="/post/video/:updateNumber?" element={<PostVideoPage />} />
              <Route path="/post/photo/:updateNumber?" element={<PostPhotoPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
