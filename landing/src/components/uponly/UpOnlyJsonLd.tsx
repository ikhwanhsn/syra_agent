const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.syraa.fun/",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Up Only ($UPONLY)",
          "item": "https://www.syraa.fun/uponly",
        },
      ],
    },
    {
      "@type": "Product",
      "name": "Up Only (UPONLY)",
      "description":
        "Syra × RISE: $UPONLY on the RISE launch protocol. Educational page with on-chain details and fee policy.",
      "url": "https://www.syraa.fun/uponly",
      "brand": {
        "@type": "Brand",
        "name": "Syra",
      },
      "category": "https://docs.rise.rich/introduction",
    },
  ],
} as const;

export function UpOnlyJsonLd() {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
    />
  );
}
