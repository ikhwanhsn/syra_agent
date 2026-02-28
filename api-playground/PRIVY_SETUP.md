# Privy setup (fix Phantom / Solana error)

Config follows [privy-io/create-react-app](https://github.com/privy-io/create-react-app) and [Privy v3 migration](https://docs.privy.io/basics/react/advanced/migrating-to-3.0): `embeddedWallets.ethereum` / `embeddedWallets.solana`, `externalWallets.solana.connectors`, and simple `login()` with no options.

---

## ⚠️ "Login with solana wallet not allowed" / 403 on siws/init

**You must allowlist your app’s origin in the Privy Dashboard.**

- **Not using a Client ID?** Add the origin in **Configuration → App settings → Domains → Allowed origins** (see below).
- **Using `VITE_PRIVY_CLIENT_ID` in .env?** Client settings override app settings. Go to **Configuration → App settings → Clients**, open **your client**, and set **Allowed origins** there (e.g. `http://localhost:5173`). Use the exact value the app shows in the toast (or `window.location.origin` in the console).

After saving, do a hard refresh (Ctrl+Shift+R) or try in an incognito window.

---

## Why MetaMask works but Phantom shows an error

- **MetaMask (EVM)** uses Sign-In With Ethereum (SIWE). Privy allows it without extra config.
- **Phantom (Solana)** uses Sign-In With Solana (SIWS). Privy’s server only accepts it if your **app origin** is in **Allowed origins**. If not, you get `403` on `auth.privy.io/api/v1/siws/init`.

So: **MetaMask works; Phantom errors** until the dashboard is set up below.

---

## How Phantom Solana login works in this app

To avoid 403 / "Could not log in" with Phantom, the app uses a **connect-then-SIWS** flow when you choose Solana:

1. You click **Connect Wallet** (with Solana as the payment network).
2. The modal shows **only Solana wallets** (Phantom, Solflare, etc.) — no Ethereum option, so Phantom is used for Solana.
3. You pick Phantom and approve the **connection** in Phantom.
4. The app then asks Phantom to **sign a Sign-In With Solana (SIWS) message**; you approve in Phantom again.
5. You're logged in with Phantom as your Solana wallet.

If you see errors, ensure your **origin** is in Privy Dashboard → Domains → Allowed origins (see below).

## Phantom workaround (no dashboard change)

Phantom works if you **don’t** use “Log in with Phantom” on the first screen:

1. Click **Connect Wallet** → choose **Log in with email** and sign in.
2. After login, click **Connect Wallet** again → choose **Phantom** (and approve in Phantom).
3. Phantom is connected and linked; no SIWS 403.

The Connect Wallet tooltip in the app also says: *“Phantom error? Log in with email first, then connect Phantom.”*

---

## Fix Phantom “Log in with Phantom” (remove 403)

If you see **`POST https://auth.privy.io/api/v1/siws/init 403 (Forbidden)`**, your app’s origin is not allowlisted (or you’re using an App Client that has its own list).

### 1. Allowed origins (main app)

1. Open **[Privy Dashboard](https://dashboard.privy.io)** → your app.
2. **Configuration** → **App settings** → **Domains** tab.  
   [Direct link](https://dashboard.privy.io/apps?setting=domains&page=settings).
3. Under **Allowed origins**, select **Web & mobile web**.
4. Add:
   - **Local:** `http://localhost:8080` (use your real port; include port).
   - **Production:** `https://your-domain.com` (no trailing slash).
5. Save.

### 2. If you use an App Client (e.g. `VITE_PRIVY_CLIENT_ID`)

**App Client settings override the app’s defaults.** If you set a **Client ID** in `.env`, you must also set allowed origins **for that client**:

1. **Configuration** → **App settings** → **Clients** tab.  
   [Direct link](https://dashboard.privy.io/apps?setting=clients&page=settings).
2. Open the **client** you use (the one whose ID is in `.env`).
3. Set **Allowed origins** for that client (same values: `http://localhost:8080`, `https://your-domain.com`, etc.).
4. Save.

### 3. Rules

- Localhost: include port, e.g. `http://localhost:8080`.
- **`localhost` ≠ `127.0.0.1`** — they are different origins. If you open the app at `http://127.0.0.1:8080`, add **both**:
  - `http://localhost:8080`
  - `http://127.0.0.1:8080`
- Production: use `https://`, no trailing path.
- If both `https://example.com` and `https://www.example.com` are used, add both.

### 4. Still 403?

- **Check the exact origin**: In the browser console on the playground page, run `console.log(window.location.origin)`. Add that **exact** value in Privy → Domains → Allowed origins (and save).
- **Using an App Client?** If `VITE_PRIVY_CLIENT_ID` is set (in `.env` or your deployment), go to **Configuration → Clients**, open that client, and set **Allowed origins** there too (client settings override app defaults).
- **Production**: If you use a different URL (e.g. `http://` or a staging domain), add that exact origin.
- **Cache**: Try a hard refresh (Ctrl+Shift+R) or an incognito window after changing domains.

### 5. Login methods

In **Configuration** → **Login methods**, ensure **Email** (and **Wallet** if you later switch back to wallet login) is enabled.
