import type { Action, ActionResult, HandlerCallback } from '../node_modules/@elizaos/core/dist/types/components';
import type { Memory } from '../node_modules/@elizaos/core/dist/types/memory';
import type { Content } from '../node_modules/@elizaos/core/dist/types/primitives';
import type { Plugin, RouteRequest, RouteResponse } from '../node_modules/@elizaos/core/dist/types/plugin';
import type { IAgentRuntime } from '../node_modules/@elizaos/core/dist/types/runtime';
import type { State } from '../node_modules/@elizaos/core/dist/types/state';

/**
 * ElizaOS matches plugin routes against the path **after** stripping
 * `/api/agents/{agentUuid}/plugins`. Public URLs must therefore be:
 *   `/api/agents/<AGENT_ID>/plugins/syra-brief` (+ `/snapshot`, `/chat`).
 * A bare `/api/syra-brief` hits the REST router and returns JSON 404 ("API endpoint not found").
 */
export const BRIEF_PAGE_SEGMENT = '/syra-brief';

export function pluginPublicBase(agentId: string): string {
  return `/api/agents/${agentId}/plugins`;
}

const COINGECKO_SOL =
  'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true';

type Snapshot = { usd: number | null; change24hPct: number | null; fetchedAt: string; error?: string };

async function fetchSolSnapshot(): Promise<Snapshot> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(COINGECKO_SOL, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      return {
        usd: null,
        change24hPct: null,
        fetchedAt,
        error: `HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as {
      solana?: { usd?: number; usd_24h_change?: number };
    };
    const s = data.solana;
    return {
      usd: typeof s?.usd === 'number' ? s.usd : null,
      change24hPct: typeof s?.usd_24h_change === 'number' ? s.usd_24h_change : null,
      fetchedAt,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { usd: null, change24hPct: null, fetchedAt, error: msg };
  }
}

const fetchSolPriceAction: Action = {
  name: 'FETCH_SOL_PRICE',
  similes: ['SOL_PRICE', 'SOL_SNAPSHOT', 'PRICE_CHECK_SOL'],
  description:
    'Fetches a live SOL / USD snapshot (24h change when available) from CoinGecko public API. Use for real-time spot context.',

  validate: async (_runtime: IAgentRuntime, message: Memory, _state?: State): Promise<boolean> => {
    const t = message.content?.text?.toLowerCase() ?? '';
    return (
      /\bsol\b|\bsolana\b|\bprice\b|\bsnapshot\b|\bspot\b/.test(t) && !t.includes('nft') // naive guard
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: unknown,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    if (!callback) {
      return { text: 'No callback', values: {}, data: {}, success: false };
    }
    const snap = await fetchSolSnapshot();
    const lines = [
      '**SOL snapshot** (CoinGecko public)',
      snap.usd != null ? `- Spot: **$${snap.usd.toFixed(4)}** USD` : '- Spot: unavailable',
      snap.change24hPct != null ? `- 24h: **${snap.change24hPct.toFixed(2)}%**` : '- 24h: n/a',
      `- Fetched: ${snap.fetchedAt}`,
      snap.error ? `- Error: ${snap.error}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const responseContent: Content = {
      text: lines,
      actions: ['FETCH_SOL_PRICE'],
      source: message.content?.source,
    };
    await callback(responseContent);

    console.info('[FETCH_SOL_PRICE]', snap);

    return {
      text: 'Returned SOL snapshot',
      values: { success: !snap.error && snap.usd != null },
      data: { snap },
      success: true,
    };
  },

  examples: [
    [
      { name: '{{name1}}', content: { text: 'What is SOL trading at?' } },
      {
        name: 'SyraBrief',
        content: {
          text: '**SOL snapshot** (CoinGecko public)\n- Spot: **$123.45** USD',
          actions: ['FETCH_SOL_PRICE'],
        },
      },
    ],
  ],
};

function briefPageHtml(agentId: string): string {
  const base = `${pluginPublicBase(agentId)}${BRIEF_PAGE_SEGMENT}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Syra Brief — Nosana × ElizaOS</title>
  <style>
    :root { color-scheme: dark; --bg: #0b0f14; --card: #121922; --accent: #38bdf8; --text: #e2e8f0; --muted: #94a3b8; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
    header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    h1 { font-size: 1.1rem; margin: 0; letter-spacing: 0.02em; }
    .badge { font-size: 0.7rem; color: var(--muted); border: 1px solid #334155; border-radius: 999px; padding: 0.2rem 0.55rem; }
    main { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 1rem; padding: 1rem; max-width: 1100px; margin: 0 auto; }
    @media (max-width: 820px) { main { grid-template-columns: 1fr; } }
    .card { background: var(--card); border: 1px solid #1e293b; border-radius: 12px; padding: 1rem; }
    .card h2 { margin: 0 0 0.75rem; font-size: 0.95rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    #snap { font-size: 1.35rem; font-weight: 600; }
    #snap small { display: block; margin-top: 0.35rem; font-size: 0.8rem; color: var(--muted); font-weight: 400; }
    textarea { width: 100%; min-height: 120px; resize: vertical; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: var(--text); padding: 0.65rem; font-size: 0.95rem; }
    button { margin-top: 0.5rem; background: var(--accent); color: #0f172a; border: 0; border-radius: 8px; padding: 0.55rem 1rem; font-weight: 600; cursor: pointer; }
    button:disabled { opacity: 0.55; cursor: wait; }
    #out { white-space: pre-wrap; line-height: 1.45; font-size: 0.92rem; min-height: 4rem; }
    .err { color: #f87171; font-size: 0.85rem; margin-top: 0.35rem; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Syra Brief</h1>
      <div style="margin-top:0.25rem;color:var(--muted);font-size:0.85rem;">Personal crypto briefing · ElizaOS on Nosana</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.35rem;max-width:min(100%,36rem);">
      <span class="badge">This page: <code>${base}</code></span>
      <span class="badge" style="text-align:right;line-height:1.35;">Main Eliza UI often lives at <code>/chat/…/…</code> — a different route. Use <code>GET /api/agents</code> to find the agent <code>id</code> for plugin URLs.</span>
    </div>
  </header>
  <main>
    <section class="card">
      <h2>Live snapshot</h2>
      <div id="snap">Loading…</div>
      <p class="err" id="snapErr"></p>
    </section>
    <section class="card">
      <h2>Ask the agent</h2>
      <textarea id="q" placeholder="e.g. Outline a 5-bullet risk checklist before I buy a new Solana memecoin."></textarea>
      <button id="go">Run briefing</button>
      <p class="err" id="chatErr"></p>
      <div id="out"></div>
    </section>
  </main>
  <script>
    async function loadSnap() {
      const snapEl = document.getElementById('snap');
      const errEl = document.getElementById('snapErr');
      errEl.textContent = '';
      try {
        const r = await fetch('${base}/snapshot');
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || r.statusText);
        if (j.usd == null) {
          snapEl.textContent = 'Unavailable';
          snapEl.innerHTML += '<small>' + (j.error || 'No price') + '</small>';
          return;
        }
        let ch = j.change24hPct != null ? '24h ' + (j.change24hPct >= 0 ? '+' : '') + j.change24hPct.toFixed(2) + '%' : '';
        snapEl.textContent = '$' + Number(j.usd).toFixed(4) + ' USD';
        snapEl.innerHTML += '<small>' + [ch, 'via CoinGecko · ' + j.fetchedAt].filter(Boolean).join(' · ') + '</small>';
      } catch (e) {
        errEl.textContent = e.message || String(e);
        snapEl.textContent = '—';
      }
    }
    document.getElementById('go').addEventListener('click', async () => {
      const btn = document.getElementById('go');
      const out = document.getElementById('out');
      const err = document.getElementById('chatErr');
      err.textContent = '';
      out.textContent = '';
      const q = document.getElementById('q').value.trim();
      if (!q) { err.textContent = 'Enter a question.'; return; }
      btn.disabled = true;
      out.textContent = 'Thinking… (direct model call, usually faster than full agent pipeline)';
      try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), 100000);
        const r = await fetch('${base}/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q }),
          signal: ac.signal
        });
        clearTimeout(t);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || r.statusText);
        out.textContent = j.text || JSON.stringify(j);
      } catch (e) {
        const msg = e && e.name === 'AbortError' ? 'Request timed out — try a shorter question or check your LLM endpoint.' : (e.message || String(e));
        err.textContent = msg;
        out.textContent = '';
      } finally {
        btn.disabled = false;
      }
    });
    loadSnap();
    setInterval(loadSnap, 60_000);
  </script>
</body>
</html>`;
}

function json(res: RouteResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

const CHAT_MODEL = 'TEXT_SMALL' as const;
const CHAT_MAX_TOKENS = 768;
const CHAT_TEMPERATURE = 0.35;
const CHAT_TIMEOUT_MS = 90_000;
const SYSTEM_MAX_CHARS = 2800;

function truncateForPrompt(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[system prompt truncated for speed]`;
}

function buildBriefPrompt(runtime: IAgentRuntime, userMessage: string): string {
  const system =
    typeof runtime.character.system === 'string' && runtime.character.system.trim()
      ? truncateForPrompt(runtime.character.system.trim(), SYSTEM_MAX_CHARS)
      : 'You are a helpful, concise assistant.';
  const name = runtime.character.name ?? 'Assistant';
  return (
    `${system}\n\n` +
    `You are "${name}". Reply in clear markdown or plain text. Be concise (roughly under 350 words unless the user asks for more detail).\n\n` +
    `User:\n${userMessage}\n\n` +
    `Assistant:`
  );
}

async function runWithTimeout<T>(ms: number, task: () => Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Model timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([task(), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

const syraBriefPlugin: Plugin = {
  name: 'syra-brief',
  description: 'Syra Brief — custom routes, SOL snapshot, and hackathon UI shell',
  priority: 10,
  actions: [fetchSolPriceAction],
  routes: [
    {
      name: 'syra-brief-ui',
      path: BRIEF_PAGE_SEGMENT,
      type: 'GET',
      public: true,
      handler: async (_req: RouteRequest, res: RouteResponse, runtime: IAgentRuntime) => {
        res.setHeader?.('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(briefPageHtml(runtime.agentId));
      },
    },
    {
      name: 'syra-brief-snapshot',
      path: `${BRIEF_PAGE_SEGMENT}/snapshot`,
      type: 'GET',
      public: true,
      handler: async (_req: RouteRequest, res: RouteResponse) => {
        const snap = await fetchSolSnapshot();
        json(res, 200, snap);
      },
    },
    {
      name: 'syra-brief-chat',
      path: `${BRIEF_PAGE_SEGMENT}/chat`,
      type: 'POST',
      public: true,
      handler: async (req: RouteRequest, res: RouteResponse, runtime: IAgentRuntime) => {
        try {
          const body = (req.body ?? {}) as { message?: string };
          const message = typeof body.message === 'string' ? body.message.trim() : '';
          if (!message) {
            json(res, 400, { success: false, error: 'message is required' });
            return;
          }
          // generateText() runs the full agent pipeline (memory, providers, embeddings) and feels
          // "stuck loading" on 27B-class models. useModel() is a direct LLM call — much faster for this UI.
          const prompt = buildBriefPrompt(runtime, message);
          const reply = await runWithTimeout(CHAT_TIMEOUT_MS, () =>
            runtime.useModel(CHAT_MODEL, {
              prompt,
              maxTokens: CHAT_MAX_TOKENS,
              temperature: CHAT_TEMPERATURE,
              stream: false,
            })
          );
          json(res, 200, { success: true, text: reply });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error('[syra-brief-chat]', msg);
          json(res, 500, { success: false, error: msg });
        }
      },
    },
  ],
};

export default syraBriefPlugin;
