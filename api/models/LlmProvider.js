import mongoose from 'mongoose';

export const LLM_PROVIDER_STATUSES = Object.freeze([
  'draft',
  'active',
  'paused',
  'delisted',
]);

export const LLM_PRICING_MODES = Object.freeze(['per_million_tokens', 'flat']);

/** Wire protocol used to call the seller upstream. */
export const LLM_PROTOCOLS = Object.freeze([
  'openai',
  'anthropic',
  'google',
  'openai_custom',
]);

const modelEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    displayName: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const authConfigSchema = new mongoose.Schema(
  {
    /** Relative chat path for openai_custom (e.g. /v1/chat/completions). */
    chatPath: { type: String, default: '', trim: true },
    /** Auth header name (default Authorization for openai, x-api-key for anthropic). */
    authHeader: { type: String, default: '', trim: true },
    /** bearer | raw */
    authScheme: { type: String, default: '', trim: true },
    /** Anthropic API version or other vendor version string. */
    apiVersion: { type: String, default: '', trim: true },
    /** Extra static headers (keys lowercased on write). */
    extraHeaders: { type: Map, of: String, default: undefined },
  },
  { _id: false },
);

const pricingSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: LLM_PRICING_MODES,
      default: 'per_million_tokens',
    },
    /** USD per 1M input tokens (when mode=per_million_tokens). */
    inputUsdPer1M: { type: Number, default: 0, min: 0 },
    /** USD per 1M output tokens (when mode=per_million_tokens). */
    outputUsdPer1M: { type: Number, default: 0, min: 0 },
    /** Flat USD per successful call (when mode=flat). */
    flatUsdPerCall: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const capabilitiesSchema = new mongoose.Schema(
  {
    contextWindow: { type: Number, default: 8192, min: 1 },
    streaming: { type: Boolean, default: false },
    tools: { type: Boolean, default: false },
    modalities: { type: [String], default: () => ['text'] },
  },
  { _id: false },
);

const healthSchema = new mongoose.Schema(
  {
    successCount: { type: Number, default: 0, min: 0 },
    failureCount: { type: Number, default: 0, min: 0 },
    successRate: { type: Number, default: 1, min: 0, max: 1 },
    p50LatencyMs: { type: Number, default: null },
    p95LatencyMs: { type: Number, default: null },
    recentLatenciesMs: { type: [Number], default: () => [] },
    consecutiveFailures: { type: Number, default: 0, min: 0 },
    lastProbeAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    /** 0–1 score used by the smart router (successRate × recency decay). */
    callabilityScore: { type: Number, default: 1, min: 0, max: 1 },
  },
  { _id: false },
);

const llmProviderSchema = new mongoose.Schema(
  {
    creatorAnonymousId: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /**
     * Upstream base URL (e.g. https://api.deepseek.com/v1, https://api.anthropic.com).
     * Optional for anthropic/google when using protocol defaults.
     */
    baseUrl: { type: String, required: true, trim: true },
    /**
     * Wire protocol for upstream calls.
     * openai covers DeepSeek, Together, Groq, Mistral, vLLM, Ollama, OpenRouter.
     */
    protocol: {
      type: String,
      enum: LLM_PROTOCOLS,
      default: 'openai',
      index: true,
    },
    /** Protocol overrides (openai_custom path/auth, anthropic-version, etc.). */
    authConfig: { type: authConfigSchema, default: () => ({}) },
    /** Encrypted API key (never return plaintext over API). */
    apiKeyEnc: { type: String, default: null },
    models: { type: [modelEntrySchema], default: () => [] },
    pricing: { type: pricingSchema, default: () => ({}) },
    capabilities: { type: capabilitiesSchema, default: () => ({}) },
    payoutWallet: { type: String, default: null, index: true },
    payToChain: { type: String, enum: ['solana'], default: 'solana' },
    status: {
      type: String,
      enum: LLM_PROVIDER_STATUSES,
      default: 'draft',
      index: true,
    },
    /** Syra-seeded OpenRouter fallback; never returns seller API key. */
    isSystemFallback: { type: Boolean, default: false, index: true },
    /** Featured placement for staked / high-tier sellers. */
    featured: { type: Boolean, default: false, index: true },
    health: { type: healthSchema, default: () => ({}) },
    useCount: { type: Number, default: 0, min: 0 },
    totalRevenueUsd: { type: Number, default: 0, min: 0 },
    totalSellerEarnedUsd: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: 'llm_providers' },
);

llmProviderSchema.index({ status: 1, 'health.callabilityScore': -1, useCount: -1 });
llmProviderSchema.index({ creatorAnonymousId: 1, updatedAt: -1 });
llmProviderSchema.index({ status: 1, featured: -1, 'pricing.inputUsdPer1M': 1 });
llmProviderSchema.index({ 'models.id': 1, status: 1 });
llmProviderSchema.index({ protocol: 1, status: 1 });

const LlmProvider =
  mongoose.models.LlmProvider || mongoose.model('LlmProvider', llmProviderSchema);

export default LlmProvider;
