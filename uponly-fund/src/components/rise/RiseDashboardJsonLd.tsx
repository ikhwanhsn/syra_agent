/**
 * schema.org markup for the /uponly/rise dashboard. Uses WebApplication +
 * Dataset + BreadcrumbList so search engines and AI agents can understand
 * the page is a live financial screener for the RISE ecosystem.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.syraa.fun/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Rise Ecosystem Dashboard",
          item: "https://www.syraa.fun/uponly/rise",
        },
      ],
    },
    {
      "@type": "WebApplication",
      name: "Rise Ecosystem Dashboard",
      url: "https://www.syraa.fun/uponly/rise",
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
        name: "Syra",
        url: "https://www.syraa.fun/",
      },
    },
    {
      "@type": "Dataset",
      name: "RISE markets dataset",
      description:
        "Aggregated market data for tokens launched on the RISE protocol — price, market cap, floor, holders, level, 24h volume.",
      url: "https://www.syraa.fun/uponly/rise",
      keywords: ["RISE", "Solana", "DeFi", "bonding curve", "screener"],
      isAccessibleForFree: true,
      creator: {
        "@type": "Organization",
        name: "Syra",
        url: "https://www.syraa.fun/",
      },
    },
  ],
} as const;

export function RiseDashboardJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
    />
  );
}
