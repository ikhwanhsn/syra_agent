#!/usr/bin/env bash
# File Syra's Tokens upstream issues against solana-foundation/tokens.
# Requires: gh auth login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/docs/tokens-upstream"
GH_BIN="${GH_BIN:-gh}"

if ! command -v "$GH_BIN" >/dev/null 2>&1; then
  echo "gh not found. Install GitHub CLI and run: gh auth login" >&2
  exit 1
fi

if ! "$GH_BIN" auth status >/dev/null 2>&1; then
  echo "gh is not authenticated. Run: gh auth login" >&2
  exit 1
fi

REPO="solana-foundation/tokens"

echo "Creating issue: OHLCV empty Solana mints..."
"$GH_BIN" issue create \
  --repo "$REPO" \
  --title "Sparse / empty OHLCV for many Solana mints (agent consumer)" \
  --body-file "$DIR/ISSUE_ohlcv_empty_solana_mints.md"

echo "Creating issue: Agent OpenAPI DX..."
"$GH_BIN" issue create \
  --repo "$REPO" \
  --title "Agent / OpenAPI DX: resolve error shapes + consumer examples" \
  --body-file "$DIR/ISSUE_agent_openapi_dx.md"

echo "Done. Optionally PR EXAMPLE_paid_agent_consumer.md into apps/docs."
