# Privy setup (web / agent.syraa.fun)

## Production wallet connect fails but localhost works

### 1. Content-Security-Policy (Vercel)

`vercel.json` must allow Privy, WalletConnect, and Solana RPC hosts. Local `npm run dev` does **not** apply those headers — only production on Vercel does. If you see generic Privy or network errors in production, redeploy after updating `web/vercel.json`.

### 2. Allowed origins (Privy Dashboard)

SIWS / Phantom login returns **403** when the site origin is not allowlisted.

1. Open [Privy Dashboard](https://dashboard.privy.io) → your app.
2. **Without** `VITE_PRIVY_CLIENT_ID`: **Configuration → Domains → Allowed origins** — add:
   - `http://localhost:8080` (local dev port)
   - `https://agent.syraa.fun`
   - `https://www.agent.syraa.fun`
   - `https://dashboard.syraa.fun` (if used)
3. **With** `VITE_PRIVY_CLIENT_ID` in Vercel: client settings **override** app domains. Also add the same origins under **Configuration → Clients → [your client] → Allowed origins**.

Use the exact origin (no trailing slash): run `window.location.origin` in the browser console on the failing page.

### 3. Vercel environment variables

Set for the **web** project (build-time `VITE_*`):

| Variable | Required |
|----------|----------|
| `VITE_PRIVY_APP_ID` | Yes |
| `VITE_PRIVY_CLIENT_ID` | Only if you use an app client in the dashboard |

Redeploy after changing env vars.

### 4. Phantom workaround

1. Connect with **email** first.
2. Then **Connect wallet** → Phantom.

See also `api-playground/PRIVY_SETUP.md` for more detail.
