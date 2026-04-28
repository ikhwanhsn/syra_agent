import { useEffect } from "react";

const SITE_ORIGIN = "https://www.syraa.fun" as const;

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
  ogImage = `${SITE_ORIGIN}/images/og-banner.png`,
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

    setOrUpdateMetaProperty("og:title", title);
    setOrUpdateMetaProperty("og:description", description);
    setOrUpdateMetaProperty("og:url", canonical);
    setOrUpdateMetaProperty("og:type", ogType);
    setOrUpdateMetaProperty("og:image", ogImage);
    setOrUpdateMetaName("twitter:title", title);
    setOrUpdateMetaName("twitter:description", description);
    setOrUpdateMetaName("twitter:image", ogImage);
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, ogImage, ogType]);
}
