import { UP_ONLY_FUND } from "@/data/upOnlyFund";
import { SITE_ORIGIN } from "@/config/site";

export function UpOnlyFundJsonLd() {
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
            item: `${SITE_ORIGIN}/landing`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Up Only",
            item: `${SITE_ORIGIN}/landing#landing-token`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Up Only Fund",
            item: `${SITE_ORIGIN}/landing#mandate`,
          },
        ],
      },
      {
        "@type": "WebPage",
        name: `${UP_ONLY_FUND.name} — RISE ecosystem treasury`,
        description: UP_ONLY_FUND.mandate,
        url: `${SITE_ORIGIN}/landing`,
      },
      {
        "@type": "Organization",
        name: "Up Only Fund",
        url: `${SITE_ORIGIN}/landing`,
      },
    ],
  } as const;

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
