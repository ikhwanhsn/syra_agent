/** Photo template batch 4 — partnership & integration lockups */
export const POST_PHOTO_LAYOUTS_BATCH4 = [
  "photo-partnership-union",
  "photo-partnership-beacon",
] as const;

export type PostPhotoLayoutTemplateBatch4 = (typeof POST_PHOTO_LAYOUTS_BATCH4)[number];

export const POST_PHOTO_LAYOUT_LABELS_BATCH4: Record<PostPhotoLayoutTemplateBatch4, string> = {
  "photo-partnership-union": "Partnership union lockup",
  "photo-partnership-beacon": "Partnership beacon split",
};
