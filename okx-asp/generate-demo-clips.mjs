#!/usr/bin/env node
/**
 * Generate OKX Genesis demo clips via OpenRouter (same path as Labs /llm Video).
 * Veo models only allow 4/6/8s — we use 8s beats and stitch to ≤90s.
 *
 *   node okx-asp/generate-demo-clips.mjs
 *   node okx-asp/generate-demo-clips.mjs --skip-existing
 *   node okx-asp/generate-demo-clips.mjs --only 02-problem
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "okx-asp", "video-clips");
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

function loadEnv() {
  const envPath = join(root, "api", ".env");
  if (!existsSync(envPath)) throw new Error(`Missing ${envPath}`);
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let val = m[2] ?? "";
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

/** All clips: google/veo-3.1* only supports 4, 6, 8s. */
const CLIPS = [
  {
    id: "01-hook",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 product intro for Syra Finance Copilot. Dark charcoal background with subtle gold light. Large clean typography: "Syra" as hero brand, then "Finance Copilot for Agents", badge row "x402 · OKX.AI · #OKXAI". Soft camera push-in. Professional fintech motion graphics, high contrast readable text. Implied VO: "Syra is a Finance Copilot for agents on OKX.AI." No people. Avoid blurry text, purple neon, anime, emoji, watermark.`,
  },
  {
    id: "02-problem",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 split-screen. Left "Raw data": cluttered gray charts and tickers. Right "Syra Finance Copilot": clean gold cards labeled Signal, Risk, Brain on dark charcoal. Wipe left to right. Subtitle: "Agents need decisions — not another price feed." Implied VO about decisions over raw feeds. Avoid purple neon, emoji, blurry text.`,
  },
  {
    id: "03a-ask",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 dark desktop UI mock. Header "Syra Brain". Chat bubble types the question: "Give me a quick BTC market brief: signal, sentiment, and key risks in the last 24h." Cursor typing animation, readable text, gold accents. Product demo style. Avoid purple, emoji, unreadable text.`,
  },
  {
    id: "03b-pay",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 dark UI. Large red badge "HTTP 402 Payment Required" then transitions to green "Paid · x402 · X Layer USDC" confirmation. Syra header. Clean fintech motion. Implied VO: "Pay per call with x402." Avoid purple neon, emoji, blurry text.`,
  },
  {
    id: "03c-report",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 dark UI showing a markdown BTC finance brief with sections Signal, Sentiment, Risks, and a toolUsages list: news, signal, sentiment. Syra Brain header. Scroll subtly. Implied VO: "Brain picks the tools. Grounded finance brief — not vibes." Readable text, gold accents. Avoid purple, emoji, watermark.`,
  },
  {
    id: "04a-catalog",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 dark background. Elegant flash of API route chips: /signal /indicator /sentiment /arbitrage /bitcoin /brain. Caption "48+ live finance APIs + Syra Brain A2A". Gold on charcoal motion graphics. Avoid purple, emoji, blurry text.`,
  },
  {
    id: "04b-close",
    duration: 8,
    model: "google/veo-3.1-lite",
    prompt: `Cinematic 16:9 end card. Large text "Syra · Finance Copilot for Agents". Then burn in "#OKXAI" clearly and hold. Small URLs: syraa.fun · api.syraa.fun · docs.syraa.fun. Dark charcoal, gold accents. Implied VO: "Syra. Finance Copilot for agents. #OKXAI." Avoid purple, emoji, blurry text.`,
  },
];

function headers() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://syraa.fun",
    "X-Title": "Syra OKX Genesis Demo",
  };
}

async function submitClip(clip) {
  const res = await fetch(`${OPENROUTER_BASE}/videos`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: clip.model,
      prompt: clip.prompt,
      duration: clip.duration,
      aspect_ratio: "16:9",
      generate_audio: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 202) {
    throw new Error(
      `submit ${clip.id} failed (${res.status}): ${data?.error?.message || JSON.stringify(data).slice(0, 400)}`,
    );
  }
  const id = data.id || data.generation_id || data.data?.id;
  if (!id) throw new Error(`No generation id for ${clip.id}: ${JSON.stringify(data).slice(0, 400)}`);
  return String(id);
}

async function pollStatus(id) {
  const res = await fetch(`${OPENROUTER_BASE}/videos/${encodeURIComponent(id)}`, {
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`status ${id} failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

function extractUrl(data) {
  if (!data || typeof data !== "object") return null;
  if (typeof data.url === "string" && data.url.trim()) return data.url;
  if (typeof data.video_url === "string" && data.video_url.trim()) return data.video_url;
  if (Array.isArray(data.unsigned_urls) && typeof data.unsigned_urls[0] === "string") {
    return data.unsigned_urls[0];
  }
  return null;
}

async function downloadContent(id, destPath) {
  const res = await fetch(
    `${OPENROUTER_BASE}/videos/${encodeURIComponent(id)}/content?index=0`,
    { headers: headers() },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`content ${id} failed (${res.status}): ${t.slice(0, 300)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`content ${id} too small (${buf.length} bytes)`);
  writeFileSync(destPath, buf);
  return buf.length;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(clip) {
  const dest = join(outDir, `${clip.id}.mp4`);
  if (existsSync(dest) && process.argv.includes("--skip-existing")) {
    console.log(`skip existing ${clip.id}`);
    return dest;
  }
  console.log(`\n=== ${clip.id} (${clip.duration}s · ${clip.model}) ===`);
  const id = await submitClip(clip);
  console.log(`submitted: ${id}`);
  writeFileSync(join(outDir, `${clip.id}.job.json`), JSON.stringify({ id, clip: clip.id }, null, 2));

  const deadline = Date.now() + 25 * 60 * 1000;
  while (Date.now() < deadline) {
    const data = await pollStatus(id);
    const status = String(data.status ?? "").toLowerCase();
    const url = extractUrl(data);
    console.log(`  status=${status || "?"} url=${url ? "yes" : "no"}`);
    if (status === "failed" || status === "error") {
      throw new Error(`${clip.id} failed: ${JSON.stringify(data).slice(0, 500)}`);
    }
    if (status === "completed" || status === "complete" || url) {
      try {
        const bytes = await downloadContent(id, dest);
        console.log(`saved ${dest} (${bytes} bytes)`);
        return dest;
      } catch (e) {
        if (url) {
          const r = await fetch(url, { headers: headers() });
          if (r.ok) {
            const buf = Buffer.from(await r.arrayBuffer());
            writeFileSync(dest, buf);
            console.log(`saved via url ${dest} (${buf.length} bytes)`);
            return dest;
          }
        }
        console.log(`  content not ready: ${e.message}`);
      }
    }
    await sleep(8000);
  }
  throw new Error(`timeout waiting for ${clip.id}`);
}

async function main() {
  loadEnv();
  mkdirSync(outDir, { recursive: true });
  const only = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]
    : null;
  const clips = only ? CLIPS.filter((c) => c.id === only) : CLIPS;
  if (!clips.length) throw new Error(`No clips matched --only ${only}`);
  for (const clip of clips) await generateOne(clip);
  console.log("\nAll clips ready in okx-asp/video-clips/");
}

main().catch((e) => {
  console.error("\nFATAL:", e.message || e);
  process.exit(1);
});
