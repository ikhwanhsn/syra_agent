import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  X,
  Palette,
  Type,
  MessageSquare,
  LayoutGrid,
  Move,
  Sparkles,
  Boxes,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SyraLogo } from "@/components/SyraLogo";
import logoMark from "/images/logo.jpg";

function SectionNumber({ n }: { n: string }) {
  return (
    <span className="font-mono text-xs font-semibold tracking-widest text-muted-foreground tabular-nums">
      {n}
    </span>
  );
}

function DoDont({
  dos,
  donts,
}: {
  dos: string[];
  donts: string[];
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-success">
          <Check className="h-4 w-4 shrink-0" />
          Do
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {dos.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-foreground/40">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border bg-card/40 p-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-destructive">
          <X className="h-4 w-4 shrink-0" />
          Don&apos;t
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {donts.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-foreground/40">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  token,
  description,
  className,
}: {
  label: string;
  token: string;
  description: string;
  className: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card/30 p-4">
      <div
        className={`h-16 w-16 shrink-0 rounded-lg border border-border shadow-inner ${className}`}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{token}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function Brand() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main className="relative z-10 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0 opacity-50 grid-pattern" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-16 max-w-3xl"
          >
            <p className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium uppercase tracking-wider">
              Brand Guidelines
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="neon-text">SYRA</span>
              <span className="text-foreground"> identity</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              Visual and verbal identity for Syra — AI-powered trading infrastructure on Solana. Use
              this system so every touchpoint feels precise, neutral, and built for builders.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="rounded-full border border-border bg-card/50 px-4 py-1.5 font-mono text-xs">
                v1.0 — April 2026
              </span>
              <span className="rounded-full border border-border bg-card/50 px-4 py-1.5">
                Public use for partners &amp; press
              </span>
            </div>
          </motion.header>

          <div className="space-y-24 md:space-y-32">
            {/* 01 Logo */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-28"
              id="logo"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="01" />
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Logo</h2>
                </div>
              </div>
              <p className="mb-10 max-w-2xl text-muted-foreground">
                The Syra lockup pairs the mark with a bold wordmark. The gradient wordmark
                (&quot;neon&quot;) signal is reserved for the name — keep the icon mark clean and
                high-contrast.
              </p>

              <div className="mb-10 grid gap-6 lg:grid-cols-2">
                <div className="glass-card p-8">
                  <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Primary lockup
                  </p>
                  <SyraLogo className="scale-110" />
                  <p className="mt-8 text-sm text-muted-foreground">
                    Default for headers, decks, and product. Minimum clear space ≈ one-quarter of the
                    mark height on all sides.
                  </p>
                </div>
                <div className="glass-card p-8">
                  <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Mark only
                  </p>
                  <div className="flex items-center gap-6">
                    <img
                      src={logoMark}
                      width={72}
                      height={72}
                      alt="Syra mark"
                      className="h-[72px] w-[72px] shrink-0 rounded-2xl border border-border object-cover"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use when the full wordmark is redundant (favicons, app icons, tight UI). Prefer
                      PNG or WebP at 2× for crisp edges.
                    </p>
                  </div>
                </div>
              </div>

              <DoDont
                dos={[
                  "Place the logo on high-contrast backgrounds (dark or light).",
                  "Keep clear space; do not crowd the lockup with borders or busy imagery.",
                  "Use SVG or high-resolution raster for digital; match theme (dark/light).",
                  "Keep the mark at least 24px tall in product UI.",
                ]}
                donts={[
                  "Distort, rotate, or add heavy drop shadows to the mark.",
                  "Recolor the wordmark gradient arbitrarily — it follows theme tokens.",
                  "Place the mark on low-contrast or noisy backgrounds.",
                  "Replace the official asset with redrawn or alternate letterforms.",
                ]}
              />
            </motion.section>

            {/* 02 Color */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="color"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="02" />
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Color</h2>
                </div>
              </div>
              <p className="mb-10 max-w-2xl text-muted-foreground">
                Syra uses a monochrome base with subtle &quot;neon&quot; accents driven by CSS
                variables. Light and dark themes share the same structure — components read
                semantic tokens, not raw hex.
              </p>

              <div className="mb-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Surfaces &amp; text
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorSwatch
                    label="Background"
                    token="background"
                    description="Page canvas; deepest layer."
                    className="bg-background"
                  />
                  <ColorSwatch
                    label="Foreground"
                    token="foreground"
                    description="Primary text and key UI chrome."
                    className="bg-foreground"
                  />
                  <ColorSwatch
                    label="Card"
                    token="card"
                    description="Panels, elevated surfaces."
                    className="bg-card"
                  />
                  <ColorSwatch
                    label="Border"
                    token="border"
                    description="Dividers, outlines, subtle structure."
                    className="bg-border"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Accent &amp; neon (neutral ramp)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ColorSwatch
                    label="Neon cyan"
                    token="neon.cyan"
                    description="Highlights, data viz accents."
                    className="bg-neon-cyan"
                  />
                  <ColorSwatch
                    label="Neon blue"
                    token="neon.blue"
                    description="Secondary accent, links."
                    className="bg-neon-blue"
                  />
                  <ColorSwatch
                    label="Neon purple"
                    token="neon.purple"
                    description="Depth, alternate emphasis."
                    className="bg-neon-purple"
                  />
                  <ColorSwatch
                    label="Neon gold"
                    token="neon.gold"
                    description="Premium / spotlight moments."
                    className="bg-neon-gold"
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Semantic
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ColorSwatch
                    label="Success"
                    token="success"
                    description="Confirmations, positive states."
                    className="bg-success"
                  />
                  <ColorSwatch
                    label="Warning"
                    token="warning"
                    description="Caution, pending."
                    className="bg-warning"
                  />
                  <ColorSwatch
                    label="Destructive"
                    token="destructive"
                    description="Errors, irreversible actions."
                    className="bg-destructive"
                  />
                </div>
              </div>
            </motion.section>

            {/* 03 Typography */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="typography"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="03" />
                <div className="flex items-center gap-3">
                  <Type className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Typography</h2>
                </div>
              </div>
              <p className="mb-10 max-w-2xl text-muted-foreground">
                Space Grotesk is the single family across marketing and product chrome on the landing
                site. Use weight and size — not extra families — for hierarchy.
              </p>

              <div className="glass-card divide-y divide-border overflow-hidden">
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">Display / 72</span>
                  <p className="text-5xl font-bold tracking-tight sm:text-6xl md:text-[4.5rem] leading-none">
                    SYRA
                  </p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">H1 / 48</span>
                  <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Trade with intelligence
                  </p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">H2 / 30</span>
                  <p className="text-2xl font-bold sm:text-3xl">API &amp; agent infrastructure</p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">H3 / 20</span>
                  <p className="text-xl font-semibold">x402 and Solana-native flows</p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">Body / 16</span>
                  <p className="text-base text-muted-foreground">
                    Syra combines real-time market data, agent tooling, and pay-per-use APIs so teams
                    ship faster without sacrificing clarity.
                  </p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">Small / 14</span>
                  <p className="text-sm text-muted-foreground">
                    Secondary copy, helper text, and dense tables.
                  </p>
                </div>
                <div className="grid gap-6 p-6 md:grid-cols-[140px_1fr] md:items-center">
                  <span className="font-mono text-xs text-muted-foreground">Caption / 12</span>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Uppercase labels
                  </p>
                </div>
              </div>
            </motion.section>

            {/* 04 Voice */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="voice"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="04" />
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Voice &amp; tone</h2>
                </div>
              </div>
              <p className="mb-10 max-w-2xl text-muted-foreground">
                Direct, technical, and proof-oriented. We speak to traders and builders — clarity
                beats hype. Separate analysis from execution; never imply certainty about markets.
              </p>

              <div className="mb-10 grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: "Direct",
                    quote: "Pay per request. No subscription lock-in.",
                    body: "Short sentences. State what the product does and how it is priced.",
                  },
                  {
                    title: "Technical",
                    quote: "x402 on Solana. Typed responses. Observable limits.",
                    body: "Use precise terms your audience already knows. Link to specs when it helps.",
                  },
                  {
                    title: "Proof-first",
                    quote: "Dashboards, logs, and on-chain context when relevant.",
                    body: "Prefer demonstrable claims over superlatives. Show the path from signal to action.",
                  },
                ].map((block) => (
                  <div key={block.title} className="rounded-2xl border border-border bg-card/40 p-6">
                    <h3 className="text-lg font-semibold">{block.title}</h3>
                    <p className="mt-4 font-mono text-sm text-foreground/90">&ldquo;{block.quote}&rdquo;</p>
                    <p className="mt-3 text-sm text-muted-foreground">{block.body}</p>
                  </div>
                ))}
              </div>

              <DoDont
                dos={[
                  "AI-powered trading infrastructure for the next generation of traders.",
                  "Built for Solana with programmable payments — use what you need.",
                  "Your agent returned ranked signals in under three seconds.",
                ]}
                donts={[
                  "Revolutionary paradigm-shifting synergy in the DeFi metaverse.",
                  "Guaranteed returns and risk-free alpha.",
                  "Vague promises with no path to verify or reproduce results.",
                ]}
              />
            </motion.section>

            {/* 05 UI */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="ui"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="05" />
                <div className="flex items-center gap-3">
                  <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">UI components</h2>
                </div>
              </div>
              <p className="mb-10 max-w-2xl text-muted-foreground">
                Glass surfaces, gradient wordmarks, and high-contrast buttons match the rest of the
                landing experience.
              </p>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="glass-card space-y-4 p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Buttons
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="btn-primary cursor-default px-6 py-3 text-sm">Primary CTA</span>
                    <span className="btn-secondary cursor-default px-6 py-3 text-sm">Secondary</span>
                  </div>
                  <a
                    href="#ui"
                    className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Text link →
                  </a>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card/40 p-6 transition-colors hover:border-primary/30">
                    <p className="text-xs text-muted-foreground">Default card</p>
                    <h3 className="mt-2 font-semibold">Border + subtle hover</h3>
                  </div>
                  <div className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-6">
                    <p className="text-xs text-muted-foreground">Active / emphasis</p>
                    <h3 className="mt-2 font-semibold">Highlighted panel</h3>
                  </div>
                  <div className="neon-glow rounded-2xl border border-border bg-card/60 p-6">
                    <p className="text-xs text-muted-foreground">Glow</p>
                    <h3 className="mt-2 font-semibold">Featured callout</h3>
                  </div>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/80 p-6 font-mono text-sm">
                <p className="text-muted-foreground">syra-cli preview</p>
                <p className="mt-4 text-foreground">
                  $ syra signal --pair SOL-USDC --window 1h
                </p>
                <p className="mt-2 text-muted-foreground">⟳ Aggregating venues…</p>
                <p className="mt-2 text-success">✓ Response ready (typed, rate-limited)</p>
                <p className="mt-4 animate-pulse text-primary">▌</p>
              </div>
            </motion.section>

            {/* 06 Spacing */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="spacing"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="06" />
                <div className="flex items-center gap-3">
                  <Boxes className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Spacing</h2>
                </div>
              </div>
              <p className="mb-8 max-w-2xl text-muted-foreground">
                Tailwind&apos;s 4px base scale (0.25rem) aligns layout rhythm. Prefer multiples of 4
                for padding, gaps, and icon boxes.
              </p>
              <div className="flex flex-wrap gap-3">
                {[4, 8, 12, 16, 24, 32, 48, 64].map((px) => (
                  <div
                    key={px}
                    className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-4"
                  >
                    <div
                      className="rounded bg-primary/30"
                      style={{ width: px, height: px, minWidth: 4, minHeight: 4 }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">{px}px</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* 07 Motion */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="motion"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="07" />
                <div className="flex items-center gap-3">
                  <Move className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold sm:text-3xl">Motion</h2>
                </div>
              </div>
              <p className="mb-8 max-w-2xl text-muted-foreground">
                Motion is restrained: short fades, subtle hovers, and scroll reveals. Avoid playful
                bounce; keep transitions under ~600ms for UI feedback.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2">
                {[
                  { name: "fade-in", note: "Sections on scroll — opacity + translateY" },
                  { name: "shimmer", note: "Skeletons and loading stripes" },
                  { name: "marquee", note: "Ticker-style content; pause on hover when possible" },
                  { name: "pulse-glow", note: "Soft emphasis on key metrics" },
                ].map((item) => (
                  <li
                    key={item.name}
                    className="rounded-xl border border-border bg-card/40 px-4 py-3 font-mono text-sm"
                  >
                    <span className="text-foreground">{item.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.note}</span>
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* 08 Quick reference */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              id="downloads"
            >
              <div className="mb-8 flex flex-wrap items-end gap-4">
                <SectionNumber n="08" />
                <h2 className="text-2xl font-bold sm:text-3xl">Quick reference</h2>
              </div>
              <div className="glass-card grid gap-8 p-8 md:grid-cols-2 md:items-center">
                <div>
                  <SyraLogo />
                  <dl className="mt-8 space-y-4 text-sm">
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Wordmark treatment
                      </dt>
                      <dd className="mt-1 text-foreground">Gradient via .neon-text (theme tokens)</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Typeface
                      </dt>
                      <dd className="mt-1 text-foreground">Space Grotesk</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        Tagline
                      </dt>
                      <dd className="mt-1 text-foreground">
                        AI-powered trading infrastructure for the next generation of traders.
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6">
                  <p className="text-sm font-medium text-foreground">Assets</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use the official mark bundled with the product repo (
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/images/logo.jpg</code>
                    ). Request vector or alternate formats from the team for print or broadcast.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
