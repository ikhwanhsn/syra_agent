import { motion, useInView } from "framer-motion";
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
  { name: "Messari", slug: "messari", href: "https://messari.io" },
  { name: "Pump", slug: "pump", href: "https://pump.fun" },
] as const;

const LOGO_PLACEHOLDER = "/images/partners/placeholder.svg";

type Partner = (typeof PARTNERS)[number];

function PartnerLink({
  partner,
  tabFocusable = true,
}: {
  partner: Partner;
  tabFocusable?: boolean;
}) {
  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabFocusable ? undefined : -1}
      className="inline-flex w-[11rem] shrink-0 items-center justify-start gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-accent/50 hover:bg-accent/[0.04] hover:shadow-[0_0_24px_-8px_hsl(var(--accent)/0.2)] sm:w-[12rem] sm:gap-3 sm:rounded-xl sm:px-4 sm:py-2.5 md:w-[13rem] md:gap-4 md:px-5 md:py-3 lg:w-[15rem] lg:px-6 lg:py-4"
    >
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-background/60 sm:h-10 sm:w-10 sm:rounded-lg md:h-11 md:w-11 lg:h-14 lg:w-14 lg:rounded-xl">
        <img
          src={`/images/partners/${partner.slug}.png`}
          alt=""
          className="h-6 w-6 object-contain sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-11 lg:w-11"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== LOGO_PLACEHOLDER) {
              target.src = LOGO_PLACEHOLDER;
            }
          }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap sm:text-sm md:text-base lg:text-lg">
        {partner.name}
      </span>
    </a>
  );
}

function MarqueeTrack({ labelledBy }: { labelledBy: string }) {
  return (
    <div
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      role="region"
      aria-labelledby={labelledBy}
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <div className="flex shrink-0 items-center gap-3 pr-3 sm:gap-5 sm:pr-5 md:gap-6 md:pr-6 lg:gap-8 lg:pr-8">
          {PARTNERS.map((partner) => (
            <PartnerLink key={partner.slug} partner={partner} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 pr-3 sm:gap-5 sm:pr-5 md:gap-6 md:pr-6 lg:gap-8 lg:pr-8" aria-hidden>
          {PARTNERS.map((partner) => (
            <PartnerLink
              key={`${partner.slug}-dup`}
              partner={partner}
              tabFocusable={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const PartnersAndIntegrations = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const headingId = "partners-heading";

  return (
    <section
      id="partners"
      className="relative border-b border-accent/10 bg-muted/5 py-12 sm:py-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/[0.07] via-neon-gold/[0.04] to-transparent" />
      <div className="relative mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={ref} className="mb-8 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="section-eyebrow-gradient mb-2 inline-block text-xs font-medium uppercase tracking-wider sm:text-sm"
          >
            Ecosystem
          </motion.span>
          <motion.h2
            id={headingId}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl"
          >
            Partners & <span className="neon-text">Integrations</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base"
          >
            Syra integrates with leading protocols and data providers to deliver
            institutional-grade intelligence and execution.
          </motion.p>
        </div>

        <div className="hidden min-w-0 flex-wrap items-center justify-center gap-2 motion-reduce:flex sm:gap-4 md:gap-6">
          {PARTNERS.map((partner) => (
            <PartnerLink key={partner.slug} partner={partner} />
          ))}
        </div>
        <div className="min-w-0 motion-reduce:hidden">
          <MarqueeTrack labelledBy={headingId} />
        </div>
      </div>
    </section>
  );
}
