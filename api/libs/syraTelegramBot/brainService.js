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
import { executeAgentToolCall } from '../agentToolExecutor.js';
import { callOpenRouter } from '../openrouter.js';
import { sanitizeUserMessage } from '../promptSanitizer.js';
import { getEffectiveAgentToolPriceUsd } from '../pactPricing.js';
import { recordTelegramBotEvent } from '../../utils/recordTelegramBotEvent.js';
import { getTelegramReferralMinBalanceUsd } from '../../config/syraTelegramBotConfig.js';
import { planTelegramAnswerButtons } from './answerButtonsService.js';
import { buildTelegramChartAttachment } from './chartService.js';
import {
  classifyTelegramQuestion,
  buildTelegramIntentSystemNotes,
} from './questionIntent.js';
import { resolveTelegramMatchedTools, withTelegramTimeout } from './telegramBrainUtils.js';
import {
  formatTelegramToolDirect,
  TELEGRAM_DIRECT_FORMAT_TOOLS,
} from './telegramToolFormat.js';
import {
  tryConsumeTelegramFreeTool,
  canSubsidyTelegramTool,
  getTelegramFreeToolRemaining,
} from './telegramFreeToolQuota.js';
import {
  canReferrerSponsor,
  recordReferralSponsoredSpend,
} from './telegramReferralSpend.js';
import { getAgentBalancesCached } from './walletService.js';
import { invalidateBalanceCache } from './balanceCache.js';

const MAX_TOKENS_WITH_TOOLS = 900;
const MAX_TOKENS_DEFAULT = 700;
const TELEGRAM_LLM_TIMEOUT_MS = 22_000;
const TELEGRAM_TOOL_TIMEOUT_MS = 45_000;
const TELEGRAM_BALANCE_TIMEOUT_MS = 8_000;
const MAX_HISTORY_MESSAGES = 10;
const TELEGRAM_CHAT_TITLE = 'Telegram';
const MAX_PARALLEL_TOOLS = 3;

function enforceSyraBranding(text) {
  if (typeof text !== 'string' || !text.trim()) return '';
  return text
    .replace(/\bjatevo(?:'s)?\b/gi, 'Syra')
    .replace(/\bopenrouter\b/gi, 'Syra')
    .replace(/\bopen\s*router\b/gi, 'Syra');
}

/**
 * @param {string} err
 * @param {{ budgetExceeded?: boolean; referralCap?: boolean }} result
 * @param {boolean} billingReferral
 * @returns {string | null}
 */
function buildLiveDataFailureText(err, result, billingReferral) {
  if (result.referralCap) {
    return billingReferral
      ? 'Your referrer hit today\'s sponsor spend cap for paid tools. Ask them to raise the cap or deposit more USDC, or deposit to **your** wallet via **Wallet** to pay yourself.'
      : 'Daily referral sponsor spend cap reached. Deposit USDC to your own wallet (**Wallet**) to continue, or try again tomorrow.';
  }
  const needsUsdc = result.budgetExceeded || /USDC|insufficient|no USDC|token account/i.test(err);
  const needsSol = /SOL|transaction fee|debit an account|no record of a prior credit/i.test(err);
  const isWalletConfig =
    /Agent wallet not found|privy_not_configured|missing_privy_wallet_id/i.test(err);

  if (isWalletConfig) {
    return 'Your Syra agent wallet is not ready yet. Open **Wallet** in the bot menu, then try again.';
  }
  if (needsUsdc) {
    return billingReferral
      ? 'Live data tools bill from your referrer\'s wallet. Ask them to deposit USDC via **Wallet**, then try again. Or deposit to your own wallet to pay yourself.'
      : 'Deposit a small amount of USDC to your Syra wallet (**Wallet** button) to fetch live prices and news, then try again.\n\nYou get a few free live-data calls per day — try a short ask like **BTC news** or **SOL signal** first.';
  }
  if (needsSol) {
    return 'Your agent wallet needs a small amount of SOL (about 0.01) for transaction fees. Add SOL via **Wallet**, then try again.';
  }
  const isTimeout = /timed out/i.test(err);
  if (isTimeout) {
    return 'That live-data request took too long. Please try again in a moment — short commands like **SOL news** or **ETH price** work best.';
  }
  return 'I could not fetch that live data right now (the data provider or payment step failed). Please try again in a moment. If it keeps happening, make sure your Syra wallet has a little USDC via the **Wallet** button.';
}

/**
 * @param {string} anonymousId - payer wallet identity
 * @param {import('../../config/agentTools.js').AgentToolDefinition} tool
 * @param {Record<string, string>} params
 * @param {number} usdcBalance
 * @param {{ freeSubsidy?: boolean; billingReferral?: boolean; userAnonymousId?: string; telegramUserId?: number | null }} [opts]
 */
async function executeTelegramTool(anonymousId, tool, params, usdcBalance, opts = {}) {
  const requiredUsdc = getEffectiveAgentToolPriceUsd(tool, null);
  const freeSubsidy = opts.freeSubsidy === true;
  const billingReferral = opts.billingReferral === true;

  if (!freeSubsidy && billingReferral && requiredUsdc > 0) {
    const sponsor = await canReferrerSponsor(anonymousId, requiredUsdc);
    if (!sponsor.allowed) {
      return {
        status: 402,
        error: `Referrer daily sponsor cap reached ($${sponsor.spentUsd.toFixed(2)} / $${sponsor.capUsd.toFixed(2)}).`,
        budgetExceeded: true,
        referralCap: true,
      };
    }
    const minBal = getTelegramReferralMinBalanceUsd();
    if (usdcBalance < Math.max(minBal, requiredUsdc)) {
      return {
        status: 402,
        error:
          usdcBalance <= 0
            ? `Referrer wallet has no USDC. Deposit USDC to sponsor tools.`
            : `Referrer wallet has insufficient USDC ($${usdcBalance.toFixed(2)}; needs ~$${requiredUsdc.toFixed(4)}).`,
        budgetExceeded: true,
      };
    }
  }

  if (!freeSubsidy && requiredUsdc > 0 && (usdcBalance <= 0 || usdcBalance < requiredUsdc)) {
    const msg =
      usdcBalance <= 0
        ? `Your agent wallet has no USDC. Deposit USDC to your Syra wallet to use ${tool.name}.`
        : `Your agent wallet has insufficient USDC ($${usdcBalance.toFixed(2)} available; ${tool.name} needs about $${requiredUsdc.toFixed(4)}).`;
    return { status: 402, error: msg, budgetExceeded: true };
  }

  const normalizedParams = Object.fromEntries(
    Object.entries(params || {})
      .filter(([k, v]) => typeof k === 'string' && v != null && v !== '')
      .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)]),
  );

  const execResult = await withTelegramTimeout(
    executeAgentToolCall({
      anonymousId,
      toolId: tool.id,
      params: normalizedParams,
      ctx: {},
      skipUsdcCharge: freeSubsidy && Boolean(tool.agentDirect),
      useTreasury: freeSubsidy && !tool.agentDirect,
    }),
    TELEGRAM_TOOL_TIMEOUT_MS,
    tool.name || tool.id,
  );

  const { status, body } = execResult;
  if (body?.success) {
    if (!freeSubsidy && billingReferral && requiredUsdc > 0) {
      await recordReferralSponsoredSpend(anonymousId, requiredUsdc);
    }
    void recordTelegramBotEvent(freeSubsidy ? 'tg_free_tool' : 'tg_paid_tool', {
      telegramUserId: opts.telegramUserId ?? null,
      anonymousId: opts.userAnonymousId || anonymousId,
      props: {
        toolId: tool.id,
        toolName: tool.name,
        priceUsd: freeSubsidy ? 0 : requiredUsdc,
        billingReferral,
        freeSubsidy,
      },
    });
    return { status: 200, data: body.data, freeSubsidy, priceUsd: requiredUsdc };
  }

  const budgetExceeded = body?.budgetExceeded === true || body?.insufficientBalance === true;
  const error = body?.error || body?.message || 'Request failed';
  console.warn(
    `[syra-telegram] tool "${tool.id}" failed (status ${status}):`,
    String(error).slice(0, 300),
  );

  return {
    status: budgetExceeded ? 402 : status >= 400 ? status : 502,
    error,
    budgetExceeded,
  };
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
 * @param {{ anonymousId: string; payerAnonymousId?: string; question: string; telegramUserId?: number | null }} input
 * @returns {Promise<{ text: string; toolsUsed: string[]; chartAttachment?: object; showFollowUps: boolean; followUpQuestions: string[]; showMainMenu: boolean; followUpExpiresAt?: Date; limited?: boolean; depositPrompted?: boolean }>}
 */
export async function askSyraBrain({ anonymousId, payerAnonymousId, question, telegramUserId = null }) {
  try {
    return await askSyraBrainInner({ anonymousId, payerAnonymousId, question, telegramUserId });
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
      depositPrompted: false,
    };
  }
}

/**
 * @param {{ anonymousId: string; payerAnonymousId?: string; question: string; telegramUserId?: number | null }} input
 */
async function askSyraBrainInner({ anonymousId, payerAnonymousId, question, telegramUserId = null }) {
  const t0 = Date.now();
  /** @type {Record<string, number>} */
  const timing = {};

  const id = String(anonymousId || '').trim();
  const payerId = String(payerAnonymousId || anonymousId || '').trim();
  const billingReferral = payerId !== id;
  const rawQuestion = String(question || '').trim();
  if (!id || !rawQuestion) {
    return { text: 'Please send a question.', toolsUsed: [], showFollowUps: false, followUpQuestions: [], showMainMenu: false, depositPrompted: false };
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
    const tButtons = Date.now();
    const buttonPlan = await planTelegramAnswerButtons({
      userQuestion,
      assistantAnswer: declineText,
      toolsUsed: [],
    });
    timing.buttonsMs = Date.now() - tButtons;
    timing.totalMs = Date.now() - t0;
    console.info('[syra-telegram] brain timing', { intent: 'off_topic', ...timing });
    return {
      text: declineText,
      toolsUsed: [],
      showFollowUps: buttonPlan.showFollowUps,
      followUpQuestions: buttonPlan.followUpQuestions,
      showMainMenu: buttonPlan.showMainMenu,
      followUpExpiresAt: buttonPlan.followUpExpiresAt,
      depositPrompted: false,
    };
  }

  const conversationSnippet = buildConversationSnippet(chat);
  const freeRemainingPeek = await getTelegramFreeToolRemaining(id);

  const tMatch = Date.now();
  const [matchedTools, balanceResult] = await Promise.all([
    resolveTelegramMatchedTools(userQuestion, conversationSnippet),
    withTelegramTimeout(getAgentBalancesCached(payerId), TELEGRAM_BALANCE_TIMEOUT_MS, 'Balance check').catch(
      () => null,
    ),
  ]);
  timing.toolMatchMs = Date.now() - tMatch;

  let usdcBalance = balanceResult?.usdcBalance ?? 0;

  const capabilitiesList = getCapabilitiesList().join('\n');
  const apiMessages = [{ role: 'user', content: userQuestion }];

  const freeHint =
    freeRemainingPeek.remaining > 0
      ? `This user has ${freeRemainingPeek.remaining} free live-data tool call(s) left today (of ${freeRemainingPeek.limit}). Prefer using tools when they ask for live data — do not push deposits until free calls are exhausted.`
      : 'Free live-data calls for today are used up. If a paid tool fails for USDC, tell them to deposit via Wallet.';

  const systemContent = [
    'You are Syra — machine money for agents on Solana. You can chat naturally and use paid tools when the user asks for specific live data.',
    buildTelegramIntentSystemNotes(questionIntent),
    `Syra's live-data tools (only when the user needs current prices, news, signals, etc.):\n${capabilitiesList}`,
    freeHint,
    'If a paid tool was skipped or failed because of insufficient USDC, tell the user to deposit USDC to their Syra agent wallet (Wallet button) and try again.',
    billingReferral
      ? 'This user joined via a referral — paid tools are billed from their referrer\'s wallet (subject to a daily sponsor cap). If USDC/cap blocks them, tell them their referrer must deposit or they can fund their own wallet.'
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
  /** @type {string[]} */
  const directTelegramParts = [];
  let needsLlmForToolResults = false;
  /** @type {Array<{ name: string; status: string }>} */
  const toolUsages = [];
  /** @type {{ png: Buffer; caption: string; detailUrl: string } | null} */
  let chartAttachment = null;
  let depositPrompted = false;
  let usedFreeSubsidy = false;

  /** @type {Array<{ toolId: string; toolName: string; params: Record<string, string>; data: unknown }>} */
  const chartCandidates = [];

  if (matchedTools && matchedTools.length > 0) {
    const toolResults = [];
    const toolErrors = [];

    /** @type {Array<{ err: string; result: { budgetExceeded?: boolean; referralCap?: boolean } }>} */
    const liveDataFailures = [];

    /** @type {Array<{
     *   matched: { toolId: string; params?: object };
     *   tool: import('../../config/agentTools.js').AgentToolDefinition;
     *   params: Record<string, string>;
     *   priceUsd: number;
     *   freeSubsidy: boolean;
     * }>} */
    const jobs = [];

    for (const matched of matchedTools.slice(0, MAX_PARALLEL_TOOLS)) {
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

      const priceUsd = getEffectiveAgentToolPriceUsd(tool, null);
      let freeSubsidy = false;
      // Allocate free slots sequentially before parallel execution (quota must stay correct).
      if (priceUsd > 0 && canSubsidyTelegramTool(tool) && !billingReferral) {
        const slot = await tryConsumeTelegramFreeTool(id);
        freeSubsidy = slot.allowed;
        if (freeSubsidy) usedFreeSubsidy = true;
      }

      jobs.push({ matched, tool, params, priceUsd, freeSubsidy });
    }

    const tTools = Date.now();
    const settled = await Promise.all(
      jobs.map(async (job) => {
        const result = await executeTelegramTool(payerId, job.tool, job.params, usdcBalance, {
          freeSubsidy: job.freeSubsidy,
          billingReferral,
          userAnonymousId: id,
          telegramUserId,
        }).catch((e) => ({
          status: 502,
          error: e instanceof Error ? e.message : String(e),
        }));
        return { job, result };
      }),
    );
    timing.toolsMs = Date.now() - tTools;

    for (const { job, result } of settled) {
      const { tool, params, priceUsd, freeSubsidy, matched } = job;

      if (result.status !== 200) {
        const err = result.error || 'Request failed';
        const needsUsdc = /USDC|insufficient|no USDC|token account/i.test(err);
        const needsSol = /SOL|transaction fee|debit an account|no record of a prior credit/i.test(err);
        const isWalletConfig =
          /Agent wallet not found|privy_not_configured|missing_privy_wallet_id/i.test(err);
        let hint = 'Do not invent data.';
        if (result.referralCap) {
          hint =
            'Tell the user the referrer hit today\'s sponsor spend cap — they can deposit to their own wallet or ask the referrer to fund more.';
          depositPrompted = true;
        } else if (isWalletConfig) {
          hint =
            'Tell the user to open Wallet in the bot and ensure their Syra agent wallet is ready, then try again.';
        } else if (result.budgetExceeded || needsUsdc) {
          depositPrompted = true;
          hint = billingReferral
            ? 'Tell the user their referrer must deposit USDC to their Syra wallet — paid tools bill the referrer, not this user. Or they can deposit to their own wallet.'
            : 'Tell the user to deposit USDC to their Syra agent wallet (Wallet button) to pay for this tool. Mention free daily live-data calls reset at midnight UTC.';
        } else if (needsSol) {
          hint =
            'Tell the user their agent wallet needs a small amount of SOL (e.g. 0.01) for transaction fees.';
        } else {
          hint = 'Suggest they try again in a moment. Do not invent data.';
        }
        toolErrors.push(`[Tool "${tool.name}" failed: ${err}. ${hint}]`);
        toolUsages.push({ name: tool.name, status: 'error' });
        liveDataFailures.push({ err, result });
      } else {
        hadToolResults = true;
        toolUsages.push({ name: tool.name, status: 'complete' });
        if (!freeSubsidy && priceUsd > 0) {
          usdcBalance = Math.max(0, usdcBalance - priceUsd);
          invalidateBalanceCache(payerId, balanceResult?.agentAddress);
        }
        if (TELEGRAM_DIRECT_FORMAT_TOOLS.has(matched.toolId)) {
          const direct = formatTelegramToolDirect(matched.toolId, result.data, params);
          if (direct) directTelegramParts.push(direct);
        } else {
          needsLlmForToolResults = true;
        }
        chartCandidates.push({
          toolId: matched.toolId,
          toolName: tool.name,
          params,
          data: result.data,
        });
        const formatted = formatToolResultForLlm(result.data, tool.id);
        const freeNote = result.freeSubsidy
          ? '\n\n[Note for reply: this live-data call used one of the user\'s free daily tool credits. Mention briefly if useful.]'
          : '';
        toolResults.push(
          `[Result from tool "${tool.name}" — present clearly for Telegram.]${freeNote}\n\n${formatted}`,
        );
      }
    }

    if (depositPrompted) {
      void recordTelegramBotEvent('tg_deposit_prompt', {
        telegramUserId,
        anonymousId: id,
        props: { billingReferral },
      });
    }

    if (toolErrors.length > 0 && toolResults.length === 0 && matchedTools.length > 0) {
      const firstFailure = liveDataFailures[0];
      const directFailure = firstFailure
        ? buildLiveDataFailureText(firstFailure.err, firstFailure.result, billingReferral)
        : 'I could not fetch that live data right now. Please try again in a moment.';
      const text = enforceSyraBranding(directFailure) || directFailure;
      await persistChatTurn(chat, userQuestion, text, toolUsages);
      const tButtons = Date.now();
      const buttonPlan = await planTelegramAnswerButtons({
        userQuestion,
        assistantAnswer: text,
        toolsUsed: [],
      });
      timing.buttonsMs = Date.now() - tButtons;
      timing.totalMs = Date.now() - t0;
      console.info('[syra-telegram] brain timing', { intent: questionIntent, path: 'tool_fail', ...timing });
      return {
        text,
        toolsUsed: [],
        chartAttachment: null,
        showFollowUps: buttonPlan.showFollowUps,
        followUpQuestions: buttonPlan.followUpQuestions,
        showMainMenu: buttonPlan.showMainMenu,
        followUpExpiresAt: buttonPlan.followUpExpiresAt,
        depositPrompted,
      };
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

  /**
   * Build first available chart (off the tool serial path).
   * @returns {Promise<{ png: Buffer; caption: string; detailUrl: string } | null>}
   */
  async function resolveChart() {
    for (const c of chartCandidates) {
      try {
        const chart = await buildTelegramChartAttachment(c.toolId, c.params, c.data);
        if (chart) return chart;
      } catch (chartErr) {
        console.warn('[syraTelegramBot] chart render failed:', chartErr?.message || chartErr);
      }
    }
    return null;
  }

  const toolsUsed = toolUsages.filter((t) => t.status === 'complete').map((t) => t.name);
  const directTelegramText =
    directTelegramParts.length > 0 ? directTelegramParts.join('\n\n---\n\n') : null;

  if (directTelegramText && !needsLlmForToolResults) {
    const tChart = Date.now();
    chartAttachment = await resolveChart();
    timing.chartMs = Date.now() - tChart;

    let text = enforceSyraBranding(directTelegramText) || directTelegramText;
    if (usedFreeSubsidy) {
      const rem = await getTelegramFreeToolRemaining(id);
      text = `${text}\n\n_Free live-data credit used · ${rem.remaining} left today_`;
    }
    await persistChatTurn(chat, userQuestion, text, toolUsages);
    const tButtons = Date.now();
    const buttonPlan = await planTelegramAnswerButtons({
      userQuestion,
      assistantAnswer: text,
      toolsUsed,
    });
    timing.buttonsMs = Date.now() - tButtons;
    timing.totalMs = Date.now() - t0;
    console.info('[syra-telegram] brain timing', { intent: questionIntent, path: 'direct', ...timing });
    return {
      text,
      toolsUsed,
      chartAttachment,
      showFollowUps: buttonPlan.showFollowUps,
      followUpQuestions: buttonPlan.followUpQuestions,
      showMainMenu: buttonPlan.showMainMenu,
      followUpExpiresAt: buttonPlan.followUpExpiresAt,
      depositPrompted,
    };
  }

  const llmOptions = {
    max_tokens: hadToolResults ? MAX_TOKENS_WITH_TOOLS : MAX_TOKENS_DEFAULT,
    timeoutMs: TELEGRAM_LLM_TIMEOUT_MS,
    temperature: hadToolResults ? 0.35 : 0.6,
  };

  const tLlm = Date.now();
  const [llmSettled, chartSettled] = await Promise.all([
    callOpenRouter(withLlmIdentitySystemNote(apiMessages, OPENROUTER_DEFAULT_MODEL), llmOptions),
    resolveChart(),
  ]);
  timing.llmMs = Date.now() - tLlm;
  chartAttachment = chartSettled;

  let text =
    enforceSyraBranding(llmSettled.response) || "I couldn't generate a response. Please try again.";
  if (usedFreeSubsidy) {
    const rem = await getTelegramFreeToolRemaining(id);
    text = `${text}\n\n_Free live-data credit used · ${rem.remaining} left today_`;
  }

  await persistChatTurn(chat, userQuestion, text, toolUsages);

  const tButtons = Date.now();
  const buttonPlan = await planTelegramAnswerButtons({
    userQuestion,
    assistantAnswer: text,
    toolsUsed,
  });
  timing.buttonsMs = Date.now() - tButtons;
  timing.totalMs = Date.now() - t0;
  console.info('[syra-telegram] brain timing', { intent: questionIntent, path: 'llm', ...timing });

  return {
    text,
    toolsUsed,
    chartAttachment,
    showFollowUps: buttonPlan.showFollowUps,
    followUpQuestions: buttonPlan.followUpQuestions,
    showMainMenu: buttonPlan.showMainMenu,
    followUpExpiresAt: buttonPlan.followUpExpiresAt,
    depositPrompted,
  };
}
