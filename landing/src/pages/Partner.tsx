import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EMAIL_SUPPORT } from "../../config/global";
import {
  ALL_CATEGORIES,
  getCategoryLabel,
  type PartnerCategory,
  SYRA_PARTNERS,
} from "@/data/partners";

const LOGO_PLACEHOLDER = "/images/partners/placeholder.svg";

function categoryStyle(cat: PartnerCategory): string {
  switch (cat) {
    case "infrastructure":
      return "border-neon-blue/30 bg-neon-blue/[0.08] text-neon-blue";
    case "liquidity":
      return "border-success/30 bg-success/[0.1] text-success";
    case "data":
      return "border-foreground/15 bg-muted/50 text-foreground/90";
    case "wallets":
      return "border-neon-gold/35 bg-neon-gold/[0.1] text-neon-gold";
    case "exchanges":
      return "border-border bg-card/60 text-muted-foreground";
    default: {
      const _exhaustive: never = cat;
      return _exhaustive;
    }
  }
}

export default function Partner() {
  const reduceMotion = useReducedMotion();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<PartnerCategory | "all">("all");

  const counts = useMemo(() => {
    const by = new Map<PartnerCategory, number>();
    for (const c of ALL_CATEGORIES) by.set(c, 0);
    for (const p of SYRA_PARTNERS) {
      by.set(p.category, (by.get(p.category) ?? 0) + 1);
    }
    return by;
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SYRA_PARTNERS.filter((p) => {
      if (active !== "all" && p.category !== active) return false;
      if (!s) return true;
      return (
        p.name.toLowerCase().includes(s) ||
        p.tagline.toLowerCase().includes(s) ||
        p.summary.toLowerCase().includes(s) ||
        getCategoryLabel(p.category).toLowerCase().includes(s)
      );
    });
  }, [q, active]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.12] via-background to-background" />
          <div
            className="absolute -top-32 left-1/2 h-[28rem] w-[min(90vw,48rem)] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--ring) / 0.2), transparent 70%)",
            }}
          />
          <div
            className="absolute right-0 top-40 h-[18rem] w-[18rem] opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--foreground) / 0.08), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern opacity-[0.25]" />
        </div>

        <div className="mx-auto min-w-0 max-w-7xl px-4 pt-28 pb-16 sm:px-6 sm:pt-32 lg:px-8">
          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 max-w-3xl sm:mb-12"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur sm:text-sm">
              <Layers3 className="h-3.5 w-3.5 text-foreground/70" aria-hidden />
              Ecosystem
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              Partner <span className="neon-text">integrations</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl text-balance">
              The protocols, venues, and data layer Syra connects to—so
              research, risk, and execution sit on a single, coherent
              stack.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                {SYRA_PARTNERS.length} live integrations
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="text-xs sm:text-sm">
                Execution remains user- or policy-gated; we surface context, not
                promises of returns.
              </span>
            </div>
          </motion.header>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
            <div className="relative w-full sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search partners…"
                className="h-12 rounded-2xl border-border/60 bg-card/50 pl-10 pr-3 shadow-inner backdrop-blur"
                autoComplete="off"
              />
            </div>
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Filter by category"
            >
              <button
                type="button"
                role="tab"
                aria-selected={active === "all"}
                onClick={() => setActive("all")}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition-colors sm:text-sm",
                  active === "all"
                    ? "border-foreground/25 bg-foreground/10 text-foreground"
                    : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              {ALL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={active === c}
                  onClick={() => setActive(c)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors sm:text-sm",
                    active === c
                      ? "border-foreground/25 bg-foreground/10 text-foreground"
                      : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {getCategoryLabel(c)}
                  <span className="tabular-nums text-[0.7rem] opacity-70">
                    {counts.get(c) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <p className="text-lg font-semibold">No partners match that filter</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another search or reset categories.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => { setQ(""); setActive("all"); }}>
                  Clear filters
                </Button>
              </div>
            </div>
          ) : (
            <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
              {filtered.map((partner, i) => (
                <motion.li
                  key={partner.slug}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    delay: Math.min(0.06 * i, 0.36),
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    to={`/partner/${partner.slug}`}
                    className="group glass-card block h-full min-h-[11.5rem] overflow-hidden rounded-2xl p-5 transition-transform duration-300 will-change-transform hover:-translate-y-0.5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/60"
                          style={{
                            boxShadow: "0 0 0 1px hsl(var(--foreground) / 0.04) inset",
                          }}
                        >
                          <img
                            src={`/images/partners/${partner.slug}.png`}
                            alt=""
                            className="h-8 w-8 object-contain"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith(LOGO_PLACEHOLDER)) {
                                target.src = LOGO_PLACEHOLDER;
                              }
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">
                            {partner.name}
                          </h2>
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {partner.tagline}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl border text-muted-foreground transition-colors",
                          "border-border/60 bg-background/40",
                          "group-hover:border-foreground/20 group-hover:text-foreground",
                        )}
                        aria-hidden
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {partner.summary}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          categoryStyle(partner.category),
                        )}
                      >
                        {getCategoryLabel(partner.category)}
                      </span>
                      <span className="text-xs font-semibold text-foreground/70 group-hover:text-foreground">
                        View details
                      </span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/80 to-muted/15 p-8 sm:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-foreground/5 blur-2xl" />
            <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Build on Syra
                </div>
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl text-balance">
                  Want your protocol or data product listed?
                </h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  We are always expanding the integration surface. Share what you
                  ship and how it complements institutional trading and agent
                  workflows.
                </p>
              </div>
              <a
                href={`mailto:${EMAIL_SUPPORT}?subject=Partner%20integration`}
                className="shrink-0 btn-secondary"
              >
                Contact partnerships
                <ArrowUpRight className="ml-2 inline h-4 w-4 align-text-bottom" />
              </a>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
