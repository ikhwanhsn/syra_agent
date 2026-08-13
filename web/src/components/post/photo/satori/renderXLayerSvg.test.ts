/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { XLAYER_CARDS } from "@/content/announce/xlayerCards";
import { renderXLayerSvg } from "@/components/post/photo/satori/renderXLayerSvg";
import { PHOTO_PIXEL_RATIO } from "@/components/post/photo/satori/tokens";

type NodeFs = typeof import("node:fs");
type NodePath = typeof import("node:path");

function nodeBuiltin<T>(name: string): T {
  const getter = (process as NodeJS.Process & {
    getBuiltinModule?: (id: string) => T;
  }).getBuiltinModule;
  if (typeof getter === "function") {
    return getter(name);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(name) as T;
}

const fs = nodeBuiltin<NodeFs>("fs");
const path = nodeBuiltin<NodePath>("path");

const FONT_DIR = path.resolve(process.cwd(), "public/fonts");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const OUT_DIR = path.resolve(process.cwd(), "public/images/threads");
const WASM_PATH = path.resolve(
  process.cwd(),
  "node_modules/@resvg/resvg-wasm/index_bg.wasm",
);

function bufferFrom(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function mimeFromPath(p: string): string {
  const lower = p.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ttf")) return "font/ttf";
  return "image/jpeg";
}

vi.stubGlobal(
  "fetch",
  vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pathname = url.startsWith("http")
      ? new URL(url).pathname
      : url.startsWith("/")
        ? url
        : `/${url}`;

    if (pathname.startsWith("/fonts/")) {
      const file = path.resolve(FONT_DIR, pathname.replace("/fonts/", ""));
      return new Response(bufferFrom(file), {
        status: 200,
        headers: { "Content-Type": "font/ttf" },
      });
    }

    if (pathname.startsWith("/images/")) {
      const file = path.resolve(PUBLIC_DIR, pathname.replace(/^\//, ""));
      if (!fs.existsSync(file)) {
        return new Response("not found", { status: 404 });
      }
      return new Response(bufferFrom(file), {
        status: 200,
        headers: { "Content-Type": mimeFromPath(file) },
      });
    }

    return new Response("not found", { status: 404 });
  }),
);

describe("X-Layer announce cards", () => {
  it("renders all archetypes to SVG and writes PNGs", async () => {
    await initWasm(fs.readFileSync(WASM_PATH));
    fs.mkdirSync(OUT_DIR, { recursive: true });

    for (const card of XLAYER_CARDS) {
      const svg = await renderXLayerSvg(card);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain('width="1080"');
      expect(svg).toContain('height="1080"');

      const resvg = new Resvg(svg, {
        fitTo: { mode: "zoom", value: PHOTO_PIXEL_RATIO },
      });
      const rendered = resvg.render();
      const png = rendered.asPng();
      rendered.free();
      const outPath = path.resolve(OUT_DIR, `${card.slug}.png`);
      fs.writeFileSync(outPath, png);
      expect(png.byteLength).toBeGreaterThan(10_000);
    }
  }, 180_000);
});
