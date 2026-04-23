import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Cpu,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import {
  getCategoryLabel,
  getPartnerBySlug,
  type PartnerCategory,
} from "@/data/partners";
import { LINK_DOCS, EMAIL_SUPPORT, LINK_AGENT } from "../../config/global";

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

export default function PartnerDetail() {
  const { slug } = useParams();
  const partner = useMemo(() => getPartnerBySlug(slug), [slug]);
  const reduceMotion = useReducedMotion();

  if (!partner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6">
          <h1 className="text-3xl font-bold">Integration not found</h1>
          <p className="mt-3 text-muted-foreground">
            This partner page does not exist or the link is outdated.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/partner" className="btn-primary">
              All partners
            </Link>
            <Link to="/" className="btn-secondary">
              Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { integration } = partner;
  const isLive = integration.status === "live";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.1] via-background to-background" />
          <div
            className="absolute -top-24 left-0 h-[20rem] w-[min(100vw,36rem)] opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--ring) / 0.22), transparent 70%)",
            }}
          />
          <div
            className="absolute -right-10 top-32 h-[22rem] w-[22rem] opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--foreground) / 0.1), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>

        <div className="mx-auto min-w-0 max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  to="/partner"
                  className="hover:text-foreground transition-colors"
                >
                  Partners
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="font-medium text-foreground" aria-current="page">
                {partner.name}
              </li>
            </ol>
          </nav>

          <div className="mb-8 flex items-start justify-between gap-4">
            <Link
              to="/partner"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card/50 transition-colors group-hover:border-foreground/20"
                aria-hidden
              >
                <ArrowLeft className="h-4 w-4" />
              </span>
              Back to partners
            </Link>
          </div>

          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 p-6 sm:p-10"
          >
            <div className="pointer-events-none absolute inset-0 section-glow-left opacity-30" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-5 sm:gap-7">
                <div
                  className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border/50 bg-background/70 shadow-[0_0_0_1px_hsl(var(--foreground)/0.04)_inset] sm:h-24 sm:w-24"
                >
                  <img
                    src={`/images/partners/${partner.slug}.png`}
                    alt=""
                    className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (!t.src.endsWith(LOGO_PLACEHOLDER)) {
                        t.src = LOGO_PLACEHOLDER;
                      }
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        categoryStyle(partner.category),
                      )}
                    >
                      {getCategoryLabel(partner.category)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        isLive
                          ? "border-success/30 bg-success/[0.1] text-success"
                          : "border-warning/35 bg-warning/[0.1] text-warning-foreground",
                      )}
                    >
                      {isLive ? "Live" : "Beta"}
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-balance">
                    {partner.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg">
                    {partner.tagline}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:max-w-xs">
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-semibold backdrop-blur transition-colors hover:border-foreground/25 hover:bg-background/80"
                >
                  Visit {partner.name}
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </a>
                <a
                  href={LINK_DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  API &amp; product docs
                </a>
              </div>
            </div>
          </motion.header>

          <div className="mt-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr,22rem] lg:gap-8">
            <div className="space-y-5">
              <motion.section
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4 }}
                className="glass-card rounded-2xl p-6 sm:p-7"
              >
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Overview
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {integration.overview}
                </p>
              </motion.section>

              <motion.section
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: 0.04 }}
                className="overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/50 to-card/20"
              >
                <div className="border-b border-border/40 bg-muted/20 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-foreground/90">
                    <Cpu className="h-4 w-4 text-muted-foreground" aria-hidden />
                    Capabilities in Syra
                  </h2>
                </div>
                <ul className="space-y-0">
                  {integration.capabilities.map((c, i) => (
                    <li
                      key={i}
                      className="flex gap-3 border-b border-border/30 px-6 py-4 last:border-0"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/45"
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                        {c}
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.section>

              {integration.technical ? (
                <motion.section
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.08 }}
                  className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-muted/15 p-6 sm:p-7"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground/90">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    Technical note
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {integration.technical}
                  </p>
                </motion.section>
              ) : null}
            </div>

            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-2xl p-6"
                >
                  <p className="text-sm font-bold text-foreground/90">Summary</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {partner.summary}
                  </p>
                  <div className="mt-5 h-px bg-border/60" />
                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Market data and integrations are for informational and
                    operational context. Syra does not guarantee future
                    performance or the accuracy of third-party data.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <a href={LINK_AGENT} className="btn-primary text-center" target="_blank">
                      Open Syra agent
                    </a>
                    <a
                      href={LINK_DOCS}
                      className="btn-secondary text-center"
                      target="_blank"
                    >
                      Read documentation
                    </a>
                    <a
                      href={`mailto:${EMAIL_SUPPORT}?subject=${encodeURIComponent(
                        `Partner: ${partner.name}`,
                      )}`}
                      className="text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Ask a question
                    </a>
                  </div>
                </motion.div>

                <p className="mt-4 text-center text-xs text-muted-foreground lg:px-2">
                  <Link to="/partner" className="inline-flex items-center justify-center gap-1 font-medium hover:text-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Browse all partners
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
