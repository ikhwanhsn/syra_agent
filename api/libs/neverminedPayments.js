/**
 * Nevermined x402 Payments client (feature-flagged pilot).
 *
 * Syra Exact USDC rails (Dexter → GoPlausible → PayAI) stay on /news.
 * This module only gates the parallel /partners/nevermined/* merchant path.
 *
 * @see https://nevermined.ai/docs/integrate/add-to-your-agent/express
 */
import { Payments } from "@nevermined-io/payments";
import { paymentMiddleware } from "@nevermined-io/payments/express";
import { optionalSecret } from "../config/secrets.js";
import { X402_API_PRICE_NEWS_USD } from "../config/x402Pricing.js";

/** Pilot HTTP path (Express mount + route). */
export const NEVERMINED_NEWS_MOUNT = "/partners/nevermined";
export const NEVERMINED_NEWS_ROUTE_PATH = "/news";
/** Full public path for docs / clients. */
export const NEVERMINED_NEWS_PUBLIC_PATH = `${NEVERMINED_NEWS_MOUNT}${NEVERMINED_NEWS_ROUTE_PATH}`;

/** Credits burned per news call; price the Nevermined plan to ≈ X402_API_PRICE_NEWS_USD. */
export const NEVERMINED_NEWS_CREDITS = 1;

/** @type {import('@nevermined-io/payments').Payments | null} */
let paymentsSingleton = null;

function envFlagEnabled(name) {
  const raw = String(process.env[name] ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "on";
}

/**
 * @returns {'sandbox' | 'live' | 'staging_sandbox' | 'staging_live'}
 */
export function getNeverminedEnvironment() {
  const raw = String(process.env.NVM_ENVIRONMENT || optionalSecret("NVM_ENVIRONMENT") || "sandbox")
    .trim()
    .toLowerCase();
  if (raw === "live" || raw === "staging_live" || raw === "staging_sandbox") return raw;
  return "sandbox";
}

/**
 * @returns {{ enabledFlag: boolean, apiKey: string, planId: string, agentId: string }}
 */
export function getNeverminedConfig() {
  return {
    enabledFlag: envFlagEnabled("NEVERMINED_X402_ENABLED"),
    apiKey: optionalSecret("NVM_API_KEY"),
    planId: optionalSecret("NVM_PLAN_ID"),
    agentId: optionalSecret("NVM_AGENT_ID"),
  };
}

/**
 * True when the pilot may accept traffic (flag + required secrets).
 * @returns {boolean}
 */
export function isNeverminedEnabled() {
  const { enabledFlag, apiKey, planId } = getNeverminedConfig();
  return Boolean(enabledFlag && apiKey && planId);
}

/**
 * Human-readable reason when pilot is off (for 503 bodies). Never includes secrets.
 * @returns {string | null} null when enabled
 */
export function getNeverminedDisabledReason() {
  if (isNeverminedEnabled()) return null;
  const { enabledFlag, apiKey, planId } = getNeverminedConfig();
  if (!enabledFlag) {
    return "Nevermined pilot is disabled. Set NEVERMINED_X402_ENABLED=true and configure NVM_API_KEY + NVM_PLAN_ID.";
  }
  if (!apiKey) return "Nevermined pilot missing NVM_API_KEY.";
  if (!planId) return "Nevermined pilot missing NVM_PLAN_ID.";
  return "Nevermined pilot is not configured.";
}

/**
 * @returns {import('@nevermined-io/payments').Payments}
 * @throws {Error} when not enabled / missing key
 */
export function getNeverminedPayments() {
  if (!isNeverminedEnabled()) {
    throw new Error(getNeverminedDisabledReason() || "Nevermined disabled");
  }
  if (paymentsSingleton) return paymentsSingleton;
  const { apiKey } = getNeverminedConfig();
  paymentsSingleton = Payments.getInstance({
    nvmApiKey: apiKey,
    environment: getNeverminedEnvironment(),
  });
  return paymentsSingleton;
}

/** Reset singleton (tests only). */
export function resetNeverminedPaymentsForTests() {
  paymentsSingleton = null;
}

/**
 * Route map for paymentMiddleware when mounted at /partners/nevermined
 * (req.path inside the router is /news).
 * @returns {Record<string, { planId: string, agentId?: string, credits: number }>}
 */
export function buildNeverminedNewsRouteConfig() {
  const { planId, agentId } = getNeverminedConfig();
  /** @type {{ planId: string, agentId?: string, credits: number }} */
  const cfg = {
    planId,
    credits: NEVERMINED_NEWS_CREDITS,
  };
  if (agentId) cfg.agentId = agentId;
  return {
    [`GET ${NEVERMINED_NEWS_ROUTE_PATH}`]: cfg,
  };
}

/**
 * Express paymentMiddleware for the news pilot, with settle logging.
 * @param {import('@nevermined-io/payments').Payments} [payments]
 * @returns {import('express').RequestHandler}
 */
export function createNeverminedNewsPaymentMiddleware(payments) {
  const client = payments || getNeverminedPayments();
  return paymentMiddleware(client, buildNeverminedNewsRouteConfig(), {
    onAfterSettle: (req, creditsUsed, settlement) => {
      const tx =
        settlement && typeof settlement === "object"
          ? /** @type {{ txHash?: string }} */ (settlement).txHash
          : undefined;
      console.log(
        `[nevermined] settled path=${req.path} credits=${creditsUsed}` +
          (tx ? ` tx=${String(tx).slice(0, 88)}` : "") +
          ` newsUsdRef=${X402_API_PRICE_NEWS_USD}`,
      );
    },
    onPaymentError: (error, _req, res) => {
      const msg = error?.message || String(error ?? "Payment required");
      if (!res.headersSent) {
        res.status(402).json({
          error: msg,
          facilitator: "nevermined",
          path: NEVERMINED_NEWS_PUBLIC_PATH,
          hint: "Obtain an x402 access token from Nevermined and retry with payment-signature header.",
          docs: "https://docs.syraa.fun",
          quickstart: "docs/NEVERMINED_X402_QUICKSTART.md",
        });
      }
    },
  });
}
