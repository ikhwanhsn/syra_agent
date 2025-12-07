import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, TrendingUp } from "lucide-react";

const testimonials = [
  {
    quote:
      "Syra ran 25K+ real on-chain transactions to stress-test our system — flawless execution. Fast, reliable, and powerful.",
    author: "Kehaya",
    role: "Ex-Solana Foundation",
    metric: "+50K",
    metricLabel: "X Followers",
    link: "https://x.com/afkehaya/status/1989172829598924956?s=20",
  },
  {
    quote:
      "Syra’s agents delivered a true 100% success rate — zero failures. Performance at its best.",
    author: "Corbits",
    role: "x402 Facilitator",
    metric: "+3.5K",
    metricLabel: "X Followers",
    link: "https://x.com/corbits_dev/status/1989770638555570301?s=20",
  },
  {
    quote:
      "Syra’s modular AI agents deliver real market intelligence. Real-time sentiment and deep research in one system.",
    author: "Stanley",
    role: "Whales Investor",
    metric: "+21K",
    metricLabel: "X Followers",
    link: "https://x.com/Stanley_Trader/status/1992906485169267009?s=20",
  },
];

const partners = [
  "Chainlink",
  "Polygon",
  "Arbitrum",
  "Optimism",
  "Alchemy",
  "The Graph",
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
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
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="flex flex-col p-6 glass-card rounded-2xl"
            >
              <Quote className="w-8 h-8 mb-4 text-primary/30" />

              <a
                href={testimonial.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <p className="relative z-10 flex-1 mb-6 text-muted-foreground">
                  "{testimonial.quote}"
                </p>
              </a>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* <TrendingUp className="w-4 h-4 text-green-400" /> */}
                    <span className="font-bold neon-text">
                      {testimonial.metric}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.metricLabel}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="mb-8 text-sm tracking-wider uppercase text-muted-foreground">
            Integrated With Leading Protocols
          </p>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="text-xl font-semibold transition-colors cursor-default text-muted-foreground/50 hover:text-muted-foreground"
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
