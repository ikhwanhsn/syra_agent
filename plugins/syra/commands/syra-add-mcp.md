---
name: syra-add-mcp
description: Add the Syra MCP server configuration to a project's Cursor MCP settings for crypto research and x402 API tools
---

# Add Syra MCP Server

Add the Syra MCP server so Cursor can call ~240 crypto research and agent tools via `@syra-ai/mcp-server`.

## Steps

1. **Check if Syra plugin is installed** — Open Customize → verify `syra` MCP server is enabled. If yes, skip to step 4.

2. **Add MCP config** — Merge into the project's MCP settings (`.cursor/mcp.json` or user-level MCP config):

```json
{
  "mcpServers": {
    "syra": {
      "command": "npx",
      "args": ["-y", "@syra-ai/mcp-server@latest"],
      "env": {
        "SYRA_API_BASE_URL": "https://api.syraa.fun",
        "SYRA_MCP_TOOL_PROFILE": "curated",
        "SYRA_PAYER_KEYPAIR": "${SYRA_PAYER_KEYPAIR}",
        "SYRA_MCP_API_KEY": "${SYRA_MCP_API_KEY}"
      }
    }
  }
}
```

3. **Set environment variables** — Add to system env or `.env` (never commit secrets):

```env
SYRA_PAYER_KEYPAIR=your-solana-keypair-with-usdc
SYRA_MCP_API_KEY=your-mcp-bridge-key
```

4. **Reload MCP** — Restart Cursor or use Developer: Reload Window.

5. **Verify** — Ask in chat: "Check Syra API health status" — should call `syra_v2_check_status`.

## Local development

For local API without payment:

```json
"env": {
  "SYRA_API_BASE_URL": "http://localhost:3000",
  "SYRA_USE_DEV_ROUTES": "true"
}
```

## One-line alternative (Claude CLI)

```bash
claude mcp add syra -- npx -y @syra-ai/mcp-server@latest
```

## References

- Plugin MCP config: `plugins/syra/mcp.json`
- Full docs: https://docs.syraa.fun
- MCP README: `mcp-server/README.md`
