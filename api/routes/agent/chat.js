import express from 'express';
import Chat from '../../models/agent/Chat.js';
import { callJatevo } from '../../libs/jatevo.js';
import {
  getAgentTool,
  getCapabilitiesList,
  getToolsForLlmSelection,
} from '../../config/agentTools.js';
import { getAgentUsdcBalance, getAgentBalances, getAgentAddress } from '../../libs/agentWallet.js';
import { callX402V2WithAgent } from '../../libs/agentX402Client.js';
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
- For the "news" tool set "params": {"ticker": "BTC"} or {"ticker": "ETH"} or {"ticker": "SOL"} or {"ticker": "general"} when the user asks for news about a coin.
- For the "signal" tool set "params": {"token": "bitcoin"} or {"token": "ethereum"} or {"token": "solana"} when the user asks for a signal for a specific coin (e.g. "bitcoin signal" -> token bitcoin, "BTC signal" -> token bitcoin, "eth signal" -> token ethereum).
- For all other tools use "params": {}.
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
          // Pay with agent wallet server-side (balance reduces on-chain here)
          const agentAddr = await getAgentAddress(anonymousId);
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
            apiMessages.push({ role: 'user', content: instruction });
          } else {
            amountChargedUsd = tool.priceUsd;
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

    const { response, truncated } = await callJatevo(apiMessages, { anonymousId });
    const payload = { success: true, response };
    if (truncated) payload.truncated = true;
    if (amountChargedUsd > 0) payload.amountChargedUsd = amountChargedUsd;
    return res.json(payload);
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
