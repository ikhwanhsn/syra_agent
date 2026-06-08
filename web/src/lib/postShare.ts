import type { PostUpdateMeta } from "@/content/posts/types";

export type PostShareFormat = "video" | "photo";

export type PostFormat = "hub" | PostShareFormat;

export function getPostPageUrl(format: PostFormat = "hub"): string {
  const path = format === "hub" ? "/post" : `/post/${format}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `https://www.syraa.fun${path}`;
}

export function getPostShareCopy(meta: PostUpdateMeta, format: PostShareFormat): string {
  return format === "video" ? meta.shareCopyVideo : meta.shareCopyPhoto;
}

/** Full paste-ready post: copy body + page URL. */
export function getPostShareCopyWithUrl(meta: PostUpdateMeta, format: PostShareFormat): string {
  return `${getPostShareCopy(meta, format).trim()}\n\n${getPostPageUrl(format)}`;
}

export function buildPostOnXUrl(meta: PostUpdateMeta, format: PostShareFormat = "video"): string {
  const text = getPostShareCopyWithUrl(meta, format);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function copyPostShareText(meta: PostUpdateMeta, format: PostShareFormat): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getPostShareCopyWithUrl(meta, format));
    return true;
  } catch {
    return false;
  }
}

export async function copyPostLink(format: PostFormat = "hub"): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getPostPageUrl(format));
    return true;
  } catch {
    return false;
  }
}
