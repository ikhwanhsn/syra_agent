/**
 * schema.org markup for the /terminal page. Uses WebApplication +
 * Dataset + BreadcrumbList so search engines and AI agents can understand
 * the page is a live financial screener for the RISE ecosystem.
 */
import { SITE_ORIGIN } from "@/config/site";

export function RiseDashboardJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_ORIGIN,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Rise Ecosystem Terminal",
            item: `${SITE_ORIGIN}/terminal`,
          },
        ],
      },
      {
        "@type": "WebApplication",
        name: "Rise Ecosystem Terminal",
        url: `${SITE_ORIGIN}/terminal`,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        description:
          "Live screener and analytics for the RISE protocol — token markets, top movers, OHLC, on-chain transactions, wallet portfolio lookups, and read-only quote / borrow simulators.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        isPartOf: {
          "@type": "WebSite",
          name: "Up Only Fund",
          url: SITE_ORIGIN,
        },
      },
      {
        "@type": "Dataset",
        name: "RISE markets dataset",
        description:
          "Aggregated market data for tokens launched on the RISE protocol — price, market cap, floor, holders, level, 24h volume.",
        url: `${SITE_ORIGIN}/terminal`,
        keywords: ["RISE", "Solana", "DeFi", "bonding curve", "screener"],
        isAccessibleForFree: true,
        creator: {
          "@type": "Organization",
          name: "Up Only Fund",
          url: `${SITE_ORIGIN}/landing`,
        },
      },
    ],
  } as const;

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
