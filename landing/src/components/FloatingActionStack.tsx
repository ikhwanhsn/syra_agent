import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { isQwertiHiddenRoute } from "@/lib/qwertiRoutes";

/** Scroll-to-top only; Qwerti widget loads via QwertiAutoLoad (launcher, manual open). */
export function FloatingActionStack() {
  const { pathname } = useLocation();
  const hidden = useMemo(() => isQwertiHiddenRoute(pathname), [pathname]);

  if (hidden) return null;

  return <ScrollToTopButton />;
}
