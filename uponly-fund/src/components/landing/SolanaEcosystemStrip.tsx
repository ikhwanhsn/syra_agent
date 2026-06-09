import { useReducedMotion } from "framer-motion";
import { UOF_STACK_PARTNERS, getCategoryLabel, type UofStackPartner } from "@/data/partners";
import { cn } from "@/lib/utils";

const PARTNER_LOGOS: Record<string, string> = {
  solana: "/images/partners/solana.png",
  jupiter: "/images/partners/jupiter.png",
  pyth: "/images/partners/pyth.png",
  helius: "/images/partners/helius.png",
  phantom: "/images/partners/phantom.png",
  nansen: "/images/partners/nansen.png",
  raydium: "/images/partners/raydium.png",
};

const DISPLAY_SLUGS = [
  "solana",
  "jupiter",
  "pyth",
  "helius",
  "phantom",
  "nansen",
  "raydium",
] as const;

const MARQUEE_BREAKOUT =
  "-mx-[max(1rem,env(safe-area-inset-left,0px))] min-[400px]:-mx-5 sm:-mx-8 lg:-mx-12 xl:-mx-14" as const;

type SolanaEcosystemStripProps = {
  className?: string;
};

function PartnerMarqueeItem({ partner }: { partner: UofStackPartner }) {
  const logoSrc = PARTNER_LOGOS[partner.slug];

  return (
    <a
      href={partner.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-[4.25rem] w-[10.5rem] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-border/45 bg-card/35 px-4 transition duration-300 hover:border-border/75 hover:bg-card/55 sm:h-[4.5rem] sm:w-[11.5rem]"
      aria-label={`${partner.name} — ${getCategoryLabel(partner.category)}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt=""
          className="h-6 w-auto max-w-[7rem] object-contain opacity-55 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 sm:h-7"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="font-display text-sm font-semibold text-foreground/80">{partner.name}</span>
      )}
      <span className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/80 transition group-hover:text-muted-foreground">
        {getCategoryLabel(partner.category)}
      </span>
    </a>
  );
}

export function SolanaEcosystemStrip({ className }: SolanaEcosystemStripProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const partners = DISPLAY_SLUGS.map(
    (slug) => UOF_STACK_PARTNERS.find((p) => p.slug === slug)!,
  ).filter(Boolean);

  const marqueeItems = reduceMotion ? partners : [...partners, ...partners];

  return (
    <section
      className={cn("scroll-mt-24", className)}
      aria-labelledby="uof-ecosystem-heading"
    >
      <header className="mx-auto max-w-2xl text-center">
        <p className="landing-eyebrow">Ecosystem</p>
        <h2
          id="uof-ecosystem-heading"
          className="landing-section-title mt-4 text-foreground"
        >
          Built on the Solana stack
        </h2>
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Infrastructure, liquidity, data, and wallets we integrate with for onchain conviction allocation.
        </p>
      </header>

      <div
        className={cn(
          "relative mt-10 border-y border-border/40 bg-card/[0.12] sm:mt-12",
          MARQUEE_BREAKOUT,
        )}
      >
        {reduceMotion ? (
          <ul className="flex flex-wrap items-center justify-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6">
            {partners.map((p) => (
              <li key={p.slug}>
                <PartnerMarqueeItem partner={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden py-5 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] sm:py-6">
            <div className="animate-partner-marquee flex min-w-max items-center gap-3 px-3 will-change-transform hover:[animation-play-state:paused] sm:gap-4 sm:px-4">
              {marqueeItems.map((p, i) => (
                <PartnerMarqueeItem key={`${p.slug}-${i}`} partner={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
