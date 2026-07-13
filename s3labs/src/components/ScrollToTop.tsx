import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

const SCROLL_THRESHOLD = 400;

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const [visible, setVisible] = useState(false);

  // Only reset scroll on real route / hash changes — not query-string updates
  // (KOL tabs, filters, etc. use search params and must keep scroll position).
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <Button
      variant="default"
      size="icon"
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg transition-opacity duration-200 hover:opacity-90 md:bottom-8 md:right-8 md:h-14 md:w-14"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-6 w-6 md:h-7 md:w-7" />
    </Button>
  );
};

export default ScrollToTop;
