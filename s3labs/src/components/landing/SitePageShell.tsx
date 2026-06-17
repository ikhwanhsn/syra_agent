import { useState, type ReactNode } from "react";

import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";

interface SitePageShellProps {
  children: ReactNode;
}

function SitePageContent({ children }: SitePageShellProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`relative min-h-screen ${theme === "light" ? "landing-light-bg" : "bg-background"}`}
    >
      <MeteorEffect />
      <MouseEffects />
      <div className="relative z-10 pb-4">
        <Header />
        <main>{children}</main>
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
    className: "container relative z-[1] pt-28 pb-8",
  };
}
