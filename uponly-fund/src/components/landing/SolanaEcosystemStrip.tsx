import { UOF_STACK_PARTNERS } from "@/data/partners";
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

type SolanaEcosystemStripProps = {
  className?: string;
};

export function SolanaEcosystemStrip({ className }: SolanaEcosystemStripProps) {
  const partners = DISPLAY_SLUGS.map(
    (slug) => UOF_STACK_PARTNERS.find((p) => p.slug === slug)!,
  ).filter(Boolean);

  return (
    <section
      className={cn("scroll-mt-24", className)}
      aria-labelledby="uof-ecosystem-heading"
    >
      <p
        id="uof-ecosystem-heading"
        className="text-center text-[0.65rem] font-bold uppercase tracking-[0.32em] text-muted-foreground"
      >
        Built on the Solana stack
      </p>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 px-2 sm:gap-x-16">
        {partners.map((p) => (
          <li key={p.slug}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-uof/40 rounded-lg px-2 py-1"
            >
              <img
                src={PARTNER_LOGOS[p.slug]}
                alt={p.name}
                className="h-7 w-auto max-w-[8rem] object-contain opacity-50 grayscale transition duration-300 group-hover:opacity-95 group-hover:grayscale-0 sm:h-8"
                loading="lazy"
                decoding="async"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
