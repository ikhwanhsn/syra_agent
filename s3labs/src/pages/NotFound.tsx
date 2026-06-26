import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <SitePageShell>
      <div className={cn(pageContent, "pb-20 flex flex-1 items-center justify-center min-h-[60dvh]")}>
        <div className="panel-glass max-w-md w-full mx-auto px-6 sm:px-8 py-12 sm:py-16 text-center">
          <p className="text-6xl sm:text-7xl font-semibold text-gradient tabular-nums mb-4">404</p>
          <h1 className="heading-section mb-3">Page not found</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page you requested doesn&apos;t exist or may have moved.
          </p>
          <Button variant="hero" size="lg" asChild className="rounded-full gap-2 w-full sm:w-auto">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </SitePageShell>
  );
};

export default NotFound;
