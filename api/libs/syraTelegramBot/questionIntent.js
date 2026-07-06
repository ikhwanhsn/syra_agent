/**
 * Telegram bot — classify user questions for tool vs LLM-knowledge vs off-topic handling.
 */
import { hasHeuristicAgentTool } from './telegramHeuristicTools.js';

const KNOWLEDGE_PATTERNS =
  /\b(what is|what are|what's|whats|explain|how does|how do|how to|tell me about|define|meaning of|difference between|compared to|vs\.?|versus|who is|who are|why is|why are|overview of|introduction to|describe|walk me through|basics of|eli5|in simple terms)\b/i;

const LIVE_DATA_PATTERNS =
  /\b(price|prices|trading at|worth|costs?|signal|news|headline|headlines|sentiment|trending|trend|digest|sundown|events?|balance|balances|portfolio|swap|buy now|sell now|chart|ohlc|holders?|market cap|volume|arbitrage|smart money|whale|latest update|right now|live|today'?s|current|fetch|look up|search the web|web search|scrape|crawl|defillama|coingecko|birdeye|nansen|zerion|gmgn|pump\.?fun|analytics|tvl|yield|global market|dominance|spcx|equity|xstocks?|tiktok|instagram|reddit|firecrawl|apollo|serper)\b/i;

const IN_SCOPE_PATTERNS =
  /\b(crypto|cryptocurrency|bitcoin|btc|eth|ethereum|solana|sol|defi|web3|blockchain|token|tokens|dex|cex|nft|nfts|syra|agent|agents|wallet|wallets|trading|trade|perp|perps|perpetual|hyperliquid|jupiter|uniswap|aave|compound|curve|layer\s*2|l2|rollup|staking|stake|vault|bridge|x402|machine money|memecoin|meme coin|pump\.?fun|liquidity|lp|impermanent loss|slippage|mev|airdrop|dao|stablecoin|usdc|usdt|solana|on-?chain|smart contract|validator|rpc|mev|cex|orderbook|funding rate|liquidation|leverage|margin|derivatives|options|futures|spot|technical analysis|rsi|macd|ta\b|fa\b|fundamental|tokenomics|whitepaper|mainnet|devnet|airdrop|hackathon|ai\b|llm|tech|software|api|sdk|telegram|bot)\b/i;

const OFF_TOPIC_PATTERNS =
  /\b(recipe|cook|cooking|bake|weather forecast|football|soccer|basketball|nba|nfl|movie|movies|dating|relationship advice|homework|math problem|solve for x|pizza|restaurant|hotel|flight|vacation|pregnancy|medical diagnosis|prescription|politics|election|religion|horoscope|zodiac)\b/i;

const EXPLICIT_TOOL_PATTERNS =
  /\b(search the web|web search|look up the latest|find (the )?latest|get (me )?news|get (me )?a signal|show (me )?(the )?price|what(?:'s| is) .+ trading at|current price|live price|sundown digest|daily digest|trending headline|market sentiment|crypto events?|analytics summary|arbitrage|defillama|coingecko|smart money|whale activity|trending on jupiter)\b/i;

const TOOL_ACTION_PATTERNS =
  /\b(get|give|show|fetch|pull|check|list|find|look up|what(?:'s| is)|how much|current|latest|live|today'?s)\b/i;

/**
 * @typedef {'knowledge' | 'live_data' | 'general' | 'off_topic'} TelegramQuestionIntent
 */

/**
 * @param {string} question
 * @returns {boolean}
 */
export function isTelegramOffTopicQuestion(question) {
  const q = String(question || '').trim().toLowerCase();
  if (!q) return true;
  if (IN_SCOPE_PATTERNS.test(q)) return false;
  if (OFF_TOPIC_PATTERNS.test(q)) return true;
  // Short greetings / acks are in-scope (handled elsewhere)
  if (q.length <= 24 && /^(hi|hello|hey|thanks|thank you|ok|okay|help)\b/.test(q)) return false;
  // Default: allow — user may ask about a project name we didn't list (e.g. "hyperliquid")
  return false;
}

/**
 * @param {string} question
 * @returns {boolean}
 */
export function isTelegramLiveDataQuestion(question) {
  const q = String(question || '').trim();
  if (!q) return false;
  if (hasHeuristicAgentTool(q)) return true;
  if (EXPLICIT_TOOL_PATTERNS.test(q)) return true;
  const lower = q.toLowerCase();
  const knowledge = KNOWLEDGE_PATTERNS.test(lower);
  const live = LIVE_DATA_PATTERNS.test(lower);
  if (knowledge && !live) return false;
  if (live) return true;
  return false;
}

/**
 * True when the message should attempt agent tool routing (heuristic or LLM).
 * @param {string} question
 * @returns {boolean}
 */
export function isTelegramToolCandidateQuestion(question) {
  const q = String(question || '').trim();
  if (!q) return false;
  if (hasHeuristicAgentTool(q)) return true;
  if (isTelegramLiveDataQuestion(q)) return true;
  if (IN_SCOPE_PATTERNS.test(q.toLowerCase()) && TOOL_ACTION_PATTERNS.test(q.toLowerCase())) {
    return true;
  }
  return false;
}

/**
 * @param {string} question
 * @returns {boolean}
 */
export function isTelegramKnowledgeQuestion(question) {
  const q = String(question || '').trim();
  if (!q || isTelegramLiveDataQuestion(q)) return false;
  return KNOWLEDGE_PATTERNS.test(q.toLowerCase()) || (!LIVE_DATA_PATTERNS.test(q.toLowerCase()) && IN_SCOPE_PATTERNS.test(q.toLowerCase()));
}

/**
 * @param {string} question
 * @returns {TelegramQuestionIntent}
 */
export function classifyTelegramQuestion(question) {
  const q = String(question || '').trim();
  if (!q) return 'off_topic';
  if (isTelegramOffTopicQuestion(q)) return 'off_topic';
  if (hasHeuristicAgentTool(q) || isTelegramLiveDataQuestion(q)) return 'live_data';
  if (isTelegramKnowledgeQuestion(q)) return 'knowledge';
  return 'general';
}

/**
 * @param {TelegramQuestionIntent} intent
 * @returns {string}
 */
export function buildTelegramIntentSystemNotes(intent) {
  if (intent === 'off_topic') {
    return [
      'The user question appears outside Syra\'s scope (not crypto, web3, tech, or Syra-related).',
      'Politely decline in 1–3 sentences. Say you focus on crypto, DeFi, web3, trading, Solana, and Syra.',
      'Do not answer the unrelated topic. Offer 1–2 example questions they could ask instead.',
    ].join(' ');
  }

  if (intent === 'knowledge' || intent === 'general') {
    return [
      'This is a conceptual or general crypto/web3/tech question — answer from your knowledge.',
      'Give a clear, helpful explanation (protocols, terms, how things work, project overviews).',
      'You do NOT need live tool data for this. Do not say you lack tools or could not find data.',
      'If tool results are missing or failed, still answer from general knowledge when the topic is in scope.',
      'Never invent live prices, signals, or headlines — for those the user must ask explicitly (e.g. "BTC price", "SOL news").',
    ].join(' ');
  }

  return [
    'The user wants live or current market data. Use ONLY tool results below for numbers, headlines, and signals.',
    'If no tool results are provided or tools failed, say data could not be fetched and suggest depositing USDC or rephrasing.',
    'Never fabricate prices, news, or trading signals.',
  ].join(' ');
}
