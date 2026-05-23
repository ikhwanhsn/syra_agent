/**
 * Meteora DLMM on-chain transaction builder (no signing — position keypair partial-sign only).
 * Uses @meteora-ag/dlmm via CJS require for Node ESM compatibility.
 */
import { createRequire } from "node:module";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import BN from "bn.js";
import bs58 from "bs58";
import {
  decryptAgentSecretFromStorage,
  encryptAgentSecretForStorage,
} from "./agentWalletSecretCrypto.js";

const require = createRequire(import.meta.url);
const DLMM = require("@meteora-ag/dlmm");

const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Meteora DLMM legacy `Position` accounts encode at most 70 bins
 * (`maxBinId - minBinId + 1 ≤ 70`). Exceeding this triggers the on-chain
 * program's Anchor error 6040 `invalidPositionWidth` and the pre-flight
 * simulation refuses to sign, surfacing as `Custom:6040` to the operator.
 *
 * We hard-clamp here so simulation strategies (designed without this cap)
 * cannot ship invalid position widths to the broker.
 */
export const MAX_METEORA_POSITION_BINS = 70;

let connectionSingleton = null;

function getConnection() {
  if (!connectionSingleton) {
    const url =
      process.env.SOLANA_RPC_BLOCKCHAIN_URL ||
      process.env.SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";
    connectionSingleton = new Connection(url, "confirmed");
  }
  return connectionSingleton;
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Clamp a (binsBelow, binsAbove) pair so the resulting position width fits
 * Meteora's legacy `Position` limit while preserving the directional skew.
 *
 * Width formula: `binsBelow + binsAbove + 1` (active bin included).
 * Returns the (possibly scaled) values plus a `clamped` flag for telemetry.
 *
 * @param {number} binsBelow
 * @param {number} binsAbove
 * @param {number} [maxWidth=MAX_METEORA_POSITION_BINS]
 * @returns {{ binsBelow: number, binsAbove: number, clamped: boolean }}
 */
export function clampPositionBinRange(binsBelow, binsAbove, maxWidth = MAX_METEORA_POSITION_BINS) {
  const rawBelow = Math.max(0, Math.floor(toNum(binsBelow, 0)));
  const rawAbove = Math.max(0, Math.floor(toNum(binsAbove, 0)));
  const maxSides = Math.max(0, maxWidth - 1);
  const total = rawBelow + rawAbove;

  if (total <= maxSides) {
    return { binsBelow: rawBelow, binsAbove: rawAbove, clamped: false };
  }

  if (total === 0) {
    return { binsBelow: 0, binsAbove: 0, clamped: false };
  }

  let scaledBelow = Math.floor((rawBelow * maxSides) / total);
  let scaledAbove = Math.floor((rawAbove * maxSides) / total);
  let slack = maxSides - (scaledBelow + scaledAbove);

  while (slack > 0) {
    if (rawBelow >= rawAbove) {
      scaledBelow += 1;
    } else {
      scaledAbove += 1;
    }
    slack -= 1;
  }

  return { binsBelow: scaledBelow, binsAbove: scaledAbove, clamped: true };
}

/** Map sim lpShape to Meteora StrategyType enum. */
export function mapLpShapeToStrategyType(lpShape) {
  switch (String(lpShape || "spot").toLowerCase()) {
    case "bid_ask":
      return DLMM.StrategyType.BidAsk;
    case "curve":
      return DLMM.StrategyType.Curve;
    case "mixed":
      return DLMM.StrategyType.Spot;
    case "spot":
    default:
      return DLMM.StrategyType.Spot;
  }
}

function isSolMint(mint) {
  if (!mint) return false;
  const m = String(mint);
  return m === WRAPPED_SOL_MINT || m.toLowerCase() === "sol";
}

/**
 * @param {import("@solana/web3.js").PublicKey} tokenXMint
 * @param {import("@solana/web3.js").PublicKey} tokenYMint
 * @param {number} depositSol
 * @param {number} tokenXDecimals
 * @param {number} tokenYDecimals
 */
function computeDepositAmounts(tokenXMint, tokenYMint, depositSol, tokenXDecimals, tokenYDecimals) {
  const lamports = Math.floor(toNum(depositSol) * LAMPORTS_PER_SOL);
  const solIsX = isSolMint(tokenXMint.toBase58());
  const solIsY = isSolMint(tokenYMint.toBase58());

  if (solIsX && !solIsY) {
    return {
      totalXAmount: new BN(lamports),
      totalYAmount: new BN(0),
    };
  }
  if (solIsY && !solIsX) {
    return {
      totalXAmount: new BN(0),
      totalYAmount: new BN(lamports),
    };
  }
  // Fallback: split evenly in lamport-equivalent units (rare non-SOL pools)
  const half = Math.floor(lamports / 2);
  return {
    totalXAmount: new BN(half).mul(new BN(10).pow(new BN(Math.max(0, tokenXDecimals - 9)))),
    totalYAmount: new BN(lamports - half).mul(new BN(10).pow(new BN(Math.max(0, tokenYDecimals - 9)))),
  };
}

/**
 * Normalize SDK tx output to array of legacy Transaction objects.
 * @param {Transaction | Transaction[] | import("@solana/web3.js").Transaction[]} raw
 */
function normalizeTxArray(raw) {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Partial-sign txs with position keypair, serialize first tx as base64 for walletBroker.
 * @param {Transaction[]} txs
 * @param {Keypair} positionKeypair
 * @param {PublicKey} feePayer
 */
async function prepareSerializedTx(txs, positionKeypair, feePayer) {
  if (!txs.length) throw new Error("empty_transaction");
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = txs[0];
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = feePayer;
  tx.partialSign(positionKeypair);
  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  return {
    serializedTxBase64: Buffer.from(serialized).toString("base64"),
    blockhash,
    lastValidBlockHeight,
  };
}

/**
 * @param {object} params
 * @param {string} params.lbPairAddress
 * @param {number} params.binsBelow
 * @param {number} params.binsAbove
 * @param {string} params.lpShape
 * @param {number} params.depositSol
 * @param {string} params.agentPubkey
 * @param {number} [params.slippageBps]
 */
export async function buildOpenPositionTx({
  lbPairAddress,
  binsBelow,
  binsAbove,
  lpShape,
  depositSol,
  agentPubkey,
  slippageBps = 50,
}) {
  const connection = getConnection();
  const lbPair = new PublicKey(lbPairAddress);
  const user = new PublicKey(agentPubkey);
  const dlmmPool = await DLMM.create(connection, lbPair);

  const activeBin = await dlmmPool.getActiveBin();
  const clampedRange = clampPositionBinRange(binsBelow, binsAbove);
  const effectiveBinsBelow = clampedRange.binsBelow;
  const effectiveBinsAbove = clampedRange.binsAbove;
  const minBinId = activeBin.binId - effectiveBinsBelow;
  const maxBinId = activeBin.binId + effectiveBinsAbove;

  const tokenXDecimals = dlmmPool.tokenX?.mint?.decimals ?? 9;
  const tokenYDecimals = dlmmPool.tokenY?.mint?.decimals ?? 9;
  const tokenXMint = dlmmPool.tokenX.publicKey;
  const tokenYMint = dlmmPool.tokenY.publicKey;

  const { totalXAmount, totalYAmount } = computeDepositAmounts(
    tokenXMint,
    tokenYMint,
    depositSol,
    tokenXDecimals,
    tokenYDecimals,
  );

  const positionKeypair = Keypair.generate();
  const slippagePct = Math.max(0.01, toNum(slippageBps, 50) / 100);

  const rawTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: positionKeypair.publicKey,
    user,
    totalXAmount,
    totalYAmount,
    strategy: {
      minBinId,
      maxBinId,
      strategyType: mapLpShapeToStrategyType(lpShape),
    },
    slippage: slippagePct,
  });

  const txs = normalizeTxArray(rawTx);
  const { serializedTxBase64 } = await prepareSerializedTx(txs, positionKeypair, user);

  const positionSecretPlain = bs58.encode(positionKeypair.secretKey);
  const positionSecretEnc = encryptAgentSecretForStorage(positionSecretPlain);

  return {
    serializedTxBase64,
    positionPubkey: positionKeypair.publicKey.toBase58(),
    positionSecretEnc,
    activeBinAtOpen: activeBin.binId,
    baseMint: tokenXMint.toBase58(),
    quoteMint: tokenYMint.toBase58(),
    effectiveBinsBelow,
    effectiveBinsAbove,
    binsClamped: clampedRange.clamped,
  };
}

/**
 * @param {object} params
 * @param {string} params.lbPairAddress
 * @param {string} params.positionPubkey
 * @param {string} params.agentPubkey
 * @param {string} params.positionSecretEnc
 * @param {number} [params.slippageBps]
 */
export async function buildClosePositionTx({
  lbPairAddress,
  positionPubkey,
  agentPubkey,
  positionSecretEnc,
  slippageBps: _slippageBps = 50,
}) {
  const connection = getConnection();
  const user = new PublicKey(agentPubkey);
  const position = new PublicKey(positionPubkey);
  const dlmmPool = await DLMM.create(connection, new PublicKey(lbPairAddress));

  const positionKeypair = keypairFromEncryptedSecret(positionSecretEnc);

  const rawTx = await dlmmPool.closePosition({
    owner: user,
    position,
  });

  const txs = normalizeTxArray(rawTx);
  const { serializedTxBase64 } = await prepareSerializedTx(txs, positionKeypair, user);
  return { serializedTxBase64 };
}

/**
 * @param {object} params
 * @param {string} params.lbPairAddress
 * @param {string} params.positionPubkey
 * @param {string} params.agentPubkey
 * @param {string} params.positionSecretEnc
 */
export async function buildClaimFeesTx({ lbPairAddress, positionPubkey, agentPubkey, positionSecretEnc }) {
  const connection = getConnection();
  const user = new PublicKey(agentPubkey);
  const position = new PublicKey(positionPubkey);
  const dlmmPool = await DLMM.create(connection, new PublicKey(lbPairAddress));
  const positionKeypair = keypairFromEncryptedSecret(positionSecretEnc);

  const positionState = await dlmmPool.getPosition(position);
  const rawTx = await dlmmPool.claimSwapFee({
    owner: user,
    position: positionState,
  });

  const txs = normalizeTxArray(rawTx);
  const { serializedTxBase64 } = await prepareSerializedTx(txs, positionKeypair, user);
  return { serializedTxBase64 };
}

/**
 * @param {string} positionPubkey
 * @param {string} lbPairAddress
 */
export async function fetchOnChainPosition(positionPubkey, lbPairAddress) {
  const connection = getConnection();
  const dlmmPool = await DLMM.create(connection, new PublicKey(lbPairAddress));
  const position = await dlmmPool.getPosition(new PublicKey(positionPubkey));
  const activeBin = await dlmmPool.getActiveBin();

  let unclaimedFeeSol = 0;
  try {
    const feeX = toNum(position?.feeX?.toString?.() ?? position?.feeX, 0);
    const feeY = toNum(position?.feeY?.toString?.() ?? position?.feeY, 0);
    const solIsX = isSolMint(dlmmPool.tokenX.publicKey.toBase58());
    const solIsY = isSolMint(dlmmPool.tokenY.publicKey.toBase58());
    if (solIsX) unclaimedFeeSol += feeX / LAMPORTS_PER_SOL;
    if (solIsY) unclaimedFeeSol += feeY / LAMPORTS_PER_SOL;
  } catch {
  }

  return {
    position,
    activeBinId: activeBin.binId,
    currentPrice: toNum(activeBin.pricePerToken ?? activeBin.price, 0),
    unclaimedFeeSol,
    lbPairAddress,
  };
}

/** @param {string} agentAddress */
export async function getAgentSolBalance(agentAddress) {
  const connection = getConnection();
  const lamports = await connection.getBalance(new PublicKey(agentAddress), "confirmed");
  return lamports / LAMPORTS_PER_SOL;
}

function keypairFromEncryptedSecret(positionSecretEnc) {
  const plain = decryptAgentSecretFromStorage(positionSecretEnc);
  return Keypair.fromSecretKey(bs58.decode(plain));
}

export { getConnection, WRAPPED_SOL_MINT };
