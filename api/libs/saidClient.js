/**
 * SAID Protocol adapter — on-chain identity registration, verification, and HTTP reads.
 * @see https://www.saidprotocol.com/docs
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { sendAndConfirmSolanaTransaction } from "./solanaConfirm.js";
import { SYRA_AGENT_DESCRIPTION, SYRA_TAGLINE_SHORT } from "../config/syraBranding.js";

const DEFAULT_SAID_API = "https://api.saidprotocol.com";
/** Public mainnet RPC — Alchemy HTTP tiers often lack signatureSubscribe for sendAndConfirmTransaction. */
const DEFAULT_SAID_RPC = "https://api.mainnet-beta.solana.com";
export const MIN_SOL_FOR_SAID_VERIFY = 0.012;

/** Default AgentCard description — override with SYRA_SAID_DESCRIPTION in env. */
const DEFAULT_SAID_DESCRIPTION = SYRA_AGENT_DESCRIPTION;

const SAID_PROGRAM_ID = new PublicKey("5dpw6KEQPn248pnkkaYyWfHwu2nfb3LUMbTucb6LaA8G");
const SAID_TREASURY_PDA = new PublicKey("2XfHTeNWTjNwUmgoXaafYuqHcAAXj8F5Kjw2Bnzi4FxH");
const UPDATE_AGENT_DISCRIMINATOR = Buffer.from([0x55, 0x02, 0xb2, 0x09, 0x77, 0x8b, 0x66, 0xa4]);
/** said-sdk REGISTER_AGENT / GET_VERIFIED discriminators (Anchor sighash). */
const REGISTER_AGENT_DISCRIMINATOR = Buffer.from([135, 157, 66, 195, 2, 113, 175, 30]);
const GET_VERIFIED_DISCRIMINATOR = Buffer.from([132, 231, 2, 30, 115, 74, 23, 26]);
const LEGACY_SAID_ACCOUNT_SIZE = 263;
const SAID_STATUS_RETRY_MS = 800;
const SAID_STATUS_RETRIES = 4;

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isAlreadyInitializedError(err) {
  const msg = err instanceof Error ? err.message : String(err || "");
  return /already in use|already.?initialized|custom program error:\s*0x0\b|AccountAlreadyInitialized/i.test(
    msg,
  );
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isAlreadyVerifiedError(err) {
  const msg = err instanceof Error ? err.message : String(err || "");
  return /already.?verified|AlreadyVerified/i.test(msg);
}

/**
 * @returns {string}
 */
export function getSaidBaseUrl() {
  return (process.env.SAID_API_BASE_URL || DEFAULT_SAID_API).replace(/\/$/, "");
}

/**
 * @returns {string | null}
 */
export function getSyraSaidWallet() {
  const wallet = process.env.SAID_AGENT_WALLET?.trim();
  return wallet || null;
}

/**
 * @returns {boolean}
 */
export function hasSaidConfigured() {
  return !!getSyraSaidWallet();
}

/**
 * @returns {Keypair}
 */
export function getSaidSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      /* fall through */
    }
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  throw new Error(
    "Missing signer: set SOLANA_PRIVATE_KEY, PAYER_KEYPAIR, or AGENT_PRIVATE_KEY in env"
  );
}

/**
 * RPC for SAID on-chain writes (register/verify). Prefer SAID_RPC_URL; avoid Alchemy-only
 * endpoints that reject signatureSubscribe during sendAndConfirmTransaction.
 * @returns {string}
 */
export function getSaidRpcUrl() {
  const explicit = process.env.SAID_RPC_URL?.trim();
  if (explicit) return explicit;

  const configured =
    process.env.SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
    process.env.SOLANA_RPC_READ_ONLY_URL;

  if (configured && /alchemy\.com|quiknode\.pro/i.test(configured)) {
    return DEFAULT_SAID_RPC;
  }

  return configured || DEFAULT_SAID_RPC;
}

/**
 * Parse SAID AgentIdentity account bytes.
 * Supports legacy 263-byte layout (uri @40) and current layout (authority @40, uri @72).
 *
 * @param {string} pubkey
 * @param {Buffer | Uint8Array} data
 * @returns {{ pubkey: string; owner: string; metadataUri: string; isVerified: boolean; registeredAt?: number; verifiedAt?: number; authority?: string } | null}
 */
export function parseSaidAgentAccountData(pubkey, data) {
  if (!data || data.length < 77) return null;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  const owner = new PublicKey(buf.subarray(8, 40)).toBase58();

  /** @type {{ uriLengthOffset: number; uriOffset: number; hasAuthority: boolean } | null} */
  let layout = null;
  /** @type {string | undefined} */
  let authority;

  if (buf.length === LEGACY_SAID_ACCOUNT_SIZE) {
    layout = { uriLengthOffset: 40, uriOffset: 44, hasAuthority: false };
  } else {
    const uriLengthAt72 = buf.readUInt32LE(72);
    if (uriLengthAt72 > 0 && uriLengthAt72 <= 200 && 76 + uriLengthAt72 + 9 <= buf.length) {
      layout = { uriLengthOffset: 72, uriOffset: 76, hasAuthority: true };
      authority = new PublicKey(buf.subarray(40, 72)).toBase58();
    } else {
      // Fallback: some intermediate sizes still use uri @40 (no authority field).
      const uriLengthAt40 = buf.readUInt32LE(40);
      if (uriLengthAt40 > 0 && uriLengthAt40 <= 200 && 44 + uriLengthAt40 + 9 <= buf.length) {
        layout = { uriLengthOffset: 40, uriOffset: 44, hasAuthority: false };
      }
    }
  }

  if (!layout) return null;

  const uriLength = buf.readUInt32LE(layout.uriLengthOffset);
  if (uriLength <= 0 || uriLength > 200) return null;
  const metadataUri = buf.subarray(layout.uriOffset, layout.uriOffset + uriLength).toString("utf8");
  const after = buf.subarray(layout.uriOffset + uriLength);

  if (after.length < 9) {
    return { pubkey, owner, metadataUri, isVerified: false, ...(authority ? { authority } : {}) };
  }

  const registeredAt = Number(after.readBigInt64LE(0));
  const isVerified = after[8] === 1;

  /** @type {number | undefined} */
  let verifiedAt;
  if (after.length >= 18 && (after[9] === 0 || after[9] === 1)) {
    // Current Anchor Option<i64>: tag @9, value @10 when Some.
    if (after[9] === 1) {
      verifiedAt = Number(after.readBigInt64LE(10));
    }
  } else if (after.length >= 17) {
    // Legacy fixed i64 immediately after is_verified.
    verifiedAt = Number(after.readBigInt64LE(9));
  }

  return {
    pubkey,
    owner,
    metadataUri,
    registeredAt: Number.isFinite(registeredAt) ? registeredAt : undefined,
    isVerified,
    verifiedAt: verifiedAt != null && Number.isFinite(verifiedAt) ? verifiedAt : undefined,
    ...(authority ? { authority } : {}),
  };
}

/**
 * @param {string} wallet
 * @returns {Promise<ReturnType<typeof parseSaidAgentAccountData>>}
 */
export async function lookupOnChainAgent(wallet) {
  const { SAID } = await import("said-sdk");
  const { Connection, PublicKey } = await import("@solana/web3.js");
  const ownerKey = new PublicKey(wallet);
  const [agentPDA] = SAID.deriveAgentPDA(ownerKey);
  const connection = new Connection(getSaidRpcUrl(), "confirmed");
  const info = await connection.getAccountInfo(agentPDA);
  if (!info?.data?.length) return null;
  return parseSaidAgentAccountData(agentPDA.toBase58(), info.data);
}

/**
 * SAID expects a handle (e.g. "@syra_agent"), not a full URL — their UI prefixes twitter.com/.
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function normalizeSaidTwitterHandle(raw) {
  const fallback = "@syra_agent";
  if (!raw || typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const fromUrl = trimmed.match(/(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})/i);
  if (fromUrl?.[1]) return `@${fromUrl[1].replace(/^@/, "")}`;

  const handle = trimmed.replace(/^@/, "").trim();
  if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) return `@${handle}`;

  return fallback;
}

/**
 * @param {string} wallet
 * @returns {import('said-sdk').AgentCard}
 */
export function buildSyraAgentCard(wallet) {
  const image =
    process.env.SYRA_AGENT_IMAGE_URI?.trim() ||
    "https://syraa.fun/images/logo.jpg";

  const rawTwitter = process.env.SYRA_COLLECTION_X_URL?.trim() || "@syra_agent";
  const twitter = normalizeSaidTwitterHandle(rawTwitter);

  return {
    name: process.env.SYRA_SAID_NAME?.trim() || "Syra",
    description: process.env.SYRA_SAID_DESCRIPTION?.trim() || DEFAULT_SAID_DESCRIPTION,
    twitter,
    website: process.env.SYRA_COLLECTION_EXTERNAL_URL?.trim() || "https://syraa.fun",
    wallet,
    capabilities: ["x402", "mcp", "agent-wallets", "treasury", "micropayments"],
    skills: [
      "natural_language_processing/text_classification/sentiment_analysis",
      "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
      "natural_language_processing/analytical_reasoning/problem_solving",
      "tool_interaction/tool_use_planning",
    ],
    serviceTypes: ["MCP", "A2A"],
    mcpEndpoint: "https://api.syraa.fun",
    a2aEndpoint: "https://api.syraa.fun",
    image,
    created: new Date().toISOString(),
  };
}

/**
 * AgentCard for an Earn pump.fun token (registered under the token's earn wallet).
 *
 * @param {{
 *   wallet: string;
 *   name: string;
 *   symbol: string;
 *   description?: string | null;
 *   image?: string | null;
 *   mint: string;
 * }} input
 * @returns {import('said-sdk').AgentCard}
 */
export function buildTokenAgentCard(input) {
  const wallet = String(input.wallet || "").trim();
  const name = String(input.name || "").trim() || "Syra Token";
  const symbol = String(input.symbol || "").trim().toUpperCase();
  const mint = String(input.mint || "").trim();
  const description =
    (typeof input.description === "string" && input.description.trim()) ||
    `${name}${symbol ? ` ($${symbol})` : ""}: community token launched on Syra Earn / pump.fun.`;
  const image =
    (typeof input.image === "string" && input.image.trim()) ||
    process.env.SYRA_AGENT_IMAGE_URI?.trim() ||
    "https://syraa.fun/images/logo.jpg";
  const website = mint
    ? `https://syraa.fun/earn/token/${encodeURIComponent(mint)}`
    : process.env.SYRA_COLLECTION_EXTERNAL_URL?.trim() || "https://syraa.fun";
  const rawTwitter = process.env.SYRA_COLLECTION_X_URL?.trim() || "@syra_agent";
  const twitter = normalizeSaidTwitterHandle(rawTwitter);

  return {
    name,
    description,
    twitter,
    website,
    wallet,
    capabilities: ["x402", "token", "pumpfun", "earn"],
    skills: [
      "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
      "tool_interaction/tool_use_planning",
    ],
    serviceTypes: ["A2A"],
    mcpEndpoint: "https://api.syraa.fun",
    a2aEndpoint: "https://api.syraa.fun",
    image,
    created: new Date().toISOString(),
  };
}

/**
 * @param {Record<string, unknown>} card
 * @returns {Promise<string>}
 */
export async function uploadAgentCardMetadata(card) {
  const pinataJwt = process.env.PINATA_JWT?.trim();
  if (!pinataJwt) {
    throw new Error("Missing PINATA_JWT in env (required to host SAID AgentCard metadata)");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: card,
      pinataMetadata: { name: `said-agent-${card.name || "syra"}` },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Pinata upload failed (${response.status}): ${text || response.statusText}`);
  }

  const payload = await response.json();
  const cid = typeof payload.IpfsHash === "string" ? payload.IpfsHash.trim() : "";
  if (!cid) {
    throw new Error("Pinata upload did not return IpfsHash");
  }

  // Prefer ipfs:// for on-chain URI (≤200 chars; SAID program validates length/prefix).
  return `ipfs://${cid}`;
}

/**
 * @param {PublicKey} agentPDA
 * @param {PublicKey} owner
 * @param {string} metadataUri
 */
function buildRegisterAgentInstruction(agentPDA, owner, metadataUri) {
  const uriBytes = Buffer.from(metadataUri, "utf8");
  if (uriBytes.length < 10 || uriBytes.length > 200) {
    throw new Error(`SAID metadata URI length invalid (${uriBytes.length}); need 10-200 chars`);
  }
  const uriLengthBuffer = Buffer.alloc(4);
  uriLengthBuffer.writeUInt32LE(uriBytes.length, 0);
  const data = Buffer.concat([REGISTER_AGENT_DISCRIMINATOR, uriLengthBuffer, uriBytes]);

  return new TransactionInstruction({
    keys: [
      { pubkey: agentPDA, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: SAID_PROGRAM_ID,
    data,
  });
}

/**
 * @param {PublicKey} agentPDA
 * @param {PublicKey} authority
 */
function buildVerifyAgentInstruction(agentPDA, authority) {
  return new TransactionInstruction({
    keys: [
      { pubkey: agentPDA, isSigner: false, isWritable: true },
      { pubkey: SAID_TREASURY_PDA, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: SAID_PROGRAM_ID,
    data: GET_VERIFIED_DISCRIMINATOR,
  });
}

/**
 * @param {PublicKey} agentPDA
 * @param {PublicKey} authority
 * @param {string} metadataUri
 */
function buildUpdateAgentInstruction(agentPDA, authority, metadataUri) {
  const uriBytes = Buffer.from(metadataUri, "utf8");
  const uriLengthBuffer = Buffer.alloc(4);
  uriLengthBuffer.writeUInt32LE(uriBytes.length, 0);
  const data = Buffer.concat([UPDATE_AGENT_DISCRIMINATOR, uriLengthBuffer, uriBytes]);

  return new TransactionInstruction({
    keys: [
      { pubkey: agentPDA, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId: SAID_PROGRAM_ID,
    data,
  });
}

/**
 * Re-read on-chain + HTTP verification with short retries (RPC lag after confirm).
 * @param {string} wallet
 * @returns {Promise<{ verified: boolean; onChain: ReturnType<typeof parseSaidAgentAccountData> }>}
 */
async function resolveSaidVerifiedStatus(wallet) {
  let onChain = null;
  for (let i = 0; i < SAID_STATUS_RETRIES; i += 1) {
    onChain = await lookupOnChainAgent(wallet);
    if (onChain?.isVerified) {
      return { verified: true, onChain };
    }
    if (i < SAID_STATUS_RETRIES - 1) {
      await sleep(SAID_STATUS_RETRY_MS);
    }
  }

  let httpVerified = false;
  try {
    httpVerified = await checkVerified(wallet);
  } catch {
    httpVerified = false;
  }

  return {
    verified: httpVerified === true || onChain?.isVerified === true,
    onChain,
  };
}

/**
 * Pin fresh AgentCard JSON and update on-chain metadata URI (SAID update_agent).
 *
 * @param {{ signerKeypair?: Keypair; wallet?: string }} [input]
 * @returns {Promise<{ wallet: string; metadataUri: string; txSignature: string }>}
 */
export async function updateSyraSaidOnChainMetadata(input = {}) {
  const signer = input.signerKeypair || getSaidSigner();
  const wallet = input.wallet?.trim() || signer.publicKey.toBase58();
  const card = buildSyraAgentCard(wallet);
  const metadataUri = await uploadAgentCardMetadata(card);

  const { SAID } = await import("said-sdk");
  const [agentPDA] = SAID.deriveAgentPDA(new PublicKey(wallet));
  const connection = new Connection(getSaidRpcUrl(), "confirmed");
  const tx = new Transaction().add(buildUpdateAgentInstruction(agentPDA, signer.publicKey, metadataUri));
  const txSignature = await sendAndConfirmSolanaTransaction(connection, tx, [signer], {
    commitment: "confirmed",
  });

  return { wallet, metadataUri, txSignature };
}

/**
 * Full metadata refresh: new IPFS AgentCard + on-chain URI update + directory sync attempt.
 *
 * @param {{ signerKeypair?: Keypair; wallet?: string }} [input]
 */
export async function refreshSyraSaidMetadata(input = {}) {
  const onChain = await updateSyraSaidOnChainMetadata(input);
  const offChain = await syncSyraSaidMetadata(onChain.wallet);
  return { ...onChain, offChainSuccess: offChain.success, offChainError: offChain.error };
}

/**
 * @param {string} path
 * @param {RequestInit & { fetch?: typeof fetch }} [options]
 * @returns {Promise<{ success: boolean; data?: unknown; error?: string; status?: number }>}
 */
export async function saidApiFetch(path, options = {}) {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const url = `${getSaidBaseUrl()}${path}`;

  try {
    const response = await fetchFn(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && String(data.error)) ||
        (typeof data === "string" ? data : response.statusText);
      return { success: false, error: message, status: response.status, data };
    }

    return { success: true, data, status: response.status };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {string} wallet
 * @param {{ fetch?: typeof fetch }} [options]
 */
export async function getVerification(wallet, options = {}) {
  return saidApiFetch(`/api/verify/${encodeURIComponent(wallet)}`, {
    fetch: options.fetch,
  });
}

/**
 * @param {string} wallet
 * @param {{ fetch?: typeof fetch }} [options]
 */
export async function getTrust(wallet, options = {}) {
  return saidApiFetch(`/api/trust/${encodeURIComponent(wallet)}`, {
    fetch: options.fetch,
  });
}

/**
 * @param {string} wallet
 * @param {{ fetch?: typeof fetch }} [options]
 */
export async function getAgentDetails(wallet, options = {}) {
  return saidApiFetch(`/api/agents/${encodeURIComponent(wallet)}`, {
    fetch: options.fetch,
  });
}

/**
 * @param {string} walletAddress
 * @returns {Promise<number>}
 */
export async function getWalletSolBalance(walletAddress) {
  const connection = new Connection(getSaidRpcUrl(), "confirmed");
  const lamports = await connection.getBalance(new PublicKey(walletAddress));
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * @param {Keypair} signer
 * @returns {Promise<number>}
 */
export async function getSignerSolBalance(signer) {
  return getWalletSolBalance(signer.publicKey.toBase58());
}

/**
 * @param {string} wallet
 * @param {{ fetch?: typeof fetch }} [options]
 * @returns {Promise<boolean>}
 */
export async function checkVerified(wallet, options = {}) {
  try {
    const onChain = await lookupOnChainAgent(wallet);
    if (onChain?.isVerified) return true;
  } catch (err) {
    console.warn("[saidClient] on-chain lookup failed:", err?.message || err);
  }

  // said-sdk lookup requires legacy 263-byte accounts; skip when it returns false/null.
  try {
    const { isVerified } = await import("said-sdk");
    const verified = await isVerified(wallet);
    if (verified) return true;
  } catch {
    /* fall through to HTTP */
  }

  const result = await getVerification(wallet, options);
  if (!result.success || !result.data || typeof result.data !== "object") {
    return false;
  }
  return result.data.verified === true;
}

/**
 * @param {string} wallet
 * @returns {Promise<boolean>}
 */
export async function isRegisteredOnChain(wallet) {
  const agent = await lookupOnChainAgent(wallet);
  return agent !== null;
}

/**
 * Host / refresh Syra AgentCard on SAID (POST /api/cards).
 * SAID expects twitter as a handle (e.g. "@syra_agent"), not a full x.com URL.
 *
 * @param {{ wallet: string; name: string; description: string; twitter?: string; website?: string; capabilities?: string[] }} input
 */
export async function registerOffChain(input) {
  return saidApiFetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet: input.wallet,
      name: input.name,
      description: input.description,
      twitter: input.twitter ? normalizeSaidTwitterHandle(input.twitter) : undefined,
      website: input.website,
      capabilities: input.capabilities || ["x402", "mcp"],
    }),
  });
}

/**
 * Push latest Syra branding to SAID off-chain directory (updates saidprotocol.com profile text).
 * On-chain IPFS metadata URI is unchanged until a program update is supported.
 *
 * @param {string} [wallet]
 * @returns {Promise<{ success: boolean; data?: unknown; error?: string }>}
 */
export async function syncSyraSaidMetadata(wallet) {
  const targetWallet = wallet?.trim() || getSyraSaidWallet() || getSaidSigner().publicKey.toBase58();
  const card = buildSyraAgentCard(targetWallet);
  return registerOffChain({
    wallet: targetWallet,
    name: card.name,
    description: card.description || SYRA_TAGLINE_SHORT,
    twitter: card.twitter,
    website: card.website,
    capabilities: card.capabilities,
  });
}

/**
 * Register + verify any AgentCard on SAID (idempotent).
 *
 * Supports legacy in-process Keypair signing, or a custody callback
 * (`wallet` + `signAndSendTransaction`) for Privy / WalletBroker.
 *
 * @param {{
 *   signerKeypair?: Keypair;
 *   wallet?: string;
 *   signAndSendTransaction?: (args: {
 *     serializedTxBase64: string;
 *     lastValidBlockHeight: number;
 *   }) => Promise<string>;
 *   card: import('said-sdk').AgentCard;
 *   skipOffChain?: boolean;
 *   offChainCard?: {
 *     name: string;
 *     description: string;
 *     twitter?: string;
 *     website?: string;
 *     capabilities?: string[];
 *   };
 * }} input
 * @returns {Promise<{
 *   wallet: string;
 *   agentPDA?: string;
 *   metadataUri?: string;
 *   registerSignature?: string | null;
 *   verifySignature?: string | null;
 *   verified: boolean;
 *   alreadyRegistered: boolean;
 *   alreadyVerified: boolean;
 * }>}
 */
export async function registerAndVerifyAgentCard(input) {
  const signer = input.signerKeypair || null;
  const signAndSend =
    typeof input.signAndSendTransaction === "function" ? input.signAndSendTransaction : null;

  /** @type {PublicKey} */
  let feePayer;
  /** @type {string} */
  let wallet;
  if (signer) {
    feePayer = signer.publicKey;
    wallet = feePayer.toBase58();
  } else if (signAndSend && input.wallet) {
    wallet = String(input.wallet).trim();
    if (!wallet) throw new Error("wallet is required when using signAndSendTransaction");
    feePayer = new PublicKey(wallet);
  } else {
    throw new Error("signerKeypair is required (or wallet + signAndSendTransaction)");
  }

  const card = { ...input.card, wallet };

  const { SAID } = await import("said-sdk");
  const [agentPdaKey] = SAID.deriveAgentPDA(new PublicKey(wallet));
  const connection = new Connection(getSaidRpcUrl(), "confirmed");

  /**
   * @param {Transaction} tx
   * @returns {Promise<string>}
   */
  async function submitTx(tx) {
    if (signer) {
      return sendAndConfirmSolanaTransaction(connection, tx, [signer], {
        commitment: "confirmed",
      });
    }
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = feePayer;
    const serializedTxBase64 = Buffer.from(
      tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
    ).toString("base64");
    const signature = await signAndSend({ serializedTxBase64, lastValidBlockHeight });
    if (!signature || typeof signature !== "string") {
      throw new Error("signAndSendTransaction returned no signature");
    }
    return signature;
  }

  let existing = await lookupOnChainAgent(wallet);
  let registerSignature = null;
  let agentPDA = existing?.pubkey || agentPdaKey.toBase58();
  let metadataUri = existing?.metadataUri;
  let alreadyRegistered = !!existing;

  if (!existing) {
    metadataUri = await uploadAgentCardMetadata(card);
    const registerIx = buildRegisterAgentInstruction(agentPdaKey, feePayer, metadataUri);
    const registerTx = new Transaction().add(registerIx);
    try {
      registerSignature = await submitTx(registerTx);
      agentPDA = agentPdaKey.toBase58();
    } catch (err) {
      if (!isAlreadyInitializedError(err)) throw err;
      alreadyRegistered = true;
      existing = await lookupOnChainAgent(wallet);
      agentPDA = existing?.pubkey || agentPdaKey.toBase58();
      metadataUri = existing?.metadataUri || metadataUri;
    }
  }

  let verifySignature = null;
  const wasVerified = existing?.isVerified === true;
  if (!wasVerified) {
    const verifyIx = buildVerifyAgentInstruction(agentPdaKey, feePayer);
    const verifyTx = new Transaction().add(verifyIx);
    try {
      verifySignature = await submitTx(verifyTx);
    } catch (err) {
      if (!isAlreadyVerifiedError(err)) {
        // Re-check: verify may have landed despite confirm noise, or already verified on-chain.
        const status = await resolveSaidVerifiedStatus(wallet);
        if (!status.verified) throw err;
      }
    }
  }

  if (!input.skipOffChain) {
    const off = input.offChainCard || {
      name: card.name,
      description: card.description || SYRA_TAGLINE_SHORT,
      twitter: card.twitter,
      website: card.website,
      capabilities: card.capabilities,
    };
    const offChain = await registerOffChain({
      wallet,
      name: off.name,
      description: off.description,
      twitter: off.twitter,
      website: off.website,
      capabilities: off.capabilities,
    });
    if (!offChain.success) {
      console.warn("[saidClient] off-chain directory sync failed:", offChain.error);
    }
  }

  const status = await resolveSaidVerifiedStatus(wallet);
  const onChainFinal = status.onChain;

  return {
    wallet,
    agentPDA: agentPDA || onChainFinal?.pubkey || agentPdaKey.toBase58(),
    metadataUri: metadataUri || onChainFinal?.metadataUri,
    registerSignature,
    verifySignature,
    verified: status.verified === true || wasVerified,
    alreadyRegistered,
    alreadyVerified: wasVerified,
  };
}

/**
 * Register Syra on SAID on-chain and obtain the verification badge.
 * Idempotent: skips register/verify when already present.
 *
 * @param {{ signerKeypair?: Keypair; skipOffChain?: boolean }} [input]
 * @returns {Promise<{
 *   wallet: string;
 *   agentPDA?: string;
 *   metadataUri?: string;
 *   registerSignature?: string | null;
 *   verifySignature?: string | null;
 *   verified: boolean;
 *   alreadyRegistered: boolean;
 *   alreadyVerified: boolean;
 * }>}
 */
export async function registerAndVerifySyra(input = {}) {
  const signer = input.signerKeypair || getSaidSigner();
  const wallet = signer.publicKey.toBase58();
  const card = buildSyraAgentCard(wallet);
  return registerAndVerifyAgentCard({
    signerKeypair: signer,
    card,
    skipOffChain: input.skipOffChain,
    offChainCard: {
      name: card.name,
      description: card.description || SYRA_TAGLINE_SHORT,
      twitter: card.twitter,
      website: card.website,
      capabilities: card.capabilities,
    },
  });
}
