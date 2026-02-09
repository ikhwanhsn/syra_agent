#!/usr/bin/env node
/**
 * Syra MCP Server – exposes all Syra v2 API endpoints as MCP tools.
 *
 * The v2 API uses x402 payment; without a valid payment header the API returns 402.
 * For local testing: set SYRA_API_BASE_URL (e.g. http://localhost:3000) and
 * SYRA_USE_DEV_ROUTES=true to call /v2/.../dev for all endpoints (no payment).
 */
export {};
