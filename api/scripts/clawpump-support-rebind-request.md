## Summary

Please rebind `agents.token_mint` for our Syra agent to an **already-launched** pump.fun mint. ClawPump's public API rejects writing `token_mint` via PATCH (`No allowed fields in request body`), and there is no import/link endpoint.

We intentionally deleted a previous agent (to avoid a wrong gasless listing mint) and recreated Syra **without** launching a new ClawPump token. We need the dashboard "token launched" status + `token_mint` field pointed at our canonical CA.

## Account

- Dashboard account email: `ikhwanulhusna111@gmail.com`
- Current agent ID: `d456ef3a-8358-4491-8af6-e48108d6da3a`
- Agent name: `Syra`
- Agent wallet: `EtAK5gkFsTKETBUJ4e3gjXFkBZyEBqQowoANpeeazu7V`
- Dashboard: https://agents.clawpump.tech/dashboard?agent=d456ef3a-8358-4491-8af6-e48108d6da3a

## Requested DB update

Please set:

```text
agents.token_mint = 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump
```

for agent `d456ef3a-8358-4491-8af6-e48108d6da3a`.

### Canonical token (already live on pump.fun)

- Symbol: `SYRA`
- Name: Syra Agent
- Mint: `8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump`
- Pump.fun: https://pump.fun/coin/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump

### Already stored client-side (for context)

We already set these on the agent config / skill_config because they are writable:

- `config.primary_token_mint = 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump`
- `config.external_token_mint = 8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump`
- `skill_config.primary_token.mint` = same

But the UI still shows **token not launched** because `agent.token_mint` remains `null`.

## Background (why not re-launch via ClawPump)

1. `$SYRA` was launched directly on pump.fun **before** ClawPump registration.
2. Launching again via ClawPump gasless creates a **new** mint (we previously accidentally got `GsM2zU1pGoGdQysLg8khSySZM4TA8CeRiZcG5vNHqydP` on deleted agent `fa14efc9-5212-4efb-aece-6e86e7460463`).
3. We deleted that agent and recreated cleanly to avoid a duplicate/conflicting ticker listing.

## What we need from support

1. Rebind `token_mint` on the current agent to `8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump`.
2. Confirm whether fee-share / creator-fee collection can apply to an externally launched mint (we understand it likely cannot; status + mint display is the priority).
3. If rebinding externally launched mints is unsupported by policy, please confirm so we can document that constraint.

Thanks — happy to verify ownership via Google-login dashboard session or a signed message from our Solana wallets if needed.
