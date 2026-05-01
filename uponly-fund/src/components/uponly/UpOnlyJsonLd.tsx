import { SITE_ORIGIN } from "@/config/site";

export function UpOnlyJsonLd() {
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
            name: "Up Only ($UPONLY)",
            item: `${SITE_ORIGIN}/landing#landing-token`,
          },
        ],
      },
      {
        "@type": "Product",
        name: "Up Only (UPONLY)",
        description:
          "Up Only: $UPONLY on the RISE launch protocol. Educational page with on-chain details and fee policy.",
        url: `${SITE_ORIGIN}/landing#on-chain-details`,
        brand: {
          "@type": "Brand",
          name: "Up Only Fund",
        },
        category: "https://docs.rise.rich/introduction",
      },
    ],
  } as const;

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
