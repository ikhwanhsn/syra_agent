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
} from "./agent/chat.js";
import { getAgentTool, getCapabilitiesList } from "../config/agentTools.js";
import { callJatevo } from "../libs/jatevo.js";
import { resolveAgentBaseUrl } from "./agent/utils.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const MAX_TOOLS_PER_REQUEST = 3;
const MAX_TOKENS_WITH_TOOLS = 4096;
const MAX_TOKENS_DEFAULT = 2000;

const outputSchema = {
  success: { type: "boolean", description: "Whether the request succeeded" },
  response: { type: "string", description: "Syra's answer in plain text / markdown" },
  toolUsages: { type: "array", description: "Tools that were selected and their status" },
};

const questionDescription = "Natural language question (e.g. latest BTC news, trending pools on Solana)";

/** Shared brain logic: runs tool selection, tool calls, LLM; calls settlePaymentAndSetResponse and sends JSON. */
async function runBrain(req, res, question) {
  try {
    const apiMessages = [{ role: "user", content: question }];
    const matchedTools = await selectToolsWithLlm(question);
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
        const url = `${baseUrl}${tool.path}`;
        const method = tool.method || "GET";
        const result = await callToolWithTreasury(
          url,
          method,
          method === "GET" ? params : {},
          method === "POST" ? params : undefined
        );

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
    const { response } = await callJatevo(apiMessages, jatevoOptions);

    await settlePaymentAndSetResponse(res, req);
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

  router.get(
    "/",
    requirePayment(getPaymentOptions),
    async (req, res) => {
      const question = (req.query.question ?? "").trim();
      if (!question) {
        res.status(400).json({ success: false, error: "question is required (query param)" });
        return;
      }
      await runBrain(req, res, question);
    }
  );

  router.post(
    "/",
    requirePayment(postPaymentOptions),
    async (req, res) => {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const question = (body.question ?? "").trim();
      if (!question) {
        res.status(400).json({ success: false, error: "question is required (body)" });
        return;
      }
      await runBrain(req, res, question);
    }
  );

  return router;
}
