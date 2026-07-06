/**
 * Syra Telegram bot — brain Q&A using the same tool pipeline as website /brain.
 */
import crypto from 'node:crypto';
import Chat from '../../models/agent/Chat.js';
import { getAgentTool, getCapabilitiesList } from '../../config/agentTools.js';
import { OPENROUTER_DEFAULT_MODEL } from '../../config/openrouterModels.js';
import {
  formatToolResultForLlm,
  withLlmIdentitySystemNote,
} from '../../routes/agent/chat.js';
import { callZerionWithAgent } from '../agentZerionClient.js';
import { callBirdeyeWithAgent, isEmptyBirdeyePayload } from '../agentBirdeyeClient.js';
import { getBirdeyeGateMissing } from '../../config/birdeyeAgentTools.js';
import { runAgentPartnerDirectTool } from '../agentPartnerDirectTools.js';
import { callOpenRouter } from '../openrouter.js';
import { sanitizeUserMessage } from '../promptSanitizer.js';
import { callX402V2WithAgentForSyraPath } from '../agentX402Client.js';
import { getAgentBalances } from '../agentWallet.js';
import { getEffectiveAgentToolPriceUsd } from '../pactPricing.js';
import { planTelegramAnswerButtons } from './answerButtonsService.js';
import { buildTelegramChartAttachment } from './chartService.js';
import {
  classifyTelegramQuestion,
  buildTelegramIntentSystemNotes,
} from './questionIntent.js';
import { resolveTelegramMatchedTools, withTelegramTimeout } from './telegramBrainUtils.js';
import {
  formatNewsTelegram,
  TELEGRAM_DIRECT_FORMAT_TOOLS,
} from './telegramToolFormat.js';

const MAX_TOKENS_WITH_TOOLS = 900;
const MAX_TOKENS_DEFAULT = 700;
const TELEGRAM_LLM_TIMEOUT_MS = 22_000;
const TELEGRAM_TOOL_TIMEOUT_MS = 45_000;
const TELEGRAM_BALANCE_TIMEOUT_MS = 8_000;
const MAX_HISTORY_MESSAGES = 10;
const TELEGRAM_CHAT_TITLE = 'Telegram';

function enforceSyraBranding(text) {
  if (typeof text !== 'string' || !text.trim()) return '';
  return text
    .replace(/\bjatevo(?:'s)?\b/gi, 'Syra')
    .replace(/\bopenrouter\b/gi, 'Syra')
    .replace(/\bopen\s*router\b/gi, 'Syra');
}

/**
 * @param {string} anonymousId
 * @param {import('../../config/agentTools.js').AgentToolDefinition} tool
 * @param {Record<string, string>} params
 * @param {number} usdcBalance
 */
async function executeTelegramTool(anonymousId, tool, params, usdcBalance) {
  const requiredUsdc = getEffectiveAgentToolPriceUsd(tool, null);
  if (requiredUsdc > 0 && (usdcBalance <= 0 || usdcBalance < requiredUsdc)) {
    const msg =
      usdcBalance <= 0
        ? `Your agent wallet has no USDC. Deposit USDC to your Syra wallet to use ${tool.name}.`
        : `Your agent wallet has insufficient USDC ($${usdcBalance.toFixed(2)} available; ${tool.name} needs about $${requiredUsdc.toFixed(4)}).`;
    return { status: 402, error: msg, budgetExceeded: true };
  }

  const method = tool.method || 'GET';

  if (tool.zerionPath) {
    const zr = await callZerionWithAgent(anonymousId, tool.zerionPath, method, params);
    return zr.success
      ? { status: 200, data: zr.data }
      : { status: zr.budgetExceeded ? 402 : 502, error: zr.error, budgetExceeded: zr.budgetExceeded };
  }

  if (tool.birdeyePath) {
    const birdeyeMissing = getBirdeyeGateMissing(tool.id, params);
    if (birdeyeMissing?.length) {
      return { status: 502, error: `Missing Birdeye params: ${birdeyeMissing.join(', ')}` };
    }
    const p = params.chain ? params : { ...params, chain: 'solana' };
    const br = await callBirdeyeWithAgent(anonymousId, tool.birdeyePath, method, p);
    if (br.success && isEmptyBirdeyePayload(br.data)) {
      return { status: 502, error: 'Birdeye returned an empty response for this query' };
    }
    return br.success
      ? { status: 200, data: br.data }
      : { status: br.budgetExceeded ? 402 : 502, error: br.error, budgetExceeded: br.budgetExceeded };
  }

  if (tool.agentDirect) {
    const out = await runAgentPartnerDirectTool(tool.id, params, { host: null });
    return out.ok
      ? { status: out.httpStatus ?? 200, data: out.data }
      : { status: out.status ?? 502, error: out.error };
  }

  const result = await withTelegramTimeout(
    callX402V2WithAgentForSyraPath({
      anonymousId,
      path: tool.path,
      method,
      query: method === 'GET' ? params : {},
      body: method === 'POST' ? params : undefined,
    }),
    TELEGRAM_TOOL_TIMEOUT_MS,
    tool.name || tool.id,
  );
  if (!result.success) {
    return {
      status: result.budgetExceeded ? 402 : 502,
      error: result.error,
      budgetExceeded: result.budgetExceeded,
    };
  }
  return { status: 200, data: result.data };
}

/**
 * @param {string} anonymousId
 * @returns {Promise<import('../../models/agent/Chat.js').default | null>}
 */
async function getOrCreateTelegramChat(anonymousId) {
  let chat = await Chat.findOne({ anonymousId, title: TELEGRAM_CHAT_TITLE }).sort({ updatedAt: -1 });
  if (!chat) {
    chat = await Chat.create({
      anonymousId,
      title: TELEGRAM_CHAT_TITLE,
      modelId: OPENROUTER_DEFAULT_MODEL,
      messages: [],
    });
  }
  return chat;
}

/**
 * @param {import('../../models/agent/Chat.js').default} chat
 * @returns {string}
 */
function buildConversationSnippet(chat) {
  const msgs = Array.isArray(chat.messages) ? chat.messages : [];
  const recent = msgs.slice(-MAX_HISTORY_MESSAGES);
  return recent
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${String(m.content || '').slice(0, 500)}`)
    .join('\n');
}

/**
 * @param {import('../../models/agent/Chat.js').default} chat
 * @param {string} userContent
 * @param {string} assistantContent
 * @param {Array<{ name: string; status: string }>} toolUsages
 */
async function persistChatTurn(chat, userContent, assistantContent, toolUsages = []) {
  const userMsg = {
    id: crypto.randomUUID(),
    role: 'user',
    content: userContent,
    timestamp: new Date(),
  };
  const assistantMsg = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date(),
    ...(toolUsages.length > 0 && {
      toolUsages: toolUsages.map((t) => ({
        name: t.name,
        status: t.status === 'complete' ? 'complete' : 'error',
        included: false,
      })),
    }),
  };

  const messages = [...(chat.messages || []), userMsg, assistantMsg];
  const trimmed =
    messages.length > MAX_HISTORY_MESSAGES * 2
      ? messages.slice(-MAX_HISTORY_MESSAGES * 2)
      : messages;

  await Chat.updateOne(
    { _id: chat._id },
    {
      $set: {
        messages: trimmed,
        preview: assistantContent.slice(0, 120),
        modelId: chat.modelId || OPENROUTER_DEFAULT_MODEL,
      },
    },
  );
}

/**
 * @param {{ anonymousId: string; payerAnonymousId?: string; question: string }} input
 * @returns {Promise<{ text: string; toolsUsed: string[]; chartAttachment?: object; showFollowUps: boolean; followUpQuestions: string[]; showMainMenu: boolean; followUpExpiresAt?: Date; limited?: boolean }>}
 */
export async function askSyraBrain({ anonymousId, payerAnonymousId, question }) {
  try {
    return await askSyraBrainInner({ anonymousId, payerAnonymousId, question });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[syra-telegram] askSyraBrain failed:', e instanceof Error ? e.stack || msg : msg);
    const isTimeout = /timed out/i.test(msg);
    return {
      text: isTimeout
        ? 'That took too long — please try again.\n\nTip: **SOL news**, **BTC signal**, or **ETH price** work best as short commands.'
        : 'Something went wrong. Please try again in a moment.',
      toolsUsed: [],
      showFollowUps: false,
      followUpQuestions: [],
      showMainMenu: true,
    };
  }
}

/**
 * @param {{ anonymousId: string; payerAnonymousId?: string; question: string }} input
 */
async function askSyraBrainInner({ anonymousId, payerAnonymousId, question }) {
  const id = String(anonymousId || '').trim();
  const payerId = String(payerAnonymousId || anonymousId || '').trim();
  const billingReferral = payerId !== id;
  const rawQuestion = String(question || '').trim();
  if (!id || !rawQuestion) {
    return { text: 'Please send a question.', toolsUsed: [], showFollowUps: false, followUpQuestions: [], showMainMenu: false };
  }

  const { text: sanitizedQuestion } = sanitizeUserMessage(rawQuestion);
  const userQuestion = sanitizedQuestion.trim() || rawQuestion;

  const chat = await getOrCreateTelegramChat(id);
  const questionIntent = classifyTelegramQuestion(userQuestion);

  if (questionIntent === 'off_topic') {
    const declineText = [
      "I'm **Syra** — your crypto & web3 copilot on Solana.",
      '',
      'I focus on DeFi, trading, tokens, markets, tech, and Syra tools.',
      'That question seems outside my lane — try something like:',
      '• What is Hyperliquid?',
      '• How does impermanent loss work?',
      '• BTC trading signal',
    ].join('\n');
    await persistChatTurn(chat, userQuestion, declineText, []);
    const buttonPlan = await planTelegramAnswerButtons({
      userQuestion,
      assistantAnswer: declineText,
      toolsUsed: [],
    });
    return {
      text: declineText,
      toolsUsed: [],
      showFollowUps: buttonPlan.showFollowUps,
      followUpQuestions: buttonPlan.followUpQuestions,
      showMainMenu: buttonPlan.showMainMenu,
      followUpExpiresAt: buttonPlan.followUpExpiresAt,
    };
  }

  const conversationSnippet = buildConversationSnippet(chat);

  const [matchedTools, balanceResult] = await Promise.all([
    resolveTelegramMatchedTools(userQuestion, conversationSnippet),
    withTelegramTimeout(getAgentBalances(payerId), TELEGRAM_BALANCE_TIMEOUT_MS, 'Balance check').catch(
      () => null,
    ),
  ]);

  let usdcBalance = balanceResult?.usdcBalance ?? 0;

  const capabilitiesList = getCapabilitiesList().join('\n');
  const apiMessages = [{ role: 'user', content: userQuestion }];

  const systemContent = [
    'You are Syra — machine money for agents on Solana. You can chat naturally and use paid tools when the user asks for specific live data.',
    buildTelegramIntentSystemNotes(questionIntent),
    `Syra's live-data tools (only when the user needs current prices, news, signals, etc.):\n${capabilitiesList}`,
    'If a paid tool was skipped or failed because of insufficient USDC, tell the user to deposit USDC to their Syra agent wallet (Wallet button) and try again. Do not mention daily limits or pricing tiers.',
    billingReferral
      ? 'This user joined via a referral — paid tools are billed from their referrer\'s wallet. If USDC is insufficient, tell them their referrer must deposit USDC to their Syra wallet.'
      : '',
    'Response format: clear, concise Telegram-friendly markdown. Never mention third-party API brands — always present as Syra.',
  ]
    .filter(Boolean)
    .join('\n\n');

  apiMessages.unshift({ role: 'system', content: systemContent });

  if (conversationSnippet) {
    apiMessages.splice(1, 0, {
      role: 'user',
      content: `[Recent conversation for context:\n${conversationSnippet}]`,
    });
  }

  let hadToolResults = false;
  let directTelegramText = null;
  /** @type {Array<{ name: string; status: string }>} */
  const toolUsages = [];
  /** @type {{ png: Buffer; caption: string; detailUrl: string } | null} */
  let chartAttachment = null;

  if (matchedTools && matchedTools.length > 0) {
    const toolResults = [];
    const toolErrors = [];

    for (const matched of matchedTools) {
      const tool = getAgentTool(matched.toolId);
      if (!tool) continue;

      if (matched.toolId === 'pumpfun-agents-swap' || matched.toolId === 'jupiter-swap-order') {
        toolErrors.push(
          '[On-chain swaps are not supported in Telegram yet. Ask for analysis or market data instead.]',
        );
        toolUsages.push({ name: tool.name, status: 'error' });
        continue;
      }

      const rawParams = typeof matched.params === 'object' ? matched.params : {};
      const params = Object.fromEntries(
        Object.entries(rawParams)
          .filter(([k, v]) => typeof k === 'string' && v != null && v !== '')
          .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)]),
      );

      const result = await executeTelegramTool(payerId, tool, params, usdcBalance).catch((e) => ({
        status: 502,
        error: e instanceof Error ? e.message : String(e),
      }));

      if (result.status !== 200) {
        const err = result.error || 'Request failed';
        const needsUsdc = /USDC|insufficient|no USDC|token account/i.test(err);
        const needsSol = /SOL|transaction fee|debit an account|no record of a prior credit/i.test(err);
        const isWalletConfig =
          /Agent wallet not found|privy_not_configured|missing_privy_wallet_id/i.test(err);
        let hint = 'Do not invent data.';
        if (isWalletConfig) {
          hint =
            'Tell the user to open Wallet in the bot and ensure their Syra agent wallet is ready, then try again.';
        } else if (result.budgetExceeded || needsUsdc) {
          hint = billingReferral
            ? 'Tell the user their referrer must deposit USDC to their Syra wallet — paid tools bill the referrer, not this user.'
            : 'Tell the user to deposit USDC to their Syra agent wallet (Wallet button) to pay for this tool.';
        } else if (needsSol) {
          hint =
            'Tell the user their agent wallet needs a small amount of SOL (e.g. 0.01) for transaction fees.';
        } else {
          hint = 'Suggest they try again in a moment. Do not invent data.';
        }
        toolErrors.push(`[Tool "${tool.name}" failed: ${err}. ${hint}]`);
        toolUsages.push({ name: tool.name, status: 'error' });
      } else {
        hadToolResults = true;
        toolUsages.push({ name: tool.name, status: 'complete' });
        if (TELEGRAM_DIRECT_FORMAT_TOOLS.has(matched.toolId)) {
          if (matched.toolId === 'news') {
            const direct = formatNewsTelegram(result.data, params.ticker);
            if (direct) directTelegramText = direct;
          }
        }
        if (!chartAttachment) {
          try {
            chartAttachment = await buildTelegramChartAttachment(matched.toolId, params, result.data);
          } catch (chartErr) {
            console.warn('[syraTelegramBot] chart render failed:', chartErr?.message || chartErr);
          }
        }
        const formatted = formatToolResultForLlm(result.data, tool.id);
        toolResults.push(
          `[Result from tool "${tool.name}" — present clearly for Telegram.]\n\n${formatted}`,
        );
      }
    }

    if (toolErrors.length > 0 && toolResults.length === 0) {
      if (questionIntent === 'live_data') {
        apiMessages.push({ role: 'user', content: toolErrors[0] });
      } else {
        apiMessages.push({
          role: 'user',
          content:
            '[Note: live tools were not used or did not return data. Answer from your crypto/web3/tech knowledge. Do not say you lack tools or could not find data.]',
        });
      }
    } else if (toolResults.length > 0) {
      apiMessages.push({ role: 'user', content: toolResults.join('\n\n---\n\n') });
      if (toolErrors.length > 0) {
        apiMessages.push({ role: 'user', content: toolErrors.join(' ') });
      }
    }
  }

  const toolsUsed = toolUsages.filter((t) => t.status === 'complete').map((t) => t.name);

  if (directTelegramText) {
    const text = enforceSyraBranding(directTelegramText) || directTelegramText;
    await persistChatTurn(chat, userQuestion, text, toolUsages);
    const buttonPlan = await planTelegramAnswerButtons({
      userQuestion,
      assistantAnswer: text,
      toolsUsed,
    });
    return {
      text,
      toolsUsed,
      chartAttachment,
      showFollowUps: buttonPlan.showFollowUps,
      followUpQuestions: buttonPlan.followUpQuestions,
      showMainMenu: buttonPlan.showMainMenu,
      followUpExpiresAt: buttonPlan.followUpExpiresAt,
    };
  }

  const llmOptions = {
    max_tokens: hadToolResults ? MAX_TOKENS_WITH_TOOLS : MAX_TOKENS_DEFAULT,
    timeoutMs: TELEGRAM_LLM_TIMEOUT_MS,
    temperature: hadToolResults ? 0.35 : 0.6,
  };

  const { response } = await callOpenRouter(
    withLlmIdentitySystemNote(apiMessages, OPENROUTER_DEFAULT_MODEL),
    llmOptions,
  );

  const text =
    enforceSyraBranding(response) || "I couldn't generate a response. Please try again.";

  await persistChatTurn(chat, userQuestion, text, toolUsages);

  const buttonPlan = await planTelegramAnswerButtons({
    userQuestion,
    assistantAnswer: text,
    toolsUsed,
  });

  return {
    text,
    toolsUsed,
    chartAttachment,
    showFollowUps: buttonPlan.showFollowUps,
    followUpQuestions: buttonPlan.followUpQuestions,
    showMainMenu: buttonPlan.showMainMenu,
    followUpExpiresAt: buttonPlan.followUpExpiresAt,
  };
}
