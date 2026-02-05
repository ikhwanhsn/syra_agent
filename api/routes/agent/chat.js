import express from 'express';
import Chat from '../../models/agent/Chat.js';
import { callJatevo, getJatevoModels } from '../../libs/jatevo.js';
import { JATEVO_MODELS, JATEVO_DEFAULT_MODEL } from '../../config/jatevoModels.js';
import {
  getAgentTool,
  getCapabilitiesList,
  getToolsForLlmSelection,
} from '../../config/agentTools.js';
import { getAgentUsdcBalance, getAgentBalances, getAgentAddress } from '../../libs/agentWallet.js';
import { callX402V2WithAgent } from '../../libs/agentX402Client.js';
import { resolveAgentBaseUrl } from './utils.js';

const router = express.Router();

const MAX_TOOLS_PER_REQUEST = 3;

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
- For the "signal" tool set "params": {"token": "bitcoin"} or {"token": "ethereum"} or {"token": "solana"} when the user asks for a signal for a specific coin.
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

// GET /models - List available Jatevo LLM models for the agent chat. Prefer Jatevo API list when available.
router.get('/models', async (_req, res) => {
  try {
    const fromApi = await getJatevoModels();
    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return res.json({ models: fromApi });
    }
  } catch (err) {
    console.warn('[agent/chat] GET /models: could not fetch from Jatevo, using config', err?.message);
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
    /** @type {Array<{ toolId: string; params?: Record<string, string> }>} */
    let matchedTools;
    if (clientToolRequest?.toolId != null) {
      matchedTools = [{ toolId: clientToolRequest.toolId, params: clientToolRequest.params || {} }];
    } else if (Array.isArray(clientToolRequest?.tools) && clientToolRequest.tools.length > 0) {
      matchedTools = clientToolRequest.tools
        .slice(0, MAX_TOOLS_PER_REQUEST)
        .filter((t) => t?.toolId && getAgentTool(t.toolId))
        .map((t) => ({ toolId: t.toolId, params: t.params || {} }));
    } else {
      matchedTools = await selectToolsWithLlm(lastUserMessage);
    }

    const capabilitiesList = getCapabilitiesList().join('\n');

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
      systemParts.push(
        `Agent wallet knowledge: The agent wallet needs BOTH (1) USDC to pay for paid tools, and (2) SOL to pay Solana transaction fees. If the user has 0 or very low USDC, tell them to deposit USDC to their agent wallet to use paid tools. If the user has 0 or very low SOL (e.g. below 0.001), tell them to send a small amount of SOL (e.g. 0.01 SOL) to their agent wallet address so payments can be processed. If a paid tool fails with a message about "SOL for transaction fees" or "debit an account", explain clearly that they need to add SOL to their agent wallet for network fees. If the failure mentions "USDC" or "insufficient balance", explain they need to add USDC for the tool cost.`
      );
    }
    if (systemPrompt && typeof systemPrompt === 'string') {
      systemParts.push(systemPrompt);
    }
    apiMessages.unshift({ role: 'system', content: systemParts.join('\n\n') });

    let amountChargedUsd = 0;
    if (!matchedTools || matchedTools.length === 0) {
      // No tools matched: let the agent answer from the system prompt (general chat vs out-of-scope).
    } else if (walletConnected === false) {
      const toolIds = matchedTools.map((t) => t.toolId).join(', ');
      apiMessages.push({
        role: 'user',
        content: `[The user asked for something that requires paid tool(s) (${toolIds}), but they have not connected a wallet. Reply that they need to connect their wallet to use tools and get this information. You can mention they can chat about crypto without a wallet, but tools and realtime data require a connected wallet.]`,
      });
    } else if (anonymousId) {
      let usdcBalance = (await getAgentUsdcBalance(anonymousId))?.usdcBalance ?? 0;
      const toolResults = [];
      const toolErrors = [];
      for (const matched of matchedTools) {
        const tool = getAgentTool(matched.toolId);
        const params = typeof matched.params === 'object' ? matched.params || {} : {};
        if (!tool) continue;
        const requiredUsdc = tool.priceUsd;
        if (usdcBalance <= 0 || usdcBalance < requiredUsdc) {
          const msg =
            usdcBalance <= 0
              ? `The user's agent wallet has 0 USDC balance. The requested paid tool (${tool.name}) costs $${requiredUsdc.toFixed(4)}. Explain that they need to deposit USDC to their agent wallet to use this feature.`
              : `The user's agent wallet has insufficient USDC (balance: $${usdcBalance.toFixed(4)}, required for ${tool.name}: $${requiredUsdc.toFixed(4)}). Explain this and ask them to deposit more USDC.`;
          toolErrors.push(msg);
          continue;
        }
        const url = `${resolveAgentBaseUrl(req)}${tool.path}`;
        const method = tool.method || 'GET';
        const result = await callToolWithAgentWallet(
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
          if (needsSol) {
            instruction += ` Tell the user their agent wallet needs SOL to pay Solana transaction fees—they should send a small amount of SOL (e.g. 0.01) to their agent wallet address.`;
          } else if (needsUsdc) {
            instruction += ` Tell the user they need to deposit USDC to their agent wallet to pay for this tool.`;
          } else {
            instruction += ` Suggest they check their agent wallet has both USDC (for the tool) and SOL (for fees), or try again later.`;
          }
          toolErrors.push(instruction);
        } else {
          amountChargedUsd += tool.priceUsd;
          usdcBalance -= tool.priceUsd;
          toolResults.push(
            `[Result from paid tool "${tool.name}" — present this to the user in clear, human-readable form. Use headings, short paragraphs, bullet points or markdown tables. Do not include raw JSON or any {"tool"/"params"} blocks.]\n\n${JSON.stringify(result.data, null, 2)}`
          );
        }
      }
      if (toolErrors.length > 0 && toolResults.length === 0) {
        apiMessages.push({ role: 'user', content: toolErrors[0] });
      } else if (toolResults.length > 0) {
        const combined = toolResults.join('\n\n---\n\n');
        apiMessages.push({ role: 'user', content: combined });
        if (toolErrors.length > 0) {
          apiMessages.push({ role: 'user', content: toolErrors.join(' ') });
        }
      }
    } else {
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
    const requestedModel = jatevoOptions.model || JATEVO_DEFAULT_MODEL;
    console.log(`[agent/chat] Completion request model=${requestedModel}`);

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
            `[agent/chat] Jatevo account budget exceeded. Using default model. Top up at Jatevo to use other models.`
          );
        } else {
          console.error(
            `[agent/chat] Requested model "${requestedModel}" failed, falling back to ${JATEVO_DEFAULT_MODEL}. Reason: ${reason}`
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
    console.log(`[agent/chat] Completion success model=${actualModel}${usedFallbackModel ? ' (fallback)' : ''}`);

    const payload = { success: true, response };
    if (truncated) payload.truncated = true;
    if (amountChargedUsd > 0) payload.amountChargedUsd = amountChargedUsd;
    if (usedFallbackModel) payload.usedFallbackModel = true;
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
