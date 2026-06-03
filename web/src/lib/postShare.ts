import type { PostUpdateMeta } from "@/content/posts/types";

export function getPostPageUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/post`;
  }
  return "https://www.syraa.fun/post";
}

export function buildPostOnXUrl(meta: PostUpdateMeta): string {
  const url = getPostPageUrl();
  const text = `${meta.shareTweet.trim()}\n\n${url}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function copyPostLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getPostPageUrl());
    return true;
  } catch {
    return false;
  }
}
