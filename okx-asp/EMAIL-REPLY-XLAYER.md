# Reply draft — X Layer ASP offline / fix request

**To:** reply to the email from the X Layer / OKX team (same thread)  
**From:** Agentic Wallet email (`ikhwanulhusna111@gmail.com`)  
**Subject:** Re: ASP online & testable — Syra #2311 / https://api.syraa.fun

---

Hi X Layer / OKX team,

Thank you for the note. We checked ASP **#2311 (Syra / Finance Copilot)** immediately.

**Status:** Endpoint is **online and functioning**. We also fixed a discovery regression and redeployed.

### Live checks (2026-08-04)

| Probe | Result |
|-------|--------|
| `GET https://api.syraa.fun/health/live` | HTTP **200** (`ok`) |
| `GET https://api.syraa.fun/health` | HTTP **402** (x402 challenge; expected without payment) |
| X Layer accept in 402 | `eip155:196`, USD₮0, payTo `0x3b35c4bb0b5304f97644de429f68e3b5be2b400c`, EIP-712 domain `USD₮0` / `1` |
| `GET https://api.syraa.fun/x402/capabilities` | HTTP **200**, `networks.xlayer: true`, `okx.enabled: true` |
| `GET https://api.syraa.fun/.well-known/x402` | HTTP **200** |
| `GET https://api.syraa.fun/openapi.json` | HTTP **200** |
| Onchain OS `x402-check` | **`valid: true`** for `https://api.syraa.fun/health` |

Please re-run your marketplace test against:

- **ASP ID:** 2311  
- **A2MCP endpoint:** https://api.syraa.fun  
- **Smoke route:** `GET /health` (402 unpaid → 200 after X Layer payment)

Happy to provide more logs or a paid test receipt if useful.

Best regards,  
Syra team  
https://api.syraa.fun · https://syraa.fun

---

## How to send

1. Open the Agentic Wallet / X Layer email from Aug 3 (or the team request).
2. Reply-all with the body above (edit tone if needed).
3. Optionally attach a screenshot of `curl`/`validate-okx-x402` output.
