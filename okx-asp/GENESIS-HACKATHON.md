# OKX.AI Genesis Hackathon — Finance Copilot Playbook

**Event:** [Build X / OKX.AI Genesis](https://web3.okx.com/xlayer/build-x-series)  
**Deadline:** Jul 27, 2026 **23:59 UTC**  
**Prize target:** Finance Copilot ($2,500) + spillover Social Buzz  
**Status snapshot:** [STATUS.md](./STATUS.md)

---

## Eligibility checklist (must all be true)

- [ ] ASP approved and **LIVE** on OKX.AI marketplace
- [ ] X post with **#OKXAI** + <=90s demo published
- [ ] [Google form](https://forms.gle/mddEUagmDbyV37ws8) submitted with ASP details + X post link

---

## Day 0 — Get live (blocker)

### 1. Re-login Agentic Wallet

```powershell
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
onchainos wallet login ikhwanulhusna111@gmail.com
# enter OTP from email
onchainos wallet status
```

Expect `"loggedIn": true`.

### 2. Register or activate ASP

```powershell
cd d:\business\syra-monorepo
node okx-asp/register-syra-asp.mjs
```

If you already have ASP #2311:

```powershell
node okx-asp/register-syra-asp.mjs --activate-only 2311
```

To update services after create (Finance Copilot copy is in `services.json`):

```powershell
onchainos agent get-my-agents
# then follow Onchain OS update flow, or Cursor prompt:
# "Update my ASP #2311 services using okx-asp/services.json Finance Copilot fields"
```

### 3. If create fails with `origin error`

1. Cursor: `Help me register an A2MCP ASP on OKX.AI using Onchain OS`
2. [OKX Dev Portal](https://web3.okx.com/onchain-os/dev-portal)
3. GitHub: https://github.com/okx/onchainos-skills/issues/new
4. Payments still work via X Layer x402 without listing — but **Genesis requires listing**, so escalate hard.

### 4. Confirm live

- Check Agentic Wallet email for approval (up to 2 business days — escalate if slow)
- Browse https://www.okx.ai for Syra / Finance Copilot
- Save marketplace URL into [FORM-SUBMISSION.md](./FORM-SUBMISSION.md)

---

## Day 1 — Positioning + demo

Repo already repositioned:

| File | Change |
|------|--------|
| `services.json` | Finance Copilot API + Brain Finance Copilot |
| `asp-dossier.md` | Category=Finance, finance bundle spotlight |
| `register-syra-asp.mjs` | Finance Copilot description |

Demo recording script: [DEMO-SCRIPT.md](./DEMO-SCRIPT.md)

Record <=90s video (phone or Loom/OBS):

1. Agent asks Brain a finance question
2. Show 402 → payment → report with `toolUsages`
3. End card: Syra Finance Copilot · #OKXAI · syraa.fun

---

## Day 2 — X post + form + orders

1. Publish participation post using ship-log **#40** (`okxGenesisFinance`) — copy from `/post` or [X-POST.md](./X-POST.md). Must include **#OKXAI** and the demo.
2. Drive paid calls: [DRIVE-ORDERS.md](./DRIVE-ORDERS.md)
3. Submit Google form: [FORM-SUBMISSION.md](./FORM-SUBMISSION.md)

---

## Day 3 — Monitor

[MONITOR.md](./MONITOR.md)

---

## Judging angle (Finance Copilot)

| Criterion | How Syra wins |
|-----------|---------------|
| Category fit | Explicit Finance Copilot naming + finance route bundle |
| Product completeness | 48 x402 resources + A2A Brain |
| Differentiation | Decision layer vs raw data (CoinAnk) |
| Top-performing | Real paid orders + positive reviews during campaign |
| Social | #OKXAI ship-log + demo |

---

## Related files

| File | Purpose |
|------|---------|
| [STATUS.md](./STATUS.md) | Live verification snapshot |
| [services.json](./services.json) | Registration payload |
| [asp-dossier.md](./asp-dossier.md) | Full profile |
| [EXECUTE.md](./EXECUTE.md) | Registration CLI steps |
| [DEMO-SCRIPT.md](./DEMO-SCRIPT.md) | 90s demo |
| [X-POST.md](./X-POST.md) | Paste-ready #OKXAI posts |
| [FORM-SUBMISSION.md](./FORM-SUBMISSION.md) | Google form answers |
| [DRIVE-ORDERS.md](./DRIVE-ORDERS.md) | Usage / reviews playbook |
| [MONITOR.md](./MONITOR.md) | Pre-deadline checklist |
