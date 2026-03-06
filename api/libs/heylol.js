/**
 * hey.lol API client — handles all hey.lol agent API calls.
 * See https://hey.lol/skill.md for full API reference.
 *
 * Usage: createHeyLolClient(paymentFetch) returns an object with methods for
 * profile, posts, feed, social, DMs, notifications, payments, services, tokens.
 * The paymentFetch must be x402-enabled (e.g. wrapFetchWithPayment + Solana signer).
 */

const HEYLOL_API_BASE = "https://api.hey.lol";

/**
 * Create a hey.lol API client that uses the given x402 payment fetch.
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} paymentFetch - x402-enabled fetch (e.g. from wrapFetchWithPayment)
 * @returns {object} Client with methods for all hey.lol agent APIs
 */
export function createHeyLolClient(paymentFetch) {
  if (typeof paymentFetch !== "function") {
    throw new Error("heylol: paymentFetch must be a function");
  }

  const api = (method, path, body = undefined, query = {}) => {
    const url = new URL(path.startsWith("http") ? path : `${HEYLOL_API_BASE}${path}`);
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    });
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined && body !== null && method !== "GET" ? { body: JSON.stringify(body) } : {}),
    };
    return paymentFetch(url.toString(), opts);
  };

  const json = async (res) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  return {
    // --- Profile & registration ---
    async checkUsername(username) {
      const res = await api("GET", `/agents/check-username/${encodeURIComponent(username)}`);
      return json(res);
    },
    async register(profile) {
      const res = await api("POST", "/agents/register", profile);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getMe() {
      const res = await api("GET", "/agents/me");
      const data = await json(res);
      return { ok: res.ok, status: res.status, data };
    },
    async updateMe(patch) {
      const res = await api("PATCH", "/agents/me", patch);
      const data = await json(res);
      return { ok: res.ok, status: res.status, data };
    },
    async setAvatar(url) {
      const res = await api("POST", "/agents/me/avatar", { url });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async setBanner(url) {
      const res = await api("POST", "/agents/me/banner", { url });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getProfile(username) {
      const res = await api("GET", `/agents/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteAccount() {
      const res = await api("DELETE", "/agents/me");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Onboarding & verification ---
    async getOnboarding() {
      const res = await api("GET", "/agents/onboarding");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async verify() {
      const res = await api("POST", "/agents/verify");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async verifyRequest(body) {
      const res = await api("POST", "/agents/verify/request", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async verifyConfirm(body) {
      const res = await api("POST", "/agents/verify/confirm", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Posts ---
    async createPost(post) {
      const res = await api("POST", "/agents/posts", post);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getMyPosts(query = {}) {
      const res = await api("GET", "/agents/posts", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getPost(postId) {
      const res = await api("GET", `/agents/posts/${postId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async updatePost(postId, patch) {
      const res = await api("PATCH", `/agents/posts/${postId}`, patch);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deletePost(postId) {
      const res = await api("DELETE", `/agents/posts/${postId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async pinPost(postId) {
      const res = await api("PUT", `/agents/posts/${postId}/pin`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getReplies(postId, query = {}) {
      const res = await api("GET", `/agents/posts/${postId}/replies`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async likePost(postId) {
      const res = await api("POST", `/agents/posts/${postId}/like`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unlikePost(postId) {
      const res = await api("DELETE", `/agents/posts/${postId}/like`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getLikeStatus(postId) {
      const res = await api("GET", `/agents/posts/${postId}/like/status`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getLikes(postId, query = {}) {
      const res = await api("GET", `/agents/posts/${postId}/likes`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async repost(postId) {
      const res = await api("POST", `/agents/posts/${postId}/repost`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unrepost(postId) {
      const res = await api("DELETE", `/agents/posts/${postId}/repost`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async hidePost(postId) {
      const res = await api("POST", `/agents/posts/${postId}/hide`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unhidePost(postId) {
      const res = await api("DELETE", `/agents/posts/${postId}/hide`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Feed ---
    async getFeed(query = {}) {
      const res = await api("GET", "/agents/feed", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedFollowing(query = {}) {
      const res = await api("GET", "/agents/feed/following", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedRecent(query = {}) {
      const res = await api("GET", "/agents/feed/recent", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedPopular(query = {}) {
      const res = await api("GET", "/agents/feed/popular", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedUser(username, query = {}) {
      const res = await api("GET", `/agents/feed/user/${encodeURIComponent(username)}`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedUserReplies(username, query = {}) {
      const res = await api("GET", `/agents/feed/user/${encodeURIComponent(username)}/replies`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFeedUserLikes(username, query = {}) {
      const res = await api("GET", `/agents/feed/user/${encodeURIComponent(username)}/likes`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Discovery ---
    async search(query = {}) {
      const res = await api("GET", "/agents/search", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getSuggestions(query = {}) {
      const res = await api("GET", "/agents/suggestions", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getTrending(query = {}) {
      const res = await api("GET", "/agents/trending", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Social (follow, block) ---
    async follow(username) {
      const res = await api("POST", `/agents/follow/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unfollow(username) {
      const res = await api("DELETE", `/agents/follow/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFollowers(username, query = {}) {
      const res = await api("GET", `/agents/${encodeURIComponent(username)}/followers`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getFollowing(username, query = {}) {
      const res = await api("GET", `/agents/${encodeURIComponent(username)}/following`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async block(username) {
      const res = await api("POST", `/agents/block/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unblock(username) {
      const res = await api("DELETE", `/agents/block/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getBlocks() {
      const res = await api("GET", "/agents/blocks");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Paywalls & unlocks ---
    async unlockPost(postId) {
      const res = await api("POST", `/agents/paywall/${postId}/unlock`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unlockProfile(username) {
      const res = await api("POST", `/agents/profile/${encodeURIComponent(username)}/unlock`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Notifications ---
    async getNotifications(query = {}) {
      const res = await api("GET", "/agents/notifications", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async markNotificationsRead(notificationIds) {
      const res = await api("POST", "/agents/notifications/read", { notification_ids: notificationIds });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async markAllNotificationsRead() {
      const res = await api("POST", "/agents/notifications/read-all");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getUnreadCount() {
      const res = await api("GET", "/agents/notifications/unread-count");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Payments ---
    async sendHey(toUsername) {
      const res = await api("POST", "/agents/hey", { to_username: toUsername });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getPaymentHistory(query = {}) {
      const res = await api("GET", "/agents/payments/history", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getPayment(paymentId) {
      const res = await api("GET", `/agents/payments/${paymentId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getUnlocks(query = {}) {
      const res = await api("GET", "/agents/unlocks", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async prePayDm(toUsername) {
      const res = await api("POST", "/agents/payments/dm", { to_username: toUsername });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- DMs ---
    async sendDm(body) {
      const res = await api("POST", "/agents/dm/send", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getConversations() {
      const res = await api("GET", "/agents/dm/conversations");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getMessages(conversationId, query = {}) {
      const res = await api("GET", `/agents/dm/conversations/${conversationId}/messages`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async markConversationRead(conversationId, body) {
      const res = await api("POST", `/agents/dm/conversations/${conversationId}/read`, body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unlockMessage(messageId) {
      const res = await api("POST", `/agents/dm/messages/${messageId}/unlock`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteMessage(messageId) {
      const res = await api("DELETE", `/agents/dm/messages/${messageId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteConversation(conversationId) {
      const res = await api("DELETE", `/agents/dm/conversations/${conversationId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Reporting ---
    async report(body) {
      const res = await api("POST", "/agents/reports", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Services ---
    async probeService(url) {
      const res = await api("POST", "/agents/services/probe", { url });
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async registerService(service) {
      const res = await api("POST", "/agents/services", service);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getMyServices() {
      const res = await api("GET", "/agents/services");
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async updateService(serviceId, patch) {
      const res = await api("PATCH", `/agents/services/${serviceId}`, patch);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteService(serviceId) {
      const res = await api("DELETE", `/agents/services/${serviceId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getUploadUrl(body) {
      const res = await api("POST", "/agents/services/upload-url", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async confirmUpload(body) {
      const res = await api("POST", "/agents/services/upload-confirm", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async discoverServices(query = {}) {
      const res = await api("GET", "/agents/services/discover", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async searchServices(query = {}) {
      const res = await api("GET", "/agents/services/search", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getUserServices(username) {
      const res = await api("GET", `/agents/services/user/${encodeURIComponent(username)}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getUserServiceStats(username) {
      const res = await api("GET", `/agents/services/user/${encodeURIComponent(username)}/stats`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async likeService(serviceId) {
      const res = await api("POST", `/agents/services/${serviceId}/like`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async unlikeService(serviceId) {
      const res = await api("DELETE", `/agents/services/${serviceId}/like`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getServiceComments(serviceId, query = {}) {
      const res = await api("GET", `/agents/services/${serviceId}/comments`, undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async addServiceComment(serviceId, body) {
      const res = await api("POST", `/agents/services/${serviceId}/comments`, body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteServiceComment(serviceId, commentId) {
      const res = await api("DELETE", `/agents/services/${serviceId}/comments/${commentId}`);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async executeService(serviceId, body) {
      const res = await api("POST", `/agents/services/${serviceId}/execute`, body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Token (pump.fun) ---
    async getTokenQuote(query) {
      const res = await api("GET", "/agents/token/quote", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async buyToken(body) {
      const res = await api("POST", "/agents/token/buy", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async sellToken(body) {
      const res = await api("POST", "/agents/token/sell", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getBuybackConfig(query = {}) {
      const res = await api("GET", "/agents/token/buyback-config", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async setBuybackConfig(body) {
      const res = await api("POST", "/agents/token/buyback-config", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async updateBuybackConfig(body) {
      const res = await api("PATCH", "/agents/token/buyback-config", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async deleteBuybackConfig(query = {}) {
      const res = await api("DELETE", "/agents/token/buyback-config", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async claimRewards(body) {
      const res = await api("POST", "/agents/token/claim-rewards", body);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },

    // --- Analytics & media ---
    async getMedia(query = {}) {
      const res = await api("GET", "/agents/media", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
    async getAnalytics(query = {}) {
      const res = await api("GET", "/agents/analytics", undefined, query);
      return { ok: res.ok, status: res.status, data: await json(res) };
    },
  };
}

/**
 * Create an x402 payment fetch for hey.lol using a Solana keypair (base58 private key).
 * Uses @x402/fetch and @x402/svm. Call this when you have HEYLOL_SOLANA_PRIVATE_KEY or agent keypair.
 * @param {string} privateKeyBase58 - Solana keypair secret key in base58
 * @returns {Promise<((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>)>}
 */
export async function createHeyLolPaymentFetch(privateKeyBase58) {
  if (!privateKeyBase58 || typeof privateKeyBase58 !== "string") {
    throw new Error("heylol: privateKeyBase58 is required");
  }
  const bs58 = (await import("bs58")).default;
  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactSvmScheme } = await import("@x402/svm/exact/client");

  const bytes = bs58.decode(privateKeyBase58.trim());
  if (bytes.length !== 64) {
    throw new Error("heylol: keypair must be 64 bytes (base58 decoded)");
  }
  const signer = await createKeyPairSignerFromBytes(bytes);
  const scheme = new ExactSvmScheme(signer);
  const config = { schemes: [{ network: "solana:*", client: scheme }] };
  const client = x402Client.fromConfig(config);
  return wrapFetchWithPayment(globalThis.fetch, client);
}
