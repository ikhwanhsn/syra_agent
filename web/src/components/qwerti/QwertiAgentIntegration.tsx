"use client";

import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { destroyQwertiEmbed } from "@/lib/qwerti";
import { injectQwertiHeadScript } from "@/lib/qwertiHeadScript";

const BODY_ACTIVE_CLASS = "syra-qwerti-active";

/** Home chat route only (`/`) — floating launcher hidden elsewhere. */
export function isQwertiHomeRoute(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/";
}

/**
 * Loads the Qwerti buy widget on `/` only (all viewports).
 * Launcher + open() are handled by the official buy.js bundle.
 */
export function QwertiAgentIntegration() {
  const { pathname } = useLocation();
  const visible = useMemo(() => isQwertiHomeRoute(pathname), [pathname]);

  useEffect(() => {
    document.body.classList.toggle(BODY_ACTIVE_CLASS, visible);

    if (!visible) {
      destroyQwertiEmbed();
      return () => {
        document.body.classList.remove(BODY_ACTIVE_CLASS);
      };
    }

    injectQwertiHeadScript();

    return () => {
      document.body.classList.remove(BODY_ACTIVE_CLASS);
      destroyQwertiEmbed();
    };
  }, [visible]);

  return null;
}
