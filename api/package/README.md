# agentcash

MCP server for calling [x402](https://x402.org)-protected APIs with automatic payment handling.

## Install

### Recommended (Guided Install)

```bash
npx agentcash install
```

### Claude Code

```bash
claude mcp add agentcash --scope user -- npx -y agentcash@latest
```

### Codex

```bash
codex mcp add agentcash -- npx -y agentcash@latest
```

### Cursor

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=agentcash&config=eyJjb21tYW5kIjoiL2Jpbi9iYXNoIiwiYXJncyI6WyItYyIsInNvdXJjZSAkSE9NRS8ubnZtL252bS5zaCAyPi9kZXYvbnVsbDsgZXhlYyBucHggLXkgQHg0MDJzY2FuL21jcEBsYXRlc3QiXX0%3D)

### Claude Cowork

Follow the [guided install](https://agentcash.dev/install/claude) to download and set up the MCPB bundle.

### Claude Desktop

Follow the [guided install](https://agentcash.dev/install/claude) or use the badge below:

[![Add to Claude](https://img.shields.io/badge/Add_to_Claude-agentcash-blue?logo=anthropic)](https://agentcash.dev/agentcash.mcpb)

<details>
<summary>Manual installation</summary>

**Codex** - Add to `~/.codex/config.toml`:

```toml
[mcp_servers.agentcash]
command = "npx"
args = ["-y", "agentcash@latest"]
```

**Cursor** - Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agentcash": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y agentcash@latest"
      ]
    }
  }
}
```

**Claude Desktop** - Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "agentcash": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "source $HOME/.nvm/nvm.sh 2>/dev/null; exec npx -y agentcash@latest"
      ]
    }
  }
}
```

</details>

## Usage

On first run, a wallet is generated at `~/.agentcash/wallet.json`. Deposit USDC on Base to the wallet address before making paid API calls.

**Workflow:**

1. `get_balance` - Check if you have funds available for paid endpoints
2. `redeem_invite` - Redeem an invite code to fund your wallet (if you have one)
3. `list_accounts` - Get network-specific balances, addresses, and deposit links when funding details are needed
4. `discover_api_endpoints` - Find available x402 endpoints on an origin
5. `check_endpoint_schema` - Probe endpoint for pricing/schema (optional)
6. `fetch` - Make the request. AgentCash will attempt SIWX first and only pay if the route still returns 402.

## Tools

| Tool                     | Description                                                     |
| ------------------------ | --------------------------------------------------------------- |
| `fetch`                  | Fetch a protected resource with automatic SIWX auth and payment |
| `fetch_with_auth`        | Deprecated alias for `fetch`                                    |
| `get_balance`            | Get total wallet balance across supported networks              |
| `list_accounts`          | Get per-network balances, addresses, and deposit links          |
| `redeem_invite`          | Redeem an invite code to receive USDC                           |
| `check_endpoint_schema`  | Check if endpoint is x402-protected, get pricing/schema/auth    |
| `discover_api_endpoints` | Discover x402 resources from origin's OpenAPI or .well-known    |
| `report_error`           | Report critical MCP tool bugs to agentcash developers           |

## Environment

| Variable           | Description                       |
| ------------------ | --------------------------------- |
| `X402_PRIVATE_KEY` | Override wallet (optional)        |
| `X402_DEBUG`       | Set to `true` for verbose logging |

## Supported Networks

Base, Base Sepolia, Ethereum, Optimism, Arbitrum, Polygon (via CAIP-2)

## Develop

```bash
pnpm install

# Build
pnpm -w dev:mcp

# In a separate terminal with cwd packages/external/mcp
pnpm dev install --dev

# Build .mcpb for Claude Desktop
pnpm build:mcpb
```

## Evaluations

MCP changes are automatically tested via CI. Comprehensive evaluations run in the [x402-evals](https://github.com/merit-systems/x402-evals) repository.

### Automatic Checks

- **PR Smoke Test** - Automatically runs when you modify MCP source code
- **Release Eval** - Full evaluation suite runs when a new version is published

### Manual Evaluation

Comment on your PR to trigger evaluations:

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `/eval` or `/eval smoke` | Quick validation (~2-3 min)              |
| `/eval full`             | Comprehensive testing (~10 min)          |
| `/eval regression`       | Known edge cases and historical failures |

Results are posted back to your PR with a link to detailed metrics.

### Local Evaluation

```bash
# In x402-evals repo
MCP_SERVER_DIR=/path/to/agentcash/packages/external/mcp/dist/esm pnpm --filter @x402-evals/promptfoo eval
```

### Evals on changes to enrichx402 or stablestudio

1. Make a PR in enrichx402 and generate a preview URL with vercel
2. Make a branch in the agentcash repo
3. Replace the enrichx402.com URL in `src/shared/origins.ts` with your preview URL
4. Push and make a PR, then comment on it with "/eval full" (or smoke, regression)

## Publishing

This package uses [changesets](https://github.com/changesets/changesets) for versioning and publishing.

### Standard Release Flow (main branch)

1. Create a changeset describing your changes:
   ```bash
   pnpm changeset
   ```
2. Commit the changeset file with your PR
3. When merged to `main`, the CI creates a "Version Packages" PR
4. Merging the version PR triggers automatic npm publish

### Beta Release Flow (beta branch)

For pre-release versions, use the `beta` branch with prerelease mode:

1. Enter prerelease mode:
   ```bash
   pnpm changeset pre enter beta
   ```
2. Commit the generated `.changeset/pre.json` file
3. Create changesets and merge to `beta` as normal
4. Versions will be published as `x.x.x-beta.x`

To exit prerelease mode and promote to stable:

```bash
pnpm changeset pre exit
```

**Note:** The CI enforces that `beta` branch must have `pre.json` and `main` branch must not.
