import express from 'express';
import mongoose from 'mongoose';
import Chat from '../../models/agent/Chat.js';
import {
  callOpenRouter,
  getOpenRouterModels,
  OPENROUTER_EMPTY_RESPONSE_PLACEHOLDER,
} from '../../libs/openrouter.js';
import { OPENROUTER_MODELS, OPENROUTER_DEFAULT_MODEL } from '../../config/openrouterModels.js';
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
  signAndSubmitSerializedTransaction,
  signAndSubmitSwapTransaction,
} from '../../libs/agentX402Client.js';
import {
  enrichPumpfunToolParams,
  omitParamsKeys,
  substituteAgentToolPath,
  PUMPFUN_TX_TOOL_IDS,
} from '../../libs/agentPumpfunTools.js';
import { getAgentToolParamGateMessage } from '../../libs/agentToolParamGate.js';
import { callNansenWithAgent } from '../../libs/agentNansenClient.js';
import { callZerionWithAgent } from '../../libs/agentZerionClient.js';
import {
  purchVaultSearch,
  purchVaultBuy,
  purchVaultDownload,
} from '../../libs/agentPurchVaultClient.js';
import { getEffectivePriceUsd } from '../../config/x402Pricing.js';
import { SYRA_TOKEN_MINT, isSyraHolderEligible } from '../../libs/syraToken.js';
import { findVerifiedJupiterToken } from '../../libs/jupiterTokens.js';
import { resolveAgentBaseUrl } from './utils.js';
import { recordAgentChatUsage } from '../../libs/agentLeaderboard.js';
import {
  buildAgentChatDailyLimitMessage,
  isAgentChatDailyLimitBypassWallet,
  tryConsumeAgentChatDailyQuestion,
} from '../../libs/agentChatDailyLimit.js';
import { TEMPO_PUBLIC_REFERENCE, fetchTempoTokenList } from '../../libs/tempoPublic.js';
import { runAgentPartnerDirectTool } from '../../libs/agentPartnerDirectTools.js';

const router = express.Router();

function readPositiveIntEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const MAX_TOOLS_PER_REQUEST = 3;
/** Max characters of tool result to send to the LLM (env: AGENT_CHAT_MAX_TOOL_RESULT_CHARS). */
const MAX_TOOL_RESULT_CHARS = readPositiveIntEnv('AGENT_CHAT_MAX_TOOL_RESULT_CHARS', 20_000);
/** Final completion max_tokens when tool results are present (env: AGENT_CHAT_MAX_COMPLETION_TOKENS_TOOLS). */
const MAX_TOKENS_WITH_TOOLS = readPositiveIntEnv('AGENT_CHAT_MAX_COMPLETION_TOKENS_TOOLS', 2_560);
/** Final completion max_tokens without large tool payloads (env: AGENT_CHAT_MAX_COMPLETION_TOKENS_DEFAULT). */
const MAX_TOKENS_DEFAULT = readPositiveIntEnv('AGENT_CHAT_MAX_COMPLETION_TOKENS_DEFAULT', 1_200);
/** Cap total OpenRouter-reported tokens per persisted chat thread (env: AGENT_CHAT_SESSION_LLM_TOKEN_CAP). */
const AGENT_CHAT_SESSION_LLM_TOKEN_CAP = readPositiveIntEnv('AGENT_CHAT_SESSION_LLM_TOKEN_CAP', 120_000);
/** Max characters of prior user/assistant turns; tail is preserved for recency (env: AGENT_CHAT_HISTORY_MAX_CHARS). */
const AGENT_CHAT_HISTORY_MAX_CHARS = readPositiveIntEnv('AGENT_CHAT_HISTORY_MAX_CHARS', 40_000);
/** Tool-router LLM max_tokens (env: AGENT_CHAT_TOOL_SELECT_MAX_TOKENS). */
const AGENT_CHAT_TOOL_SELECT_MAX_TOKENS = readPositiveIntEnv('AGENT_CHAT_TOOL_SELECT_MAX_TOKENS', 280);

/**
 * @param {{ prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null | undefined} usage
 * @returns {number}
 */
function tokensFromUsage(usage) {
  if (!usage || typeof usage !== 'object') return 0;
  if (typeof usage.total_tokens === 'number' && Number.isFinite(usage.total_tokens)) {
    return usage.total_tokens;
  }
  const p = usage.prompt_tokens;
  const c = usage.completion_tokens;
  if (typeof p === 'number' && typeof c === 'number' && Number.isFinite(p) && Number.isFinite(c)) {
    return p + c;
  }
  return 0;
}

/**
 * Keep the tail of the thread within a char budget so input cost stays bounded while preserving recent context.
 * @param {Array<{ role: string; content: string }>} msgs
 * @param {number} maxChars
 * @returns {{ messages: typeof msgs; trimmed: boolean }}
 */
function truncateConversationForLlm(msgs, maxChars) {
  if (!Array.isArray(msgs) || msgs.length === 0) return { messages: msgs, trimmed: false };
  const total = msgs.reduce(
    (sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0),
    0
  );
  if (total <= maxChars) return { messages: msgs, trimmed: false };

  const overhead = 140;
  const budget = Math.max(2000, maxChars - overhead);
  const out = [];
  let used = 0;
  for (let i = msgs.length - 1; i >= 0; i--) {
    const m = msgs[i];
    const c = typeof m.content === 'string' ? m.content.length : 0;
    if (used + c > budget && out.length > 0) break;
    if (used + c > budget && out.length === 0) {
      const content = typeof m.content === 'string' ? m.content : '';
      const slice = content.slice(Math.max(0, content.length - budget));
      out.unshift({ ...m, content: `${slice}\n\n[…message trimmed for context budget]` });
      return { messages: out, trimmed: true };
    }
    out.unshift(m);
    used += c;
  }
  const dropped = msgs.length - out.length;
  if (dropped > 0) {
    out.unshift({
      role: 'user',
      content: `[Context: ${dropped} earlier message(s) were omitted to stay within the context budget. Continue from the thread below — do not assume details from omitted turns unless the user repeats them.]`,
    });
  }
  return { messages: out, trimmed: dropped > 0 };
}

/**
 * Enforce Syra-first branding in user-visible replies.
 * We keep provider names out of chat output even if a model leaks them.
 * @param {string | undefined} text
 * @returns {string}
 */
function enforceSyraBranding(text) {
  if (typeof text !== 'string' || !text.trim()) return '';
  return text
    .replace(/\bjatevo(?:'s)?\b/gi, 'Syra')
    .replace(/\bopenrouter\b/gi, 'Syra')
    .replace(/\bopen\s*router\b/gi, 'Syra');
}

const WSOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Metadata for the agent UI price chart (CoinGecko OHLC via /agent/chart; DEX fallback on client for mints).
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @param {unknown} toolData
 * @returns {Record<string, string>}
 */
function agentChartUiMeta(toolId, params, toolData) {
  const id = typeof toolId === 'string' ? toolId : '';
  if (id === 'pumpfun-coin' || id === 'pumpfun-coin-query') {
    const mint = params?.mint && String(params.mint).trim();
    if (!mint) return {};
    /** @type {Record<string, string>} */
    const out = { chartMint: mint };
    if (toolData && typeof toolData === 'object') {
      if (typeof toolData.symbol === 'string' && toolData.symbol.trim()) out.chartSymbol = toolData.symbol.trim();
      if (typeof toolData.name === 'string' && toolData.name.trim()) out.chartName = toolData.name.trim();
    }
    return out;
  }
  if (id === 'pumpfun-sol-price') {
    return { chartMint: WSOL_MINT, chartSymbol: 'SOL', chartName: 'Solana' };
  }
  if (id === 'signal') {
    const raw = (params?.token && String(params.token).trim()) || 'bitcoin';
    const normalized = raw.toLowerCase();
    /** Maps signal `token` param → CoinGecko id + display labels */
    const SIGNAL_CHART = {
      bitcoin: { chartCoinId: 'bitcoin', chartSymbol: 'BTC', chartName: 'Bitcoin' },
      btc: { chartCoinId: 'bitcoin', chartSymbol: 'BTC', chartName: 'Bitcoin' },
      ethereum: { chartCoinId: 'ethereum', chartSymbol: 'ETH', chartName: 'Ethereum' },
      eth: { chartCoinId: 'ethereum', chartSymbol: 'ETH', chartName: 'Ethereum' },
      solana: { chartCoinId: 'solana', chartSymbol: 'SOL', chartName: 'Solana' },
      sol: { chartCoinId: 'solana', chartSymbol: 'SOL', chartName: 'Solana' },
    };
    const row = SIGNAL_CHART[normalized];
    if (row) {
      return {
        chartCoinId: row.chartCoinId,
        chartSymbol: row.chartSymbol,
        chartName: row.chartName,
      };
    }
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) && normalized.length <= 80) {
      return {
        chartCoinId: normalized,
        chartSymbol: normalized.slice(0, 8).toUpperCase(),
        chartName: normalized,
      };
    }
    return {};
  }
  return {};
}

/**
 * Client-only fields for pump.fun create-coin success (mint page, explorer, share).
 * @param {string} toolId
 * @param {Record<string, string>} params
 * @param {unknown} toolData
 * @returns {Record<string, string>}
 */
/**
 * Prefill hints for inline swap UI (extract mints + amount from user text).
 * @param {string | undefined} msg
 * @returns {{ suggestedMints: string[]; suggestedAmount?: string }}
 */
function swapUiHintsFromUserText(msg) {
  /** @type {{ suggestedMints: string[]; suggestedAmount?: string }} */
  const out = { suggestedMints: [] };
  if (!msg || typeof msg !== 'string') return out;
  const re = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
  const seen = new Set();
  let m;
  while ((m = re.exec(msg)) !== null) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      out.suggestedMints.push(m[0]);
    }
  }
  const solAmt = /\bswap\s+\$?([\d.,]+)\s*(?:sol|wsol)\b/i.exec(msg);
  const usdcAmt = /\bswap\s+\$?([\d.,]+)\s*usdc\b/i.exec(msg);
  const loose = /\bswap\s+\$?([\d.,]+)\b/i.exec(msg);
  if (solAmt) out.suggestedAmount = solAmt[1].replace(/,/g, '');
  else if (usdcAmt) out.suggestedAmount = usdcAmt[1].replace(/,/g, '');
  else if (loose) out.suggestedAmount = loose[1].replace(/,/g, '');
  return out;
}

/** Injected so the final LLM turn emits no visible text when the client shows the swap form. */
const SWAP_UI_EMPTY_LLM_REPLY =
  '[Syra already shows an inline swap form in the chat UI. Reply with ZERO assistant text: output nothing (empty string only). Do not write any words, apologies, explanations, or markdown.]';

/**
 * Parse mints/amount from the confirmation message sent when the user taps Swap in the inline form.
 * Accepts legacy "Execute jupiter-swap-order…" headers for older clients.
 * @param {string | undefined} text
 * @param {'pumpfun-agents-swap'} toolId
 * @returns {{ inputMint: string; outputMint: string; amount: string } | null}
 */
function parseAgentSwapParamsFromFormMessage(text, toolId) {
  if (!text || typeof text !== 'string') return null;
  if (toolId !== 'pumpfun-agents-swap') return null;
  const header =
    /Execute pumpfun-agents-swap with these exact parameters/i.test(text) ||
    /Execute jupiter-swap-order with these exact parameters/i.test(text);
  if (!header) return null;
  const inputM = /- inputMint:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/i.exec(text);
  const outputM = /- outputMint:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/i.exec(text);
  const amountQuoted = /- amount:\s*"([^"]+)"/i.exec(text);
  const amountBare = /- amount:\s*(\S+)/i.exec(text);
  const amount = (amountQuoted ? amountQuoted[1] : amountBare ? amountBare[1] : '').trim();
  if (!inputM || !outputM || !amount) return null;
  return { inputMint: inputM[1], outputMint: outputM[1], amount };
}

function pumpfunCreateCoinResultUiMeta(toolId, params, toolData) {
  if (toolId !== 'pumpfun-agents-create-coin' || !toolData || typeof toolData !== 'object') return {};
  const d = /** @type {Record<string, unknown>} */ (toolData);
  const mintRaw =
    typeof d.mintPublicKey === 'string'
      ? d.mintPublicKey
      : typeof d.mint === 'string'
        ? d.mint
        : '';
  const mint = mintRaw.trim();
  const sig = typeof d.submittedSignature === 'string' ? d.submittedSignature.trim() : '';
  /** @type {Record<string, string>} */
  const out = {};
  if (mint) out.pumpfunCreateMint = mint;
  if (sig) out.pumpfunCreateSignature = sig;
  const sym = params?.symbol != null ? String(params.symbol).trim() : '';
  const nm = params?.name != null ? String(params.name).trim() : '';
  if (sym) out.pumpfunCreateSymbol = sym.toUpperCase();
  if (nm) out.pumpfunCreateName = nm;
  return out;
}

/** User-facing model label for system prompts; never mention inference vendor brands to end users. */
export function buildLlmIdentityNote(modelId) {
  const resolved =
    modelId && typeof modelId === 'string' && modelId.trim()
      ? modelId.trim()
      : OPENROUTER_DEFAULT_MODEL;
  const entry = OPENROUTER_MODELS.find((x) => x.id === resolved);
  const displayName = entry?.name || resolved;
  return `LLM identity (user-facing): This turn uses the language model "${displayName}". If asked what model you are, what LLM powers Syra, or who hosts the API: answer with "${displayName}" only. Never name inference platforms, API marketplaces, hosting vendors, or third-party provider brands.`;
}

/** Clone messages with the identity note appended to the first system message (fresh copy per inference attempt). */
export function withLlmIdentitySystemNote(apiMessages, modelId) {
  const note = buildLlmIdentityNote(modelId);
  const first = apiMessages[0];
  if (first?.role === 'system' && typeof first.content === 'string') {
    return [{ ...first, content: `${first.content}\n\n${note}` }, ...apiMessages.slice(1)];
  }
  return [{ role: 'system', content: note }, ...apiMessages];
}

/**
 * Use OpenRouter LLM to pick up to 3 most relevant tools (and optional params) from the user question.
 * Returns tools ordered by relevance (most relevant first).
 * @param {string} userMessage - Last user message
 * @returns {Promise<{ tools: Array<{ toolId: string; params?: Record<string, string> }>; usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null }>}
 */
export async function selectToolsWithLlm(userMessage) {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return { tools: [], usage: null };
  }

  const tools = getToolsForLlmSelection();
  const toolsText = tools
    .map((t) => {
      let line = `- ${t.id}: ${t.name} — ${t.description}`;
      if (t.paramsHint) line += ` (${t.paramsHint})`;
      return line;
    })
    .join('\n');

  const systemContent = `You are a strict tool selector for a crypto AI agent. Your ONLY job is to decide which tools to call based on the user's question. You must respond with ONLY a valid JSON object — no markdown, no explanation, no other text.

CRITICAL RULES — READ CAREFULLY:

1. REAL-TIME DATA ALWAYS REQUIRES TOOLS when you can satisfy the tool's parameters from the user's message. Any question about current/live/latest prices, market data, token data, news, sentiment, trading signals, trending tokens, on-chain data, wallet balances, smart money activity, or any data that changes over time MUST select at least one tool IF you can fill required params. If the user did not provide an address, mint, query, or other required field, return {"tools": []} so the assistant can ask — do NOT select tools with empty params.

2. ONLY return {"tools": []} for purely conversational messages: greetings (hi, hello), "what can you do", general crypto concept explanations (e.g. "what is DeFi", "how does staking work"), opinions that don't need live data, topics unrelated to crypto, OR when the user wants live data but has not given the identifiers the tools need (then empty tools so the assistant asks).

3. When choosing among tools for which you already have complete parameters, prefer SELECTING A TOOL over returning empty tools.

QUICK ROUTING GUIDE (use this to pick the right tool fast):
— Live spot prices, market stats, or token safety from public sources are NOT exposed as Syra tools; for broad “what’s the price of X” without a dedicated tool, prefer exa-search for web context or explain the user can use an external price feed / playground proxy to upstream APIs.
— Trending Solana tokens / momentum → trending-jupiter
— Bundled dashboard (trending + Nansen smart money + Binance correlation) → analytics-summary
— News / latest updates → news
— Market sentiment → sentiment
— Trading signal → signal
— Smart money / whale activity → smart-money or nansen-smart-money-* (and other nansen-* tools as appropriate)
— Swap / buy / sell Solana tokens (including pump.fun curve or AMM) → pumpfun-agents-swap (pump.fun fun-block API; params inputMint, outputMint, amount in smallest units, user defaults to agent wallet)
— pump.fun: SOL/USD → pumpfun-sol-price; coin metadata → pumpfun-coin or pumpfun-coin-query (param mint); launch token → pumpfun-agents-create-coin; claim creator fees → pumpfun-collect-fees; fee sharing → pumpfun-sharing-config; tokenized agent invoice tx → pumpfun-agent-payments-build; verify invoice → pumpfun-agent-payments-verify
— Web search / research → exa-search
— Questions asking for live market data → select a tool only when you can supply that tool's required params from the message (otherwise {"tools": []} so the assistant asks for a symbol, mint, or URL).

Available tools (id, name, description):
${toolsText}

Response format: {"tools": [{"toolId": "<id>", "params": {}}, ...]}
- "tools" must be an array. Include 1 to 3 tools that best match the question.
- ONLY return {"tools": []} for casual chat / concept explanations that need zero live data.
- Each tool object: "toolId" (one of the ids above), "params" (object, see below).

PARAM RULES:
- For the "news" tool set "params": {"ticker": "BTC"} or {"ticker": "ETH"} or {"ticker": "SOL"} or {"ticker": "general"} when the user asks for news about a coin.
- For the "exa-search" tool set "params": {"query": "<search phrase from user>"} when the user asks for Exa search, web search, or insights on a topic (e.g. "bitcoin insight", "latest Nvidia news", "crypto market analysis"). The query should be the user's topic or question.
- For the "website-crawl" tool set "params": {"url": "<starting URL from user>"} when the user asks to crawl a website, summarize a site, get content from a URL, or ingest a docs site (e.g. "crawl https://example.com/docs", "summarize this website"). Extract the URL from the message; if no URL is given, do not select this tool. Optional: "limit" (e.g. 20), "depth" (e.g. 2).
- For the "signal" tool set "params": {"token": "bitcoin"} or {"token": "ethereum"} or {"token": "solana"} when the user asks for a signal for a specific coin.
- For "trending-jupiter" set "params": {} when the user asks for trending tokens on Jupiter / Solana momentum (this endpoint has no query params).
- For "analytics-summary" set "params": {} when the user wants a combined view: Jupiter trending, Nansen smart money, Binance correlation.
- For Nansen wallet/profiler tools (nansen-address-current-balance, nansen-address-historical-balances, nansen-profiler-counterparties) set "params": {"chain": "solana", "address": "<wallet address from user>"}.
- For Nansen smart-money tools (nansen-smart-money-netflow, nansen-smart-money-holdings, nansen-smart-money-dex-trades) set "params": {"chains": "[\"solana\"]"} or extract chain from user question.
- For Nansen TGM/token tools (nansen-tgm-holders, nansen-tgm-flow-intelligence, nansen-tgm-flows, nansen-tgm-dex-trades, nansen-tgm-pnl-leaderboard) set "params": {"chain": "solana", "token_address": "<token contract address from user>"}; add date_from/date_to for flows or pnl-leaderboard if user specifies a date range.
- For "nansen-token-screener" set "params": {"chain": "solana"} or chain from user.
- For "purch-vault-search" set "params": {"q": "<search query>"} or {"category": "development"} or {"productType": "skill"} when the user asks to search Purch Vault for skills, knowledge, or personas. Optional: category (marketing, development, automation, career, ios, productivity), productType (skill, knowledge, persona), minPrice, maxPrice, limit.
- For "purch-vault-buy" set "params": {"slug": "<item slug from search>"} when the user asks to buy a Purch Vault item (e.g. after search). Slug is required (e.g. "faith"); optional email.
- For "tempo-token-list" set "params": {"chainId": "4217"} or {"chainId": "42431"} when the user asks for Tempo tokens, contract addresses on Tempo, official token list, or which stablecoins exist on Tempo mainnet vs testnet. Default chainId is 4217 (mainnet) if not specified.
- For "tempo-network-info" set "params": {} when the user asks for Tempo RPC URL, chain ID, explorer, how to connect to Tempo, or public documentation links.
- For "tempo-send-payout" set "params": {"amountUsd": "<number from user>"} when the user asks to receive a payout, withdrawal, or transfer on Tempo blockchain in stablecoin; optional "memo" (e.g. invoice id). Only select if the user explicitly wants money sent on Tempo. The server sends funds only to the user’s linked EVM wallet or Base agent wallet—never pass a recipient address.
- For pump.fun coin metadata use "pumpfun-coin-query" with "params": {"mint": "<base58 mint>"} (or pumpfun-coin with same mint).
- For token swap / buy / sell on Solana use "pumpfun-agents-swap" with params inputMint, outputMint, amount (string smallest units), optional user (defaults to agent wallet).
- For pump.fun launch use "pumpfun-agents-create-coin" with name, symbol, uri, solLamports (string), optional user.
- For pump.fun collect creator fees use "pumpfun-collect-fees" with mint, optional user.
- For pump.fun fee sharing use "pumpfun-sharing-config" with mint, shareholders (JSON string), optional user.
- For tokenized agent invoice payment tx use "pumpfun-agent-payments-build" with agentMint, currencyMint, amount, memo, startTime, endTime (strings), optional user.
- For verify agent invoice use "pumpfun-agent-payments-verify" with agentMint, currencyMint, amount, memo, startTime, endTime as numbers, optional user.
- For all other tools use "params": {}.
- Do not duplicate the same toolId in the array. Maximum ${MAX_TOOLS_PER_REQUEST} tools.`;

  const userContent = `User question: ${userMessage.trim()}`;

  try {
    const { response, usage } = await callOpenRouter(
      [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      { max_tokens: AGENT_CHAT_TOOL_SELECT_MAX_TOKENS, temperature: 0.05 }
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
              Object.entries(item.params)
                .filter(([k, v]) => typeof k === 'string' && v != null && v !== '')
                .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
            )
          : {};
      result.push({ toolId, params });
    }
    return { tools: result, usage: usage ?? null };
  } catch (err) {
    return { tools: [], usage: null };
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
    /swap\s+\$?([\d.,]+)\s+\$?([A-Za-z0-9]+)\s+(?:for|to|into)\s+\$?([A-Za-z0-9]+)/i.exec(text);
  if (!match) return null;
  const amountStr = match[1].replace(/,/g, '');
  const fromSymbol = match[2].toUpperCase();
  const toSymbol = match[3].toUpperCase();
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
 * When the user message matches a simple SOL↔USDC "swap …" phrase, trust parsed mints
 * over LLM-filled `inputMint`/`outputMint` (models often hallucinate a wrong USDC mint).
 * Mutates `params` in place.
 * @param {string | undefined} text
 * @param {Record<string, string>} params
 */
function applyParseJupiterSwapParamsFromTextIfMatched(text, params) {
  const inferred = parseJupiterSwapParamsFromText(text);
  if (!inferred) return;
  params.inputMint = inferred.inputMint;
  params.outputMint = inferred.outputMint;
  params.amount = inferred.amount;
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
export function formatToolResultForLlm(data, toolId) {
  if (
    typeof toolId === 'string' &&
    toolId.startsWith('pumpfun-') &&
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof data.transaction === 'string'
  ) {
    const txLen = data.transaction.length;
    const { transaction: _omit, ...rest } = data;
    const summary = {
      ...rest,
      transaction: `[omitted base64 tx, ${txLen} chars — do not paste back; use submittedSignature / other fields]`,
    };
    const raw = JSON.stringify(summary, null, 2);
    return raw.length <= MAX_TOOL_RESULT_CHARS
      ? raw
      : raw.slice(0, MAX_TOOL_RESULT_CHARS) + '\n\n[... truncated.]';
  }
  if (toolId === 'analytics-summary' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      return condensedAnalyticsSummary(data);
    } catch {
      // use truncation fallback
    }
  }
  // Website crawl: present crawled pages as readable sections for summarization
  if (toolId === 'website-crawl' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      const records = Array.isArray(data.records) ? data.records : [];
      const status = data.status ?? 'unknown';
      if (status !== 'completed' || records.length === 0) {
        return `[Website crawl ended with status: ${status}. ${data.message || ''} No page content to summarize.]`;
      }
      const lines = [`Crawled ${records.length} page(s) from the website (status: ${data.status}). Use ONLY this content to answer or summarize.`, ''];
      for (const r of records) {
        const title = r.title || r.url || 'Untitled';
        const md = r.markdown || r.content || '';
        lines.push(`## ${title}\nURL: ${r.url || ''}\n\n${md.slice(0, 6000)}${md.length > 6000 ? '\n\n[... truncated]' : ''}\n`);
      }
      const out = lines.join('\n');
      return out.length <= MAX_TOOL_RESULT_CHARS ? out : out.slice(0, MAX_TOOL_RESULT_CHARS) + "\n\n[... Result truncated.]";
    } catch {
      // fallback to raw below
    }
  }
  // Purch Vault search: list items for the user to choose from
  if (toolId === 'purch-vault-search' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      const items = Array.isArray(data.items) ? data.items : [];
      const nextCursor = data.nextCursor;
      if (items.length === 0) {
        return '[Purch Vault search returned no items. Suggest trying a different query or category.]';
      }
      const lines = ['Purch Vault results (skills, knowledge, personas):'];
      for (const item of items.slice(0, 20)) {
        const title = item.title || item.slug || '—';
        const productType = item.productType || '—';
        const price = item.price != null ? `$${item.price}` : '—';
        const category = item.category || '—';
        const desc = (item.cardDescription || '').slice(0, 120);
        lines.push(`- **${title}** (${productType}) | ${price} | ${category} | slug: \`${item.slug || ''}\`${desc ? ` — ${desc}...` : ''}`);
      }
      if (items.length > 20) lines.push(`... and ${items.length - 20} more. Use slug to buy.`);
      if (nextCursor) lines.push('(More results available with cursor pagination.)');
      return lines.join('\n');
    } catch {
      // fallback to raw
    }
  }
  // Purch Vault buy: purchase complete summary
  if (toolId === 'purch-vault-buy' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      const item = data.item || {};
      const payment = data.payment || {};
      const lines = [
        data.message || 'Purchase complete.',
        `Item: ${item.title || item.slug || '—'} (${item.productType || '—'})`,
        `Price: ${payment.amountUsdc != null ? payment.amountUsdc : payment.amountMicroUsdc || '—'} USDC`,
        data.downloadCompleted ? 'Download completed; file was received.' : '',
      ].filter(Boolean);
      return lines.join('\n');
    } catch {
      // fallback to raw
    }
  }
  // Squid Router cross-chain route: present route summary and transactionRequest for user to sign
  if (toolId === 'squid-route' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      const route = data.route || data;
      const txReq = route.transactionRequest;
      const quoteId = route.quoteId ?? data.quoteId;
      const requestId = data.requestId;
      const lines = [
        'Cross-chain route (Squid Router):',
        requestId ? `Request ID: ${requestId} (use for status check)` : '',
        quoteId ? `Quote ID: ${quoteId} (required for status check)` : '',
        txReq
          ? `First-leg transaction: sign and submit on source chain. target: ${txReq.target || '—'}, data length: ${(txReq.data && txReq.data.length) || 0}, value: ${txReq.value ?? '0'}, gasLimit: ${txReq.gasLimit ?? '—'}. After submitting, use squid-status with transactionId, requestId, fromChainId, toChainId, quoteId to track status.`
          : 'No transactionRequest in response; route may be unsupported for this pair.',
      ].filter(Boolean);
      return lines.join('\n');
    } catch {
      // fallback to raw below
    }
  }
  // Squid Router cross-chain status
  if (toolId === 'squid-status' && data && typeof data === 'object' && !Array.isArray(data)) {
    try {
      const status = data.squidTransactionStatus ?? data.status ?? 'unknown';
      const lines = [`Cross-chain transaction status: ${status}`, data.message ? `Message: ${data.message}` : ''].filter(Boolean);
      return lines.join('\n');
    } catch {
      // fallback to raw below
    }
  }
  // Jupiter trending (Corbits): only present real API data
  if (toolId === 'trending-jupiter' && data && typeof data === 'object') {
    const mints = Array.isArray(data.contractAddresses) ? data.contractAddresses : [];
    if (mints.length === 0 && !data.tokenSummary && !data.newsSummary) {
      return '[The trending Jupiter API returned no data. Do NOT invent token names or prices. Tell the user trending data could not be loaded and suggest trying again later.]';
    }
    try {
      const lines = ['Trending on Jupiter (live data):'];
      const summaries = Array.isArray(data.tokenSummary) ? data.tokenSummary : [];
      const news = Array.isArray(data.newsSummary) ? data.newsSummary : [];
      for (let i = 0; i < Math.min(15, Math.max(mints.length, summaries.length)); i++) {
        const mint = mints[i];
        const sum = summaries[i];
        const line = typeof sum === 'string' && sum.trim() ? sum.trim().slice(0, 500) : mint ? `mint: ${mint}` : '—';
        lines.push(`- ${line}`);
      }
      if (news.length > 0) {
        lines.push('News snippets:');
        for (const n of news.slice(0, 5)) {
          if (typeof n === 'string' && n.trim()) lines.push(`  • ${n.trim().slice(0, 300)}`);
        }
      }
      if (mints.length > 15) lines.push(`... and ${mints.length - 15} more entries.`);
      return lines.join('\n');
    } catch {
      // fallback to raw below
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
 * @param {Record<string, unknown>} summary - Response from /analytics/summary
 * @returns {string}
 */
function condensedAnalyticsSummary(summary) {
  const lines = [];
  const sections = summary.sections && typeof summary.sections === 'object' ? summary.sections : {};
  const sectionOrder = ['price', 'correlation', 'onChain'];
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
 * Call x402 tool with agent wallet (server pays in one shot; agent balance is reduced on-chain).
 * When connectedWalletAddress is set, API may apply dev pricing (same as API playground) for that wallet.
 */
async function callToolWithAgentWallet(anonymousId, url, method, query, body, connectedWalletAddress) {
  const result = await callX402V2WithAgent({
    anonymousId,
    url,
    method: method || 'GET',
    query: method === 'GET' ? query || {} : {},
    body: method === 'POST' ? body : undefined,
    connectedWalletAddress: connectedWalletAddress || undefined,
  });
  if (!result.success) {
    const status = result.budgetExceeded ? 402 : 502;
    return { status, error: result.error, budgetExceeded: result.budgetExceeded };
  }
  return { status: 200, data: result.data };
}

/**
 * Call x402 v2 tool with treasury wallet (AGENT_PRIVATE_KEY). Used for 1M+ SYRA holders (free tools).
 */
export async function callToolWithTreasury(url, method, query, body) {
  const result = await callX402V2WithTreasury({
    url,
    method: method || 'GET',
    query: method === 'GET' ? query || {} : {},
    body: method === 'POST' ? body : undefined,
  });
  if (!result.success) {
    const status = result.budgetExceeded ? 402 : 502;
    return { status, error: result.error, budgetExceeded: result.budgetExceeded };
  }
  return { status: 200, data: result.data };
}

// GET /models - List curated OpenRouter models for the agent chat (enriched from OpenRouter /models when possible).
router.get('/models', async (_req, res) => {
  try {
    const fromApi = await getOpenRouterModels();
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return res.json({ models: fromApi });
    }
  } catch {
    // use config fallback
  }
  res.json({ models: OPENROUTER_MODELS });
});

// POST /completion - Get LLM completion from OpenRouter. Tool is chosen dynamically by the LLM from the user question.
// Playground-style: when tool returns 402, we return 402 to client; client calls pay-402 then retries with X-Payment.
// When client sends X-Payment, we forward it to the tool request.
router.post('/completion', async (req, res) => {
  const completionStart = Date.now();
  try {
    const {
      messages: bodyMessages,
      systemPrompt,
      anonymousId,
      toolRequest: clientToolRequest,
      walletConnected,
      model: modelId,
      /** Client-provided agent wallet balances (same source as UI dropdown); use when present so chat matches what user sees */
      agentWalletBalances,
      /** Persisted chat id — enables per-thread LLM token budget and server-side usage accounting */
      chatId: bodyChatId,
    } = req.body || {};
    if (!Array.isArray(bodyMessages) || bodyMessages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }
    let apiMessages = bodyMessages.map((m) => ({
      role: m.role || 'user',
      content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
    }));
    const historyCompact = truncateConversationForLlm(apiMessages, AGENT_CHAT_HISTORY_MAX_CHARS);
    apiMessages = historyCompact.messages;

    let chatIdForBudget = null;
    let sessionTokensUsedBefore = 0;
    const rawChatId = typeof bodyChatId === 'string' ? bodyChatId.trim() : '';
    if (rawChatId && anonymousId && mongoose.Types.ObjectId.isValid(rawChatId)) {
      const existing = await Chat.findOne({
        _id: rawChatId,
        anonymousId: String(anonymousId).trim(),
      })
        .select('llmSessionTokensTotal')
        .lean();
      if (existing) {
        chatIdForBudget = rawChatId;
        sessionTokensUsedBefore = Number(existing.llmSessionTokensTotal) || 0;
      }
    }
    if (chatIdForBudget != null && sessionTokensUsedBefore >= AGENT_CHAT_SESSION_LLM_TOKEN_CAP) {
      return res.json({
        success: true,
        response: enforceSyraBranding(
          'This chat has reached the Syra AI usage limit for this conversation (cost control). **Start a New Chat** to keep going — your saved chats stay in the sidebar.'
        ),
        sessionTokenBudgetExceeded: true,
        sessionLlmTokensUsed: sessionTokensUsedBefore,
        sessionLlmTokenCap: AGENT_CHAT_SESSION_LLM_TOKEN_CAP,
      });
    }

    /** Linked wallet for this session; reused below for SYRA treasury + tool path (avoids double DB read). */
    let connectedWalletFromDb = null;
    if (anonymousId && walletConnected) {
      try {
        connectedWalletFromDb = await getConnectedWalletAddress(anonymousId);
      } catch (earlyCwErr) {
        console.error('[agent/chat/completion] getConnectedWalletAddress (quota) failed:', earlyCwErr?.message || earlyCwErr);
      }
    }

    const quota = isAgentChatDailyLimitBypassWallet(connectedWalletFromDb)
      ? { allowed: true }
      : await tryConsumeAgentChatDailyQuestion(anonymousId);
    if (!quota.allowed) {
      return res.json({
        success: true,
        response: enforceSyraBranding(buildAgentChatDailyLimitMessage()),
      });
    }

    const lastUserMessage = apiMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .pop();

    const toolSelectStart = Date.now();
    /** Normalize toolId (legacy Jupiter swap ids → pump.fun swap), "squid_route" -> "squid-route", etc. */
    const normalizeToolId = (id) => {
      if (id === 'jupiter_swap_order' || id === 'jupiter-swap-order') return 'pumpfun-agents-swap';
      if (id === 'squid_route') return 'squid-route';
      if (id === 'squid_status') return 'squid-status';
      if (typeof id === 'string' && id.startsWith('pumpfun') && id.includes('_')) return id.replace(/_/g, '-');
      return id;
    };
    /** @type {Array<{ toolId: string; params?: Record<string, string> }>} */
    let matchedTools;
    /** OpenRouter usage from tool-selection call only (null when client supplied tools or selection skipped). */
    let toolSelectUsage = null;
    if (clientToolRequest?.toolId != null) {
      const toolId = normalizeToolId(clientToolRequest.toolId);
      matchedTools = [{ toolId, params: clientToolRequest.params || {} }];
    } else if (Array.isArray(clientToolRequest?.tools) && clientToolRequest.tools.length > 0) {
      matchedTools = clientToolRequest.tools
        .slice(0, MAX_TOOLS_PER_REQUEST)
        .filter((t) => t?.toolId && getAgentTool(t.toolId))
        .map((t) => ({ toolId: normalizeToolId(t.toolId), params: t.params || {} }));
    } else {
      try {
        const sel = await selectToolsWithLlm(lastUserMessage);
        matchedTools = sel.tools;
        toolSelectUsage = sel.usage;
      } catch (toolSelectErr) {
        console.error('[agent/chat/completion] selectToolsWithLlm threw unexpectedly:', toolSelectErr?.message || toolSelectErr);
        matchedTools = [];
      }
    }

    const capabilitiesList = getCapabilitiesList().join('\n');

    let useTreasuryForTools = false;
    if (anonymousId && walletConnected) {
      try {
        let cwTreasury = connectedWalletFromDb;
        if (!cwTreasury) {
          cwTreasury = await getConnectedWalletAddress(anonymousId);
        }
        useTreasuryForTools = !!(cwTreasury && (await isSyraHolderEligible(cwTreasury)));
      } catch (treasuryErr) {
        console.error('[agent/chat/completion] treasury eligibility check failed:', treasuryErr?.message || treasuryErr);
      }
    }

    let systemParts = [];
    systemParts.push(
      `You are Syra, a smart AI agent for crypto, web3, and blockchain. You can chat naturally and also use paid tools when the user asks for specific data.`
    );
    systemParts.push(
      `Syra's paid tools (user pays from agent wallet when a tool is used):\n${capabilitiesList}`
    );
    systemParts.push(
      `When the user is just chatting—greetings (hi, hello), "what can you do", general crypto questions, or casual conversation—respond naturally and helpfully. Do not say "I don't have a tool for that" or list every capability in response to a simple greeting. Briefly mention what you can do only when it fits (e.g. if they ask "what can you do").`
    );
    systemParts.push(
      `When the user asks for something specific (e.g. "give me X", "show me Y data") that is not covered by the tools above, then say Syra doesn't have that capability right now and briefly list what Syra can do. Do not make up data or use general knowledge for topics that require a tool we don't have.`
    );
    systemParts.push(
      `CRITICAL — NEVER FABRICATE REAL-TIME DATA:
You MUST NEVER make up, guess, or use training data for: prices, market caps, volumes, token metrics, news headlines, trending tokens, wallet balances, smart money flows, trading signals, on-chain data, or ANY information that changes over time. These MUST come from tool results only.
- If the user asks for real-time data (price, market data, news, signals, etc.) and you did NOT receive tool results in this conversation, tell the user: "Let me fetch that data for you" or explain that the tool needs to be called. NEVER answer with a made-up number.
- If a tool was called but failed or returned an error, say the data could not be fetched right now. NEVER fill in the gap with your own data.
- You CAN freely answer: general crypto concepts (what is DeFi, how staking works), explain mechanisms, give educational content, discuss strategy frameworks, and have casual conversation — these don't need tools.
- The rule is simple: if it has a number that changes (price, volume, TVL, market cap, APR, etc.), it MUST come from a tool.`
    );
    systemParts.push(
      `Response format: Always reply in clear, human-readable text. Use markdown: headings (##), bullet points, numbered lists, and tables where they help readability. Format numbers, prices, and percentages clearly (e.g. $1,234.56, +2.5%). NEVER include raw JSON, code blocks showing tool calls, "tool_calls:" blocks, or blocks like {"tool": "..."} or {"name": "...", "arguments": "..."} in your reply—turn all data into plain, well-formatted prose and tables only. Tools are called automatically by the system; you must NEVER output tool_calls or function_call JSON yourself. When you receive results from multiple tools (separated by ---), synthesize them into one coherent answer that addresses the user's question.`
    );
    systemParts.push(
      `Model disclosure: If asked what LLM/model powers Syra or you, answer with the language model name only (the server appends the exact name for this session before inference). Never name third-party inference or API provider brands.`
    );
    systemParts.push(
      `Branding rule: Never mention third-party inference or API marketplace names in user-facing replies. Always present the assistant and platform brand as "Syra".`
    );
    if (anonymousId) {
      let usdcBalance = 0;
      let solBalance = 0;
      let agentAddr = '';
      try {
        const useClientBalances =
          agentWalletBalances &&
          typeof agentWalletBalances.usdcBalance === 'number' &&
          typeof agentWalletBalances.solBalance === 'number';
        if (useClientBalances) {
          usdcBalance = agentWalletBalances.usdcBalance;
          solBalance = agentWalletBalances.solBalance;
          agentAddr = (await getAgentAddress(anonymousId)) ?? '';
        } else {
          const balanceResult = await getAgentBalances(anonymousId);
          usdcBalance = balanceResult?.usdcBalance ?? 0;
          solBalance = balanceResult?.solBalance ?? 0;
          agentAddr = balanceResult?.agentAddress ?? '';
        }
      } catch (balErr) {
        console.error('[agent/chat/completion] balance fetch for system prompt failed:', balErr?.message || balErr);
      }
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
    /** @type {Array<{ name: string; status: 'complete' | 'error' | 'skipped'; costUsd?: number; included?: boolean }>} */
    let toolUsages = [];
    let hadToolResults = false;
    /** When pump.fun create-coin was skipped for missing params, client shows an inline launch form. */
    let offerPumpfunCreateUi = false;
    /** pump.fun swap missing params — client shows inline swap form. */
    let offerPumpfunSwapUi = false;
    /** @type {{ suggestedMints: string[]; suggestedAmount?: string } | null} */
    let pumpfunSwapInlineHints = null;
    /** Skip OpenRouter when the only "tool errors" are silent swap UI hints (form shown, no assistant copy). */
    let skipFinalLlmForSilentSwapUi = false;
    /** pump.fun agents swap: on-chain submit outcome if the final model reply is empty (OpenRouter placeholder). */
    let lastPumpfunAgentsSwapChainResult = null;
    if (!matchedTools || matchedTools.length === 0) {
      // No tools matched — but if the user is asking for real-time data, inject a guardrail
      // so the LLM doesn't fabricate prices/data from training knowledge.
      if (lastUserMessage && /\b(price|how much|market cap|volume|trending|latest news|current|live|real.?time|what('?s| is) .{0,30} (price|worth|trading|at)|ticker|apy|apr|tvl|floor price)\b/i.test(lastUserMessage)) {
        apiMessages.push({
          role: 'user',
          content: `[SYSTEM NOTE: The user appears to be asking for real-time market data, but no tool was called for this request. You MUST NOT answer with any specific numbers, prices, or data from your training knowledge. Instead, tell the user you'll fetch the data using your tools, or ask them to rephrase their question so the right tool can be selected. If they need a price, suggest they ask like "What's the price of BTC?" or "Show me SOL price". Do NOT make up any numbers.]`,
        });
      }
    } else if (walletConnected === false) {
      toolUsages = matchedTools.map((m) => {
        const t = getAgentTool(m.toolId);
        const costUsd = t ? getEffectivePriceUsd(t.priceUsd, null) ?? t.priceUsd : 0;
        return { name: t ? t.name : m.toolId, status: 'error', costUsd: Number(costUsd) || 0 };
      });
      const toolIds = matchedTools.map((t) => t.toolId).join(', ');
      apiMessages.push({
        role: 'user',
        content: `[The user asked for something that requires paid tool(s) (${toolIds}), but they have not connected a wallet. Reply that they need to connect their wallet to use tools and get this information. You can mention they can chat about crypto without a wallet, but tools and realtime data require a connected wallet.]`,
      });
    } else if (anonymousId) {
      const useTreasury = useTreasuryForTools;
      let connectedWallet = connectedWalletFromDb;
      try {
        if (connectedWallet == null && walletConnected) {
          connectedWallet = await getConnectedWalletAddress(anonymousId);
        }
      } catch (cwErr) {
        console.error('[agent/chat/completion] getConnectedWalletAddress failed:', cwErr?.message || cwErr);
      }
      const useClientBalancesForTools =
        agentWalletBalances &&
        typeof agentWalletBalances.usdcBalance === 'number' &&
        typeof agentWalletBalances.solBalance === 'number';
      let usdcBalance = 0;
      let solBalanceForSwap = 0;
      try {
        if (useClientBalancesForTools) {
          usdcBalance = agentWalletBalances.usdcBalance;
          solBalanceForSwap = agentWalletBalances.solBalance;
        } else {
          const balanceInfoForSwap = await getAgentBalances(anonymousId);
          usdcBalance = balanceInfoForSwap?.usdcBalance ?? 0;
          solBalanceForSwap = balanceInfoForSwap?.solBalance ?? 0;
        }
      } catch (balErr) {
        console.error('[agent/chat/completion] tool balance fetch failed:', balErr?.message || balErr);
      }
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
        if (!tool) continue;
        const effectivePrice = getEffectivePriceUsd(tool.priceUsd, connectedWallet) ?? tool.priceUsd;
        const requiredUsdc = effectivePrice;
        // pump.fun swap (fun-block): only call upstream after the user confirms via the inline form template.
        if (matched.toolId === 'pumpfun-agents-swap') {
          const isPumpfunSwapFormConfirm =
            /Execute pumpfun-agents-swap with these exact parameters/i.test(lastUserMessage) ||
            /Execute jupiter-swap-order with these exact parameters/i.test(lastUserMessage);

          if (isPumpfunSwapFormConfirm) {
            const fromForm = parseAgentSwapParamsFromFormMessage(lastUserMessage, 'pumpfun-agents-swap');
            if (fromForm) {
              params.inputMint = fromForm.inputMint;
              params.outputMint = fromForm.outputMint;
              params.amount = fromForm.amount;
            }
            await normalizeJupiterAmountToBaseUnits(params);
          } else {
            if (!params.inputMint || !params.outputMint || !params.amount) {
              const fromLlm = normalizeJupiterSwapParams(params);
              if (fromLlm) {
                params = { ...params, ...fromLlm };
              }
            }
            if (!params.inputMint || !params.outputMint || !params.amount) {
              const inferredSwap = parseJupiterSwapParamsFromText(lastUserMessage);
              if (inferredSwap) {
                params = { ...params, ...inferredSwap };
              }
            }
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
            await normalizeJupiterAmountToBaseUnits(params);
            applyParseJupiterSwapParamsFromTextIfMatched(lastUserMessage, params);

            offerPumpfunSwapUi = true;
            pumpfunSwapInlineHints = swapUiHintsFromUserText(lastUserMessage);
            if (params.inputMint && params.outputMint) {
              pumpfunSwapInlineHints.suggestedMints = [params.outputMint, params.inputMint];
            }
            toolErrors.unshift(SWAP_UI_EMPTY_LLM_REPLY);
            toolUsages.push({ name: tool.name, status: 'skipped', costUsd: 0 });
            continue;
          }

          if (!params.inputMint || !params.outputMint || !params.amount) {
            offerPumpfunSwapUi = true;
            pumpfunSwapInlineHints = swapUiHintsFromUserText(lastUserMessage);
            if (params.inputMint && params.outputMint) {
              pumpfunSwapInlineHints.suggestedMints = [params.outputMint, params.inputMint];
            }
            toolErrors.unshift(SWAP_UI_EMPTY_LLM_REPLY);
            toolUsages.push({ name: tool.name, status: 'skipped', costUsd: 0 });
            continue;
          }
        }

        if (matched.toolId.startsWith('pumpfun-')) {
          params = await enrichPumpfunToolParams(anonymousId, matched.toolId, params);
        }
        const paramGateMsg = getAgentToolParamGateMessage(matched.toolId, tool.method || 'GET', params);
        if (paramGateMsg) {
          if (matched.toolId === 'pumpfun-agents-create-coin') {
            offerPumpfunCreateUi = true;
            toolErrors.unshift(
              '[Syra shows an inline pump.fun launch form in the chat. Reply in at most 2 short sentences: welcome them and say they can enter details in the form and tap Create when ready. Do not list token name, symbol, metadata URI, or SOL as bullets or a numbered checklist.]'
            );
          } else if (matched.toolId === 'pumpfun-agents-swap') {
            offerPumpfunSwapUi = true;
            pumpfunSwapInlineHints = swapUiHintsFromUserText(lastUserMessage);
            toolErrors.unshift(SWAP_UI_EMPTY_LLM_REPLY);
          } else {
            toolErrors.push(paramGateMsg);
          }
          toolUsages.push({ name: tool.name, status: 'skipped', costUsd: 0 });
          continue;
        }
        // Free tools (e.g. tempo-network-info at $0) must not require USDC balance
        if (!useTreasury && requiredUsdc > 0 && (usdcBalance <= 0 || usdcBalance < requiredUsdc)) {
          const msg =
            usdcBalance <= 0
              ? `The user's agent wallet has 0 USDC balance. The requested paid tool (${tool.name}) costs $${requiredUsdc.toFixed(4)}. Explain that they need to deposit USDC to their agent wallet to use this feature.`
              : `The user's agent wallet has insufficient USDC (balance: $${usdcBalance.toFixed(4)}, required for ${tool.name}: $${requiredUsdc.toFixed(4)}). Explain this and ask them to deposit more USDC.`;
          toolErrors.push(msg);
          toolUsages.push({ name: tool.name, status: 'skipped', costUsd: 0 });
          continue;
        }
        // hey.lol tools: backend must send anonymousId so the heylol route can resolve the agent wallet
        if (tool.path && tool.path.startsWith('/heylol')) {
          params = { ...params, anonymousId };
        }
        // Nansen x402 tools: call real Nansen API (api.nansen.ai) with agent wallet; no Syra route
        // Purch Vault: call api.purch.xyz (search, or buy + sign/submit + download)
        let result;
        if (tool.nansenPath) {
          const nansenResult = await callNansenWithAgent(anonymousId, tool.nansenPath, params);
          result = nansenResult.success
            ? { status: 200, data: nansenResult.data }
            : {
                status: nansenResult.budgetExceeded ? 402 : 502,
                error: nansenResult.error,
                budgetExceeded: nansenResult.budgetExceeded,
              };
        } else if (tool.zerionPath) {
          const zerionResult = await callZerionWithAgent(
            anonymousId,
            tool.zerionPath,
            tool.method || 'GET',
            params
          );
          result = zerionResult.success
            ? { status: 200, data: zerionResult.data }
            : {
                status: zerionResult.budgetExceeded ? 402 : 502,
                error: zerionResult.error,
                budgetExceeded: zerionResult.budgetExceeded,
              };
        } else if (tool.purchVaultPath) {
          if (tool.id === 'purch-vault-search') {
            const searchResult = await purchVaultSearch(anonymousId, params);
            result = searchResult.success
              ? { status: 200, data: searchResult.data }
              : { status: 502, error: searchResult.error, budgetExceeded: searchResult.budgetExceeded };
          } else if (tool.id === 'purch-vault-buy') {
            const slug = params.slug && String(params.slug).trim();
            if (!slug) {
              result = { status: 400, error: 'slug is required to buy a Purch Vault item (e.g. from search results)' };
            } else {
              const buyResult = await purchVaultBuy(anonymousId, {
                slug,
                email: (params.email && String(params.email).trim()) || undefined,
              });
              if (!buyResult.success) {
                result = {
                  status: 502,
                  error: buyResult.error,
                  budgetExceeded: buyResult.budgetExceeded,
                };
              } else {
                try {
                  const { signature } = await signAndSubmitSwapTransaction(
                    anonymousId,
                    buyResult.data.serializedTransaction
                  );
                  const downloadResult = await purchVaultDownload(anonymousId, {
                    purchaseId: buyResult.data.purchaseId,
                    downloadToken: buyResult.data.downloadToken,
                    txSignature: signature,
                  });
                  if (downloadResult.success) {
                    result = {
                      status: 200,
                      data: {
                        purchaseId: buyResult.data.purchaseId,
                        item: buyResult.data.item,
                        payment: buyResult.data.payment,
                        purchased: true,
                        downloadCompleted: true,
                        message:
                          'Purchase complete. The file was received. You can re-download from Purch Vault with the same purchase if needed.',
                      },
                    };
                  } else {
                    result = {
                      status: 502,
                      error: `Purchase submitted (tx signed) but download failed: ${downloadResult.error}`,
                    };
                  }
                } catch (signErr) {
                  result = {
                    status: 502,
                    error: signErr?.message || 'Failed to sign or submit purchase transaction',
                  };
                }
              }
            }
          } else {
            result = { status: 502, error: `Unknown Purch Vault tool: ${tool.id}` };
          }
        } else if (tool.tempoPublic) {
          // Synthetic paths (/__tempo_public__/…) are not HTTP routes; mirror POST /agent/tools/call
          if (tool.tempoPublic === 'networks') {
            result = { status: 200, data: TEMPO_PUBLIC_REFERENCE };
          } else if (tool.tempoPublic === 'tokenlist') {
            const chainId = params.chainId || params.chain_id || '4217';
            const listResult = await fetchTempoTokenList(chainId);
            result = listResult.ok
              ? { status: 200, data: listResult.data }
              : { status: 502, error: listResult.error };
          } else {
            result = { status: 502, error: `Unknown Tempo public tool: ${tool.id}` };
          }
        } else if (tool.agentDirect) {
          const out = await runAgentPartnerDirectTool(tool.id, params, { host: req.get('host') });
          result = out.ok
            ? { status: out.httpStatus ?? 200, data: out.data }
            : { status: out.status ?? 502, error: out.error };
        } else {
          let toolPath = tool.path;
          let callParams = { ...params };
          const pathSub = substituteAgentToolPath(toolPath, callParams);
          if ('error' in pathSub && pathSub.error) {
            toolErrors.push(
              `[Paid tool "${tool.name}" was not run — no charge: ${pathSub.error} Explain briefly; ask the user for the missing value. Do not invent data.]`
            );
            toolUsages.push({ name: tool.name, status: 'skipped', costUsd: 0 });
            continue;
          }
          toolPath = pathSub.path;
          if (pathSub.consumed?.length) {
            callParams = omitParamsKeys(callParams, pathSub.consumed);
          }
          if (matched.toolId === 'signal' && !String(callParams.source || '').trim()) {
            callParams = { ...callParams, source: 'coingecko' };
          }
          const url = `${resolveAgentBaseUrl(req)}${toolPath}`;
          const method = tool.method || 'GET';
          result = useTreasury
            ? await callToolWithTreasury(
                url,
                method,
                method === 'GET' ? callParams : {},
                method === 'POST' ? callParams : undefined
              )
            : await callToolWithAgentWallet(
                anonymousId,
                url,
                method,
                method === 'GET' ? callParams : {},
                method === 'POST' ? callParams : undefined,
                connectedWallet
              );
        }
        if (result.status !== 200) {
          const err = result.error || 'Request failed';
          const needsSol = /SOL|transaction fee|debit an account|no record of a prior credit/i.test(err);
          const needsUsdc = /USDC|insufficient|no USDC|token account/i.test(err);
          const budgetExceeded = result.budgetExceeded === true;
          // Upstream / infra / rate limits: never steer users to USDC/SOL (see generic else branch).
          const isBackendError =
            /timeout|CLI|502|503|504|request failed|fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND/i.test(err) ||
            /403|401|Forbidden|permission\s*(issue|error)|temporarily unavailable|service.*unavailable/i.test(err) ||
            /rate limit|too many requests|throttl|way too many|\b429\b|\b418\b|-1003|-1015/i.test(err) ||
            /Binance klines|Failed to fetch news|News service is temporarily/i.test(err);
          let instruction = `[Paid tool "${tool.name}" failed: ${err}. Explain what went wrong in plain language.`;
          if (budgetExceeded) {
            instruction += ` This was blocked by the agent's spend limit (Sentinel budget). Tell the user their agent has hit its hourly/daily budget cap; they can try again later or adjust limits in settings.`;
          } else if (isBackendError) {
            instruction += ` This was a temporary service or API access issue, not a wallet balance problem. Tell the user the tool could not fetch data right now and they can try again in a moment. Do NOT suggest checking USDC or SOL for this error.`;
          } else if (useTreasury) {
            instruction += ` Tell the user their agent wallet needs SOL to pay Solana transaction fees—they should send a small amount of SOL (e.g. 0.01) to their agent wallet address.`;
          } else if (needsUsdc) {
            instruction += ` Tell the user they need to deposit USDC to their agent wallet to pay for this tool.`;
          } else if (needsSol) {
            instruction += ` Tell the user their agent wallet needs SOL to pay Solana transaction fees—they should send a small amount of SOL (e.g. 0.01) to their agent wallet address.`;
          } else {
            instruction += ` Suggest they check their agent wallet has both USDC (for the tool) and SOL (for fees), or try again later.`;
          }
          instruction += ` Do NOT invent or make up data (e.g. trending pools, token names, prices, or tables). Only report that the tool failed and the user should try again.`;
          toolErrors.push(instruction);
          toolUsages.push({ name: tool.name, status: 'error', costUsd: effectivePrice });
        } else {
          if (!useTreasury) amountChargedUsd += effectivePrice;
          usdcBalance -= effectivePrice;
          let toolData = result.data;
          if (PUMPFUN_TX_TOOL_IDS.has(matched.toolId) && toolData && typeof toolData.transaction === 'string') {
            try {
              const { signature } = await signAndSubmitSerializedTransaction(
                anonymousId,
                toolData.transaction
              );
              toolData = { ...toolData, submittedSignature: signature, submittedOnChain: true };
            } catch (pumpErr) {
              toolData = {
                ...toolData,
                submittedOnChain: false,
                submitError: pumpErr?.message || 'Failed to submit pump.fun transaction',
              };
            }
          }
          if (
            matched.toolId === 'pumpfun-agents-swap' &&
            toolData &&
            typeof toolData === 'object' &&
            typeof toolData.transaction === 'string'
          ) {
            lastPumpfunAgentsSwapChainResult = {
              submittedOnChain: toolData.submittedOnChain === true,
              signature:
                typeof toolData.submittedSignature === 'string' ? toolData.submittedSignature.trim() : '',
              submitError:
                typeof toolData.submitError === 'string' ? toolData.submitError.trim() : '',
            };
          }
          const chartUi = agentChartUiMeta(matched.toolId, params, toolData);
          const createCoinUi = pumpfunCreateCoinResultUiMeta(matched.toolId, params, toolData);
          toolUsages.push({
            name: tool.name,
            status: 'complete',
            costUsd: effectivePrice,
            ...(useTreasury && effectivePrice > 0 ? { included: true } : {}),
            ...chartUi,
            ...createCoinUi,
          });
          const formatted = formatToolResultForLlm(toolData, tool.id);
          const presentInstruction =
            tool.id === 'trending-jupiter'
              ? 'Present this Jupiter trending data in a clear list or table. Use ONLY the data below—do not invent token names, prices, or percentages.'
              : tool.id === 'pumpfun-agents-swap'
                ? 'The user ran a Solana swap via Syra. You MUST write a visible reply (never empty): state success or failure, and include the transaction signature (submittedSignature) or submitError from the JSON verbatim. Link solscan.io/tx/<signature> when a signature is present.'
                : 'Present this to the user in clear, human-readable form. Use headings, short paragraphs, bullet points or markdown tables. Do not include raw JSON or any {"tool"/"params"} blocks.';
          toolResults.push(
            `[Result from paid tool "${tool.name}" — ${presentInstruction}]\n\n${formatted}`
          );
        }
      }
      const silentSwapUiOnly =
        toolErrors.length > 0 &&
        toolResults.length === 0 &&
        toolErrors.every((e) => e === SWAP_UI_EMPTY_LLM_REPLY);
      if (silentSwapUiOnly) {
        skipFinalLlmForSilentSwapUi = true;
      } else if (toolErrors.length > 0 && toolResults.length === 0) {
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
        const costUsd = t ? getEffectivePriceUsd(t.priceUsd, null) ?? t.priceUsd : 0;
        return { name: t ? t.name : m.toolId, status: 'error', costUsd: Number(costUsd) || 0 };
      });
      const toolIds = matchedTools.map((t) => t.toolId).join(', ');
      apiMessages.push({
        role: 'user',
        content: `[The user asked for paid tool(s) (${toolIds}) but no agent wallet is linked. Reply that they need to connect or create an agent wallet and deposit USDC to use Syra's paid features.]`,
      });
    }

    const llmOptions = { anonymousId };
    if (modelId && typeof modelId === 'string' && modelId.trim()) {
      llmOptions.model = modelId.trim();
    }
    if (hadToolResults) {
      llmOptions.max_tokens = MAX_TOKENS_WITH_TOOLS;
    } else {
      llmOptions.max_tokens = MAX_TOKENS_DEFAULT;
    }
    const requestedModel = llmOptions.model || OPENROUTER_DEFAULT_MODEL;

    let response;
    let truncated = false;
    let usedFallbackModel = false;
    /** Usage from the final main completion (after any model fallback). */
    let mainCompletionUsage = null;

    try {
      if (skipFinalLlmForSilentSwapUi) {
        response = '';
        truncated = false;
        mainCompletionUsage = null;
      } else {
        const modelForCall = llmOptions.model || OPENROUTER_DEFAULT_MODEL;
        const result = await callOpenRouter(withLlmIdentitySystemNote(apiMessages, modelForCall), llmOptions);
        response = result.response;
        truncated = result.truncated;
        mainCompletionUsage = result.usage;
      }
    } catch (firstError) {
      const requestedModelOnErr = llmOptions.model;
      console.error(`[agent/chat/completion] callOpenRouter failed (model=${requestedModelOnErr || OPENROUTER_DEFAULT_MODEL}):`, firstError?.message || firstError);
      if (
        requestedModelOnErr &&
        requestedModelOnErr !== OPENROUTER_DEFAULT_MODEL
      ) {
        try {
          const fallbackOptions = { ...llmOptions, model: OPENROUTER_DEFAULT_MODEL };
          const fallbackResult = await callOpenRouter(
            withLlmIdentitySystemNote(apiMessages, OPENROUTER_DEFAULT_MODEL),
            fallbackOptions
          );
          response = fallbackResult.response;
          truncated = fallbackResult.truncated;
          mainCompletionUsage = fallbackResult.usage;
          usedFallbackModel = true;
        } catch (fallbackError) {
          console.error(`[agent/chat/completion] fallback model also failed:`, fallbackError?.message || fallbackError);
          const err = new Error(
            firstError?.message?.includes('OPENROUTER_API_KEY')
              ? 'AI service is not configured. Please contact the administrator.'
              : `AI model is temporarily unavailable (${firstError?.message || 'unknown error'}). Please try again in a moment.`
          );
          err.status = firstError?.status || 502;
          throw err;
        }
      } else {
        const err = new Error(
          firstError?.message?.includes('OPENROUTER_API_KEY')
            ? 'AI service is not configured. Please contact the administrator.'
            : `AI model is temporarily unavailable (${firstError?.message || 'unknown error'}). Please try again in a moment.`
        );
        err.status = firstError?.status || 502;
        throw err;
      }
    }

    if (
      lastPumpfunAgentsSwapChainResult &&
      hadToolResults &&
      typeof response === 'string' &&
      (response === OPENROUTER_EMPTY_RESPONSE_PLACEHOLDER || !response.trim())
    ) {
      const r = lastPumpfunAgentsSwapChainResult;
      if (r.submittedOnChain && r.signature) {
        response = `Swap submitted on-chain.\n\n**Signature:** \`${r.signature}\`\n\n[View on Solscan](https://solscan.io/tx/${r.signature})`;
      } else if (r.submitError) {
        response = `Swap transaction could not be submitted: ${r.submitError}`;
      } else {
        response =
          'The swap transaction was built but Syra did not receive a signature from the network. Check your agent wallet balance (SOL for fees) and try again.';
      }
    }

    const tokensThisTurn = tokensFromUsage(toolSelectUsage) + tokensFromUsage(mainCompletionUsage);
    if (chatIdForBudget && anonymousId && tokensThisTurn > 0) {
      await Chat.findOneAndUpdate(
        { _id: chatIdForBudget, anonymousId: String(anonymousId).trim() },
        { $inc: { llmSessionTokensTotal: tokensThisTurn } }
      ).catch(() => {});
    }

    const payload = { success: true, response: enforceSyraBranding(response) };
    if (truncated) payload.truncated = true;
    if (amountChargedUsd > 0) payload.amountChargedUsd = amountChargedUsd;
    if (usedFallbackModel) payload.usedFallbackModel = true;
    if (toolUsages && toolUsages.length > 0) payload.toolUsages = toolUsages;
    if (offerPumpfunCreateUi) {
      payload.inlineUi = { type: 'pumpfun-create-coin' };
    } else if (offerPumpfunSwapUi) {
      payload.inlineUi = {
        type: 'pumpfun-swap',
        ...(pumpfunSwapInlineHints?.suggestedMints?.length
          ? { suggestedMints: pumpfunSwapInlineHints.suggestedMints }
          : {}),
        ...(pumpfunSwapInlineHints?.suggestedAmount
          ? { suggestedAmount: pumpfunSwapInlineHints.suggestedAmount }
          : {}),
      };
    }
    if (historyCompact.trimmed) payload.contextTrimmed = true;
    if (tokensThisTurn > 0) {
      payload.llmTokensThisTurn = tokensThisTurn;
      if (chatIdForBudget != null) {
        payload.sessionLlmTokensUsed = sessionTokensUsedBefore + tokensThisTurn;
        payload.sessionLlmTokenCap = AGENT_CHAT_SESSION_LLM_TOKEN_CAP;
      }
    }

    if (anonymousId && (amountChargedUsd > 0 || (toolUsages && toolUsages.some((u) => u.status === 'complete')))) {
      const toolCallsDelta = toolUsages ? toolUsages.filter((u) => u.status === 'complete').length : 0;
      recordAgentChatUsage(anonymousId, {
        toolCallsDelta,
        x402VolumeUsdDelta: amountChargedUsd,
      }).catch(() => {});
    }

    return res.json(payload);
  } catch (error) {
    const status = error.status || 500;
    const msg = error.message || 'Completion failed';
    const elapsed = Date.now() - completionStart;
    console.error(`[agent/chat/completion] ${status} after ${elapsed}ms:`, msg, error.raw ? JSON.stringify(error.raw).slice(0, 300) : '');
    return res.status(status).json({
      success: false,
      error: msg,
      ...(error.raw?.error?.type && { errorType: error.raw.error.type }),
    });
  }
});

const AGENT_DESC_SYSTEM = `You are a copywriter for Syra, an AI agent ecosystem and MCP (Model Context Protocol) platform.
Generate exactly one short, unique description (1-2 sentences, under 200 characters) for an AI agent.
The description must be professional and clearly related to Syra or the agent ecosystem: MCP tools, AI agents, crypto/data tools, or Syra's marketplace. Do not use generic phrases; mention Syra, agents, or the ecosystem. Output only the description, no quotes or preamble.`;

// POST /generate-description - Generate agent description via OpenRouter; requires user's agent wallet (anonymousId) so payment uses user wallet not system.
router.post('/generate-description', async (req, res) => {
  try {
    const { anonymousId, agentName } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required. Connect your agent wallet so payment uses your wallet, not the system.' });
    }
    const name = (typeof agentName === 'string' && agentName.trim()) ? agentName.trim() : 'this agent';
    const apiMessages = [
      { role: 'system', content: AGENT_DESC_SYSTEM },
      { role: 'user', content: `Generate a short, unique description for an AI agent named "${name}".` },
    ];
    const result = await callOpenRouter(apiMessages, { anonymousId });
    let text = typeof result.response === 'string' ? result.response.trim() : '';
    if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
    return res.json({ response: text });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Failed to generate description',
      ...(error.raw && { raw: error.raw }),
    });
  }
});

// Xona Agent – Grok Imagine: https://xona-agent.com/docs ($0.04 USDC per image, x402 on Solana)
const XONA_GROK_IMAGINE_URL = 'https://api.xona-agent.com/image/grok-imagine';

// POST /generate-agent-image - Generate unique agent image using Xona Grok Imagine; payment from user's agent wallet (x402).
router.post('/generate-agent-image', async (req, res) => {
  try {
    const { anonymousId, agentName, agentDescription } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'anonymousId is required. Connect your agent wallet so image generation is paid from your wallet (x402).',
      });
    }
    const name = (typeof agentName === 'string' && agentName.trim()) ? agentName.trim() : 'AI agent';
    const desc = (typeof agentDescription === 'string' && agentDescription.trim()) ? agentDescription.trim() : '';
    const prompt = desc
      ? `Professional avatar or logo for an AI agent named "${name}". ${desc} Style: clean, modern, suitable for a marketplace listing. No text in the image.`
      : `Professional avatar or logo for an AI agent named "${name}". Clean, modern, suitable for a marketplace listing. No text in the image.`;
    if (!prompt || prompt.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be under 4000 characters.',
      });
    }
    const result = await callX402V2WithAgent({
      anonymousId: anonymousId.trim(),
      url: XONA_GROK_IMAGINE_URL,
      method: 'POST',
      body: { prompt },
    });
    if (!result.success) {
      const status = result.budgetExceeded ? 402 : 400;
      let errMsg = result.error || 'Image generation failed';
      if (errMsg.includes('403') || errMsg.includes('blockchain') || errMsg.includes('not allowed to access')) {
        errMsg = 'Solana RPC blocked: set SOLANA_RPC_URL in API .env to an RPC that allows blockchain access (e.g. Helius, Triton, or Ankr paid). ' + errMsg;
      }
      if (errMsg.includes('Agent wallet not found')) {
        return res.status(401).json({ success: false, error: errMsg });
      }
      return res.status(status).json({ success: false, error: errMsg });
    }
    const imageUrl = result.data?.image_url;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(502).json({
        success: false,
        error: 'Xona did not return an image URL',
        ...(result.data && { raw: result.data }),
      });
    }
    return res.json({
      image_url: imageUrl,
      ...(result.data?.image_description && { image_description: result.data.image_description }),
      ...(result.data?.metadata && { metadata: result.data.metadata }),
    });
  } catch (error) {
    let errMsg = error.message || 'Failed to generate image';
    if (errMsg.includes('403') || errMsg.includes('blockchain') || errMsg.includes('not allowed to access') || errMsg.includes('get info about account')) {
      errMsg = 'Solana RPC blocked. In API .env set SOLANA_RPC_URL to an RPC with blockchain access (e.g. https://mainnet.helius-rpc.com/?api_key=YOUR_KEY or paid Ankr). ' + errMsg;
    }
    return res.status(500).json({
      success: false,
      error: errMsg,
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
        ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
        ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
        ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
        ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
        ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
    recordAgentChatUsage(ownerId, { chatsDelta: 1 }).catch(() => {});

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
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
    }));

    const chat = await Chat.findOneAndUpdate(
      { _id: id, anonymousId: ownerId },
      { $push: { messages: { $each: newMessages } } },
      { new: true, runValidators: true }
    ).lean();

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    recordAgentChatUsage(ownerId, { messagesDelta: newMessages.length }).catch(() => {});

    const outMessages = (chat.messages || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      toolUsage: m.toolUsage,
      ...(Array.isArray(m.toolUsages) && m.toolUsages.length > 0 ? { toolUsages: m.toolUsages } : {}),
      ...(m.inlineUi && typeof m.inlineUi === 'object' ? { inlineUi: m.inlineUi } : {}),
      ...(m.inlineUiDismissed ? { inlineUiDismissed: true } : {}),
      ...(m.swapActionsHidden ? { swapActionsHidden: true } : {}),
      ...(m.swapInlineStatus ? { swapInlineStatus: m.swapInlineStatus } : {}),
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
