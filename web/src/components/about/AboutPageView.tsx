"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { useSearchParams } from "@/lib/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutAnalyticsSection } from "@/components/about/AboutAnalyticsSection";
import { AboutTabBar } from "@/components/about/AboutTabBar";
import { AboutOverviewPanel } from "@/components/about/AboutOverviewPanel";
import { AboutProductPanel } from "@/components/about/AboutProductPanel";
import { AboutConnectPanel } from "@/components/about/AboutConnectPanel";
import { DEFAULT_ABOUT_TAB, parseAboutTab, type AboutTabId } from "@/components/about/aboutTabs";
import { aboutRootClass } from "@/components/about/aboutStyles";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

interface AboutPageViewProps {
  embedded?: boolean;
}

function TabPanel({ children, tabId }: { children: ReactNode; tabId: AboutTabId }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        id={`about-panel-${tabId}`}
        role="tabpanel"
        aria-labelledby={`about-tab-${tabId}`}
        className="about-tab-panel-wrap about-tab-content-card rounded-[1.35rem] border border-border/40 bg-gradient-to-b from-card/50 via-background/40 to-background/20 p-4 sm:p-6 lg:p-7"
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      key={tabId}
      id={`about-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`about-tab-${tabId}`}
      className="about-tab-panel-wrap about-tab-content-card rounded-[1.35rem] border border-border/40 bg-gradient-to-b from-card/50 via-background/40 to-background/20 p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-6 lg:p-7"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function AboutPageView({ embedded = false }: AboutPageViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseAboutTab(searchParams.get("tab"));

  const setTab = useCallback(
    (next: AboutTabId) => {
      const params = new URLSearchParams(searchParams);
      if (next === DEFAULT_ABOUT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      setSearchParams(params);
      document.getElementById("about-tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw === "syra-analytics") {
      setTab("analytics");
    }
  }, [searchParams, setTab]);

  const shellClass = cn(
    embedded ? "px-2 pb-8 pt-2 sm:px-4" : DASHBOARD_CONTENT_SHELL,
    !embedded && PAGE_PADDING_TOP_MEDIUM,
    !embedded && PAGE_SAFE_AREA_BOTTOM,
    "relative z-[1] mx-auto flex max-w-6xl flex-col",
  );

  return (
    <div className={cn(aboutRootClass, "about-app-shell", embedded ? "bg-background" : "")}>
      {!embedded ? <OverviewPageBackdrop /> : null}
      <div className="about-ambient pointer-events-none absolute inset-0 -z-[1]" aria-hidden />
      <div className="about-orb about-orb-a pointer-events-none absolute -z-[1]" aria-hidden />
      <div className="about-orb about-orb-b pointer-events-none absolute -z-[1]" aria-hidden />

      <div className={shellClass}>
        <AboutTabBar activeTab={tab} onChange={setTab} />

        <div id="about-tab-content" className="about-tab-content-shell mt-4 min-h-[min(65vh,680px)] sm:mt-5">
          {tab === "overview" ? (
            <TabPanel tabId="overview">
              <AboutHero onSelectTab={setTab} activeTab={tab} />
              <div className="mt-6">
                <AboutOverviewPanel />
              </div>
            </TabPanel>
          ) : null}

          {tab === "analytics" ? (
            <TabPanel tabId="analytics">
              <AboutAnalyticsSection embedded />
            </TabPanel>
          ) : null}

          {tab === "product" ? (
            <TabPanel tabId="product">
              <AboutProductPanel />
            </TabPanel>
          ) : null}

          {tab === "connect" ? (
            <TabPanel tabId="connect">
              <AboutConnectPanel />
            </TabPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
