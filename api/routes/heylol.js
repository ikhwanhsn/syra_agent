/**
 * hey.lol API routes — x402 paid proxy to hey.lol agent API.
 * Caller pays per request (PAYMENT-SIGNATURE); server uses HEYLOL_SOLANA_PRIVATE_KEY or agent wallet (anonymousId).
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_HEYLOL_USD } from "../config/x402Pricing.js";
import { createHeyLolClient, createHeyLolPaymentFetch } from "../libs/heylol.js";
import { getAgentKeypair } from "../libs/agentWallet.js";
import bs58 from "bs58";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const router = express.Router();

/** Base x402 options for hey.lol; override resource and method per route. */
function heylolPaymentOpts(resource, method = "GET") {
  return {
    price: X402_API_PRICE_HEYLOL_USD,
    description: "hey.lol agent API proxy – profile, posts, feed, DMs, services, token",
    discoverable: true,
    resource: `/heylol${resource}`,
    method,
    outputSchema: {
      data: { type: "object", description: "hey.lol API response" },
      success: { type: "boolean", description: "Request success" },
    },
  };
}

/**
 * Resolve paymentFetch for hey.lol from request: env HEYLOL_SOLANA_PRIVATE_KEY or agent wallet (anonymousId).
 */
async function getPaymentFetch(req) {
  const envKey = process.env.HEYLOL_SOLANA_PRIVATE_KEY;
  if (envKey && String(envKey).trim()) {
    return createHeyLolPaymentFetch(envKey.trim());
  }
  const anonymousId =
    req.body?.anonymousId ?? req.query?.anonymousId ?? req.get("x-anonymous-id") ?? req.get("X-Anonymous-Id");
  if (anonymousId && typeof anonymousId === "string") {
    const keypair = await getAgentKeypair(anonymousId.trim());
    if (keypair && keypair.secretKey && keypair.secretKey.length === 64) {
      return createHeyLolPaymentFetch(bs58.encode(keypair.secretKey));
    }
  }
  return null;
}

/** Send hey.lol result after x402 settle; pass through status/data from upstream. */
function sendResult(res, result) {
  if (!result) {
    return res.status(500).json({
      success: false,
      error: "No payment fetch. Set HEYLOL_SOLANA_PRIVATE_KEY or provide anonymousId.",
    });
  }
  const { ok, status, data } = result;
  if (status === 402) {
    return res.status(402).json(data || { error: "Payment required" });
  }
  if (!ok && status >= 400) {
    return res.status(status).json(data || { error: "Request failed" });
  }
  return res.status(ok ? 200 : status).json(data != null ? data : { success: ok });
}

// --- Profile ---
router.get(
  "/profile/me",
  requirePayment(heylolPaymentOpts("/profile/me", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch. Set HEYLOL_SOLANA_PRIVATE_KEY or provide anonymousId." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getMe();
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.patch(
  "/profile/me",
  requirePayment(heylolPaymentOpts("/profile/me", "PATCH")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.updateMe(req.body || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/profile/check-username/:username",
  requirePayment(heylolPaymentOpts("/profile/check-username/:username", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.checkUsername(req.params.username);
    await settlePaymentAndSetResponse(res, req);
    return res.json(result);
  }
);

router.get(
  "/profile/:username",
  requirePayment(heylolPaymentOpts("/profile/:username", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getProfile(req.params.username);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Posts ---
router.post(
  "/posts",
  requirePayment(heylolPaymentOpts("/posts", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const body = { ...(req.body || {}) };
    delete body.anonymousId;
    const client = createHeyLolClient(paymentFetch);
    const result = await client.createPost(body);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/posts",
  requirePayment(heylolPaymentOpts("/posts", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getMyPosts(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/posts/:postId",
  requirePayment(heylolPaymentOpts("/posts/:postId", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getPost(req.params.postId);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/posts/:postId/replies",
  requirePayment(heylolPaymentOpts("/posts/:postId/replies", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getReplies(req.params.postId, req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.post(
  "/posts/:postId/like",
  requirePayment(heylolPaymentOpts("/posts/:postId/like", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.likePost(req.params.postId);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.delete(
  "/posts/:postId/like",
  requirePayment(heylolPaymentOpts("/posts/:postId/like", "DELETE")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.unlikePost(req.params.postId);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Feed ---
router.get(
  "/feed",
  requirePayment(heylolPaymentOpts("/feed", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getFeed(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/feed/following",
  requirePayment(heylolPaymentOpts("/feed/following", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getFeedFollowing(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/feed/user/:username",
  requirePayment(heylolPaymentOpts("/feed/user/:username", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getFeedUser(req.params.username, req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Discovery ---
router.get(
  "/search",
  requirePayment(heylolPaymentOpts("/search", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.search(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/suggestions",
  requirePayment(heylolPaymentOpts("/suggestions", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getSuggestions(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Social ---
router.post(
  "/follow/:username",
  requirePayment(heylolPaymentOpts("/follow/:username", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.follow(req.params.username);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.delete(
  "/follow/:username",
  requirePayment(heylolPaymentOpts("/follow/:username", "DELETE")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.unfollow(req.params.username);
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Notifications ---
router.get(
  "/notifications",
  requirePayment(heylolPaymentOpts("/notifications", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getNotifications(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Payments ---
router.get(
  "/payments/history",
  requirePayment(heylolPaymentOpts("/payments/history", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getPaymentHistory(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- DMs ---
router.post(
  "/dm/send",
  requirePayment(heylolPaymentOpts("/dm/send", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.sendDm(req.body || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/dm/conversations",
  requirePayment(heylolPaymentOpts("/dm/conversations", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getConversations();
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/dm/conversations/:conversationId/messages",
  requirePayment(heylolPaymentOpts("/dm/conversations/:conversationId/messages", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const { conversationId } = req.params;
    const result = await client.getMessages(conversationId, req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Services ---
router.get(
  "/services",
  requirePayment(heylolPaymentOpts("/services", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.getMyServices();
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.get(
  "/services/discover",
  requirePayment(heylolPaymentOpts("/services/discover", "GET")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.discoverServices(req.query || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

router.post(
  "/services/:serviceId/execute",
  requirePayment(heylolPaymentOpts("/services/:serviceId/execute", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({ success: false, error: "No payment fetch." });
    }
    const client = createHeyLolClient(paymentFetch);
    const result = await client.executeService(req.params.serviceId, req.body || {});
    await settlePaymentAndSetResponse(res, req);
    return sendResult(res, result);
  }
);

// --- Generic call ---
router.post(
  "/call",
  requirePayment(heylolPaymentOpts("/call", "POST")),
  async (req, res) => {
    const paymentFetch = await getPaymentFetch(req);
    if (!paymentFetch) {
      return res.status(500).json({
        success: false,
        error: "No payment fetch. Set HEYLOL_SOLANA_PRIVATE_KEY or provide anonymousId.",
      });
    }
    const { action, params } = req.body || {};
    if (!action || typeof action !== "string") {
      return res.status(400).json({ success: false, error: "body.action is required (string)." });
    }
    const method = action.trim();
    const client = createHeyLolClient(paymentFetch);
    if (typeof client[method] !== "function") {
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${method}. Check libs/heylol.js for available methods.`,
      });
    }
    try {
      const args = Array.isArray(params) ? params : params != null ? [params] : [];
      const result = await client[method](...args);
      await settlePaymentAndSetResponse(res, req);
      return sendResult(res, result);
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  }
);

export async function createHeyLolRouter() {
  return router;
}
