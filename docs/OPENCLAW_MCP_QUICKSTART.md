# OpenClaw → Syra MCP (distribution)

Syra remains the **x402 merchant**. OpenClaw is the **agent host** that runs `@syra-ai/mcp-server` with a funded payer wallet.

## Quick path

1. Install [OpenClaw](https://docs.openclaw.ai) (Node.js ≥ 18 on PATH).
2. Fund a Solana wallet with **≥ $1 USDC** (+ SOL for fees). Or buy USDC into a Syra agent wallet at [syraa.fun/wallet](https://syraa.fun/wallet).
3. Register Syra MCP:

```bash
openclaw mcp set syra '{"command":"npx","args":["-y","@syra-ai/mcp-server@latest"],"env":{"SYRA_API_BASE_URL":"https://api.syraa.fun","SYRA_MCP_TOOL_PROFILE":"curated","SYRA_PAYER_KEYPAIR":"your-solana-secret"}}'
openclaw mcp doctor syra --probe
```

Replace `your-solana-secret` with that funded keypair. Prefer env / secret managers over pasting secrets into shell history.

4. Install the Syra skill (consult-first workflow) from a local clone of this repo:

```bash
openclaw skills install ./.agents/skills/syra --as syra
```

Agents can also paste: `set up https://api.syraa.fun/skill.md`

5. Ask the agent: **Get BTC news**. It should call `syra_consult` (free), then `syra_spend_news` with ticker `BTC`. Confirm a settled HTTP 200 after 402.

Live docs: [docs.syraa.fun/docs/build/openclaw](https://docs.syraa.fun/docs/build/openclaw) · MCP overview: [docs/build/mcp](https://docs.syraa.fun/docs/build/mcp)

## Control UI

You can also enable/edit the same server under OpenClaw Control UI `/settings/mcp` (alias `/mcp`). CLI `openclaw mcp set` writes the canonical `mcp.servers.syra` entry.

## Do not

- Put OpenClaw on Syra’s merchant settle path (facilitators stay Dexter → GoPlausible → PayAI)
- Commit `SYRA_PAYER_KEYPAIR` or other payer secrets into git or shared OpenClaw config
- Count founder/treasury self-probes as external design-partner paid calls

## Troubleshoot

| Symptom | Fix |
|---------|-----|
| `openclaw` not found | Install OpenClaw; ensure CLI is on PATH |
| Tools missing after `mcp set` | `openclaw mcp doctor syra --probe`; restart gateway |
| Paid tool returns 402 forever | Fund payer USDC; confirm `SYRA_PAYER_KEYPAIR` is set for the Syra server |
| Skill not loaded | Re-run `openclaw skills install ./.agents/skills/syra --as syra` from repo root |

See also: [docs/AGENT_BUILDER_GTM.md](./AGENT_BUILDER_GTM.md), [docs/TRENDING_PARTNER_INTEGRATIONS.md](./TRENDING_PARTNER_INTEGRATIONS.md).
