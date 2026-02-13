import express from 'express';
import Chat from '../../models/agent/Chat.js';
import { callJatevo, getJatevoModels } from '../../libs/jatevo.js';
import { JATEVO_MODELS, JATEVO_DEFAULT_MODEL } from '../../config/jatevoModels.js';
import {
  getAgentTool,
  getCapabilitiesList,
  getToolsForLlmSelection,
  normalizeJupiterSwapParams,
} from '../../config/agentTools.js';
import {
  getAgentUsdcBalance,
  getAgentBalances,
  getAgentAddress,
  getConnectedWalletAddress,
} from '../../libs/agentWallet.js';
import {
  callX402V2WithAgent,
  callX402V2WithTreasury,
  signAndSubmitSwapTransaction,
} from '../../libs/agentX402Client.js';
import { SYRA_TOKEN_MINT, isSyraHolderEligible } from '../../libs/syraToken.js';
import { findVerifiedJupiterToken } from '../../v2/lib/jupiterTokens.js';
import { resolveAgentBaseUrl } from './utils.js';

const router = express.Router();

const MAX_TOOLS_PER_REQUEST = 3;
/** Max characters of tool result to send to the LLM (avoids blowing context; ~28k chars ≈ 7k tokens). */
const MAX_TOOL_RESULT_CHARS = 28_000;
/** Higher max_tokens when we inject tool results so the model can write a full summary. */
const MAX_TOKENS_WITH_TOOLS = 4096;
const MAX_TOKENS_DEFAULT = 2000;

/**
 * Use Jatevo LLM to pick up to 3 most relevant tools (and optional params) from the user question.
 * Returns tools ordered by relevance (most relevant first).
 * @param {string} userMessage - Last user message
 * @returns {Promise<Array<{ toolId: string; params?: Record<string, string> }>>}
 */
async function selectToolsWithLlm(userMessage) {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) return [];

  const tools = getToolsForLlmSelection();
  const toolsText = tools
    .map((t) => {
      let line = `- ${t.id}: ${t.name} — ${t.description}`;
      if (t.paramsHint) line += ` (${t.paramsHint})`;
      return line;
    })
    .join('\n');

  const systemContent = `You are a tool selector. Given the user's question, pick the tools from the list below that are MOST relevant to answering it. You may pick 1, 2, or up to 3 tools—only include tools that clearly help answer the question. Order by relevance (most relevant first). You must respond with ONLY a valid JSON object, no markdown, no explanation, no other text.

Available tools (id, name, description):
${toolsText}

Response format: {"tools": [{"toolId": "<id>", "params": {}}, ...]}
- "tools" must be an array. Include 1 to 3 tools that best match the question; use [] if no tool fits.
- Each tool object: "toolId" (one of the ids above), "params" (object, see below).
- For the "news" tool set "params": {"ticker": "BTC"} or {"ticker": "ETH"} or {"ticker": "SOL"} or {"ticker": "general"} when the user asks for news about a coin.
- For the "exa-search" tool set "params": {"query": "<search phrase from user>"} when the user asks for Exa search, web search, or insights on a topic (e.g. "bitcoin insight", "latest Nvidia news", "crypto market analysis"). The query should be the user's topic or question.
- For the "signal" tool set "params": {"token": "bitcoin"} or {"token": "ethereum"} or {"token": "solana"} when the user asks for a signal for a specific coin.
- For the "coingecko-search-pools" tool set "params": {"query": "<search term from user>", "network": "solana"} or "base" when the user asks to search pools/tokens (e.g. "search pools for pump", "find token X on Solana").
- For the "coingecko-trending-pools" tool always set "params": {"network": "solana", "duration": "5m"} when the user asks for trending pools (e.g. "give me coingecko trending pools"). Only use a different network if the user explicitly says "on Base" or "on Ethereum".
- For the "coingecko-onchain-token" tool set "params": {"network": "base"|"solana"|"eth", "address": "<contract address from user>"} when the user asks for token data by contract address.
- For the "coingecko-simple-price" tool set "params": {"symbols": "btc,eth,sol"} or {"ids": "bitcoin,ethereum,solana"} when the user asks for the price of BTC/ETH/SOL or other coins by symbol or name; optionally include_market_cap, include_24hr_vol, include_24hr_change.
- For the "coingecko-onchain-token-price" tool set "params": {"network": "base"|"solana"|"eth", "address": "<contract address>"} when the user asks for the price of a token by its contract address (or multiple addresses comma-separated).
- For all other tools use "params": {}.
- Do not duplicate the same toolId in the array. Maximum ${MAX_TOOLS_PER_REQUEST} tools.
- If the question does not match any tool, respond with: {"tools": []}`;

  const userContent = `User question: ${userMessage.trim()}`;

  try {
    const { response } = await callJatevo(
      [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      { max_tokens: 400, temperature: 0.2 }
    );

    const raw = (response || '').trim();
    let jsonStr = raw;
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();
    const parsed = JSON.parse(jsonStr);
    const toolsList = Array.isArray(parsed?.tools) ? parsed.tools : [];
    const result = [];
    const seen = new Set();
    for (const item of toolsList) {
      if (result.length >= MAX_TOOLS_PER_REQUEST) break;
      const toolId = item?.toolId;
      if (toolId == null || typeof toolId !== 'string' || seen.has(toolId)) continue;
      const tool = getAgentTool(toolId);
      if (!tool) continue;
      seen.add(toolId);
      const params =
        item.params && typeof item.params === 'object' && !Array.isArray(item.params)
          ? Object.fromEntries(
              Object.entries(item.params).filter(
                ([k, v]) => typeof k === 'string' && (v == null || typeof v === 'string')
              )
            )
          : {};
      result.push({ toolId, params });
    }
    return result;
  } catch (err) {
    return [];
  }
}

/**
 * Locally-known Jupiter tokens that we want to support even if the public
 * Jupiter token list (https://tokens.jup.ag/tokens) is temporarily unreachable.
 * These entries are used as a fast path in parseBuyTokenFromText so that
 * "buy $SYRA $0.1" or "buy $BONK $0.1" works without needing a network call.
 *
 * NOTE: Decimals here are only used when the token is the *output* asset in
 * parseBuyTokenFromText, so inaccuracies would not affect how much SOL/USDC
 * is spent. BONK decimals are taken from public Solana metadata; SYRA mint
 * comes from SYRA_TOKEN_MINT and decimals are not critical in this flow.
 */
const HARDCODED_JUPITER_TOKENS = {
  SYRA: {
    address: SYRA_TOKEN_MINT,
    // Decimals not strictly needed for "buy $SYRA $amount" where the input
    // token is SOL/USDC, but we default to 9 (standard SPL / pump.fun tokens).
    decimals: 9,
    symbol: 'SYRA',
    verified: true,
  },
  BONK: {
    // Official BONK mint on Solana
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    symbol: 'BONK',
    verified: true,
  },
};

/**
 * Try to parse a simple "swap X TOKEN_A for TOKEN_B" pattern from free text and map it to
 * Jupiter Ultra swap params. Currently supports SOL and USDC only, using known mint addresses.
 * Example: "swap 0.1 USDC for SOL" -> inputMint = USDC, outputMint = SOL, amount in base units.
 * @param {string | undefined} text
 * @returns {{ inputMint: string; outputMint: string; amount: string } | null}
 */
function parseJupiterSwapParamsFromText(text) {
  if (!text || typeof text !== 'string') return null;
  // Allow optional "$" before the amount and token symbols so phrases like
  // "swap $0.1 USDC to SOL" or "swap 0.1 $USDC to $SOL" are parsed correctly.
  const match =
    /swap\s+\$?([\d.,]+)\s+\$?([A-Za-z0-9]+)\s+(for|to)\s+\$?([A-Za-z0-9]+)/i.exec(text);
  if (!match) return null;
  const amountStr = match[1].replace(/,/g, '');
  const fromSymbol = match[2].toUpperCase();
  const toSymbol = match[4].toUpperCase();
  const amountNum = Number(amountStr);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  // Known tokens and their mint addresses / decimals (Jupiter standard mints).
  const TOKENS = {
    USDC: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
    },
    SOL: {
      // Wrapped SOL mint used by Jupiter
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
    },
  };

  const fromToken = TOKENS[fromSymbol];
  const toToken = TOKENS[toSymbol];
  if (!fromToken || !toToken) return null;

  const amountBaseUnits = Math.round(amountNum * 10 ** fromToken.decimals);
  if (!Number.isFinite(amountBaseUnits) || amountBaseUnits <= 0) return null;

  return {
    inputMint: fromToken.mint,
    outputMint: toToken.mint,
    amount: String(amountBaseUnits),
  };
}

/**
 * Parse a simple \"buy $TOKEN $AMOUNT\" pattern and build Jupiter swap params using
 * the agent's default funding token (SOL or USDC). Example: \"buy $SYRA $0.1\"
 * will spend 0.1 of the higher-balance token (SOL vs USDC) to buy SYRA (or BONK, etc).
 *
 * This function prefers locally-known tokens (HARDCODED_JUPITER_TOKENS) so that
 * common tokens like SYRA and BONK work even if the Jupiter token list fetch
 * fails. For all other symbols it falls back to findVerifiedJupiterToken().
 * @param {string | undefined} text
 * @param {number} usdcBalance
 * @param {number} solBalance
 * @returns {{ inputMint: string; outputMint: string; amount: string } | null}
 */
async function parseBuyTokenFromText(text, usdcBalance, solBalance) {
  if (!text || typeof text !== 'string') return null;
  const match = /buy\s+\$?([A-Za-z0-9]+)\s+\$?([\d.,]+)/i.exec(text);
  if (!match) return null;
  const tokenSymbol = match[1].toUpperCase();
  const amountStr = match[2].replace(/,/g, '');
  const amountNum = Number(amountStr);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  // 1) Prefer locally hardcoded tokens (SYRA, BONK, etc.) so we don't depend
  // on Jupiter's public token list for the most common cases.
  let target = HARDCODED_JUPITER_TOKENS[tokenSymbol] || null;

  // 2) Fallback to Jupiter token list for other symbols, but make sure a
  // network error ("fetch failed") doesn't crash the entire swap flow.
  if (!target) {
    try {
      const resolved = await findVerifiedJupiterToken(tokenSymbol);
      if (resolved && resolved.address) {
        target = resolved;
      }
    } catch {
      target = null;
    }
  }

  if (!target) return null;

  // Pick default funding token based on higher balance (SOL vs USDC).
  const useSol = solBalance > usdcBalance;
  const fromToken = useSol
    ? { mint: 'So11111111111111111111111111111111111111112', decimals: 9 }
    : { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 };

  const amountBaseUnits = Math.round(amountNum * 10 ** fromToken.decimals);
  if (!Number.isFinite(amountBaseUnits) || amountBaseUnits <= 0) return null;

  return {
    inputMint: fromToken.mint,
    outputMint: target.address,
    amount: String(amountBaseUnits),
  };
}

/**
 * Ensure Jupiter amount is in base units (smallest units) based on inputMint decimals.
 * If amount looks like a human number (e.g. 0.1 with a decimal), convert using token decimals.
 * For SOL/USDC we use known decimals; otherwise we query Jupiter token list once.
 * @param {{ inputMint?: string; amount?: string | number }} params
 * @returns {Promise<void>}
 */
async function normalizeJupiterAmountToBaseUnits(params) {
  if (!params || params.amount == null || !params.inputMint) return;
  const raw = String(params.amount);
  // If there's no decimal point and it's an integer string, assume it's already base units.
  if (!raw.includes('.')) return;
  const human = Number(raw);
  if (!Number.isFinite(human) || human <= 0) return;

  const mint = String(params.inputMint);
  let decimals = 0;
  if (mint === 'So11111111111111111111111111111111111111112') {
    decimals = 9; // wrapped SOL
  } else if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
    decimals = 6; // USDC
  } else {
    try {
      const info = await findVerifiedJupiterToken(mint);
      if (!info || !Number.isFinite(Number(info.decimals))) return;
      decimals = Number(info.decimals);
    } catch {
      return;
    }
  }
  if (!Number.isFinite(decimals) || decimals <= 0) return;
  const base = Math.round(human * 10 ** decimals);
  if (!Number.isFinite(base) || base <= 0) return;
  params.amount = String(base);
}

/**
 * Format tool result for LLM context. Large payloads (e.g. analytics-summary) are condensed or truncated
 * so we don't blow the context window and the model can still produce a useful answer.
 * @param {unknown} data - Raw tool response data
 * @param {string} toolId - Tool id (e.g. 'analytics-summary')
 * @returns {string} - String to inject into the user message for the LLM
 */
function formatToolResultForLlm(data, toolId) {
  if (toolId === 'analytics-summary' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      return condensedAnalyticsSummary(data);
    } catch (e) {
      console.warn('[agent/chat] condensedAnalyticsSummary failed, using truncation');
    }
  }
  // CoinGecko trending pools: only present real API data; never allow the LLM to invent pools/prices
  if (toolId === 'coingecko-trending-pools' && data && typeof data === 'object') {
    const pools = Array.isArray(data.data) ? data.data : [];
    if (pools.length === 0) {
      return '[The trending pools API returned no data. Do NOT invent or make up token names, prices, or tables. Tell the user that trending pools could not be loaded and suggest trying again later.]';
    }
    try {
      const lines = ['Trending pools (live data from CoinGecko):'];
      for (const item of pools.slice(0, 15)) {
        const attrs = item?.attributes || item;
        const name = attrs.name || attrs.base_token_symbol || item?.id || '—';
        const priceCh = attrs.price_change_percentage?.h24 ?? attrs.price_change_percentage ?? '—';
        const vol = attrs.volume_usd?.h24 ?? attrs.volume_usd ?? '—';
        const liq = attrs.liquidity_usd ?? attrs.fdv_usd ?? '—';
        lines.push(`- ${name} | 24h change: ${priceCh} | volume: ${vol} | liquidity: ${liq}`);
      }
      if (pools.length > 15) lines.push(`... and ${pools.length - 15} more pools.`);
      return lines.join('\n');
    } catch (e) {
      console.warn('[agent/chat] coingecko-trending-pools format failed', e?.message);
    }
  }
  const raw = JSON.stringify(data, null, 2);
  if (raw.length <= MAX_TOOL_RESULT_CHARS) return raw;
  return (
    raw.slice(0, MAX_TOOL_RESULT_CHARS) +
    "\n\n[... Result truncated due to length. Ask for a specific section or metric if you need more detail.]"
  );
}

/**
 * Build a condensed text summary of analytics-summary payload for the LLM (sections + key counts/top items).
 * @param {Record<string, unknown>} summary - Response from /v2/analytics/summary
 * @returns {string}
 */
function condensedAnalyticsSummary(summary) {
  const lines = [];
  const sections = summary.sections && typeof summary.sections === 'object' ? summary.sections : {};
  const sectionOrder = ['price', 'volume', 'correlation', 'tokenRisk', 'onChain', 'memecoin'];
  for (const key of sectionOrder) {
    const section = sections[key];
    if (!section || typeof section !== 'object') continue;
    const title = section.title || key;
    lines.push(`## ${title}`);
    for (const [subKey, value] of Object.entries(section)) {
      if (subKey === 'title') continue;
      try {
        if (value && typeof value === 'object' && 'ok' in value && value.ok && value.data) {
          const data = value.data;
          if (Array.isArray(data)) {
            const top = data.slice(0, 5);
            lines.push(`  ${subKey}: ${data.length} items. Top entries: ${JSON.stringify(top).slice(0, 500)}${data.length > 5 ? '...' : ''}`);
          } else if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            const preview = keys.length <= 4 ? JSON.stringify(data).slice(0, 400) : `${keys.length} keys: ${keys.slice(0, 4).join(', ')}...`;
            lines.push(`  ${subKey}: ${preview}`);
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          const keys = Object.keys(value);
          lines.push(`  ${subKey}: ${keys.length} keys — ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }
      } catch (_) {
        lines.push(`  ${subKey}: (data)`);
      }
    }
    lines.push('');
  }
  const out = lines.join('\n').trim();
  return out.length <= MAX_TOOL_RESULT_CHARS ? out : out.slice(0, MAX_TOOL_RESULT_CHARS) + "\n\n[... truncated.]";
}

/**
 * Call x402 v2 tool with agent wallet (server pays in one shot; agent balance is reduced on-chain).
 * Uses callX402V2WithAgent so payment is always done server-side when a tool is used in chat.
 */
async function callToolWithAgentWallet(anonymousId, url, method, query, body) {
  const result = await callX402V2WithAgent({
    anonymousId,
    url,
    method: method || 'GET',
    query: method === 'GET' ? query || {} : {},
    body: method === 'POST' ? body : undefined,
  });
  if (!result.success) {
    return { status: 502, error: result.error };
  }
  return { status: 200, data: result.data };
}

/**
 * Call x402 v2 tool with treasury wallet (AGENT_PRIVATE_KEY). Used for 1M+ SYRA holders (free tools).
 */
async function callToolWithTreasury(url, method, query, body) {
  const result = await callX402V2WithTreasury({
    url,
    method: method || 'GET',
    query: method === 'GET' ? query || {} : {},
    body: method === 'POST' ? body : undefined,
  });
  if (!result.success) {
    return { status: 502, error: result.error };
  }
  return { status: 200, data: result.data };
}

// GET /models - List available Jatevo LLM models for the agent chat. Prefer Jatevo API list when available.
router.get('/models', async (_req, res) => {
  try {
    const fromApi = await getJatevoModels();
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return res.json({ models: fromApi });
    }
  } catch (err) {
    console.warn('[agent/chat] GET /models: could not fetch from Jatevo, using config');
  }
  res.json({ models: JATEVO_MODELS });
});

// POST /completion - Get LLM completion from Jatevo. Tool is chosen dynamically by Jatevo from the user question.
// Playground-style: when tool returns 402, we return 402 to client; client calls pay-402 then retries with X-Payment.
// When client sends X-Payment, we forward it to the tool request.
router.post('/completion', async (req, res) => {
  const completionStart = Date.now();
  try {
    const { messages: bodyMessages, systemPrompt, anonymousId, toolRequest: clientToolRequest, walletConnected, model: modelId } =
      req.body || {};
    if (!Array.isArray(bodyMessages) || bodyMessages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }
    const apiMessages = bodyMessages.map((m) => ({
      role: m.role || 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    }));

    const lastUserMessage = apiMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .pop();

    const toolSelectStart = Date.now();
    /** Normalize toolId so "jupiter_swap_order" becomes "jupiter-swap-order" for backend. */
    const normalizeToolId = (id) =>
      id === 'jupiter_swap_order' ? 'jupiter-swap-order' : id;
    /** @type {Array<{ toolId: string; params?: Record<string, string> }>} */
    let matchedTools;
    if (clientToolRequest?.toolId != null) {
      const toolId = normalizeToolId(clientToolRequest.toolId);
      matchedTools = [{ toolId, params: clientToolRequest.params || {} }];
    } else if (Array.isArray(clientToolRequest?.tools) && clientToolRequest.tools.length > 0) {
      matchedTools = clientToolRequest.tools
        .slice(0, MAX_TOOLS_PER_REQUEST)
        .filter((t) => t?.toolId && getAgentTool(t.toolId))
        .map((t) => ({ toolId: normalizeToolId(t.toolId), params: t.params || {} }));
    } else {
      matchedTools = await selectToolsWithLlm(lastUserMessage);
    }

    const capabilitiesList = getCapabilitiesList().join('\n');

    let useTreasuryForTools = false;
    if (anonymousId && walletConnected) {
      const connectedWallet = await getConnectedWalletAddress(anonymousId);
      useTreasuryForTools = !!(connectedWallet && (await isSyraHolderEligible(connectedWallet)));
    }

    let systemParts = [];
    systemParts.push(
      `You are Syra, a smart AI agent for crypto, web3, and blockchain. You can chat naturally and also use paid tools when the user asks for specific data.`
    );
    systemParts.push(
      `Syra's paid tools (v2 API; user pays from agent wallet when a tool is used):\n${capabilitiesList}`
    );
    systemParts.push(
      `When the user is just chatting—greetings (hi, hello), "what can you do", general crypto questions, or casual conversation—respond naturally and helpfully. Do not say "I don't have a tool for that" or list every capability in response to a simple greeting. Briefly mention what you can do only when it fits (e.g. if they ask "what can you do").`
    );
    systemParts.push(
      `When the user asks for something specific (e.g. "give me X", "show me Y data") that is not covered by the tools above, then say Syra doesn't have that capability right now and briefly list what Syra can do. Do not make up data or use general knowledge for topics that require a tool we don't have.`
    );
    systemParts.push(
      `Response format: Always reply in clear, human-readable text. Use markdown: headings (##), bullet points, numbered lists, and tables where they help readability. Format numbers, prices, and percentages clearly (e.g. $1,234.56, +2.5%). Do not include raw JSON, code blocks showing tool calls, or blocks like {"tool": "..."} in your reply—turn all data into plain, well-formatted prose and tables only. When you receive results from multiple tools (separated by ---), synthesize them into one coherent answer that addresses the user's question.`
    );
    if (anonymousId) {
      const balanceResult = await getAgentBalances(anonymousId);
      const usdcBalance = balanceResult?.usdcBalance ?? 0;
      const solBalance = balanceResult?.solBalance ?? 0;
      const agentAddr = balanceResult?.agentAddress ?? '';
      systemParts.push(
        `User's agent wallet balances: USDC $${usdcBalance.toFixed(4)}, SOL ${solBalance.toFixed(4)}. Agent wallet address: ${agentAddr || 'unknown'}.`
      );
      if (useTreasuryForTools) {
        systemParts.push(
          `The user holds 1M+ SYRA tokens and can use paid tools for free (treasury pays). Do not ask them to deposit USDC for tools.`
        );
      } else {
        systemParts.push(
          `Agent wallet knowledge: The agent wallet needs BOTH (1) USDC to pay for paid tools, and (2) SOL to pay Solana transaction fees. If the user has 0 or very low USDC, tell them to deposit USDC to their agent wallet to use paid tools. If the user has 0 or very low SOL (e.g. below 0.001), tell them to send a small amount of SOL (e.g. 0.01 SOL) to their agent wallet address so payments can be processed. If a paid tool fails with a message about "SOL for transaction fees" or "debit an account", explain clearly that they need to add SOL to their agent wallet for network fees. If the failure mentions "USDC" or "insufficient balance", explain they need to add USDC for the tool cost.`
        );
      }
    }
    if (systemPrompt && typeof systemPrompt === 'string') {
      systemParts.push(systemPrompt);
    }
    apiMessages.unshift({ role: 'system', content: systemParts.join('\n\n') });

    let amountChargedUsd = 0;
    /** @type {Array<{ name: string; status: 'complete' | 'error' }>} */
    let toolUsages = [];
    let hadToolResults = false;
    if (!matchedTools || matchedTools.length === 0) {
      // No tools matched: let the agent answer from the system prompt (general chat vs out-of-scope).
    } else if (walletConnected === false) {
      toolUsages = matchedTools.map((m) => {
        const t = getAgentTool(m.toolId);
        return { name: t ? t.name : m.toolId, status: 'error' };
      });
      const toolIds = matchedTools.map((t) => t.toolId).join(', ');
      apiMessages.push({
        role: 'user',
        content: `[The user asked for something that requires paid tool(s) (${toolIds}), but they have not connected a wallet. Reply that they need to connect their wallet to use tools and get this information. You can mention they can chat about crypto without a wallet, but tools and realtime data require a connected wallet.]`,
      });
    } else if (anonymousId) {
      const useTreasury = useTreasuryForTools;
      // For swap defaults we need both USDC and SOL balances, regardless of who pays the tool fee.
      const balanceInfoForSwap = await getAgentBalances(anonymousId);
      let usdcBalance = balanceInfoForSwap?.usdcBalance ?? 0;
      let solBalanceForSwap = balanceInfoForSwap?.solBalance ?? 0;
      if (useTreasury) {
        // Treasury pays the x402 fee but swaps still use the agent wallet; don't cap balances,
        // just use the actual USDC/SOL values for choosing default from_token.
      }
      const toolResults = [];
      const toolErrors = [];
      for (const matched of matchedTools) {
        const tool = getAgentTool(matched.toolId);
        // Normalize params to string values so GET query and x402 client build URL correctly
        const rawParams = typeof matched.params === 'object' ? matched.params : {};
        let params = Object.fromEntries(
          Object.entries(rawParams).filter(
            ([k, v]) => typeof k === 'string' && v != null && v !== ''
          ).map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
        );
        // Default coingecko-trending-pools to same network/duration so "give me trending pools" is consistent
        if (matched.toolId === 'coingecko-trending-pools') {
          if (!params.network) params.network = 'solana';
          if (!params.duration) params.duration = '5m';
        }
        if (!tool) continue;
        // Jupiter swap order: use agent wallet as taker; accept LLM params (from_token, to_token, amount) or infer from message.
        if (matched.toolId === 'jupiter-swap-order') {
          const agentAddr = await getAgentAddress(anonymousId);
          if (agentAddr) params.taker = agentAddr;

          // 1) Prefer explicit LLM params (from_token, to_token, amount).
          if (!params.inputMint || !params.outputMint || !params.amount) {
            const fromLlm = normalizeJupiterSwapParams(params);
            if (fromLlm) {
              params = { ...params, ...fromLlm };
            }
          }

          // 2) If still incomplete, try generic \"swap X TOKEN for TOKEN\" pattern.
          if (!params.inputMint || !params.outputMint || !params.amount) {
            const inferredSwap = parseJupiterSwapParamsFromText(lastUserMessage);
            if (inferredSwap) {
              params = { ...params, ...inferredSwap };
            }
          }

          // 3) If user said \"buy $TOKEN $0.1\" and we still don't have params,
          //    default from_token to the higher of SOL vs USDC balance and resolve TOKEN via Jupiter.
          if (!params.inputMint || !params.outputMint || !params.amount) {
            const inferredBuy = await parseBuyTokenFromText(
              lastUserMessage,
              usdcBalance,
              solBalanceForSwap
            );
            if (inferredBuy) {
              params = { ...params, ...inferredBuy };
            }
          }

          // 4) If amount still looks like a human number (e.g. 0.1), convert to base units using inputMint decimals.
          await normalizeJupiterAmountToBaseUnits(params);

          // 5) If we still don't have full Jupiter params, it means the user
          //    requested a token outside the supported set (SOL, USDC, SYRA, BONK).
          //    Instead of calling the swap API and returning a generic 400 error,
          //    instruct the LLM to clearly say this is not supported yet.
          if (!params.inputMint || !params.outputMint || !params.amount || !params.taker) {
            const msg =
              'The user asked to swap a token that is not currently supported. For now, Syra only supports swaps involving SOL, USDC, SYRA, and BONK. Explain this limitation and ask them to choose one of these tokens.';
            toolErrors.push(msg);
            toolUsages.push({ name: tool.name, status: 'error' });
            continue;
          }
        }
        const requiredUsdc = tool.priceUsd;
        if (!useTreasury && (usdcBalance <= 0 || usdcBalance < requiredUsdc)) {
          const msg =
            usdcBalance <= 0
              ? `The user's agent wallet has 0 USDC balance. The requested paid tool (${tool.name}) costs $${requiredUsdc.toFixed(4)}. Explain that they need to deposit USDC to their agent wallet to use this feature.`
              : `The user's agent wallet has insufficient USDC (balance: $${usdcBalance.toFixed(4)}, required for ${tool.name}: $${requiredUsdc.toFixed(4)}). Explain this and ask them to deposit more USDC.`;
          toolErrors.push(msg);
          toolUsages.push({ name: tool.name, status: 'error' });
          continue;
        }
        const url = `${resolveAgentBaseUrl(req)}${tool.path}`;
        const method = tool.method || 'GET';
        const result = useTreasury
          ? await callToolWithTreasury(url, method, method === 'GET' ? params : {}, method === 'POST' ? params : undefined)
          : await callToolWithAgentWallet(
              anonymousId,
              url,
              method,
              method === 'GET' ? params : {},
              method === 'POST' ? params : undefined
            );
        if (result.status !== 200) {
          const err = result.error || 'Request failed';
          const needsSol = /SOL|transaction fee|debit an account|no record of a prior credit/i.test(err);
          const needsUsdc = /USDC|insufficient|no USDC|token account/i.test(err);
          let instruction = `[Paid tool "${tool.name}" failed: ${err}. Explain what went wrong in plain language.`;
          if (useTreasury) {
            instruction += ` This user is a 1M+ SYRA holder (treasury pays); suggest they try again or contact support if the issue persists.`;
          } else if (needsSol) {
            instruction += ` Tell the user their agent wallet needs SOL to pay Solana transaction fees—they should send a small amount of SOL (e.g. 0.01) to their agent wallet address.`;
          } else if (needsUsdc) {
            instruction += ` Tell the user they need to deposit USDC to their agent wallet to pay for this tool.`;
          } else {
            instruction += ` Suggest they check their agent wallet has both USDC (for the tool) and SOL (for fees), or try again later.`;
          }
          instruction += ` Do NOT invent or make up data (e.g. trending pools, token names, prices, or tables). Only report that the tool failed and the user should try again.`;
          toolErrors.push(instruction);
          toolUsages.push({ name: tool.name, status: 'error' });
        } else {
          if (!useTreasury) amountChargedUsd += tool.priceUsd;
          usdcBalance -= tool.priceUsd;
          toolUsages.push({ name: tool.name, status: 'complete' });
          let toolData = result.data;
          // Jupiter swap: sign and submit the transaction with the agent wallet so the swap executes (agent balance reduced).
          if (matched.toolId === 'jupiter-swap-order' && toolData?.transaction) {
            try {
              const { signature } = await signAndSubmitSwapTransaction(anonymousId, toolData.transaction);
              toolData = { ...toolData, swapSignature: signature, swapSubmitted: true };
            } catch (swapErr) {
              toolData = {
                ...toolData,
                swapSubmitted: false,
                swapError: swapErr?.message || 'Failed to submit swap transaction',
              };
            }
            // Log minimal swap result server-side for debugging without exposing sensitive details.
            try {
              console.log('[agent/chat] Jupiter swap result', {
                swapSubmitted: toolData.swapSubmitted,
                // Avoid logging full swapSignature or error contents to keep logs non-sensitive.
                hasSwapSignature: !!toolData.swapSignature,
                hasSwapError: !!toolData.swapError,
              });
            } catch {
              // ignore logging errors
            }
          }
          const formatted = formatToolResultForLlm(toolData, tool.id);
          const presentInstruction =
            tool.id === 'coingecko-trending-pools'
              ? 'Present this trending pools data to the user in a clear table or list. Use ONLY the data below—do not invent token names, prices, or percentages.'
              : 'Present this to the user in clear, human-readable form. Use headings, short paragraphs, bullet points or markdown tables. Do not include raw JSON or any {"tool"/"params"} blocks.';
          toolResults.push(
            `[Result from paid tool "${tool.name}" — ${presentInstruction}]\n\n${formatted}`
          );
        }
      }
      if (toolErrors.length > 0 && toolResults.length === 0) {
        apiMessages.push({ role: 'user', content: toolErrors[0] });
      } else if (toolResults.length > 0) {
        hadToolResults = true;
        const combined = toolResults.join('\n\n---\n\n');
        apiMessages.push({ role: 'user', content: combined });
        if (toolErrors.length > 0) {
          apiMessages.push({ role: 'user', content: toolErrors.join(' ') });
        }
      }
    } else {
      toolUsages = matchedTools.map((m) => {
        const t = getAgentTool(m.toolId);
        return { name: t ? t.name : m.toolId, status: 'error' };
      });
      const toolIds = matchedTools.map((t) => t.toolId).join(', ');
      apiMessages.push({
        role: 'user',
        content: `[The user asked for paid tool(s) (${toolIds}) but no agent wallet is linked. Reply that they need to connect or create an agent wallet and deposit USDC to use Syra's paid features.]`,
      });
    }

    const jatevoOptions = { anonymousId };
    if (modelId && typeof modelId === 'string' && modelId.trim()) {
      jatevoOptions.model = modelId.trim();
    }
    if (hadToolResults) {
      jatevoOptions.max_tokens = MAX_TOKENS_WITH_TOOLS;
    } else {
      jatevoOptions.max_tokens = MAX_TOKENS_DEFAULT;
    }
    const requestedModel = jatevoOptions.model || JATEVO_DEFAULT_MODEL;

    let response;
    let truncated = false;
    let usedFallbackModel = false;

    try {
      const result = await callJatevo(apiMessages, jatevoOptions);
      response = result.response;
      truncated = result.truncated;
    } catch (firstError) {
      // If a non-default model was requested and failed, log why and retry with default model so the user still gets a reply
      const requestedModel = jatevoOptions.model;
      if (
        requestedModel &&
        requestedModel !== JATEVO_DEFAULT_MODEL
      ) {
        const reason = firstError?.message || String(firstError);
        const isBudgetExceeded = /budget has been exceeded|max budget/i.test(reason);
        if (isBudgetExceeded) {
          console.warn(
            '[agent/chat] Jatevo account budget exceeded. Using default model.'
          );
        } else {
          console.error(
            '[agent/chat] Requested model failed, falling back to default model.'
          );
        }
        try {
          const fallbackOptions = { ...jatevoOptions, model: JATEVO_DEFAULT_MODEL };
          const fallbackResult = await callJatevo(apiMessages, fallbackOptions);
          response = fallbackResult.response;
          truncated = fallbackResult.truncated;
          usedFallbackModel = true;
        } catch (fallbackError) {
          throw firstError;
        }
      } else {
        throw firstError;
      }
    }

    const actualModel = usedFallbackModel ? JATEVO_DEFAULT_MODEL : requestedModel;

    const payload = { success: true, response };
    if (truncated) payload.truncated = true;
    if (amountChargedUsd > 0) payload.amountChargedUsd = amountChargedUsd;
    if (usedFallbackModel) payload.usedFallbackModel = true;
    if (toolUsages && toolUsages.length > 0) payload.toolUsages = toolUsages;
    return res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Completion failed',
    });
  }
});

// GET /share/:shareId - Get chat by share link. Optional query anonymousId for owner check.
// If anonymousId matches owner: 200 with full chat + isOwner: true (owner can always access).
// If chat is public and not owner: 200 with read-only payload + isOwner: false.
// If chat is private and not owner: 403.
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { anonymousId } = req.query;
    if (!shareId || typeof shareId !== 'string' || !shareId.trim()) {
      return res.status(400).json({ success: false, error: 'shareId is required' });
    }
    const chat = await Chat.findOne({ shareId: shareId.trim() }).lean();
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    const ownerId = (chat.anonymousId || '').toString();
    const isOwner =
      anonymousId &&
      typeof anonymousId === 'string' &&
      anonymousId.trim() &&
      ownerId === anonymousId.trim();

    if (isOwner) {
      const messages = (chat.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        toolUsage: m.toolUsage,
      }));
      return res.json({
        id: chat._id.toString(),
        shareId: chat.shareId,
        title: chat.title,
        preview: chat.preview,
        modelId: chat.modelId ?? '',
        messages,
        timestamp: chat.updatedAt,
        isPublic: !!chat.isPublic,
        isOwner: true,
      });
    }

    if (!chat.isPublic) {
      return res.status(403).json({
        success: false,
        private: true,
        error: 'This chat is private',
        message: 'The owner has not made this chat public. Only they can view it.',
      });
    }

    const messages = (chat.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));
    res.json({
      id: chat._id.toString(),
      shareId: chat.shareId,
      title: chat.title,
      preview: chat.preview,
      modelId: chat.modelId ?? '',
      messages,
      timestamp: chat.updatedAt,
      isPublic: true,
      isOwner: false,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET / - List chats for the given anonymousId (newest first). Scoped by wallet/user.
// Backfill shareId for any chat that doesn't have one (e.g. created before share feature).
router.get('/', async (req, res) => {
  try {
    const { anonymousId, limit = 50 } = req.query;
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
    const chats = await Chat.find({ anonymousId: ownerId })
      .sort({ updatedAt: -1 })
      .limit(limitNum);

    for (const chat of chats) {
      if (!chat.shareId) {
        chat.shareId = Chat.generateShareId();
        await chat.save();
      }
    }

    const result = chats.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      preview: c.preview,
      agentId: c.agentId,
      systemPrompt: c.systemPrompt,
      modelId: c.modelId ?? '',
      shareId: c.shareId ?? null,
      isPublic: !!c.isPublic,
      timestamp: c.updatedAt,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    res.json({ chats: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST / - Create a new chat (scoped by anonymousId / wallet)
router.post('/', async (req, res) => {
  try {
    const { anonymousId, title = 'New Chat', preview = '', agentId = '', systemPrompt = '', modelId = '' } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const shareId = Chat.generateShareId();
    const chat = new Chat({
      anonymousId: ownerId,
      title,
      preview,
      agentId,
      systemPrompt,
      modelId: typeof modelId === 'string' ? modelId : '',
      messages: [],
      shareId,
      isPublic: false,
    });
    await chat.save();

    res.status(201).json({
      success: true,
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        preview: chat.preview,
        agentId: chat.agentId,
        systemPrompt: chat.systemPrompt,
        modelId: chat.modelId ?? '',
        shareId: chat.shareId,
        isPublic: !!chat.isPublic,
        messages: [],
        timestamp: chat.updatedAt,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /:id - Get one chat with all messages (must belong to anonymousId)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId } = req.query;
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    let chat = await Chat.findOne({ _id: id, anonymousId: ownerId });
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    // Backfill shareId for legacy chats
    if (!chat.shareId) {
      chat.shareId = Chat.generateShareId();
      await chat.save();
    }
    const c = chat.toObject ? chat.toObject() : chat;

    const messages = (c.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));

    res.json({
      id: c._id.toString(),
      title: c.title,
      preview: c.preview,
      agentId: c.agentId,
      systemPrompt: c.systemPrompt,
      modelId: c.modelId ?? '',
      shareId: c.shareId ?? null,
      isPublic: !!c.isPublic,
      messages,
      timestamp: c.updatedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /:id - Update chat metadata (must belong to anonymousId)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId, title, preview, agentId, systemPrompt, modelId, isPublic } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const update = {};
    if (title !== undefined) update.title = title;
    if (preview !== undefined) update.preview = preview;
    if (agentId !== undefined) update.agentId = agentId;
    if (systemPrompt !== undefined) update.systemPrompt = systemPrompt;
    if (modelId !== undefined) update.modelId = typeof modelId === 'string' ? modelId : '';
    if (typeof isPublic === 'boolean') update.isPublic = isPublic;

    let chat = await Chat.findOne({ _id: id, anonymousId: ownerId });
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    if (!chat.shareId) {
      chat.shareId = Chat.generateShareId();
      await chat.save();
    }
    const updated = await Chat.findOneAndUpdate(
      { _id: id, anonymousId: ownerId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    res.json({
      success: true,
      chat: {
        id: updated._id.toString(),
        title: updated.title,
        preview: updated.preview,
        agentId: updated.agentId,
        systemPrompt: updated.systemPrompt,
        modelId: updated.modelId ?? '',
        shareId: updated.shareId ?? null,
        isPublic: !!updated.isPublic,
        timestamp: updated.updatedAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /:id/messages - Replace full messages array (must belong to anonymousId)
router.put('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId, messages, title, preview } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    if (!Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'messages must be an array' });
    }
    const ownerId = anonymousId.trim();

    const normalized = messages.map((m) => ({
      id: m.id || String(Date.now() + Math.random()),
      role: m.role,
      content: m.content || '',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      toolUsage: m.toolUsage,
    }));

    const update = { messages: normalized };
    if (title !== undefined) update.title = title;
    if (preview !== undefined) update.preview = preview;

    const chat = await Chat.findOneAndUpdate(
      { _id: id, anonymousId: ownerId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const outMessages = (chat.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));

    res.json({
      success: true,
      messages: outMessages,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /:id/messages - Append one or more messages (must belong to anonymousId)
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId, messages: toAdd } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const list = Array.isArray(toAdd) ? toAdd : [toAdd].filter(Boolean);
    if (list.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide messages array or single message' });
    }

    const newMessages = list.map((m) => ({
      id: m.id || String(Date.now() + Math.random()),
      role: m.role,
      content: m.content || '',
      timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      toolUsage: m.toolUsage,
    }));

    const chat = await Chat.findOneAndUpdate(
      { _id: id, anonymousId: ownerId },
      { $push: { messages: { $each: newMessages } } },
      { new: true, runValidators: true }
    ).lean();

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const outMessages = (chat.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
    }));

    res.json({
      success: true,
      messages: outMessages,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /:id - Delete a chat (must belong to anonymousId)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId } = req.query;
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const chat = await Chat.findOneAndDelete({ _id: id, anonymousId: ownerId });
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export async function createAgentChatRouter() {
  return router;
}

export default router;
