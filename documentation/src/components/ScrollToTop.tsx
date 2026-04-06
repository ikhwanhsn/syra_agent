import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to top on route change. If the URL has a hash, scrolls to that element instead.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
