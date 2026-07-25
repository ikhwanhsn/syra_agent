# Syra Brain — Finance Copilot Validation

Tune A2A capability for OKX.AI Genesis Finance Copilot. Use these prompts after a paid call (playground or payer key).

## Capability declaration (paste into OKX A2A form)

```
Task types: token due diligence, market narrative synthesis, multi-source crypto research, trading context reports, memecoin risk assessment, macro BTC/ETH briefings, arbitrage context.

Trigger keywords: finance, research, analyze, due diligence, what's happening with, market brief, token report, crypto intelligence, signal, risk score, arbitrage.

Tools: news, signals, indicators, pump.fun analyzer, assets board, Bitcoin hub, sentiment, on-chain reads — selected server-side.

Boundaries: analysis only; no trade execution; no guaranteed returns; decline off-topic or illegal requests.

Pricing:
Quick brief (1-3 tools): $0.08 - $0.25
Standard research (4-8 tools): $0.25 - $1.00
Deep dossier (full report): $1.00 - $5.00
Custom project: negotiated, floor $5.00
Default listing: $0.50 standard task
```

## Crisp demo prompts (must answer well)

1. **Macro brief (demo default)**  
   `Give me a quick BTC market brief: signal, sentiment, and key risks in the last 24h.`

2. **Token DD**  
   `Due diligence on SOL: narrative, technical context, and top risks for the next week.`

3. **Memecoin risk**  
   `Risk-score this Solana mint briefly: liquidity, narrative, and red flags. Mint: <mint>`

4. **Arb context**  
   `Summarize the most interesting cross-CEX arbitrage opportunities Syra sees right now.`

## Pass criteria

- [ ] Answer is markdown, grounded (not vibes-only)
- [ ] Mentions tools used or returns `toolUsages` in JSON metadata
- [ ] Explicitly avoids trade execution / guaranteed returns language
- [ ] Completes standard brief in under 10 minutes
- [ ] Works after x402 payment (402 without pay is expected)

## How to test

```powershell
# Expect 402 without payment
curl.exe -s -o NUL -w "%{http_code}" -X POST https://api.syraa.fun/brain -H "Content-Type: application/json" -d "{\"question\":\"Give me a quick BTC market brief: signal, sentiment, and key risks in the last 24h.\"}"

# Paid path: use https://www.syraa.fun/marketplace?tab=custom or MCP with SYRA_PAYER_KEYPAIR
```

## Notes

`api/routes/brain.js` already routes finance keywords (price, market, signal, sentiment, btc, eth, etc.) into tool-using research. No code change required for Genesis; capability copy above is what OKX reviewers and agents see.
