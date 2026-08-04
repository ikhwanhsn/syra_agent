# OKX.AI Genesis — Monitor Checklist (through Jul 27 23:59 UTC)

## Status board

| Gate | Status | Updated | Notes |
|------|--------|---------|-------|
| API/ASP endpoint testable | YES | 2026-08-04 | `/health` 402 + X Layer accept; `/x402/capabilities` 200 public; `validate-okx-x402` PASS |
| Agentic Wallet logged in | NO | 2026-08-04 | Session expired — re-login required |
| ASP create / activate | READY | 2026-07-24 | `validate-listing` **pass** with Finance Copilot services.json |
| ASP LIVE on OKX.AI | UNKNOWN | 2026-08-04 | Blocked on OTP login; last known: under review #2311 |
| X Layer delist email reply | READY | 2026-08-04 | Draft: [EMAIL-REPLY-XLAYER.md](./EMAIL-REPLY-XLAYER.md) |
| Finance Copilot positioning in repo | YES | 2026-07-24 | services.json + dossier + ship-log #40 |
| Brain Finance Copilot tune | YES | 2026-07-24 | api/routes/brain.js + BRAIN-FINANCE.md |
| Demo video recorded | YES | 2026-07-24 | Post-page Remotion #40 → `okx-asp/out/syra-okxai-genesis-finance-copilot.mp4` |
| #OKXAI Post A published | NO | | Paste from X-POST.md / ship-log #40 |
| Google form submitted | NO | | FORM-SUBMISSION.md |
| Paid orders push active | NO | | DRIVE-ORDERS.md |

## Twice-daily checks (until deadline)

1. Agentic Wallet email — listing approval / rejection
2. OKX.AI marketplace — Syra visible under Finance?
3. `curl -s -o NUL -w "%{http_code}" https://api.syraa.fun/health` → expect 402
4. Order log in DRIVE-ORDERS.md
5. X Post A engagement (replies, RTs) — amplify with Post B/C
6. If rejected: fix reason → `register-syra-asp.mjs --activate-only <id>` same day

## Escalation

| Symptom | Action |
|---------|--------|
| Wallet session expired | `onchainos wallet login ikhwanulhusna111@gmail.com` |
| `origin error` on create | Official Onchain OS skill flow + Dev Portal + GitHub issue |
| Listing rejected | Revise Finance copy; resubmit activate |
| Form fields unclear | Use FORM-SUBMISSION.md mapping; email OKX if blocked |
| Low usage | DM 10 design partners with DRIVE-ORDERS script |

## Final hour (Jul 27)

- [ ] Confirm form already submitted (do not wait until last minute)
- [ ] Confirm Post A still live with #OKXAI + demo
- [ ] Confirm ASP still listed
- [ ] One more amplification reply thread
- [ ] Screenshot everything into `okx-asp/proof/` (optional folder)
