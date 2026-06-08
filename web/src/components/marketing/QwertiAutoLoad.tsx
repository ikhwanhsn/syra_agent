import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { closeQwertiBuyWidget } from "@/lib/qwerti";
import { injectQwertiHeadScript } from "@/lib/qwertiHeadScript";
import { isQwertiHiddenRoute } from "@/lib/marketing/qwertiRoutes";
import { subscribeQwertiDesktopViewport } from "@/lib/marketing/qwertiViewport";

/**
 * Ensures the Qwerti embed script is present on marketing routes.
 * Launcher + open() are handled by the official buy.js bundle.
 */
export function QwertiAutoLoad() {
  const { pathname } = useLocation();
  const hidden = useMemo(() => isQwertiHiddenRoute(pathname), [pathname]);

  useEffect(() => {
    if (hidden) {
      closeQwertiBuyWidget();
      return;
    }
    const sync = (isDesktop: boolean) => {
      if (isDesktop) injectQwertiHeadScript();
      else closeQwertiBuyWidget();
    };
    return subscribeQwertiDesktopViewport(sync);
  }, [hidden]);

  return null;
}
