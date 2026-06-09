import { LATEST_POST_UPDATE_NUMBER } from "@/content/posts";
import type { PostPhotoLayoutTemplate } from "@/content/posts/photo/layouts";
import { getPostPhotoShareCopy } from "@/content/posts/photo/getPostPhotoShareCopy";
import type { PostPhotoUpdate } from "@/content/posts/photo/types";
import type { PostUpdateMeta } from "@/content/posts/types";
import { getPostRoutePath, type PostRouteFormat } from "@/lib/postRoutes";

export type PostShareFormat = "video" | "photo";

export type PostFormat = "hub" | PostShareFormat;

export function getPostPageUrl(
  format: PostFormat = "hub",
  updateNumber: number = LATEST_POST_UPDATE_NUMBER,
): string {
  const path = getPostRoutePath(format as PostRouteFormat, updateNumber);
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `https://www.syraa.fun${path}`;
}

export interface PostShareCopyOptions {
  photoPost?: PostPhotoUpdate;
  photoLayout?: PostPhotoLayoutTemplate;
}

export function getPostShareCopy(
  meta: PostUpdateMeta,
  format: PostShareFormat,
  options?: PostShareCopyOptions,
): string {
  if (format === "video") return meta.shareCopyVideo;
  if (options?.photoPost && options.photoLayout) {
    return getPostPhotoShareCopy(options.photoPost, options.photoLayout);
  }
  return meta.shareCopyPhoto;
}

/** Full paste-ready post: copy body + page URL. */
export function getPostShareCopyWithUrl(
  meta: PostUpdateMeta,
  format: PostShareFormat,
  options?: PostShareCopyOptions,
): string {
  return `${getPostShareCopy(meta, format, options).trim()}\n\n${getPostPageUrl(format, meta.updateNumber)}`;
}

export function buildPostOnXUrl(
  meta: PostUpdateMeta,
  format: PostShareFormat = "video",
  options?: PostShareCopyOptions,
): string {
  const text = getPostShareCopyWithUrl(meta, format, options);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export async function copyPostShareText(
  meta: PostUpdateMeta,
  format: PostShareFormat,
  options?: PostShareCopyOptions,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getPostShareCopyWithUrl(meta, format, options));
    return true;
  } catch {
    return false;
  }
}

export async function copyPostLink(
  format: PostFormat = "hub",
  updateNumber: number = LATEST_POST_UPDATE_NUMBER,
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getPostPageUrl(format, updateNumber));
    return true;
  } catch {
    return false;
  }
}
