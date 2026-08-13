/**
 * Photo Satori embeds Space Grotesk / Inter / JetBrains Mono only.
 * Several common copy glyphs are missing from those TTFs and render as tofu.
 * Normalize them to ASCII before satori so headlines stay readable.
 */
const PHOTO_GLYPH_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["→", "->"],
  ["←", "<-"],
  ["↔", "<->"],
  ["≥", ">="],
  ["≤", "<="],
  ["≠", "!="],
  ["✓", "OK"],
  ["∞", "inf"],
  ["⚡", "*"],
  ["💰", "$"],
];

/** Replace glyphs that our embedded photo fonts cannot draw. */
export function sanitizePhotoText(value: string): string {
  let next = value;
  for (const [from, to] of PHOTO_GLYPH_REPLACEMENTS) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  return next;
}

/** Deep-map string fields on photo content / nested objects for Satori. */
export function sanitizePhotoValue<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizePhotoText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePhotoValue(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizePhotoValue(child);
    }
    return out as T;
  }
  return value;
}
