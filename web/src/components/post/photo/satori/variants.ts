/** Layout variant index — 3 structurally different compositions per card role. */
export type PhotoLayoutVariant = 0 | 1 | 2;

export const PHOTO_LAYOUT_VARIANT_COUNT = 3;

export const PHOTO_LAYOUT_VARIANT_LABELS = [
  "Layout A",
  "Layout B",
  "Layout C",
] as const;

/** Short labels for segmented controls. */
export const PHOTO_LAYOUT_VARIANT_SHORT = ["A", "B", "C"] as const;

export const PHOTO_LAYOUT_VARIANT_SUFFIX = ["a", "b", "c"] as const;

export function isPhotoLayoutVariant(value: number): value is PhotoLayoutVariant {
  return value === 0 || value === 1 || value === 2;
}
