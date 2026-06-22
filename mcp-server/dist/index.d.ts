#!/usr/bin/env node
/**
 * Syra MCP Server — exposes all Syra x402 routes as MCP tools (codegen from agentTools.js).
 *
 * Env:
 * - SYRA_API_BASE_URL — API base (default https://api.syraa.fun)
 * - SYRA_PAYER_KEYPAIR — Solana secret for x402 auto-pay (base58 or JSON bytes)
 * - SYRA_MCP_API_KEY — for agent-direct tools via POST /mcp/tools/call
 * - SYRA_MCP_TOOL_PROFILE — curated (default) | full
 * - SYRA_USE_DEV_ROUTES — append /dev for local testing
 */
export {};
