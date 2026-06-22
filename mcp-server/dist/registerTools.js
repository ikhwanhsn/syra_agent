import { z } from "zod";
import { MCP_TOOL_CATALOG } from "./generated/toolCatalog.js";
import { callCatalogTool, callFreeRoute, callToolById } from "./syraApi.js";
import { hasPaidFetchConfigured } from "./payment/createPaidFetch.js";
const PILLAR_LABEL = {
    earn: "[Earn] ",
    treasury: "[Treasury] ",
    invest: "[Invest] ",
    spend: "[Spend] ",
    grow: "[Grow] ",
};
const TOOL_PROFILE = (process.env.SYRA_MCP_TOOL_PROFILE || "curated").toLowerCase();
function paymentSuffix() {
    if (hasPaidFetchConfigured())
        return "";
    return " Note: set SYRA_PAYER_KEYPAIR for production x402 auto-pay.";
}
function shouldRegister(entry) {
    if (TOOL_PROFILE === "full")
        return true;
    return entry.curated;
}
function buildToolSchema(entry) {
    const shape = {
        params: z
            .record(z.union([z.string(), z.number(), z.boolean()]))
            .optional()
            .describe("Optional query/body parameters as key-value pairs"),
    };
    for (const param of entry.pathParams ?? []) {
        shape[param] = z.string().optional().describe(`Path parameter: ${param}`);
    }
    return shape;
}
function mergeToolArgs(entry, args) {
    const merged = { ...args.params };
    for (const param of entry.pathParams ?? []) {
        if (args[param] != null && args[param] !== "") {
            merged[param] = args[param];
        }
    }
    return merged;
}
export function registerSyraTools(server) {
    const catalog = MCP_TOOL_CATALOG;
    const active = catalog.filter(shouldRegister);
    for (const entry of active) {
        const prefix = PILLAR_LABEL[entry.pillar] ?? "";
        const description = `${prefix}${entry.name}. ${entry.description}.${paymentSuffix()}`;
        server.tool(entry.toolName, description, buildToolSchema(entry), async (args) => {
            const merged = mergeToolArgs(entry, args);
            const result = await callCatalogTool(entry, merged);
            return { content: [{ type: "text", text: result.text }] };
        });
    }
    // Escape hatch — always available
    server.tool("syra_call_tool", `[Spend] Call any Syra agent tool by toolId (from GET /agent/tools). Params as key-value.${paymentSuffix()}`, {
        toolId: z.string().describe("Syra agent tool id, e.g. news, exa-search, giza-protocols"),
        params: z
            .record(z.union([z.string(), z.number(), z.boolean()]))
            .optional()
            .describe("Tool parameters"),
    }, async ({ toolId, params }) => {
        const result = await callToolById(toolId, params ?? {}, catalog);
        return { content: [{ type: "text", text: result.text }] };
    });
    // Free facade + AgentScore tools
    server.tool("syra_pillars", "Discover Syra five pillars: Earn, Treasury, Invest, Spend, Grow. Free GET /pillars.", {}, async () => {
        const result = await callFreeRoute("/pillars");
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_invest_opportunities", "[Invest] Unified invest opportunities. GET /invest/opportunities.", { anonymousId: z.string().optional() }, async ({ anonymousId }) => {
        const params = anonymousId ? { anonymousId } : undefined;
        const result = await callFreeRoute("/invest/opportunities", params);
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_invest_positions", "[Invest] Open invest positions. GET /invest/positions.", { anonymousId: z.string().optional(), limit: z.number().optional() }, async ({ anonymousId, limit }) => {
        const params = {};
        if (anonymousId)
            params.anonymousId = anonymousId;
        if (limit != null)
            params.limit = String(limit);
        const result = await callFreeRoute("/invest/positions", params);
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_grow_recommendations", "[Grow] Portfolio recommendations (analysis only). GET /grow/recommendations.", { address: z.string().optional(), anonymousId: z.string().optional() }, async ({ address, anonymousId }) => {
        const params = {};
        if (address)
            params.address = address;
        if (anonymousId)
            params.anonymousId = anonymousId;
        const result = await callFreeRoute("/grow/recommendations", params);
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_earn_summary", "[Earn] Creator earnings summary. GET /earn/summary.", { wallet: z.string().describe("Wallet address or anonymousId") }, async ({ wallet }) => {
        const result = await callFreeRoute("/earn/summary", { wallet });
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_agentscore_discover", "[Earn] AgentScore: list gated merchants and x402 bazaar resources. Free GET /agentscore/discover.", {
        q: z.string().optional(),
        chain: z.string().optional(),
        maxPrice: z.number().optional(),
        limit: z.number().optional(),
    }, async ({ q, chain, maxPrice, limit }) => {
        const params = {};
        if (q)
            params.q = q;
        if (chain)
            params.chain = chain;
        if (maxPrice != null)
            params.maxPrice = String(maxPrice);
        if (limit != null)
            params.limit = String(limit);
        const result = await callFreeRoute("/agentscore/discover", params);
        return { content: [{ type: "text", text: result.text }] };
    });
    server.tool("syra_agentscore_check", "[Earn] AgentScore: probe merchant URL without paying. Free GET /agentscore/check.", {
        url: z.string().describe("Merchant URL to probe"),
        method: z.string().optional().default("GET"),
    }, async ({ url, method }) => {
        const result = await callFreeRoute("/agentscore/check", { url, method: method ?? "GET" });
        return { content: [{ type: "text", text: result.text }] };
    });
}
export function getToolRegistrationSummary() {
    const total = MCP_TOOL_CATALOG.length;
    const registered = TOOL_PROFILE === "full" ? total : MCP_TOOL_CATALOG.filter((t) => t.curated).length;
    return { profile: TOOL_PROFILE, registered, total };
}
