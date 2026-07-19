const imageCache = new Map<string, Promise<string>>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function mimeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

/** Fetch an image and return a data URI (Satori needs embedded images). */
export async function loadImageDataUri(path: string): Promise<string> {
  const cached = imageCache.get(path);
  if (cached) return cached;

  const promise = (async () => {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`[post/photo/satori] Failed to load image ${path}: ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    const mime = mimeFromPath(path);
    return `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
  })().catch((err: unknown) => {
    imageCache.delete(path);
    throw err;
  });

  imageCache.set(path, promise);
  return promise;
}

const LOGO_PATH = "/images/logo.jpg";

export async function loadSyraLogoDataUri(): Promise<string> {
  return loadImageDataUri(LOGO_PATH);
}

export async function preloadPhotoAssets(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set([LOGO_PATH, ...paths.filter(Boolean)]));
  const entries = await Promise.all(
    unique.map(async (path) => [path, await loadImageDataUri(path)] as const),
  );
  return Object.fromEntries(entries);
}
