import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ExternalLink, MessageSquare, Shield, TrendingUp, FileText } from "lucide-react";
import { LINK_PLAYGROUND, LINK_DOCS } from "../../config/global";

const apiCategories = [
  {
    icon: MessageSquare,
    label: "Sentiment & research",
    description: "Real-time sentiment, headlines, and market research.",
  },
  {
    icon: Shield,
    label: "Risk & token reports",
    description: "Token audits, rug checks, and security scoring.",
  },
  {
    icon: TrendingUp,
    label: "Signals & whale flow",
    description: "Smart money tracking, signals, and trending data.",
  },
];

const keyPoints = [
  "Pay per request — no subscriptions",
  "Solana-native payments",
  "REST-style, any HTTP client",
  "Instant access after payment",
];

function X402FlowIllustration() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <p className="text-center text-sm font-medium text-muted-foreground mb-4">How it works</p>
      <svg
        viewBox="0 0 480 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-hidden
      >
        <defs>
          <linearGradient id="x402-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="x402-glow-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connecting line */}
        <path
          d="M 95 110 L 175 110 M 305 110 L 385 110"
          stroke="url(#x402-line)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="240" cy="110" r="5" fill="hsl(var(--muted-foreground) / 0.35)" />
        <path d="M 175 106 L 183 110 L 175 114" fill="hsl(var(--muted-foreground) / 0.5)" />
        <path d="M 297 106 L 305 110 L 297 114" fill="hsl(var(--muted-foreground) / 0.5)" />

        {/* Node 1: Send request */}
        <g>
          <circle cx="95" cy="110" r="38" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle cx="95" cy="110" r="32" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.35)" strokeWidth="1.5" />
          <text x="95" y="96" textAnchor="middle" fill="hsl(var(--foreground))" style={{ fontSize: 13, fontFamily: "system-ui", fontWeight: 700 }}>1</text>
          <text x="95" y="110" textAnchor="middle" fill="hsl(var(--foreground))" style={{ fontSize: 11, fontFamily: "system-ui", fontWeight: 600, whiteSpace: "nowrap" }}>Send request</text>
          <text x="95" y="122" textAnchor="middle" fill="hsl(var(--muted-foreground))" style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>GET /api/...</text>
        </g>

        {/* Node 2: Pay (highlighted) */}
        <motion.g
          animate={{ opacity: [0.92, 1, 0.92] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="240" cy="110" r="42" fill="url(#x402-glow-accent)" opacity="0.6" />
          <circle cx="240" cy="110" r="38" fill="hsl(var(--card))" stroke="hsl(var(--accent))" strokeWidth="2" />
          <circle cx="240" cy="110" r="32" fill="hsl(var(--accent) / 0.12)" stroke="hsl(var(--accent) / 0.6)" strokeWidth="1.5" />
          <text x="240" y="96" textAnchor="middle" fill="hsl(var(--accent))" style={{ fontSize: 14, fontFamily: "system-ui", fontWeight: 700 }}>2</text>
          <text x="240" y="112" textAnchor="middle" fill="hsl(var(--accent))" style={{ fontSize: 13, fontFamily: "system-ui", fontWeight: 700 }}>402 Pay</text>
          <text x="240" y="124" textAnchor="middle" fill="hsl(var(--muted-foreground))" style={{ fontSize: 10, fontFamily: "system-ui", whiteSpace: "nowrap" }}>Solana</text>
        </motion.g>

        {/* Node 3: Get data */}
        <g>
          <circle cx="385" cy="110" r="38" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle cx="385" cy="110" r="32" fill="hsl(var(--success) / 0.08)" stroke="hsl(var(--success) / 0.4)" strokeWidth="1.5" />
          <text x="385" y="96" textAnchor="middle" fill="hsl(var(--success))" style={{ fontSize: 13, fontFamily: "system-ui", fontWeight: 700 }}>3</text>
          <text x="385" y="110" textAnchor="middle" fill="hsl(var(--foreground))" style={{ fontSize: 11, fontFamily: "system-ui", fontWeight: 600, whiteSpace: "nowrap" }}>Get data</text>
          <text x="385" y="122" textAnchor="middle" fill="hsl(var(--muted-foreground))" style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" }}>200 + JSON</text>
        </g>
      </svg>
    </div>
  );
}

export const ApiX402Section = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="api" className="relative py-14 sm:py-20 lg:py-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-accent/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-neon-gold/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center"
        >
          {/* Left: Copy + CTA */}
          <div className="text-center lg:text-left order-2 lg:order-1 min-w-0">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="inline-block text-primary text-xs sm:text-sm font-medium tracking-widest uppercase mb-3 sm:mb-4"
            >
              HTTP 402
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold tracking-tight mb-4 sm:mb-6 leading-tight"
            >
              Request. Pay. Get data.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-6 leading-relaxed"
            >
              Syra APIs use the HTTP 402 Payment Required standard: call an endpoint, pay with Solana when prompted, then receive the response. No subscriptions—pay only for what you use.
            </motion.p>

            {/* API categories */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mb-6 sm:mb-8 space-y-3 sm:space-y-4"
            >
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
                Available via x402
              </p>
              {apiCategories.map((cat) => (
                <div key={cat.label} className="flex gap-3 items-start">
                  <div className="mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <cat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground">{cat.label}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start"
            >
              <a
                href={LINK_PLAYGROUND}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg hover:shadow-accent/20"
              >
                Open API Playground
                <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
              <a
                href={LINK_DOCS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 text-sm sm:text-base font-medium rounded-xl border border-border bg-transparent text-foreground hover:bg-secondary/50 transition-all"
              >
                <FileText className="h-4 w-4 shrink-0" />
                Documentation
              </a>
            </motion.div>
          </div>

          {/* Right: Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="order-1 lg:order-2 flex items-center justify-center min-w-0 w-full"
          >
            <div className="glass-card p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl w-full max-w-lg overflow-x-auto overflow-y-hidden">
              <div className="min-w-[280px] w-full">
                <X402FlowIllustration />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Key points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-10 sm:mt-16 pt-8 sm:pt-10 border-t border-border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {keyPoints.map((point) => (
              <div
                key={point}
                className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-card/60 border border-border text-xs sm:text-sm lg:text-base text-muted-foreground"
              >
                <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="min-w-0">{point}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
