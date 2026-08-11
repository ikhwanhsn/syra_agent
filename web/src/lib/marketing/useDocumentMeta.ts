import { useEffect } from "react";

const SITE_ORIGIN = "https://www.syraa.fun" as const;
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/og-banner.png?v=5`;
const DEFAULT_OG_ALT = "Syra. Machine money for agents. x402 pay-per-call APIs, MCP, and typed SDK.";

export type DocumentMeta = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  ogType?: string;
};

function setOrUpdateMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOrUpdateMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Sets document title, description, canonical, and Open Graph tags for SPA route changes.
 */
export function useDocumentMeta({
  title,
  description,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
}: DocumentMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    setOrUpdateMetaName("description", description);
    const canonical = `${SITE_ORIGIN}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const isDefaultOg = ogImage.includes("/images/og-banner.");
    setOrUpdateMetaProperty("og:title", title);
    setOrUpdateMetaProperty("og:description", description);
    setOrUpdateMetaProperty("og:url", canonical);
    setOrUpdateMetaProperty("og:type", ogType);
    setOrUpdateMetaProperty("og:image", ogImage);
    setOrUpdateMetaProperty("og:image:secure_url", ogImage);
    setOrUpdateMetaProperty("og:image:alt", isDefaultOg ? DEFAULT_OG_ALT : title);
    if (isDefaultOg) {
      setOrUpdateMetaProperty("og:image:type", "image/png");
      setOrUpdateMetaProperty("og:image:width", "1200");
      setOrUpdateMetaProperty("og:image:height", "630");
    }
    setOrUpdateMetaName("twitter:card", "summary_large_image");
    setOrUpdateMetaName("twitter:title", title);
    setOrUpdateMetaName("twitter:description", description);
    setOrUpdateMetaName("twitter:image", ogImage);
    setOrUpdateMetaName("twitter:image:alt", isDefaultOg ? DEFAULT_OG_ALT : title);
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, ogImage, ogType]);
}
