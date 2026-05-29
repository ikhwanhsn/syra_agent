/**
 * hey.lol API integration for the AI agent website.
 * Calls go through the agent tools API (backend pays x402 with agent wallet).
 * The chat agent can also use hey.lol tools via the injected tool list.
 */

import { agentToolsApi } from "./chatApi";

const HEYLOL_TOOL_IDS = [
  "heylol-profile-me",
  "heylol-feed",
  "heylol-feed-following",
  "heylol-posts",
  "heylol-search",
  "heylol-suggestions",
  "heylol-notifications",
  "heylol-create-post",
] as const;

export type HeyLolToolId = (typeof HEYLOL_TOOL_IDS)[number];

/** Result shape from hey.lol proxy (profile, feed, posts, etc.). */
export interface HeyLolResult<T = unknown> {
  success: true;
  toolId: string;
  data: T;
}

export interface HeyLolError {
  success: false;
  insufficientBalance?: boolean;
  usdcBalance?: number;
  requiredUsdc?: number;
  message?: string;
  error?: string;
}

/**
 * Call a hey.lol tool via the agent tools API.
 * Uses the user's agent wallet (anonymousId) to pay the x402 fee.
 */
export async function callHeyLolTool(
  anonymousId: string,
  toolId: HeyLolToolId,
  params?: Record<string, string | number | undefined>
): Promise<HeyLolResult | HeyLolError> {
  const normalized = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
      )
    : undefined;
  return agentToolsApi.call({
    anonymousId,
    toolId,
    params: normalized as Record<string, string> | undefined,
  }) as Promise<HeyLolResult | HeyLolError>;
}

/** Get the current user's hey.lol profile (requires agent wallet with USDC). */
export async function getHeyLolProfile(anonymousId: string) {
  return callHeyLolTool(anonymousId, "heylol-profile-me");
}

/** Get the public hey.lol feed. */
export async function getHeyLolFeed(
  anonymousId: string,
  opts?: { limit?: number; offset?: number }
) {
  const params: Record<string, string> = {};
  if (opts?.limit != null) params.limit = String(opts.limit);
  if (opts?.offset != null) params.offset = String(opts.offset);
  return callHeyLolTool(anonymousId, "heylol-feed", params);
}

/** Get the current user's hey.lol posts. */
export async function getHeyLolMyPosts(
  anonymousId: string,
  opts?: { limit?: number; offset?: number }
) {
  const params: Record<string, string> = {};
  if (opts?.limit != null) params.limit = String(opts.limit);
  if (opts?.offset != null) params.offset = String(opts.offset);
  return callHeyLolTool(anonymousId, "heylol-posts", params);
}

/** Search hey.lol users or posts (q required). */
export async function searchHeyLol(
  anonymousId: string,
  q: string,
  opts?: { type?: "users" | "posts"; limit?: number }
) {
  const params: Record<string, string> = { q };
  if (opts?.type) params.type = opts.type;
  if (opts?.limit != null) params.limit = String(opts.limit);
  return callHeyLolTool(anonymousId, "heylol-search", params);
}

/** Get hey.lol follow suggestions. */
export async function getHeyLolSuggestions(anonymousId: string, limit?: number) {
  return callHeyLolTool(anonymousId, "heylol-suggestions", limit != null ? { limit } : undefined);
}

/** Get hey.lol notifications. */
export async function getHeyLolNotifications(
  anonymousId: string,
  opts?: { limit?: number; unread_only?: boolean }
) {
  const params: Record<string, string> = {};
  if (opts?.limit != null) params.limit = String(opts.limit);
  if (opts?.unread_only !== undefined) params.unread_only = String(opts.unread_only);
  return callHeyLolTool(anonymousId, "heylol-notifications", params);
}

/** Create a hey.lol post (content required; optional paywall, teaser). Agent tool body is flat string params. */
export async function createHeyLolPost(
  anonymousId: string,
  body: {
    content: string;
    teaser?: string;
    paywall_price?: string;
    is_paywalled?: boolean;
    gif_url?: string;
    video_url?: string;
    quoted_post_id?: string;
    parent_id?: string;
  }
) {
  const params: Record<string, string> = { content: body.content };
  if (body.teaser) params.teaser = body.teaser;
  if (body.paywall_price) params.paywall_price = body.paywall_price;
  if (body.is_paywalled !== undefined) params.is_paywalled = String(body.is_paywalled);
  if (body.gif_url) params.gif_url = body.gif_url;
  if (body.video_url) params.video_url = body.video_url;
  if (body.quoted_post_id) params.quoted_post_id = body.quoted_post_id;
  if (body.parent_id) params.parent_id = body.parent_id;
  return callHeyLolTool(anonymousId, "heylol-create-post", params);
}

export const heylolApi = {
  getProfile: getHeyLolProfile,
  getFeed: getHeyLolFeed,
  getMyPosts: getHeyLolMyPosts,
  search: searchHeyLol,
  getSuggestions: getHeyLolSuggestions,
  getNotifications: getHeyLolNotifications,
  createPost: createHeyLolPost,
  toolIds: HEYLOL_TOOL_IDS,
};
