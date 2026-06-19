import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Code2,
  Home,
  LayoutDashboard,
  MapPinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

function useGlitchText(text: string, intervalMs = 80) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    if (!isGlitching) return;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const resolved = text.slice(0, step);
      const remaining = text.length - step;
      const noise = Array.from({ length: remaining }, () =>
        GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
      ).join("");
      setDisplay(resolved + noise);
      if (step >= text.length) {
        clearInterval(id);
        setIsGlitching(false);
        setDisplay(text);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [text, intervalMs, isGlitching]);

  return display;
}

const QUICK_DESTINATIONS = [
  {
    href: "/",
    label: "Agent",
    description: "Chat with Syra and run on-chain actions",
    icon: Bot,
  },
  {
    href: "/overview",
    label: "Overview",
    description: "Command center for labs and feeds",
    icon: LayoutDashboard,
  },
  {
    href: "/playground",
    label: "Playground",
    description: "Test x402 and MPP API endpoints",
    icon: Code2,
  },
] as const;

const NotFound = () => {
  const location = useLocation();
  const glitchedCode = useGlitchText("404", 100);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border) / 0.14) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.14) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
          }}
        />
        <div
          className="absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 68%)",
          }}
        />
        <div
          className="absolute -right-24 bottom-1/4 h-[360px] w-[360px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--muted-foreground) / 0.08), transparent 65%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>

      <div
        className={cn(
          overviewCardShell,
          "relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl px-6 py-8 sm:px-10 sm:py-10",
          "animate-slide-up",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(520px 200px at 10% -15%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(420px 180px at 100% 110%, hsl(var(--muted-foreground) / 0.06), transparent 50%)",
          }}
          aria-hidden
        />

        <div className="relative space-y-8">
          {/* Hero */}
          <div className="text-center sm:text-left">
            <div
              className={cn(
                overviewKickerClass,
                "mb-4 inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 backdrop-blur-md",
              )}
              style={{ animationDelay: "40ms" }}
            >
              <MapPinOff className="h-3.5 w-3.5 text-foreground/75" aria-hidden />
              Signal lost
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-2xl blur-xl"
                  style={{
                    background:
                      "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)",
                  }}
                  aria-hidden
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border/55 bg-background/55 shadow-inner backdrop-blur-md">
                  <MapPinOff
                    className="h-7 w-7 text-foreground/85"
                    strokeWidth={1.35}
                    aria-hidden
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-2 text-center sm:text-left">
                <h1
                  className="font-mono text-6xl font-black tracking-tighter gradient-text sm:text-7xl lg:text-8xl"
                  aria-label="404"
                >
                  {glitchedCode}
                </h1>
                <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  This page doesn&apos;t exist
                </p>
                <p className="mx-auto max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:mx-0 sm:text-[15px]">
                  The route may have moved, been renamed, or never existed. Pick a
                  destination below or head back home.
                </p>
              </div>
            </div>

            {location.pathname !== "/" ? (
              <div className="mt-5 flex justify-center sm:justify-start">
                <code className="inline-flex max-w-full items-center rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur-sm">
                  <span className="truncate">{location.pathname}</span>
                </code>
              </div>
            ) : null}
          </div>

          {/* Quick destinations */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {QUICK_DESTINATIONS.map((dest, index) => {
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.href}
                  to={dest.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-border/50 bg-background/30 p-3.5",
                    "transition-all duration-200 hover:border-primary/25 hover:bg-background/50 hover-lift",
                    "animate-slide-up opacity-0",
                  )}
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/8 transition-colors group-hover:border-primary/25 group-hover:bg-primary/12">
                    <Icon className="h-4 w-4 text-foreground/85" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {dest.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {dest.description}
                    </span>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>

          {/* Primary actions */}
          <div
            className="flex flex-col items-center justify-center gap-3 border-t border-border/40 pt-6 sm:flex-row sm:justify-start animate-slide-up opacity-0"
            style={{ animationDelay: "420ms" }}
          >
            <Button asChild variant="neon" size="lg" className="min-w-[168px] gap-2">
              <Link to="/">
                <Home className="h-4 w-4" aria-hidden />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[168px] gap-2">
              <Link to="/overview">
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Open dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
