import { createSyraClient } from "@syra-ai/sdk";
import { getPaidFetch, getPaidFetchNetworkLabel, hasPaidFetchConfigured, } from "./payment/createPaidFetch.js";
const SYRA_API_BASE_URL = (process.env.SYRA_API_BASE_URL || "https://api.syraa.fun").replace(/\/$/, "");
const SYRA_USE_DEV_ROUTES = process.env.SYRA_USE_DEV_ROUTES === "true" || process.env.SYRA_USE_DEV_ROUTES === "1";
const SYRA_MCP_API_KEY = process.env.SYRA_MCP_API_KEY?.trim() || "";
const SYRA_CONNECTED_WALLET = (process.env.SYRA_CONNECTED_WALLET || process.env.SYRA_DEV_WALLET || "").trim();
let clientPromise = null;
function buildDefaultHeaders() {
    const headers = {};
    if (SYRA_CONNECTED_WALLET) {
        headers["X-Connected-Wallet"] = SYRA_CONNECTED_WALLET;
    }
    return headers;
}
async function getClient() {
    if (!clientPromise) {
        clientPromise = getPaidFetch().then((fetchFn) => createSyraClient({
            baseUrl: SYRA_API_BASE_URL,
            fetch: fetchFn,
            headers: buildDefaultHeaders(),
            maxPaymentRetries: 0,
        }));
    }
    return clientPromise;
}
function appendDevSuffix(path) {
    if (!SYRA_USE_DEV_ROUTES)
        return path;
    if (path.startsWith("/8004")) {
        const rest = path.slice("/8004".length) || "";
        return `/8004/dev${rest}`;
    }
    return `${path}/dev`;
}
function substitutePathParams(template, params) {
    let resolved = template;
    for (const [key, value] of Object.entries(params)) {
        if (value == null || value === "")
            continue;
        resolved = resolved.replace(`{${key}}`, encodeURIComponent(value));
    }
    return resolved;
}
function splitParamsForTool(entry, raw) {
    const pathParams = {};
    const rest = {};
    const pathParamKeys = new Set(entry.pathParams ?? []);
    for (const [key, value] of Object.entries(raw)) {
        if (value == null || value === "")
            continue;
        const str = typeof value === "string" ? value : JSON.stringify(value);
        if (pathParamKeys.has(key)) {
            pathParams[key] = str;
        }
        else {
            rest[key] = str;
        }
    }
    return { pathParams, rest };
}
export function formatSyraResult(success, data, error, statusHint) {
    if (success) {
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
    const prefix = statusHint ? `API error (${statusHint}): ` : "API error: ";
    return `${prefix}${error ?? "Request failed"}`;
}
export async function callHttpTool(entry, rawParams = {}) {
    if (!entry.path) {
        return { ok: false, text: "Tool has no HTTP path configured." };
    }
    const { pathParams, rest } = splitParamsForTool(entry, rawParams);
    let path = substitutePathParams(entry.path, pathParams);
    path = appendDevSuffix(path);
    const client = await getClient();
    const method = entry.method === "POST" ? "post" : "get";
    const res = method === "post"
        ? await client.post(path, Object.keys(rest).length ? rest : undefined)
        : await client.get(path, rest);
    const paymentNote = hasPaidFetchConfigured()
        ? ""
        : ` (no x402 payer configured for ${getPaidFetchNetworkLabel()} — may have returned 402)`;
    return {
        ok: res.success,
        text: formatSyraResult(res.success, res.data, res.error) + paymentNote,
    };
}
export async function callBridgeTool(toolId, rawParams = {}) {
    if (!SYRA_MCP_API_KEY) {
        return {
            ok: false,
            text: "Agent-direct tool requires SYRA_MCP_API_KEY and server SYRA_MCP_BRIDGE_ENABLED=true. Configure MCP bridge on api.syraa.fun.",
        };
    }
    const url = `${SYRA_API_BASE_URL}/mcp/tools/call`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-MCP-API-Key": SYRA_MCP_API_KEY,
        },
        body: JSON.stringify({ toolId, params: rawParams }),
    });
    const text = await res.text();
    if (res.ok) {
        try {
            const parsed = JSON.parse(text);
            if (parsed.success) {
                return { ok: true, text: formatSyraResult(true, parsed.data) };
            }
            return { ok: false, text: formatSyraResult(false, undefined, parsed.error, res.status) };
        }
        catch {
            return { ok: true, text };
        }
    }
    return { ok: false, text: `Bridge returned ${res.status}.\n${text}` };
}
export async function callCatalogTool(entry, rawParams = {}) {
    if (entry.access === "upstream" || entry.access === "agent-direct") {
        return callBridgeTool(entry.toolId, rawParams);
    }
    return callHttpTool(entry, rawParams);
}
export async function callToolById(toolId, rawParams = {}, catalog) {
    const entry = catalog.find((t) => t.toolId === toolId);
    if (!entry) {
        return { ok: false, text: `Unknown toolId: ${toolId}. Use GET /agent/tools on Syra API for the full list.` };
    }
    return callCatalogTool(entry, rawParams);
}
/** Free facade routes not in agentTools catalog */
export { hasPaidFetchConfigured } from "./payment/createPaidFetch.js";
export async function callFreeRoute(path, params) {
    const client = await getClient();
    const resolved = appendDevSuffix(path);
    const res = await client.get(resolved, params);
    return { ok: res.success, text: formatSyraResult(res.success, res.data, res.error) };
}
