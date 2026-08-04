# OKX.AI Genesis — ASP Status Snapshot

**Checked:** 2026-08-04 (endpoint rescue after X Layer delist warning)  
**Previous check:** 2026-07-24  
**Hackathon:** [OKX.AI Genesis / Build X](https://web3.okx.com/xlayer/build-x-series)  
**Target prize:** Finance Copilot

## Product rails (verified live 2026-08-04)

| Check | Result |
|-------|--------|
| `GET /health/live` | **200** — plain `ok` |
| `GET /health` | **402** (expected without payment) |
| `GET /x402/capabilities` | **200** — was 401 before fix; now public; `networks.xlayer: true`, `okx.enabled: true` |
| `GET /.well-known/x402` | **200** — discovery resources up |
| `GET /openapi.json` | **200** |
| `GET /.well-known/agent.json` | **200** (A2A card) |
| X Layer accept (`eip155:196`) | Present; `payTo=0x3b35…400c`, asset USD₮0, EIP-712 `USD₮0` / `1` |
| `npm run validate-okx-x402` (`BASE_URL=https://api.syraa.fun`) | **PASS** (all OK lines) |
| `onchainos agent x402-check --endpoint https://api.syraa.fun/health` | **`valid: true`**, x402 v2, includes `eip155:196` |

Conclusion: ASP endpoint **https://api.syraa.fun** is **online and testable**. Not in the offline/untestable delist bucket from the X Layer email.

### Fix shipped 2026-08-04

- Commit `927a6432` — allow public `GET /x402/capabilities` (no API key). Deployed to production.

## Marketplace / Agentic Wallet

| Check | Result |
|-------|--------|
| ASP identity | **#2311** on X Layer (`0x3b35…400c`) |
| Category | **FINANCE** |
| Wallet login (2026-08-04) | **Session expired** — re-login required to refresh listing status |
| Listing (last known 2026-07-24) | Under review (`approvalDisplayStatus: 2`) |

> Listing confirmation needs: `onchainos wallet login ikhwanulhusna111@gmail.com` then `onchainos agent get-agents --agent-ids 2311`.

## Required human actions (delist window)

1. **If you received the X Layer offline/ASP email** — reply (draft: [EMAIL-REPLY-XLAYER.md](./EMAIL-REPLY-XLAYER.md)) within 3 days. Confirm endpoint live + testable.
2. **Refresh listing status** after OTP login:

```powershell
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
onchainos wallet login ikhwanulhusna111@gmail.com
# enter OTP from email
onchainos agent get-agents --agent-ids 2311
onchainos agent service-list --agent-id 2311
```

3. Optional strongest proof — paid X Layer `/health` via Agentic Wallet (costs ~0.001 USD₮0).

## Positioning (unchanged)

- Category: **Finance**
- Lead message: **Finance Copilot for agents**
- Services: Finance Copilot API (A2MCP) + Brain Finance Copilot (A2A)
- Endpoint: `https://api.syraa.fun`
