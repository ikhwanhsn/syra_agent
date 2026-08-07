#!/usr/bin/env bash
#
# Phase 0 setup for the OKX.AI Trading Hackathon (macOS/Linux).
# Installs Onchain OS skills, ensures the onchainos CLI is on PATH, and prints
# the interactive steps (OTP login + funding) that a human must complete.
#
# Safe + idempotent: it never funds, trades, or submits anything on its own.
#
set -euo pipefail

echo "== OKX.AI Trading Hackathon — Onchain OS setup =="
echo

# 1. Node check
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 18+ is required. Install it first." >&2
  exit 1
fi
echo "OK  node $(node -v)"

# 2. Ensure ~/.local/bin on PATH for the current shell
export PATH="$HOME/.local/bin:$PATH"

# 3. Install Onchain OS skills project-local (NOTE: global `-g` is NOT supported
#    for PromptScript skills; they must be installed per-project into
#    .agents/skills/). These skills let your coding agent DRIVE Onchain OS
#    (wallet login, swaps, competition registration) via natural-language prompts.
echo
echo "-- Installing Onchain OS skills (npx skills add okx/onchainos-skills) --"
if npx --yes skills add okx/onchainos-skills --yes; then
  echo "OK  Onchain OS skills installed into .agents/skills/"
else
  echo "WARN: skills install returned non-zero. Run manually in your agent:"
  echo "      npx skills add okx/onchainos-skills --yes"
fi

# 4. Locate the onchainos CLI (optional — the register-trading-asp.mjs script
#    and OKX_TRADING_EXEC_CMD use it; the interactive skills flow does not).
echo
if command -v onchainos >/dev/null 2>&1; then
  echo "OK  onchainos CLI found: $(command -v onchainos)"
  onchainos --version 2>/dev/null || true
else
  echo "NOTE: 'onchainos' CLI not on PATH (optional)."
  echo "      Primary flow is the interactive skills: just prompt your agent"
  echo "      (see manual steps below). The CLI is only needed for the scripted"
  echo "      register-trading-asp.mjs path and live OKX_TRADING_EXEC_CMD."
  echo "      Install guide: https://web3.okx.com/onchainos/dev-docs/okxai/agent-installation-guide"
fi

cat <<'NEXT'

== Manual steps (human required — cannot be automated) ==

PRIMARY PATH = prompt your coding agent (it now has the OKX skills):

1. Log in to the Agentic Wallet (OTP emailed to you):
     "Log in to Agentic Wallet on Onchain OS with my email <you@example.com>"
   (CLI equivalent: onchainos wallet login you@example.com; then wallet status)

2. Fund the Agentic Wallet with > 300 USDT of on-chain assets (+ gas), then
   confirm balance ("show my Agentic Wallet balance" / onchainos wallet status).

3. Do ONE tiny test swap to confirm on-chain execution from THIS wallet, and
   record the token contract addresses + chain for your universe. Capture them
   into OKX_TRADING_TOKENS / OKX_TRADING_WALLET / OKX_TRADING_QUOTE_ADDR
   (see okx-asp/TRADING-HACKATHON.md). The executor uses `onchainos swap execute`.

4. Register the Trading ASP + subscription service (scripted):
     node okx-asp/register-trading-asp.mjs
   (or prompt: "Help me register a Trading ASP on OKX.AI using Onchain OS")

5. Register for the competition (binds this funded wallet):
     "Help me register for the OKX.AI trading hackathon"

Registration closes Aug 11 12:00 UTC+8. Keep the ASP + subscription online.
NEXT
