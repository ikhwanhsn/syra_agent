import { type ReactNode } from "react";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { pageContent, siteMain, siteRoot } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

interface SitePageShellProps {
  children: ReactNode;
}

function SitePageContent({ children }: SitePageShellProps) {
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
      <div className="relative z-10 flex min-h-dvh min-w-0 flex-col">
        <Header />
        <main className={siteMain}>{children}</main>
        <Footer />
        <ScrollToTop />
      </div>
    </div>
  );
}

export function SitePageShell({ children }: SitePageShellProps) {
  return (
    <ThemeProvider>
      <SitePageContent>{children}</SitePageContent>
    </ThemeProvider>
  );
}

export function usePageHero() {
  return {
    className: cn(pageContent, "pb-8"),
  };
}

export { pageContent };
