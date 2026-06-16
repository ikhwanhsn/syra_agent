import type { PostPhotoUpdate } from "./types";

const SHARE_COPY_URL_PATTERN = /(?:https?:\/\/|(?:^|\s))(?:www\.)?uponlyfund\.com[^\s)]+/i;

/** True when the copy already includes a paste-ready Up Only Fund link. */
export function shareCopyHasLink(text: string): boolean {
  return SHARE_COPY_URL_PATTERN.test(text.trim());
}

/** Ready-to-post X copy for a specific photo card in an update. */
export function getPostPhotoShareCopy(post: PostPhotoUpdate, cardIndex: number): string {
  const card = post.cards[cardIndex];
  if (!card) return post.meta.shareCopyPhoto.trim();
  return card.shareCopy.trim();
}

function getPhotoShareCopyFooter(post: PostPhotoUpdate, cardIndex: number): string | null {
  const card = post.cards[cardIndex];
  if (!card) return null;

  if (card.shareCopyFooter?.trim()) {
    return card.shareCopyFooter.trim();
  }

  const linkFromContent = card.content.links.find((link) => link.href || link.value)?.href
    ?? card.content.links.find((link) => link.value)?.value;

  if (linkFromContent) {
    const href = linkFromContent.startsWith("http") ? linkFromContent : `https://www.${linkFromContent}`;
    return href;
  }

  return null;
}

/** Full paste-ready photo post — body plus optional unique footer link. */
export function getPostPhotoShareCopyWithUrl(post: PostPhotoUpdate, cardIndex: number): string {
  const body = getPostPhotoShareCopy(post, cardIndex).trim();
  if (!body) return body;
  if (shareCopyHasLink(body)) return body;

  const footer = getPhotoShareCopyFooter(post, cardIndex);
  if (footer) return `${body}\n\n${footer}`;

  return body;
}
