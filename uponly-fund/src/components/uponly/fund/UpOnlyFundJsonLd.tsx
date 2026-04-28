import { UP_ONLY_FUND } from "@/data/upOnlyFund";

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
          name: "Up Only",
          item: "https://www.syraa.fun/uponly/overview",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Up Only Fund",
          item: "https://www.syraa.fun/uponly/fund",
        },
      ],
    },
    {
      "@type": "WebPage",
      name: `${UP_ONLY_FUND.name} - Syra-backed RISE ecosystem treasury`,
      description: UP_ONLY_FUND.mandate,
      url: "https://www.syraa.fun/uponly/fund",
    },
    {
      "@type": "Organization",
      name: "Syra",
      url: "https://www.syraa.fun/",
    },
  ],
} as const;

export function UpOnlyFundJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
    />
  );
}
