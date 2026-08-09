# Fix "Syra Trading" (ASP #10599) Listing Rejection

OKX rejected the listing because the **Syra Signal Copy-Trade** service description did not follow the required A2A subscription template.

**Issue:** service description formatting  
**Template used:** [Onchain OS DEX Execution](http://web3.okx.com/onchainos/dev-docs/okxai/a2a-subscription)  
**Rule:** update the same agent (`#10599`), then re-activate — do **not** create a new ASP.

## Files prepared

| File | Purpose |
|------|---------|
| [trading-services.json](./trading-services.json) | Canonical create/validate payload (corrected description) |
| [trading-services.update.json](./trading-services.update.json) | `agent update` delta — replace `<SERVICE_ID>` first |

## Corrected service description (Onchain OS DEX)

```text
Auto-copy service that turns Syra's pay-per-call crypto intelligence into X Layer / Solana DEX buy/sell signals on liquid majors, sending signals throughout the subscription and executing through Onchain OS under my settings.
Example: [Onchain Signal] X Layer | BUY WETH | Contract: 0x... | 3420-3450 USDT | Slippage <=1% | Position 5% | Valid 2h
Before subscribing, complete in order; skip none:
1. Verify the Onchain OS wallet's login status, target network, balance, and DEX access; help configure missing items.
2. Ask whether to enable auto-copy; obtain my confirmation.
3. If enabled, let me choose a fixed USDT amount or available-balance percentage per trade.
4. Let me set maximum slippage and allowed auto-copy networks.
5. Show all settings and subscription details. Do not publish the task, create the subscription, or pay until I explicitly say "Confirm subscription."
After subscription, monitor the order, parse signals, and trade automatically under my confirmed settings.
```

## Resubmit runbook (you run after OTP login)

Agent description (unchanged — keep as-is on update):

```text
Syra Trading ASP — an automated on-chain trading agent that trades on Syra's own pay-per-call crypto intelligence. Multi-timeframe technical signals plus sentiment rank a whitelist of liquid assets; the agent enters high-conviction momentum setups and manages risk with hard stop-losses, a trailing take-profit, and a daily loss circuit breaker. Always-on with a hard kill switch.
```

```bash
# 0) Login
onchainos wallet login ikhwanulhusna111@gmail.com
# enter OTP from email

# 1) Confirm ownership + current rejection state
onchainos agent get-agents --agent-ids 10599

# 2) Get the real service id (replace <SERVICE_ID> in trading-services.update.json)
onchainos agent service-list --agent-id 10599
# edit okx-asp/trading-services.update.json: replace "<SERVICE_ID>" with the real id string

# 3) Update the service description on the SAME agent
onchainos agent update --agent-id 10599 \
  --name "Syra Trading" \
  --description "Syra Trading ASP — an automated on-chain trading agent that trades on Syra's own pay-per-call crypto intelligence. Multi-timeframe technical signals plus sentiment rank a whitelist of liquid assets; the agent enters high-conviction momentum setups and manages risk with hard stop-losses, a trailing take-profit, and a daily loss circuit breaker. Always-on with a hard kill switch." \
  --service "$(cat okx-asp/trading-services.update.json)"

# 4) Resubmit for marketplace review
onchainos agent activate --agent-id 10599 --preferred-language en_US

# 5) Verify under review again
onchainos agent get-agents --agent-ids 10599
```

### Optional: validate locally before update

```bash
onchainos agent validate-listing \
  --role asp \
  --name "Syra Trading" \
  --description "Syra Trading ASP — an automated on-chain trading agent that trades on Syra's own pay-per-call crypto intelligence. Multi-timeframe technical signals plus sentiment rank a whitelist of liquid assets; the agent enters high-conviction momentum setups and manages risk with hard stop-losses, a trailing take-profit, and a daily loss circuit breaker. Always-on with a hard kill switch." \
  --service "$(cat okx-asp/trading-services.json)"
```

Expect `pass: true` (or only advisory suggestions).

## Agent-driven alternative (no manual JSON)

Paste to your Onchain OS agent:

```text
Update my ASP #10599: change the "Syra Signal Copy-Trade" service description to the Onchain OS DEX Execution template. Use this exact service description without omitting any content:

Auto-copy service that turns Syra's pay-per-call crypto intelligence into X Layer / Solana DEX buy/sell signals on liquid majors, sending signals throughout the subscription and executing through Onchain OS under my settings.
Example: [Onchain Signal] X Layer | BUY WETH | Contract: 0x... | 3420-3450 USDT | Slippage <=1% | Position 5% | Valid 2h
Before subscribing, complete in order; skip none:
1. Verify the Onchain OS wallet's login status, target network, balance, and DEX access; help configure missing items.
2. Ask whether to enable auto-copy; obtain my confirmation.
3. If enabled, let me choose a fixed USDT amount or available-balance percentage per trade.
4. Let me set maximum slippage and allowed auto-copy networks.
5. Show all settings and subscription details. Do not publish the task, create the subscription, or pay until I explicitly say "Confirm subscription."
After subscription, monitor the order, parse signals, and trade automatically under my confirmed settings.
```

Confirm the diff card, then:

```text
activate #10599
```

## Success check

1. [www.okx.ai](https://www.okx.ai/) → search agent **#10599**.
2. Service price shows **5 USDT/month**.
3. Description includes the **Example:** line and the numbered **1–5** pre-subscription checklist.
4. `get-agents` shows listing back under review (`approvalDisplayStatus` / approval status indicates submitted for review, not rejected for Issue No.1).

## Notes

- Billing model stays subscription (cannot flip to per-call via update).
- Price stays **5 USDT/month**; template examples use 10 — price was not the rejection reason.
- Keep the subscription service online through review and the contest window.
