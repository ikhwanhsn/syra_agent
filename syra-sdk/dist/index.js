import { attachPillarModules } from "./pillars.js";
const DEFAULT_BASE = "https://api.syraa.fun";
function buildUrl(base, path, params) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(normalized, base.endsWith("/") ? base : `${base}/`);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null || value === "")
                continue;
            url.searchParams.set(key, String(value));
        }
    }
    return url.toString();
}
function parseJsonSafe(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
export class SyraClient {
    baseUrl;
    signer;
    fetchFn;
    defaultHeaders;
    maxPaymentRetries;
    constructor(options = {}) {
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
        this.signer = options.signer;
        this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
        this.defaultHeaders = { Accept: "application/json", ...options.headers };
        this.maxPaymentRetries = options.maxPaymentRetries ?? 1;
    }
    async request(path, init = {}) {
        const method = init.method ?? "GET";
        const url = buildUrl(this.baseUrl, path, method === "GET" ? init.params : undefined);
        const headers = { ...this.defaultHeaders, ...init.headers };
        let body;
        if (method === "POST" && init.body !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(init.body);
        }
        let res = await this.fetchFn(url, { method, headers, body });
        if (res.status === 402 && this.signer) {
            const challengeText = await res.text();
            const challenge = parseJsonSafe(challengeText);
            for (let attempt = 0; attempt < this.maxPaymentRetries; attempt++) {
                const paymentHeader = await this.signer.signPayment(challenge, { url, method });
                const paidHeaders = { ...headers, "PAYMENT-SIGNATURE": paymentHeader };
                res = await this.fetchFn(url, { method, headers: paidHeaders, body });
                if (res.status !== 402)
                    break;
            }
        }
        const text = await res.text();
        const parsed = parseJsonSafe(text);
        if (!res.ok) {
            const error = typeof parsed === "object" && parsed !== null && "error" in parsed
                ? String(parsed.error)
                : `HTTP ${res.status}`;
            return { success: false, error };
        }
        if (typeof parsed === "object" && parsed !== null && "success" in parsed) {
            return parsed;
        }
        return { success: true, data: parsed };
    }
    get(path, params) {
        return this.request(path, { method: "GET", params });
    }
    post(path, body) {
        return this.request(path, { method: "POST", body });
    }
    /** Five-pillar modules: earn, treasury, invest, spend, grow, pillars */
    pillars = attachPillarModules(this);
}
export function createSyraClient(options) {
    return new SyraClient(options);
}
export { isSyraX402Path, SYRA_HIGH_VALUE_ROUTES, SYRA_X402_ROUTE_PREFIXES } from "./routes.js";
export { SYRA_PILLAR_IDS, SYRA_PILLAR_ROUTES, resolveSyraPillarForPath, } from "./pillars-routes.js";
export { attachPillarModules, createEarnModule, createTreasuryModule, createInvestModule, createSpendModule, createGrowModule, createPillarsModule, } from "./pillars.js";
