import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FloatingActionStack } from "@/components/marketing/FloatingActionStack";
import { QwertiAutoLoad } from "@/components/marketing/QwertiAutoLoad";

function MarketingScrollToTop() {
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

/** Landing-style pages: own nav/footer per page, shared scroll + Qwerti chrome. */
export function MarketingLayout() {
  return (
    <>
      <MarketingScrollToTop />
      <Outlet />
      <QwertiAutoLoad />
      <FloatingActionStack />
    </>
  );
}
