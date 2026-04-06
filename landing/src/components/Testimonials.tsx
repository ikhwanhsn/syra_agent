import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

/** Per-card accents — cyan / gold / green align with landing tokens */
const testimonialThemes = [
  {
    border: "border-accent/30 hover:border-accent/55",
    shadow: "hover:shadow-[0_0_40px_-10px_hsl(var(--accent)/0.28)]",
    topBar: "from-accent/0 via-accent to-accent/0",
    quoteBox: "border border-accent/25 bg-accent/[0.08]",
    quoteIcon: "text-primary",
    quoteBar: "border-accent/45",
    avatarRing: "ring-accent/55 shadow-[0_0_18px_-5px_hsl(var(--accent)/0.45)]",
    footerRule: "border-accent/20",
    metric: "font-bold text-primary",
    metricSub: "text-muted-foreground",
  },
  {
    border: "border-neon-gold/35 hover:border-neon-gold/60",
    shadow: "hover:shadow-[0_0_40px_-10px_hsl(var(--neon-gold)/0.3)]",
    topBar: "from-neon-gold/0 via-neon-gold to-neon-gold/0",
    quoteBox: "border border-neon-gold/30 bg-neon-gold/[0.09]",
    quoteIcon: "text-neon-gold",
    quoteBar: "border-neon-gold/50",
    avatarRing: "ring-neon-gold/60 shadow-[0_0_18px_-5px_hsl(var(--neon-gold)/0.4)]",
    footerRule: "border-neon-gold/20",
    metric: "font-bold text-neon-gold",
    metricSub: "text-neon-gold/65",
  },
  {
    border: "border-success/30 hover:border-success/55",
    shadow: "hover:shadow-[0_0_40px_-10px_hsl(var(--success)/0.28)]",
    topBar: "from-success/0 via-success to-success/0",
    quoteBox: "border border-success/25 bg-success/[0.08]",
    quoteIcon: "text-success",
    quoteBar: "border-success/45",
    avatarRing: "ring-success/55 shadow-[0_0_18px_-5px_hsl(var(--success)/0.4)]",
    footerRule: "border-success/20",
    metric: "font-bold text-success",
    metricSub: "text-success/60",
  },
] as const;

const testimonials = [
  {
    quote:
      "Syra ran 25K+ real on-chain transactions to stress-test our system — flawless execution. Fast, reliable, and powerful.",
    image: "/images/trust/kehaya.jpg",
    author: "Kehaya",
    role: "Ex-Solana Foundation",
    metric: "+50K",
    metricLabel: "X Followers",
    link: "https://x.com/afkehaya/status/1989172829598924956?s=20",
  },
  {
    quote:
      "Syra’s agents delivered a true 100% success rate — zero failures. Performance at its best.",
    image: "/images/trust/corbits.jpg",
    author: "Corbits",
    role: "x402 Facilitator",
    metric: "+3.5K",
    metricLabel: "X Followers",
    link: "https://x.com/corbits_dev/status/1989770638555570301?s=20",
  },
  {
    quote:
      "Syra’s modular AI agents deliver real market intelligence. Real-time sentiment and deep research in one system.",
    image: "/images/trust/stanley.jpg",
    author: "Stanley",
    role: "Whales Investor",
    metric: "+21K",
    metricLabel: "X Followers",
    link: "https://x.com/Stanley_Trader/status/1992906485169267009?s=20",
  },
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-accent/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[320px] h-[320px] bg-success/8 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-0 w-[320px] h-[320px] bg-neon-gold/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="section-eyebrow-gradient mb-4 inline-block text-sm font-medium tracking-wider uppercase"
          >
            Testimonials
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Trusted by <span className="neon-text">Professionals</span>
          </motion.h2>
        </div>

        <div className="grid gap-6 mb-20 md:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const theme = testimonialThemes[index % testimonialThemes.length];
            return (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={cn(
                "group relative flex flex-col glass-card rounded-2xl p-6 transition-all duration-300",
                theme.border,
                theme.shadow,
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute left-8 right-8 top-0 h-[3px] rounded-full bg-gradient-to-r opacity-90 transition-opacity group-hover:opacity-100",
                  theme.topBar,
                )}
                aria-hidden
              />

              <div
                className={cn(
                  "relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  theme.quoteBox,
                )}
              >
                <Quote className={cn("h-5 w-5", theme.quoteIcon)} strokeWidth={2} />
              </div>

              <a
                href={testimonial.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 flex-1"
              >
                <p
                  className={cn(
                    "mb-6 border-l-2 pl-4 text-muted-foreground leading-relaxed transition-colors group-hover:text-foreground/90",
                    theme.quoteBar,
                  )}
                >
                  "{testimonial.quote}"
                </p>
              </a>

              <div
                className={cn(
                  "relative z-10 flex items-center justify-between gap-3 border-t pt-4",
                  theme.footerRule,
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={`${testimonial.author}`}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full object-cover ring-2",
                      theme.avatarRing,
                    )}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className={theme.metric}>{testimonial.metric}</span>
                  </div>
                  <div className={cn("text-xs", theme.metricSub)}>
                    {testimonial.metricLabel}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
