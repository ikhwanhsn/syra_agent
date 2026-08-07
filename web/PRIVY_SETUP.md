# Privy setup (web, production at syraa.fun)

Aligned with Privy's [CSP guide](https://docs.privy.io/security/implementation-guide/content-security-policy) and [security checklist](https://docs.privy.io/security/implementation-guide/security-checklist).

## Production wallet connect fails but localhost works

### 1. Content-Security-Policy (Vercel)

`web/vercel.json` allows Privy, WalletConnect, Cloudflare Turnstile, Privy RPC (`*.rpc.privy.systems`), and Solana RPC hosts. Local `npm run dev` does **not** apply those headers, only production on Vercel does. If you see generic Privy or network errors in production, redeploy after updating `web/vercel.json`.

### 2. Allowed origins (Privy Dashboard)

SIWS / Phantom login returns **403** when the site origin is not allowlisted.

1. Open [Privy Dashboard](https://dashboard.privy.io) → your **production** app.
2. **Without** `VITE_PRIVY_CLIENT_ID`: **Configuration → Domains → Allowed origins**, add:
   - `http://localhost:8080` (local dev port; remove from the production app when not needed)
   - `https://syraa.fun` (main web app, agent, dashboard, experiments)
   - `https://www.syraa.fun`
   - `https://dashboard.syraa.fun` (if used)
3. **With** `VITE_PRIVY_CLIENT_ID` in Vercel: client settings **override** app domains. Also add the same origins under **Configuration → Clients → [your client] → Allowed origins**.
4. After upgrading Test → Production: remove leftover test-only origins you no longer use.

Use the exact origin (no trailing slash): run `window.location.origin` in the browser console on the failing page.

### 3. Vercel environment variables

Set for the **web** project (build-time `VITE_*`):

| Variable | Required |
|----------|----------|
| `VITE_PRIVY_APP_ID` | Yes (production App ID) |
| `VITE_PRIVY_CLIENT_ID` | Dev/local only (see below) |
| `VITE_PRIVY_USE_PRODUCTION_CLIENT` | Set to `true` only if the app client's Allowed origins include **every** production URL |

**Important:** If `VITE_PRIVY_CLIENT_ID` is set in production without matching Allowed origins on that client, Privy's iframe is blocked (`frame-ancestors` / "Could not log in with wallet"). The app now **ignores** the client ID in production unless `VITE_PRIVY_USE_PRODUCTION_CLIENT=true`. Remove `VITE_PRIVY_CLIENT_ID` from the production Vercel env if you do not maintain a production app client.

Prefer a **separate Privy App ID** for local/dev vs production. Redeploy after changing env vars.

### 3b. API server Privy App ID (server wallets)

The API creates Privy server wallets for agent custody. Set on the **API** host only (never `VITE_*`):

| Variable | Required | Notes |
|----------|----------|--------|
| `PRIVY_APP_ID` | Recommended | Overrides the runtime default. Use a **different** App ID for local/staging vs production so test traffic does not share the free-plan MAU/signature pool. |
| `PRIVY_APP_SECRET` | Yes for privy custody | Dashboard secret for that App ID |
| `PRIVY_DEFAULT_POLICY` | Optional | Policy id assigned to new server wallets |

Guest product visits create **spend-only** server wallets. Other pillars (earn/invest/treasury/grow) are created lazily on first use. Connect/sign-in still provisions the full set.

Privy free Developer plan limits are **MAU** (monthly active users) and **signatures**, not pageviews. Track both in the Privy Dashboard; Syra also sends throttled Telegram alerts on Privy 429/5xx/auth failures when `SYRA_DEV_BOT_*` is configured.

### 4. Production security checklist (Dashboard)

Do these in [Privy Dashboard](https://dashboard.privy.io) for the production app:

| Step | Where | Notes |
|------|--------|--------|
| Allowed domains | Configuration → Domains | Production origins only; see above |
| HttpOnly cookies (recommended) | Configuration → Domains | Verify `syraa.fun` DNS, then enable |
| Login methods | Authentication settings | Disable SMS if unused; review session length |
| MFA | Authentication → MFA | Enable passkey / authenticator for high-value flows |
| App clients | Configuration → Clients | Separate localhost vs production clients if needed |

API server: keep `PRIVY_APP_ID` / `PRIVY_APP_SECRET` on the API only (never in `VITE_*`). Optional `PRIVY_DEFAULT_POLICY` for server wallets. See section 3b.

### 5. Phantom workaround

1. Connect with **email** first.
2. Then **Connect wallet** → Phantom.

The web app defers loading the Privy SDK until Connect (or until an existing Privy session token is found). Marketing pages do not initialize Privy on first paint.
