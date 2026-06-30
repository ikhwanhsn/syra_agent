# Execute OKX ASP Registration (Steps 2–4)

> **Works today (no ASP listing):** deploy [OKX-X402-DEPLOY.md](./OKX-X402-DEPLOY.md) — OKX Payment SDK on X Layer for Agentic Wallet payments.
>
> **This file:** marketplace ASP registration when `onchainos agent create` succeeds.

Everything is prepared. You only need **one interactive step** (email OTP login), then run one command.

## What is already done

- `onchainos` CLI v4.0.0 installed at `%USERPROFILE%\.local\bin\onchainos.exe`
- Listing fields validated (`validate-listing` **pass**)
- Services JSON ready: [`services.json`](./services.json)
- Registration script ready: [`register-syra-asp.mjs`](./register-syra-asp.mjs)

## Services being registered

| # | Type | Name | Fee | Endpoint |
|---|------|------|-----|----------|
| 1 | A2MCP | Syra x402 Crypto API | 0.01 USDT/call | https://api.syraa.fun |
| 2 | A2A | Syra Brain Research | 0.50 USDT/task | *(negotiated)* |

---

## Step A — Login Agentic Wallet (you must do this once)

Open **PowerShell** or **Cursor terminal** and run:

```powershell
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
onchainos wallet login YOUR_EMAIL@example.com
```

Replace `YOUR_EMAIL@example.com` with the email you want tied to your Agentic Wallet.

1. Check your inbox for the OTP code
2. Enter the code when prompted
3. Verify login:

```powershell
onchainos wallet status
```

Expected: `"loggedIn": true`

---

## Step B — Register + list ASP (one command)

From the repo root:

```powershell
cd d:\business\syra-monorepo
node okx-asp/register-syra-asp.mjs
```

This script automatically:
1. Checks wallet login
2. Uploads Syra logo as ASP avatar
3. Validates listing fields
4. Creates ASP identity on XLayer with both services
5. Submits for OKX marketplace listing (`activate`)

**Save the ASP ID** printed at the end (e.g. `#42`).

---

## If you already have an ASP

The script will detect it and print:

```
You already have ASP #N (Syra).
To list it: node okx-asp/register-syra-asp.mjs --activate-only N
```

---

## Step C — Wait for OKX review

- OKX reviews within **2 business days**
- Result emailed to your Agentic Wallet address
- If rejected, fix per email and re-run activate:

```powershell
node okx-asp/register-syra-asp.mjs --activate-only YOUR_AGENT_ID
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `onchainos not recognized` | Run `$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"` first |
| `session expired` | Re-run `onchainos wallet login your@email.com` then `onchainos wallet verify CODE` |
| `You must accept the legal terms` | Re-run `node okx-asp/register-syra-asp.mjs` — script auto-accepts consent |
| `transaction simulation failed: origin error` | On-chain agent registry revert — **not fixable by Syra or OKX support chat**. Try: (1) Cursor prompt `Help me register an A2MCP ASP on OKX.AI using Onchain OS`, (2) [OKX Dev Portal](https://web3.okx.com/onchain-os/dev-portal), (3) [GitHub issue](https://github.com/okx/onchainos-skills/issues/new). **Workaround:** integrate [OKX Payment SDK](https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk) on `api.syraa.fun` for X Layer payments without ASP listing. |
| `ASP agents require an avatar` | Script uploads `web/public/images/logo.jpg` automatically |
| Validation fails | Run `node okx-asp/validate-listing.mjs` to see findings |
| Create succeeded but no ID | Run `onchainos agent get-my-agents` |

---

## After approval

- **A2MCP:** Integrate OKX Payment SDK for instant XLayer settlement (see [asp-dossier.md](./asp-dossier.md) Section 5)
- **A2A:** Browse tasks at https://www.okx.ai/tasks
- **Deliver research:** `POST https://api.syraa.fun/brain` with `{ "question": "..." }`
