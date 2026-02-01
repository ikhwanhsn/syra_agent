import express from 'express';
import Chat from '../../models/agent/Chat.js';
import { callJatevo } from '../../libs/jatevo.js';
import {
  getAgentTool,
  getCapabilitiesList,
  getToolsForLlmSelection,
} from '../../config/agentTools.js';
import { getAgentUsdcBalance } from '../../libs/agentWallet.js';
import { resolveAgentBaseUrl } from './utils.js';

const router = express.Router();

/**
 * Use Jatevo LLM to pick the best tool (and optional params) from the user question.
 * @param {string} userMessage - Last user message
 * @returns {Promise<{ toolId: string; params?: Record<string, string> } | null>}
 */
async function selectToolWithLlm(userMessage) {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) return null;

  const tools = getToolsForLlmSelection();
  const toolsText = tools
    .map((t) => {
      let line = `- ${t.id}: ${t.name} — ${t.description}`;
      if (t.paramsHint) line += ` (${t.paramsHint})`;
      return line;
    })
    .join('\n');

  const systemContent = `You are a tool selector. Given the user's question, pick exactly ONE tool from the list below that best helps answer it. You must respond with ONLY a valid JSON object, no markdown, no explanation, no other text.

Available tools (id, name, description):
${toolsText}

Response format: {"toolId": "<id>" | null, "params": {}}
- Use "toolId" with one of the ids above if a tool fits the question; otherwise use "toolId": null.
- For the "news" tool you may set "params": {"ticker": "BTC"} or {"ticker": "ETH"} or {"ticker": "SOL"} or {"ticker": "general"}. For all other tools use "params": {}.
- If the question does not match any tool, respond with: {"toolId": null, "params": {}}`;

  const userContent = `User question: ${userMessage.trim()}`;

  try {
    const { response } = await callJatevo(
      [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      { max_tokens: 200, temperature: 0.2 }
    );

    const raw = (response || '').trim();
    let jsonStr = raw;
    const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) jsonStr = codeBlock[1].trim();
    const parsed = JSON.parse(jsonStr);
    const toolId = parsed?.toolId;
    if (toolId == null || typeof toolId !== 'string') return null;

    const tool = getAgentTool(toolId);
    if (!tool) return null;

    const params =
      parsed.params && typeof parsed.params === 'object' && !Array.isArray(parsed.params)
        ? Object.fromEntries(
            Object.entries(parsed.params).filter(
              ([k, v]) => typeof k === 'string' && (v == null || typeof v === 'string')
            )
          )
        : {};
    return { toolId, params };
  } catch (err) {
    return null;
  }
}

/** Get client payment header from request (for playground-style pay-then-retry). */
function getClientPaymentHeader(req) {
  const h =
    (req.get && (req.get('X-Payment') || req.get('PAYMENT-SIGNATURE') || req.get('x-payment') || req.get('payment-signature'))) ||
    (req.headers && (req.headers['x-payment'] || req.headers['payment-signature'] || req.headers['X-Payment'] || req.headers['PAYMENT-SIGNATURE']));
  return typeof h === 'string' && h.trim() ? h.trim() : null;
}

/**
 * Fetch tool URL once; if 402, return { status: 402, body } so caller can proxy to client.
 * If client sent payment header, include it so paid resource may return 200.
 */
async function fetchToolOnce(url, method, query, body, paymentHeader) {
  const u = new URL(url);
  if (query && method === 'GET') {
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') u.searchParams.set(k, String(v));
    });
  }
  const opts = {
    method: method || 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  if (paymentHeader) {
    opts.headers['X-Payment'] = paymentHeader;
    opts.headers['PAYMENT-SIGNATURE'] = paymentHeader;
  }
  if (body && method === 'POST') {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(u.toString(), opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 402) {
    return { status: 402, body: data };
  }
  if (!res.ok) {
    return { status: res.status, error: data?.error || res.statusText };
  }
  return { status: 200, data };
}

// POST /completion - Get LLM completion from Jatevo. Tool is chosen dynamically by Jatevo from the user question.
// Playground-style: when tool returns 402, we return 402 to client; client calls pay-402 then retries with X-Payment.
// When client sends X-Payment, we forward it to the tool request.
router.post('/completion', async (req, res) => {
  const completionStart = Date.now();
  try {
    const { messages: bodyMessages, systemPrompt, anonymousId, toolRequest: clientToolRequest, walletConnected } =
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
    const matchedTool =
      clientToolRequest?.toolId != null
        ? { toolId: clientToolRequest.toolId, params: clientToolRequest.params }
        : await selectToolWithLlm(lastUserMessage);

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
      `Response format: Always reply in clear, human-readable text. Use markdown: headings (##), bullet points, numbered lists, and tables where they help readability. Format numbers, prices, and percentages clearly (e.g. $1,234.56, +2.5%). Do not include raw JSON, code blocks showing tool calls, or blocks like {"tool": "..."} in your reply—turn all data into plain, well-formatted prose and tables only.`
    );
    if (anonymousId) {
      const balanceResult = await getAgentUsdcBalance(anonymousId);
      const usdcBalance = balanceResult?.usdcBalance ?? 0;
      systemParts.push(
        `User's agent wallet USDC balance: $${usdcBalance.toFixed(4)}. If the user asks for a paid tool and balance is 0 or lower than the tool price, explain that they need to deposit USDC to their agent wallet.`
      );
    }
    if (systemPrompt && typeof systemPrompt === 'string') {
      systemParts.push(systemPrompt);
    }
    apiMessages.unshift({ role: 'system', content: systemParts.join('\n\n') });

    if (!matchedTool) {
      // No tool matched: let the agent answer from the system prompt (general chat vs out-of-scope).
      // Do not inject any extra message; the conversation goes to the LLM as-is.
    } else if (walletConnected === false) {
      // User has not connected a wallet; don't call the tool—ask them to connect.
      apiMessages.push({
        role: 'user',
        content: `[The user asked for something that requires a paid tool (${matchedTool.toolId}), but they have not connected a wallet. Reply that they need to connect their wallet to use tools and get this information. You can mention they can chat about crypto without a wallet, but tools and realtime data require a connected wallet.]`,
      });
    } else if (anonymousId) {
      const tool = getAgentTool(matchedTool.toolId);
      const params = typeof matchedTool.params === 'object' ? matchedTool.params || {} : {};
      if (tool) {
        const balanceResult = await getAgentUsdcBalance(anonymousId);
        const usdcBalance = balanceResult?.usdcBalance ?? 0;
        const requiredUsdc = tool.priceUsd;
        if (usdcBalance > 0 && usdcBalance >= requiredUsdc) {
          const url = `${resolveAgentBaseUrl(req)}${tool.path}`;
          const method = tool.method || 'GET';
          const paymentHeader = getClientPaymentHeader(req);
          const result = await fetchToolOnce(
            url,
            method,
            method === 'GET' ? params : {},
            method === 'POST' ? params : undefined,
            paymentHeader
          );
          if (result.status === 402) {
            return res.status(402).json(result.body);
          }
          if (result.status !== 200) {
            apiMessages.push({
              role: 'user',
              content: `[Paid tool "${tool.name}" failed: ${result.error || 'Request failed'}. Explain the tool was unavailable and suggest trying again or depositing USDC if needed.]`,
            });
          } else {
            const toolContent = `[Result from paid tool "${tool.name}" — present this to the user in clear, human-readable form only. Use headings, short paragraphs, bullet points or markdown tables. Do not include raw JSON or any {"tool"/"params"} blocks in your reply.]\n\n${JSON.stringify(result.data, null, 2)}`;
            apiMessages.push({ role: 'user', content: toolContent });
          }
        } else {
          const msg =
            usdcBalance <= 0
              ? `The user's agent wallet has 0 USDC balance. The requested paid tool (${tool.name}) costs $${requiredUsdc.toFixed(4)}. Explain that they need to deposit USDC to their agent wallet to use this feature.`
              : `The user's agent wallet has insufficient USDC (balance: $${usdcBalance.toFixed(4)}, required for ${tool.name}: $${requiredUsdc.toFixed(4)}). Explain this and ask them to deposit more USDC.`;
          apiMessages.push({ role: 'user', content: msg });
        }
      }
    } else {
      apiMessages.push({
        role: 'user',
        content: `[The user asked for a paid tool (${matchedTool.toolId}) but no agent wallet is linked. Reply that they need to connect or create an agent wallet and deposit USDC to use Syra's paid features.]`,
      });
    }

    const { response } = await callJatevo(apiMessages, { anonymousId });
    return res.json({ success: true, response });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      error: error.message || 'Completion failed',
    });
  }
});

// GET / - List chats for the given anonymousId (newest first). Scoped by wallet/user.
router.get('/', async (req, res) => {
  try {
    const { anonymousId, limit = 50 } = req.query;
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const chats = await Chat.find({ anonymousId: ownerId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit, 10))
      .select('title preview agentId systemPrompt updatedAt createdAt')
      .lean();

    const result = chats.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      preview: c.preview,
      agentId: c.agentId,
      systemPrompt: c.systemPrompt,
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
    const { anonymousId, title = 'New Chat', preview = '', agentId = '', systemPrompt = '' } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const chat = new Chat({ anonymousId: ownerId, title, preview, agentId, systemPrompt, messages: [] });
    await chat.save();

    res.status(201).json({
      success: true,
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        preview: chat.preview,
        agentId: chat.agentId,
        systemPrompt: chat.systemPrompt,
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
    const chat = await Chat.findOne({ _id: id, anonymousId: ownerId }).lean();
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
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
      title: chat.title,
      preview: chat.preview,
      agentId: chat.agentId,
      systemPrompt: chat.systemPrompt,
      messages,
      timestamp: chat.updatedAt,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /:id - Update chat metadata (must belong to anonymousId)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId, title, preview, agentId, systemPrompt } = req.body || {};
    if (!anonymousId || typeof anonymousId !== 'string' || !anonymousId.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const ownerId = anonymousId.trim();
    const update = {};
    if (title !== undefined) update.title = title;
    if (preview !== undefined) update.preview = preview;
    if (agentId !== undefined) update.agentId = agentId;
    if (systemPrompt !== undefined) update.systemPrompt = systemPrompt;

    const chat = await Chat.findOneAndUpdate(
      { _id: id, anonymousId: ownerId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    res.json({
      success: true,
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        preview: chat.preview,
        agentId: chat.agentId,
        systemPrompt: chat.systemPrompt,
        timestamp: chat.updatedAt,
        updatedAt: chat.updatedAt,
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
