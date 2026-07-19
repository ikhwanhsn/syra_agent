#!/usr/bin/env node
/**
 * Syra MCP Server — exposes all Syra x402 v2 routes as MCP tools (codegen from agentTools.js).
 *
 * Env:
 * - SYRA_API_BASE_URL — API base (default https://api.syraa.fun)
 * - SYRA_PAYER_KEYPAIR / PAYER_KEYPAIR — Solana secret for x402 v2 auto-pay (default rail)
 * - SYRA_EVM_PAYER_PRIVATE_KEY — Base USDC payer when X402_PREFERRED_NETWORK=base
 * - SYRA_ALGORAND_PAYER_PRIVATE_KEY — Algorand payer when X402_PREFERRED_NETWORK=algorand
 * - X402_PREFERRED_NETWORK — solana (default) | base | algorand
 * - SYRA_MCP_API_KEY — for agent-direct tools via POST /mcp/tools/call
 * - SYRA_MCP_TOOL_PROFILE — curated (default) | full
 * - SYRA_USE_DEV_ROUTES — append /dev for local testing
 * - SYRA_CONNECTED_WALLET — optional X-Connected-Wallet for dev/playground pricing
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSyraTools, getToolRegistrationSummary } from "./registerTools.js";

function readPackageVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function main() {
  const summary = getToolRegistrationSummary();
  const version = readPackageVersion();
  const server = new McpServer(
    {
      name: "syra-mcp-server",
      version,
      description: `Syra machine money MCP — profile=${summary.profile}, tools=${summary.registered}/${summary.total}`,
    },
    { capabilities: { tools: {} } },
  );

  registerSyraTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(() => {
  process.exit(1);
});
