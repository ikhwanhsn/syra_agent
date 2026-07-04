import { Suspense, type ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { RoutePageLoader } from "@/components/PageLoader";
import { pageContent, siteMain, siteRoot } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

interface SitePageShellProps {
  children: ReactNode;
}

function SiteChrome({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        siteRoot,
        theme === "light" ? "landing-light-bg" : "bg-background",
      )}
    >
      <MeteorEffect />
      <MouseEffects />
      <Header />
      <div className="relative z-[1] flex min-h-dvh min-w-0 flex-col">
        <main className={siteMain}>{children}</main>
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
}

/**
 * Persistent app chrome for marketing routes.
 * Header/footer stay mounted; only `<Outlet />` suspends on lazy page loads.
 */
export function SiteLayout() {
  return (
    <SiteChrome>
      <Suspense fallback={<RoutePageLoader />}>
        <Outlet />
      </Suspense>
    </SiteChrome>
  );
}

/**
 * No-op wrapper — pages render inside {@link SiteLayout}.
 * Kept so existing page call sites do not need a mass rewrite.
 */
export function SitePageShell({ children }: SitePageShellProps) {
  return <>{children}</>;
}

export function usePageHero() {
  return {
    className: cn(pageContent, "pb-8"),
  };
}

export { pageContent };
