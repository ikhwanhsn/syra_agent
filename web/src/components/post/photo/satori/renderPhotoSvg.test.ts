/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { renderPhotoSvg } from "@/components/post/photo/satori/renderPhotoSvg";

type NodeFs = typeof import("node:fs");
type NodePath = typeof import("node:path");

function nodeBuiltin<T>(name: string): T {
  const getter = (process as NodeJS.Process & {
    getBuiltinModule?: (id: string) => T;
  }).getBuiltinModule;
  if (typeof getter === "function") {
    return getter(name);
  }
  // Fallback for older Node — may still work outside polyfill path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(name) as T;
}

const fs = nodeBuiltin<NodeFs>("fs");
const path = nodeBuiltin<NodePath>("path");

const FONT_DIR = path.resolve(process.cwd(), "public/fonts");
const LOGO_PATH = path.resolve(process.cwd(), "public/images/logo.jpg");

function bufferFrom(filePath: string): ArrayBuffer {
  const buf = fs.readFileSync(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
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
      const data = bufferFrom(file);
      return new Response(data, {
        status: 200,
        headers: { "Content-Type": "font/ttf" },
      });
    }

    if (pathname === "/images/logo.jpg") {
      const data = bufferFrom(LOGO_PATH);
      return new Response(data, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    }

    return new Response("not found", { status: 404 });
  }),
);

const sampleCard: PostPhotoCardDef = {
  role: "cover",
  layout: "photo-cover-spotlight",
  shareCopy: "test",
  content: {
    eyebrow: "SHIP LOG",
    badge: "Live now",
    title: "Syra ship",
    subtitle: "Agent-native commerce on Solana.",
    kicker: "Thesis",
    headline: "Build agents that can pay",
    body: "Syra ships x402 rails for agents.",
    quote: "Agents need wallets.",
    highlights: ["Pay", "Verify", "Ship"],
    steps: [
      { step: "01", title: "Discover", description: "Find an API" },
      { step: "02", title: "Pay", description: "Settle in USDC" },
      { step: "03", title: "Call", description: "Get the response" },
    ],
    cards: [
      { title: "Pay", subtitle: "x402" },
      { title: "Verify", subtitle: "Receipts" },
    ],
    stats: [
      { value: "15", label: "Cards" },
      { value: "8", label: "Slides" },
    ],
    narrative: "One deck, fifteen angles.",
    links: [{ label: "Web", value: "syraa.fun" }],
    items: ["Discover", "Pay", "Verify"],
    compareLeft: { title: "Before", body: "Manual keys" },
    compareRight: { title: "Now", body: "Agent payments" },
    terminalLines: ["> syra pay", "ok"],
    partnerName: "",
    partnerLogo: "",
    partnerLogoSolidBg: false,
  },
};

const roles = [
  "cover",
  "thesis",
  "quote",
  "flow",
  "timeline",
  "pillars",
  "checklist",
  "metrics",
  "featured",
  "comparison",
  "launch",
  "deepDive",
  "split",
  "terminal",
  "cta",
] as const;

describe("renderPhotoSvg", () => {
  it("renders all 15 role templates to SVG", async () => {
    for (const role of roles) {
      try {
        const svg = await renderPhotoSvg({ ...sampleCard, role });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg).toContain('width="1200"');
        expect(svg).toContain('height="675"');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`[role=${role}] ${message}`);
      }
    }
  }, 60_000);
});
