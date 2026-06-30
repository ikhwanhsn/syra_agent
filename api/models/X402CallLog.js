/**
 * Per-call x402 telemetry (success + failure) for inbound merchant and outbound agent flows.
 * Used for internal analytics: errors, most-used endpoints, network/facilitator reliability, USD volume.
 * TTL index auto-deletes documents after 90 days.
 */
import mongoose from 'mongoose';
import { ttlExpireSeconds } from '../utils/mongoTtl.js';

const OUTCOMES = [
  'paid',
  'payment_required',
  'verify_failed',
  'settle_failed',
  'upstream_error',
  'budget_exceeded',
  'error',
];

const DIRECTIONS = ['inbound', 'outbound'];

const FACILITATORS = ['payai', 'corbits', 'b402', 'algorand', 'local', 'upstream'];

const x402CallLogSchema = new mongoose.Schema(
  {
    /** inbound = Syra-as-merchant; outbound = agent paying upstream. */
    direction: { type: String, enum: DIRECTIONS, required: true, index: true },
    /** Normalized API path (e.g. /news, /signal). */
    path: { type: String, required: true, index: true },
    /** Host for outbound upstream calls (e.g. api.syraa.fun). */
    host: { type: String, default: null },
    /** HTTP method. */
    method: { type: String, default: 'GET' },
    /** Call outcome taxonomy. */
    outcome: { type: String, enum: OUTCOMES, required: true, index: true },
    /** HTTP status code when applicable. */
    httpStatus: { type: Number, default: null },
    /** CAIP-2 network (e.g. solana:..., eip155:8453). */
    network: { type: String, default: null, index: true },
    /** Facilitator profile used for payment. */
    facilitator: { type: String, enum: FACILITATORS, default: null },
    /** Price in USD when known. */
    amountUsd: { type: Number, default: 0 },
    /** Amount in micro USDC when known. */
    amountMicroUsdc: { type: String, default: null },
    /** Payer wallet address (inbound). */
    payer: { type: String, default: null },
    /** Agent anonymousId (outbound). */
    agentId: { type: String, default: null },
    /** Source channel: api | agent. */
    source: { type: String, default: 'api' },
    /** End-to-end latency in milliseconds. */
    latencyMs: { type: Number, default: 0 },
    /** Retry count for outbound calls. */
    retries: { type: Number, default: 0 },
    /** Sanitized error reason (truncated). */
    errorReason: { type: String, default: null },
    /** On-chain tx signature when settled. */
    txSignature: { type: String, default: null },
  },
  { timestamps: true }
);

x402CallLogSchema.index({ path: 1, createdAt: -1 });
x402CallLogSchema.index({ outcome: 1, createdAt: -1 });
x402CallLogSchema.index({ network: 1, createdAt: -1 });
x402CallLogSchema.index({ direction: 1, createdAt: -1 });
x402CallLogSchema.index({ facilitator: 1, createdAt: -1 });
// TTL: delete after N days (default 30; was 90)
x402CallLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds('X402_CALL_LOG_TTL_DAYS', 30) },
);

const X402CallLog = mongoose.model('X402CallLog', x402CallLogSchema);
export default X402CallLog;
