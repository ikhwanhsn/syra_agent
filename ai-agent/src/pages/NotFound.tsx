import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchX, Home, Store } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      {/* Subtle gradient orbs in background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* Icon with soft glow */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl bg-card/80 p-5 ring-1 ring-border/50 backdrop-blur-sm neon-glow-purple">
            <SearchX className="h-16 w-16 text-muted-foreground/80" strokeWidth={1.25} />
          </div>
        </div>

        {/* 404 with gradient */}
        <h1 className="mb-2 text-6xl sm:text-7xl font-bold tracking-tight gradient-text">
          404
        </h1>
        <p className="mb-1 text-lg font-medium text-foreground">
          Page not found
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2 min-w-[160px]">
            <Link to="/">
              <Home className="h-4 w-4" />
              Return to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 min-w-[160px]">
            <Link to="/dashboard/marketplace/prompts">
              <Store className="h-4 w-4" />
              Marketplace
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
