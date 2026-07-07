import { ArrowRight, BarChart3, Coins, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { ANSEM } from "@/lib/ansem";
import { assetPathFromQuery } from "@/lib/tokensDossierApi";
import { cn } from "@/lib/utils";

const SYRA_LINKS = [
  {
    href: "/swap",
    label: "Swap on Syra",
    description: "Trade with Jupiter routing and live market intel.",
    icon: Coins,
  },
  {
    href: assetPathFromQuery({ mint: ANSEM.mint }),
    label: "Full asset dossier",
    description: "Deep markets table, risk breakdown, and shareable link.",
    icon: BarChart3,
  },
  {
    href: "/metrics",
    label: "Syra live metrics",
    description: "x402 traction, treasury, and agent economy proof.",
    icon: Sparkles,
  },
] as const;

export function AnsemVibesSection({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div
        className={cn(
          overviewCardShell,
          "relative overflow-hidden p-6 sm:p-8",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(600px 200px at 0% 0%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(400px 160px at 100% 100%, hsl(280 70% 55% / 0.06), transparent 55%)",
          }}
          aria-hidden
        />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="space-y-3">
            <p className={overviewKickerClass}>Powered by Syra</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Good vibes for $ANSEM, built on $SYRA infra
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              This hub runs on the same agent-grade data stack Syra ships to traders and AI agents —
              dossier, intelligence, on-chain forensics, and x402 micropayments. Hold $ANSEM with
              clarity; build with Syra.
            </p>
            <Button variant="neon" className="rounded-xl" asChild>
              <Link to="/about">
                Explore Syra
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-1">
            {SYRA_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group flex items-start gap-4 rounded-2xl border border-border/50 bg-background/40 p-4 transition-all hover:border-border hover:bg-muted/30"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/40 transition-colors group-hover:bg-primary/10">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
