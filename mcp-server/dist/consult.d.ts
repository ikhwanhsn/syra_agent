import { type McpToolCatalogEntry } from "./generated/toolCatalog.js";
export declare const SYRA_SKILL_URL = "https://api.syraa.fun/skill.md";
export declare const SYRA_SKILL_SETUP_LINE = "set up https://api.syraa.fun/skill.md";
export declare const SYRA_CONSULT_SUGGESTIONS: readonly ["Get BTC news", "What's ETH sentiment?", "TVL for Aave", "Agent economy x402 stats"];
export type ConsultCall = {
    toolName: string;
    toolId: string;
    params: Record<string, string>;
    max_cost_usd: number;
    why: string;
};
export type ConsultResult = {
    mode: "call" | "unsupported";
    billed: false;
    message: string;
    calls?: ConsultCall[];
    suggestions: string[];
};
/**
 * Map a plain-language crypto-intel intent to one curated MCP tool.
 * Does not execute or bill.
 */
export declare function consultSyraIntent(intent: string, catalog?: McpToolCatalogEntry[]): ConsultResult;
