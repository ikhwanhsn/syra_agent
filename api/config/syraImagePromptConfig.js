import { SYRA_NARRATIVE_CONTEXT } from "./syraNarrativeConfig.js";

export { SYRA_NARRATIVE_CONTEXT as SYRA_IMAGE_PROMPT_BRAND_CONTEXT };

export const SYRA_IMAGE_PROMPT_MAX_RETRIES = 5;
export const SYRA_IMAGE_PROMPT_EXISTING_SAMPLE = 20;

/** Visual styles matching Syra's X design language (monochrome fintech noir). */
export const SYRA_IMAGE_PROMPT_STYLES = [
  {
    id: "data-chart",
    label: "Data chart",
    angle:
      "Minimalist financial data viz — pitch-black textured background, white lines only. With/without Syra comparison chart, dual Y-axes, clean sans-serif labels, subtle grain. Premium Bloomberg-meets-crypto aesthetic.",
  },
  {
    id: "ai-agent",
    label: "AI agent hero",
    angle:
      "Central humanoid AI robot at laptop with candlestick chart on screen. Glowing white shield logo (S with circuit nodes) on chest and floating above. Monochrome black background, neon-white glow, data streams, floating $ tokens.",
  },
  {
    id: "bull-bear-split",
    label: "Bull / bear split",
    angle:
      "Triptych composition: left bear market despair silhouette + downward chart, center stable Syra AI agent generating value, right bull market victory + upward candlesticks. High-contrast noir, dotted world map backdrop.",
  },
  {
    id: "transformation",
    label: "Before / after portal",
    angle:
      "Split scene: left dark ruined city + crash chart + despair figure; right utopian futuristic city + growth chart + cosmic sky; center glowing arched portal with Syra shield logo. Silhouette figure walking toward light.",
  },
  {
    id: "ecosystem-hub",
    label: "Ecosystem hub",
    angle:
      "Central glowing vault/cylinder hub with Syra shield, vertical light beam, data lines to utility icons (card, cart, house, car, plane). Robot agent at desk, coin stream arc, upward growth arrow. Symmetrical fintech illustration.",
  },
  {
    id: "minimal-poster",
    label: "Minimal poster",
    angle:
      "Bold typographic or symbolic poster — single strong metaphor, lots of negative space, one hero element, shield logo watermark. Same monochrome Syra palette, poster-ready for X.",
  },
];

export const SYRA_IMAGE_VISUAL_THEME = `SYRA VISUAL BRAND (always enforce):
- Color: strict monochrome — deep black background (#000) with bright white (#FFF) foreground only. No color unless user explicitly asks.
- Texture: subtle film grain / matte noise on black areas for premium feel.
- Logo: shield emblem with stylized "S" integrated with dollar sign and circuit-board nodes at line endpoints. Glowing white when featured.
- Mood: minimalist financial tech, cyber-noir, authoritative, hype without clutter.
- Lighting: chiaroscuro — elements glow against darkness; light sources are digital (screens, beams, neon lines).
- Typography in image (if any): clean modern sans-serif, small but legible, white on black.
- Subject matter: AI agents, machine money, x402 micropayments, Solana agent economy, growth vs stagnation narratives, DeFi charts, autonomous treasury.
- Avoid: rainbow gradients, cartoon style, busy backgrounds, stock photo look, generic crypto lambo/moon clichés, text walls, watermarks, "Syra" spelled out large unless user asks.`;

export const SYRA_IMAGE_PROMPT_SYSTEM_RULES = `You are Syra's internal visual prompt engineer for X (Twitter) post graphics.

Your job: take the user's rough image idea and produce:
1) A detailed image-generation prompt (for ChatGPT, DALL·E, Midjourney, etc.)
2) A short X post caption to pair with the image

RULES:
- Keep the user's core concept and narrative intent — do NOT replace their idea with something unrelated.
- Always apply the Syra visual brand theme (monochrome noir fintech).
- Expand vague ideas into concrete visual direction: composition, foreground/background, lighting, camera angle, textures, specific elements, chart types if relevant.
- Image prompt should be 120–350 words, highly specific, copy-paste ready for image AI tools.
- Caption: 1–3 short lines, hype/build-in-public energy, under 280 chars ideal. Can mention $SYRA or syraa.fun naturally if it fits. No price targets or financial advice.
- Output ONLY valid JSON, no markdown fences:
{"imagePrompt":"...","caption":"..."}
- Must differ from forbidden list outputs.`;
