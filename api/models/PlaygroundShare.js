/**
 * Playground shared request: stores request config (method, url, params, headers, body)
 * so users can share a link; same request content produces the same slug (content-addressable).
 */
import mongoose from 'mongoose';

const requestParamSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    description: { type: String },
  },
  { _id: false }
);

const requestHeaderSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const playgroundShareSchema = new mongoose.Schema(
  {
    /** Content-based slug (e.g. first 12 chars of sha256). Same request => same slug. */
    slug: { type: String, required: true, unique: true },
    method: { type: String, required: true, uppercase: true },
    url: { type: String, required: true },
    params: { type: [requestParamSchema], default: [] },
    headers: { type: [requestHeaderSchema], default: [] },
    body: { type: String, default: '' },
    /** Optional: wallet address of the user who shared (Solana or Base). */
    sharedByWallet: { type: String, default: null },
    /** Optional: chain used when sharing ('solana' or 'base'). */
    sharedByChain: { type: String, enum: ['solana', 'base'], default: null },
    /** Optional: email or identifier if user shared via email login. */
    sharedByEmail: { type: String, default: null },
  },
  { timestamps: true }
);

playgroundShareSchema.index({ slug: 1 }, { unique: true });

const PlaygroundShare = mongoose.model('PlaygroundShare', playgroundShareSchema);
export default PlaygroundShare;
