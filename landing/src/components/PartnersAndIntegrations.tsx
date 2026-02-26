import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const PARTNERS = [
  { name: "Solana", slug: "solana", href: "https://solana.com" },
  { name: "Jupiter", slug: "jupiter", href: "https://jup.ag" },
  { name: "Raydium", slug: "raydium", href: "https://raydium.io" },
  { name: "Pyth", slug: "pyth", href: "https://pyth.network" },
  { name: "Helius", slug: "helius", href: "https://helius.dev" },
  { name: "Phantom", slug: "phantom", href: "https://phantom.app" },
  { name: "Nansen", slug: "nansen", href: "https://nansen.ai" },
  { name: "DexScreener", slug: "dexscreener", href: "https://dexscreener.com" },
  { name: "Rugcheck", slug: "rugcheck", href: "https://rugcheck.xyz" },
  { name: "Bubblemaps", slug: "bubblemaps", href: "https://bubblemaps.io" },
  { name: "Binance", slug: "binance", href: "https://binance.com" },
  { name: "Pump", slug: "pump", href: "https://pump.fun" },
];

const LOGO_PLACEHOLDER = "/images/partners/placeholder.svg";

export const PartnersAndIntegrations = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="partners"
      className="relative py-24 overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-accent/6 rounded-full blur-[80px] pointer-events-none" />
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 relative">
        <div ref={ref} className="mb-16 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 text-sm font-medium tracking-wider uppercase text-primary"
          >
            Ecosystem
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Partners & <span className="neon-text">Integrations</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto text-muted-foreground"
          >
            Syra integrates with leading protocols and data providers to deliver
            institutional-grade intelligence and execution.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6"
        >
          {PARTNERS.map((partner, index) => (
            <motion.a
              key={partner.slug}
              href={partner.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.03 }}
              className="flex flex-col items-center justify-center p-6 rounded-2xl glass-card hover:border-accent/30 transition-all duration-300 group"
            >
              <div className="relative flex items-center justify-center w-16 h-16 mb-3 overflow-hidden rounded-xl bg-background/50">
                <img
                  src={`/images/partners/${partner.slug}.png`}
                  alt={`${partner.name} logo`}
                  className="object-contain w-10 h-10 transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== LOGO_PLACEHOLDER) {
                      target.src = LOGO_PLACEHOLDER;
                    }
                  }}
                />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {partner.name}
              </span>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
