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
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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

export function getSolanaConnection() {
  return getConnection();
}

/** Meteora docs: refetch on-chain pool state before deposit / withdraw / swap. */
async function createDlmmPool(lbPairAddress) {
  const connection = getConnection();
  const dlmmPool = await DLMM.create(connection, new PublicKey(lbPairAddress));
  if (typeof dlmmPool.refetchStates === "function") {
    await dlmmPool.refetchStates();
  }
  return dlmmPool;
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

export function isSolMint(mint) {
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
 * @param {{ swappedSolLamports?: number, otherTokenRaw?: BN }} [sidecar]
 */
export function computeDepositAmounts(
  tokenXMint,
  tokenYMint,
  depositSol,
  tokenXDecimals,
  tokenYDecimals,
  sidecar = {},
) {
  const totalLamports = Math.floor(toNum(depositSol) * LAMPORTS_PER_SOL);
  const swappedLamports = Math.max(0, Math.floor(toNum(sidecar.swappedSolLamports, 0)));
  const solLamports = Math.max(0, totalLamports - swappedLamports);
  const otherRaw = sidecar.otherTokenRaw ?? new BN(0);
  const solIsX = isSolMint(tokenXMint.toBase58());
  const solIsY = isSolMint(tokenYMint.toBase58());

  if (solIsX && !solIsY) {
    return {
      totalXAmount: new BN(solLamports),
      totalYAmount: otherRaw,
    };
  }
  if (solIsY && !solIsX) {
    return {
      totalXAmount: otherRaw,
      totalYAmount: new BN(solLamports),
    };
  }
  throw new Error("non_sol_pool_unsupported");
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
async function prepareSerializedTxs(txs, positionKeypair, feePayer) {
  if (!txs.length) throw new Error("empty_transaction");
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const serializedTxBase64List = txs.map((tx) => {
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = feePayer;
    const requiresPositionSig = tx.signatures.some((sig) =>
      sig.publicKey?.equals?.(positionKeypair.publicKey),
    );
    if (requiresPositionSig) {
      tx.partialSign(positionKeypair);
    }
    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    return Buffer.from(serialized).toString("base64");
  });
  return {
    serializedTxBase64: serializedTxBase64List[0],
    serializedTxBase64List,
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
  sidecar = {},
}) {
  const user = new PublicKey(agentPubkey);
  const dlmmPool = await createDlmmPool(lbPairAddress);

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
    sidecar,
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
  const { serializedTxBase64, serializedTxBase64List, blockhash, lastValidBlockHeight } =
    await prepareSerializedTxs(txs, positionKeypair, user);

  const positionSecretPlain = bs58.encode(positionKeypair.secretKey);
  const positionSecretEnc = encryptAgentSecretForStorage(positionSecretPlain);

  return {
    serializedTxBase64,
    serializedTxBase64List,
    blockhash,
    lastValidBlockHeight,
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
 * Bin range for removeLiquidity from stored open params or on-chain position data.
 */
function resolvePositionBinRange({ activeBinAtOpen, binsBelow, binsAbove, lbPosition }) {
  if (activeBinAtOpen != null && binsBelow != null && binsAbove != null) {
    return {
      fromBinId: activeBinAtOpen - binsBelow,
      toBinId: activeBinAtOpen + binsAbove,
    };
  }
  const binData = lbPosition?.positionData?.positionBinData;
  if (Array.isArray(binData) && binData.length > 0) {
    const ids = binData.map((b) => toNum(b.binId, NaN)).filter((id) => Number.isFinite(id));
    if (ids.length) {
      return { fromBinId: Math.min(...ids), toBinId: Math.max(...ids) };
    }
  }
  const lower = lbPosition?.positionData?.lowerBinId;
  const upper = lbPosition?.positionData?.upperBinId;
  if (lower != null && upper != null) {
    return { fromBinId: toNum(lower), toBinId: toNum(upper) };
  }
  throw new Error("position_bin_range_unknown");
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
  activeBinAtOpen,
  binsBelow,
  binsAbove,
  slippageBps: _slippageBps = 50,
}) {
  const user = new PublicKey(agentPubkey);
  const positionPk = new PublicKey(positionPubkey);
  const dlmmPool = await createDlmmPool(lbPairAddress);

  const positionKeypair = keypairFromEncryptedSecret(positionSecretEnc);
  const lbPosition = await dlmmPool.getPosition(positionPk);
  const { fromBinId, toBinId } = resolvePositionBinRange({
    activeBinAtOpen,
    binsBelow,
    binsAbove,
    lbPosition,
  });

  let rawTx;
  try {
    rawTx = await dlmmPool.removeLiquidity({
      user,
      position: positionPk,
      fromBinId,
      toBinId,
      bps: new BN(10_000),
      shouldClaimAndClose: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("No liquidity to remove")) throw err;
    rawTx = await dlmmPool.closePosition({
      owner: user,
      position: lbPosition,
    });
  }

  const txs = normalizeTxArray(rawTx);
  const { serializedTxBase64, serializedTxBase64List, blockhash, lastValidBlockHeight } =
    await prepareSerializedTxs(txs, positionKeypair, user);
  return { serializedTxBase64, serializedTxBase64List, blockhash, lastValidBlockHeight };
}

/**
 * @param {object} params
 * @param {string} params.lbPairAddress
 * @param {string} params.positionPubkey
 * @param {string} params.agentPubkey
 * @param {string} params.positionSecretEnc
 */
export async function buildClaimFeesTx({ lbPairAddress, positionPubkey, agentPubkey, positionSecretEnc }) {
  const user = new PublicKey(agentPubkey);
  const position = new PublicKey(positionPubkey);
  const dlmmPool = await createDlmmPool(lbPairAddress);
  const positionKeypair = keypairFromEncryptedSecret(positionSecretEnc);

  const positionState = await dlmmPool.getPosition(position);
  const rawTx = await dlmmPool.claimSwapFee({
    owner: user,
    position: positionState,
  });

  const txs = normalizeTxArray(rawTx);
  const { serializedTxBase64, serializedTxBase64List } = await prepareSerializedTxs(
    txs,
    positionKeypair,
    user,
  );
  return { serializedTxBase64, serializedTxBase64List };
}

/**
 * @param {string} positionPubkey
 * @param {string} lbPairAddress
 */
export async function fetchOnChainPosition(positionPubkey, lbPairAddress) {
  const dlmmPool = await createDlmmPool(lbPairAddress);
  const position = await dlmmPool.getPosition(new PublicKey(positionPubkey));
  const activeBin = await dlmmPool.getActiveBin();

  let unclaimedFeeSol = 0;
  try {
    const data = position?.positionData || position || {};
    const feeX = toNum(data.feeX?.toString?.() ?? data.feeX, 0);
    const feeY = toNum(data.feeY?.toString?.() ?? data.feeY, 0);
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

/**
 * Raw balance for a mint (native + wSOL ATA when mint is SOL).
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {string} mintStr
 */
async function getOwnerMintAmountRaw(connection, owner, mintStr) {
  const mint = String(mintStr || "");
  if (isSolMint(mint)) {
    const native = await connection.getBalance(owner, "confirmed");
    try {
      const wsolAta = await getAssociatedTokenAddress(
        new PublicKey(WRAPPED_SOL_MINT),
        owner,
        false,
        TOKEN_PROGRAM_ID,
      );
      const ta = await connection.getTokenAccountBalance(wsolAta, "confirmed");
      return BigInt(native) + BigInt(ta.value.amount);
    } catch {
      return BigInt(native);
    }
  }
  try {
    const ata = await getAssociatedTokenAddress(
      new PublicKey(mint),
      owner,
      false,
      TOKEN_PROGRAM_ID,
    );
    const ta = await connection.getTokenAccountBalance(ata, "confirmed");
    return BigInt(ta.value.amount);
  } catch {
    return 0n;
  }
}

/**
 * Wallet token balances for an LB pair (X/Y mints). Used to measure close proceeds.
 * @param {string} agentAddress
 * @param {string} lbPairAddress
 */
export async function snapshotAgentWalletForPool(agentAddress, lbPairAddress) {
  const connection = getConnection();
  const owner = new PublicKey(agentAddress);
  const dlmmPool = await createDlmmPool(lbPairAddress);
  const xMint = dlmmPool.tokenX.publicKey.toBase58();
  const yMint = dlmmPool.tokenY.publicKey.toBase58();
  const [xRaw, yRaw] = await Promise.all([
    getOwnerMintAmountRaw(connection, owner, xMint),
    getOwnerMintAmountRaw(connection, owner, yMint),
  ]);
  return {
    xMint,
    yMint,
    xRaw: xRaw.toString(),
    yRaw: yRaw.toString(),
    xDecimals: dlmmPool.tokenX?.mint?.decimals ?? 9,
    yDecimals: dlmmPool.tokenY?.mint?.decimals ?? 9,
    solIsX: isSolMint(xMint),
    solIsY: isSolMint(yMint),
  };
}

/**
 * SOL-equivalent tokens received from a close (delta between before/after snapshots).
 * Meteora `pricePerToken` is Y per X in human units.
 *
 * @param {{ before: object; after: object; pricePerToken: number }} params
 * @returns {number | null}
 */
export function computeCloseProceedsSol({ before, after, pricePerToken }) {
  const price = toNum(pricePerToken, 0);
  if (!before || !after || price <= 0) return null;

  const dX = BigInt(after.xRaw) - BigInt(before.xRaw);
  const dY = BigInt(after.yRaw) - BigInt(before.yRaw);
  const dxHuman = Number(dX) / 10 ** toNum(before.xDecimals, 9);
  const dyHuman = Number(dY) / 10 ** toNum(before.yDecimals, 9);

  if (before.solIsY && !before.solIsX) {
    return dyHuman + dxHuman * price;
  }
  if (before.solIsX && !before.solIsY) {
    return dxHuman + dyHuman / price;
  }
  return null;
}

function keypairFromEncryptedSecret(positionSecretEnc) {
  const plain = decryptAgentSecretFromStorage(positionSecretEnc);
  return Keypair.fromSecretKey(bs58.decode(plain));
}

export { getConnection, WRAPPED_SOL_MINT };
