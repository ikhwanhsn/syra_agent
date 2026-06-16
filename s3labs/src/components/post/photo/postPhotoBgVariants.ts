import type { PostPhotoCardRole } from "@/content/posts/photo/photoCardSlots";

/** S3 ribbon-flow backgrounds — not UOF vault brackets / Syra gold ship-log. */
export type PostPhotoBgVariant =
  | "ribbon"
  | "pulse"
  | "bloom"
  | "stream"
  | "orbit"
  | "stack"
  | "weave"
  | "ring"
  | "beacon"
  | "prism"
  | "surge"
  | "depth"
  | "slash"
  | "console"
  | "dock";

export const POST_PHOTO_BG_BY_ROLE: Record<PostPhotoCardRole, PostPhotoBgVariant> = {
  cover: "ribbon",
  thesis: "pulse",
  quote: "bloom",
  flow: "stream",
  timeline: "orbit",
  pillars: "stack",
  checklist: "weave",
  metrics: "ring",
  featured: "beacon",
  comparison: "prism",
  launch: "surge",
  deepDive: "depth",
  split: "slash",
  terminal: "console",
  cta: "dock",
};

export function getPostPhotoBgVariant(role: PostPhotoCardRole): PostPhotoBgVariant {
  return POST_PHOTO_BG_BY_ROLE[role];
}
