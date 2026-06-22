import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export declare function registerSyraTools(server: McpServer): void;
export declare function getToolRegistrationSummary(): {
    profile: string;
    registered: number;
    total: number;
};
