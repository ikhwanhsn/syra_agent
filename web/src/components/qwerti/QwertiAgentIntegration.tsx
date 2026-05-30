"use client";

import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { closeQwertiBuyWidget, destroyQwertiEmbed } from "@/lib/qwerti";
import { injectQwertiHeadScript } from "@/lib/qwertiHeadScript";
import { subscribeQwertiDesktopViewport } from "@/lib/qwertiViewport";

/** Home chat route only — floating launcher hidden elsewhere. */
export function isQwertiHomeRoute(pathname: string): boolean {
  return pathname === "/";
}

/**
 * Loads the Qwerti buy widget on `/` (desktop only).
 * Launcher + open() are handled by the official buy.js bundle.
 */
export function QwertiAgentIntegration() {
  const { pathname } = useLocation();
  const visible = useMemo(() => isQwertiHomeRoute(pathname), [pathname]);

  useEffect(() => {
    if (!visible) {
      destroyQwertiEmbed();
      return;
    }
    const sync = (isDesktop: boolean) => {
      if (isDesktop) injectQwertiHeadScript();
      else closeQwertiBuyWidget();
    };
    const unsubscribe = subscribeQwertiDesktopViewport(sync);
    return () => {
      unsubscribe();
      destroyQwertiEmbed();
    };
  }, [visible]);

  return null;
}