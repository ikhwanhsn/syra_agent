# Where the agent pays when calling x402 API

## Where the balance actually decreases

The agent’s USDC balance decreases **on Solana** when this code runs:

**File:** `api/libs/agentX402Client.js`  
**Lines 179–183:** `connection.sendRawTransaction(transaction.serialize(), ...)`

That sends a **USDC transfer** from the agent’s Associated Token Account (ATA) to the recipient’s ATA (`payTo` from the 402 `accepts`). Once the transaction is confirmed, the agent’s balance goes down.

---

## Full flow

1. **First request (no payment):**  
   `callX402V2WithAgent` does `fetch(url)` (e.g. `GET http://localhost:3000/v2/signal`) **without** any payment header.

2. **V2 route (e.g. `/v2/signal`):**  
   `requirePayment` in `api/v2/utils/x402Payment.js` runs:
   - If there is **no** `payment-signature` / `x-payment` header → it must return **402** with an `accepts` array (payment required).
   - If it returns **200** here, the client never pays (see below).

3. **Client behaviour:**
   - **If `firstRes.status !== 402`** (e.g. 200):  
     **Lines 84–86** in `agentX402Client.js` return immediately with `{ success: true, data: firstData }`.  
     No transaction is built, no `sendRawTransaction` is called → **agent balance does not change**.
   - **If `firstRes.status === 402`:**  
     Client builds a USDC transfer from the agent wallet to `payTo`, signs it with the agent keypair, then calls **`sendRawTransaction`** (lines 179–183). That is the only place the agent pays. After confirmation, it retries the API with the `PAYMENT-SIGNATURE` header and returns the response.

So: **the agent pays only when the first request gets 402.** If the first request gets 200, you get data but no payment and no balance reduction.

---

## Why your agent balance might not be reducing

1. **First request is returning 200 (most likely)**  
   - The URL called might not be the x402-protected route (e.g. wrong `BASE_URL` or path).  
   - Or the server you hit doesn’t use `requirePayment` for that route.  
   - **Check:** Add logging in `api/libs/agentX402Client.js`: log `firstRes.status` and `initialUrl`. If you see `200`, the agent never pays.

2. **Transaction fails**  
   - If `sendRawTransaction` throws, the client returns `{ success: false, error: ... }` and the agent never pays. You would see an error in the UI or logs, not a successful response with no balance change.

3. **Different wallet than the one you check**  
   - Payment is made by the wallet tied to `anonymousId` (agent keypair from DB).  
   - If you’re checking balance for another wallet or another `anonymousId`, you won’t see the decrease.

4. **BASE_URL / env**  
   - `BASE_URL` (e.g. in `api/routes/agent/chat.js`) must point to the same API that serves the v2 routes **with** `requirePayment`.  
   - If it points to another host/port that returns 200 without 402, no payment will happen.

---

## Quick checks

- In **server logs**: confirm whether the first call to the v2 API returns **402** or **200** (see suggested logging below).  
- In **Solana explorer**: search for the **agent wallet address** (from `anonymousId`); check recent USDC transfers.  
- Confirm **BASE_URL** and the v2 route (e.g. `/v2/signal`) use the same app and that `requirePayment` is in the middleware chain for that route.
