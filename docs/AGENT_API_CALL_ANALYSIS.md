# Why the Agent May Not Call the Real API or Use Returned Data

This document explains the flow from user message → tool selection → API call → LLM answer, and lists the main reasons the agent might not call the real API or use the data.

---

## Flow Overview

1. **Frontend** (`ai-agent`) sends `POST /agent/chat/completion` with `messages`, `systemPrompt`, and `anonymousId` (no `toolRequest`).
2. **Backend** (`api/routes/agent/chat.js`):
   - Gets the last user message.
   - Resolves **which tool to call**: either `clientToolRequest.toolId` (from frontend) or **`matchToolFromUserMessage(lastUserMessage)`** (regex on the message). Since the frontend never sends `toolRequest`, the backend **always** uses `matchToolFromUserMessage`.
   - If **no tool matches** → injects “Syra doesn’t have this capability” and never calls any API.
   - If **tool matches but no `anonymousId`** → injects “connect/create agent wallet” and never calls the API.
   - If **tool matches and `anonymousId`** → checks USDC balance; if **insufficient** → injects “deposit USDC” and never calls the API.
   - If **tool matches, `anonymousId`, and sufficient balance** → calls **`callX402V2WithAgent`** (real x402 API), then injects the result as a user message and calls **Jatevo** to generate the final answer from that data.

So the agent only uses “data returned from the API” when: a tool is matched, `anonymousId` is present, balance is sufficient, and the x402 call succeeds.

---

## Root Causes (Why the Agent Might Not Call the API)

### 1. **Tool matching is keyword-based and strict (most likely)**

Tool selection is done **only** by `matchToolFromUserMessage()` in `api/config/agentTools.js`. It uses a fixed list of regexes; the **first** matching intent wins.

- **Effect:** Natural questions like “What’s going on with crypto?”, “Any news?”, “How’s the market?” often don’t match any pattern, so `matchedTool` is `null`.
- **Result:** Backend never calls any API; it injects “Syra doesn’t have this capability” and the LLM answers with that.

**Examples that may not match:**

- “What’s the latest on Bitcoin?” → may not match `news` (pattern expects e.g. “news”, “latest news”, “crypto news”).
- “Give me market sentiment” → may not match if wording differs from `/sentiment\s*(analysis)?|market\s*sentiment|...`.
- “Any updates?” / “What’s new?” → no explicit “news” or “signal” keyword.

**Fix options:**

- Broaden or add regex patterns in `matchToolFromUserMessage` for common phrasings (e.g. “latest on”, “updates”, “what’s new” → news/signal).
- Or: **Let the LLM choose the tool** (see below) and send it as `toolRequest` so the backend doesn’t rely only on regex.

---

### 2. **Missing `anonymousId`**

The backend only calls the real API when `anonymousId` is present (so it can use the agent wallet for x402 payment).

- **Effect:** If the frontend sends `anonymousId: undefined`/missing (e.g. wallet context not ready yet, or `getOrCreate`/`getOrCreateByWallet` failed), the backend takes the “no agent wallet linked” branch.
- **Result:** No API call; user gets a “connect or create agent wallet” style message.

**Fix:**

- Ensure the UI only allows sending when the wallet context is ready and `anonymousId` is set (you already block on `ready`; ensure `getOrCreate` failure is handled and optionally show a “Wallet not ready” state).
- Optionally: backend could create an anonymous wallet on first completion if none is sent (product decision).

---

### 3. **Insufficient USDC balance**

Before calling a paid tool, the backend checks `getAgentUsdcBalance(anonymousId)` and compares it to the tool’s `priceUsd`.

- **Effect:** If balance is 0 or &lt; tool price, the backend injects a “deposit USDC” message and **does not** call the x402 API.
- **Result:** No real API call; answer is only about balance/deposit.

**Fix:**

- Ensure the agent wallet has enough USDC for the tools you test with.
- Optionally: surface balance and “need more USDC” clearly in the UI before/after sending.

---

### 4. **Frontend never sends `toolRequest`**

The completion API supports an explicit tool choice:

```ts
toolRequest?: { toolId: string; params?: Record<string, string> } | null;
```

- **Effect:** The frontend never sends `toolRequest`; the backend **always** uses `matchToolFromUserMessage(lastUserMessage)`. So tool selection is 100% regex-based.
- **Result:** If the user’s phrasing doesn’t match, no tool is selected and no API is called, even if the user’s intent is clear.

**Fix:**

- **Option A – LLM picks tool:**  
  Add a small “tool selection” step: call the LLM (or a cheap model) with the user message and the list of tools (id + description); parse which tool (and params) to use; send that as `toolRequest` in the completion request. Then the backend will call that tool and use the returned data for the final answer.
- **Option B – User picks tool:**  
  In the UI, let the user choose a capability (e.g. “News”, “Signal”, “Sentiment”) and send the corresponding `toolId` (and params) as `toolRequest`.

Either way, once `toolRequest` is sent, the backend will call the real API (subject to `anonymousId` and balance).

---

### 5. **x402 / BASE_URL / environment**

- **`callX402V2WithAgent`** builds the URL as `BASE_URL + tool.path` (e.g. `http://localhost:3000/v2/news`). If `BASE_URL` is wrong (e.g. different host or port), the request may fail or hit the wrong server.
- **Effect:** API “call” fails; backend injects the error message and still calls Jatevo, so the user sees an error, not “no capability”.
- So this would explain “API failed” rather than “agent didn’t call API”. If you see no call at all, focus on 1–4 first.

**Fix:** Ensure `BASE_URL` (and any env used by the API server) points to the same server that serves `/v2/*` and that x402 payment (Solana, facilitator, etc.) is configured.

---

## Quick Checklist

- [ ] **Tool match:** Try a phrase that exactly matches a pattern (e.g. “Get latest crypto news” or “trading signal”) and see if the agent then calls the API and uses the result.
- [ ] **anonymousId:** Confirm the frontend sends `anonymousId` in the completion request (e.g. network tab or server logs).
- [ ] **Balance:** Confirm the agent wallet has USDC ≥ the tool’s price.
- [ ] **Explicit tool:** Implement sending `toolRequest` (from LLM or user) and test again.

---

## Summary

The agent does not call the real API or use returned data when:

1. **No tool is matched** (strict regex in `matchToolFromUserMessage`) → backend never calls the API.  
2. **No `anonymousId`** → backend skips the API and asks to connect/create wallet.  
3. **Insufficient USDC** → backend skips the API and asks to deposit.

The most impactful improvement is **reliable tool selection**: either broaden the regex patterns or (better) use an LLM or UI to set `toolRequest` so the backend consistently calls the right API and the LLM can answer from the returned data.
