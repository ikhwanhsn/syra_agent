type FontWeight = 400 | 500 | 600 | 700;

interface FontSpec {
  name: string;
  weight: FontWeight;
  path: string;
}

export interface PhotoFont {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight;
  style: "normal";
}

const FONT_SPECS: readonly FontSpec[] = [
  { name: "Space Grotesk", weight: 500, path: "/fonts/SpaceGrotesk-Medium.ttf" },
  { name: "Space Grotesk", weight: 700, path: "/fonts/SpaceGrotesk-Bold.ttf" },
  { name: "Inter", weight: 400, path: "/fonts/Inter-Regular.ttf" },
  { name: "Inter", weight: 600, path: "/fonts/Inter-SemiBold.ttf" },
  { name: "JetBrains Mono", weight: 400, path: "/fonts/JetBrainsMono-Regular.ttf" },
  { name: "JetBrains Mono", weight: 600, path: "/fonts/JetBrainsMono-SemiBold.ttf" },
] as const;

let fontsPromise: Promise<PhotoFont[]> | null = null;

async function loadFontBuffer(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`[post/photo/satori] Failed to load font ${path}: ${res.status}`);
  }
  return res.arrayBuffer();
}

/** Lazy-load + cache all photo fonts as ArrayBuffers for Satori. */
export async function loadPhotoFonts(): Promise<PhotoFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_SPECS.map(async (spec) => {
        const data = await loadFontBuffer(spec.path);
        return {
          name: spec.name,
          data,
          weight: spec.weight,
          style: "normal" as const,
        };
      }),
    ).catch((err: unknown) => {
      fontsPromise = null;
      throw err;
    });
  }
  return fontsPromise;
}
