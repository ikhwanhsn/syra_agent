import type { McpToolCatalogEntry } from "./generated/toolCatalog.js";
export declare function formatSyraResult(success: boolean, data: unknown, error?: string, statusHint?: number): string;
export declare function callHttpTool(entry: McpToolCatalogEntry, rawParams?: Record<string, unknown>): Promise<{
    ok: boolean;
    text: string;
}>;
export declare function callBridgeTool(toolId: string, rawParams?: Record<string, unknown>): Promise<{
    ok: boolean;
    text: string;
}>;
export declare function callCatalogTool(entry: McpToolCatalogEntry, rawParams?: Record<string, unknown>): Promise<{
    ok: boolean;
    text: string;
}>;
export declare function callToolById(toolId: string, rawParams: Record<string, unknown> | undefined, catalog: McpToolCatalogEntry[]): Promise<{
    ok: boolean;
    text: string;
}>;
/** Free facade routes not in agentTools catalog */
export { hasPaidFetchConfigured } from "./payment/createPaidFetch.js";
export declare function callFreeRoute(path: string, params?: Record<string, string>): Promise<{
    ok: boolean;
    text: string;
}>;
