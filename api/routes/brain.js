/**
 * v2 x402 API: Syra Brain — single-question API that runs tool selection, tool calls (treasury-paid), and LLM.
 * For external developers to integrate Syra brain chat with one paid request.
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_BRAIN_USD } from "../config/x402Pricing.js";
import {
  selectToolsWithLlm,
  formatToolResultForLlm,
  callToolWithTreasury,
  withLlmIdentitySystemNote,
} from "./agent/chat.js";
import { getAgentTool, getCapabilitiesList } from "../config/agentTools.js";
import { JATEVO_DEFAULT_MODEL } from "../config/jatevoModels.js";
import { callZerionWithTreasury } from "../libs/agentZerionClient.js";
import { callJatevo } from "../libs/jatevo.js";
import { resolveAgentBaseUrl } from "./agent/utils.js";
import {
  requirePaymentSapEscrowOrExact,
  settleSapEscrowOrFacilitator,
} from "../utils/sapEscrowPayment.js";

const { requirePayment, getPaymentSignatureHeaderFromReq } = await getV2Payment();

const MAX_TOOLS_PER_REQUEST = 3;
const MAX_TOKENS_WITH_TOOLS = 4096;
const MAX_TOKENS_DEFAULT = 2000;

const outputSchema = {
  success: { type: "boolean", description: "Whether the request succeeded" },
  response: { type: "string", description: "Syra's answer in plain text / markdown" },
  toolUsages: { type: "array", description: "Tools that were selected and their status" },
};

const questionDescription = "Natural language question (e.g. latest BTC news, trending pools on Solana)";

/** Shared brain logic: tool selection, treasury-paid tool calls, LLM; then settle (PayAI exact or SAP escrow). */
async function runBrain(req, res, question) {
  try {
    const apiMessages = [{ role: "user", content: question }];
    let matchedTools = await selectToolsWithLlm(question);
    if (!matchedTools || matchedTools.length === 0) {
      const likelyNeedsLiveData =
        /\b(price|narrative|narratives|news|today|market|solana|trending|latest|current|signal|sentiment|token|defi|btc|eth|volume|ecosystem|headline)\b/i.test(
          question
        );
      if (likelyNeedsLiveData) {
        matchedTools = [{ toolId: "news", params: { ticker: "general" } }];
      }
    }
    const capabilitiesList = getCapabilitiesList().join("\n");

    const systemContent = [
      "You are Syra, a smart AI agent for crypto, web3, and blockchain. You answer using ONLY data from paid tools — never from training data for real-time information.",
      `Syra's paid tools:\n${capabilitiesList}`,
      `CRITICAL — NEVER FABRICATE REAL-TIME DATA:
You MUST NEVER make up, guess, or use training data for: prices, market caps, volumes, token metrics, news headlines, trending tokens, wallet balances, smart money flows, trading signals, on-chain data, or ANY information that changes over time.
- If tool results are provided below, use ONLY that data to answer. Do not supplement with guessed numbers.
- If no tool results are provided, or a tool failed, tell the user the data could not be fetched and suggest trying again. NEVER fill in gaps with made-up numbers.
- You CAN explain general crypto concepts, mechanisms, and strategies without tools.`,
      "Response format: Reply in clear, human-readable text. Use markdown: headings, bullet points, tables. Do not include raw JSON or code blocks of tool calls. Turn all data into plain, well-formatted prose.",
      "This request is from the Syra Brain API (single-question). Tools were run server-side; synthesize the results into one coherent answer using ONLY the tool data provided.",
    ].join("\n\n");
    apiMessages.unshift({ role: "system", content: systemContent });

    let hadToolResults = false;
    const toolUsages = [];

    if (!matchedTools || matchedTools.length === 0) {
      // No tools matched — inject guardrail for real-time data questions
      if (/\b(price|how much|market cap|volume|trending|latest news|current|live|real.?time|what('?s| is) .{0,30} (price|worth|trading|at)|ticker|apy|apr|tvl|floor price)\b/i.test(question)) {
        apiMessages.push({
          role: "user",
          content: `[SYSTEM NOTE: The user appears to be asking for real-time data, but no tool was matched. Do NOT answer with any specific numbers or prices from training data. Tell the user the data could not be fetched and suggest rephrasing their question.]`,
        });
      }
    }

    if (matchedTools && matchedTools.length > 0) {
      const baseUrl = resolveAgentBaseUrl(req);
      const toolResults = [];
      const toolErrors = [];

      for (const matched of matchedTools) {
        const tool = getAgentTool(matched.toolId);
        if (!tool) continue;

        // Brain API has no agent wallet; swaps require taker — skip and explain
        if (matched.toolId === "jupiter-swap-order") {
          toolErrors.push(
            "[Swap is not supported in the Brain API; use Syra agent chat with a connected wallet to execute swaps.]"
          );
          toolUsages.push({ name: tool.name, status: "error" });
          continue;
        }

        const rawParams = typeof matched.params === "object" ? matched.params : {};
        let params = Object.fromEntries(
          Object.entries(rawParams)
            .filter(([k, v]) => typeof k === "string" && v != null && v !== "")
            .map(([k, v]) => [k, typeof v === "string" ? v : String(v)])
        );
        const method = tool.method || "GET";
        let result;
        if (tool.zerionPath) {
          const zr = await callZerionWithTreasury(tool.zerionPath, method, params);
          result = zr.success
            ? { status: 200, data: zr.data }
            : {
                status: zr.budgetExceeded ? 402 : 502,
                error: zr.error,
                budgetExceeded: zr.budgetExceeded,
              };
        } else {
          const url = `${baseUrl}${tool.path}`;
          result = await callToolWithTreasury(
            url,
            method,
            method === "GET" ? params : {},
            method === "POST" ? params : undefined
          );
        }

        if (result.status !== 200) {
          const err = result.error || "Request failed";
          toolErrors.push(`[Paid tool "${tool.name}" failed: ${err}. Do not invent data.]`);
          toolUsages.push({ name: tool.name, status: "error" });
        } else {
          hadToolResults = true;
          toolUsages.push({ name: tool.name, status: "complete" });
          const formatted = formatToolResultForLlm(result.data, tool.id);
          const presentInstruction =
            tool.id === "trending-jupiter"
              ? "Present this Jupiter trending data in a clear table or list. Use ONLY the data below."
              : "Present this in clear, human-readable form. Use headings, bullet points or markdown tables.";
          toolResults.push(
            `[Result from paid tool "${tool.name}" — ${presentInstruction}]\n\n${formatted}`
          );
        }
      }

      if (toolErrors.length > 0 && toolResults.length === 0) {
        apiMessages.push({ role: "user", content: toolErrors[0] });
      } else if (toolResults.length > 0) {
        apiMessages.push({ role: "user", content: toolResults.join("\n\n---\n\n") });
        if (toolErrors.length > 0) {
          apiMessages.push({ role: "user", content: toolErrors.join(" ") });
        }
      }
    }

    const jatevoOptions = {
      max_tokens: hadToolResults ? MAX_TOKENS_WITH_TOOLS : MAX_TOKENS_DEFAULT,
    };
    const { response } = await callJatevo(
      withLlmIdentitySystemNote(apiMessages, JATEVO_DEFAULT_MODEL),
      jatevoOptions
    );

    const servicePayload = JSON.stringify({
      resource: "/brain",
      question: question.slice(0, 500),
      at: new Date().toISOString(),
    });
    await settleSapEscrowOrFacilitator(res, req, servicePayload);
    res.json({
      success: true,
      response: response || "I couldn't generate a response. Please try again.",
      ...(toolUsages.length > 0 && { toolUsages }),
    });
  } catch (err) {
    const message = err?.message ?? String(err);
    res.status(500).json({
      success: false,
      error: "Brain request failed",
      message,
    });
  }
}

export async function createBrainRouter() {
  const router = express.Router();

  const getPaymentOptions = {
    price: X402_API_PRICE_BRAIN_USD,
    description: "Syra Brain: single-question API (AI selects and runs tools, returns one answer)",
    method: "GET",
    discoverable: true,
    resource: "/brain",
    inputSchema: {
      queryParams: {
        question: {
          type: "string",
          required: true,
          description: questionDescription,
        },
      },
    },
    outputSchema,
  };

  const postPaymentOptions = {
    price: X402_API_PRICE_BRAIN_USD,
    description: "Syra Brain: single-question API (AI selects and runs tools, returns one answer)",
    method: "POST",
    discoverable: true,
    resource: "/brain",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        question: {
          type: "string",
          required: true,
          description: questionDescription,
        },
      },
    },
    outputSchema,
  };

  const payGet = requirePaymentSapEscrowOrExact(requirePayment, getPaymentOptions);
  const payPost = requirePaymentSapEscrowOrExact(requirePayment, postPaymentOptions);

  /** Require `question` before charging: unpaid → 402; paid without question → 400 (no settlement). */
  function validateBrainQuestionGet(req, res, next) {
    const q = (req.query.question ?? "").trim();
    const hasExact = getPaymentSignatureHeaderFromReq(req);
    const hasSap = String(req.headers["x-payment-protocol"] || "").trim() === "SAP-x402";
    if (!q) {
      if (!hasExact && !hasSap) {
        return requirePayment(getPaymentOptions)(req, res, () => {});
      }
      return res.status(400).json({ success: false, error: "question is required (query param)" });
    }
    return next();
  }

  function validateBrainQuestionPost(req, res, next) {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const q = (body.question ?? "").trim();
    const hasExact = getPaymentSignatureHeaderFromReq(req);
    const hasSap = String(req.headers["x-payment-protocol"] || "").trim() === "SAP-x402";
    if (!q) {
      if (!hasExact && !hasSap) {
        return requirePayment(postPaymentOptions)(req, res, () => {});
      }
      return res.status(400).json({ success: false, error: "question is required (body)" });
    }
    return next();
  }

  router.get("/", validateBrainQuestionGet, payGet, async (req, res) => {
    const question = (req.query.question ?? "").trim();
    await runBrain(req, res, question);
  });

  router.post("/", validateBrainQuestionPost, payPost, async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const question = (body.question ?? "").trim();
    await runBrain(req, res, question);
  });

  return router;
}
