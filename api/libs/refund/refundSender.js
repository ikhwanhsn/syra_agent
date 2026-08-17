/**
 * On-chain USDC/USDT0 refund sender for the in-house x402 refund layer.
 * Dedicated treasury keys with fallback to existing merchant/agent signers.
 * Retry + confirm-before-resend so we do not double-pay on ambiguous confirms.
 */
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { parseUnits, formatUnits, formatEther } from "viem";
import algosdk from "algosdk";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import {
  SOLANA_USDC_MINT,
  BASE_USDC,
  SOLANA_PAYTO,
  EVM_PAYTO,
  ALGORAND_PAYTO,
  OKX_X402_PAYTO,
} from "../../config/settlement.js";
import { XLAYER_MAINNET_USDT } from "../../config/okxX402Networks.js";
import { pickSolanaConnectionForReads, isSolanaRpcRetryableError } from "../solanaServerRpc.js";
import { confirmSolanaTransaction, isSolanaTxConfirmedOnAnyRpc } from "../solanaConfirm.js";
import { getTreasuryKeypair } from "../agentTreasuryKey.js";
import {
  getBasePublicClient,
  createBaseWalletClient,
  getXlayerPublicClient,
  createXlayerWalletClient,
  getAlgorandAlgodClient,
  getAlgorandUsdcAsaId,
  isAlgorandAddressOptedInUsdc,
} from "../labs/labWalletService.js";
import { getAlgorandAgentFeeReserveAccount } from "../labs/labAlgorandFeeBuffer.js";

export const REFUND_INSUFFICIENT_FUNDS = "REFUND_INSUFFICIENT_FUNDS";

const USDC_MINT = new PublicKey(SOLANA_USDC_MINT);
const XLAYER_USDT0 = XLAYER_MAINNET_USDT || "0x779ded0c9e1022225f8e0630b35a9b54be713736";

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
];

const REFUND_MAX_ATTEMPTS = 3;
const REFUND_RETRY_DELAY_MS = 800;
const FUNDER_MIN_EVM_NATIVE = 0.00004;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function env(name) {
  return String(process.env[name] || "").trim();
}

function isRetryableRefundError(e) {
  const msg = e?.message || String(e);
  return (
    isSolanaRpcRetryableError(e) ||
    /blockhash|block height exceeded|not confirmed|expired|node is behind|transaction was not confirmed|nonce|replacement|timeout|429|503|502/i.test(
      msg,
    )
  );
}

/**
 * @param {unknown} e
 * @returns {string | null}
 */
export function extractSubmittedTxId(e) {
  if (!e || typeof e !== "object") return null;
  const err = /** @type {Record<string, unknown>} */ (e);
  for (const key of ["txSignature", "signature", "hash", "transactionHash", "txid"]) {
    const v = err[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const msg = String(err.message || "");
  const m = msg.match(/\b([1-9A-HJ-NP-Za-km-z]{64,100})\b/) || msg.match(/\b(0x[0-9a-fA-F]{64})\b/);
  return m ? m[1] : null;
}

/**
 * @param {string | null | undefined} txId
 * @param {'solana' | 'base' | 'algorand' | 'xlayer'} chain
 * @param {object} [clients]
 */
async function isRefundTxAlreadyConfirmed(txId, chain, clients = {}) {
  const id = String(txId || "").trim();
  if (!id) return false;
  try {
    if (chain === "solana") {
      return await isSolanaTxConfirmedOnAnyRpc(id);
    }
    if ((chain === "base" || chain === "xlayer") && clients.publicClient) {
      const receipt = await clients.publicClient.getTransactionReceipt({
        hash: /** @type {`0x${string}`} */ (id),
      });
      return Boolean(receipt && receipt.status === "success");
    }
    if (chain === "algorand" && clients.algod) {
      const info = await clients.algod.pendingTransactionInformation(id).do();
      return Boolean(info?.confirmedRound || info?.["confirmed-round"]);
    }
  } catch {
    /* unknown */
  }
  return false;
}

function solanaKeypairFromSecret(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  try {
    if (s.startsWith("[")) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return Keypair.fromSecretKey(Uint8Array.from(arr));
    }
    return Keypair.fromSecretKey(bs58.decode(s));
  } catch {
    return null;
  }
}

async function loadEvmAccount(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const hex = s.startsWith("0x") ? s.slice(2) : s;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  const { privateKeyToAccount } = await import("viem/accounts");
  return privateKeyToAccount(/** @type {`0x${string}`} */ (`0x${hex}`));
}

function algorandAccountFromEnv() {
  const mnemonic = env("REFUND_ALGORAND_MNEMONIC") || env("ALGORAND_MNEMONIC");
  if (mnemonic) {
    try {
      const acct = algosdk.mnemonicToSecretKey(mnemonic.replace(/\s+/g, " "));
      const address =
        typeof acct.addr === "string"
          ? acct.addr
          : acct.addr?.toString?.() || String(acct.addr || "");
      if (address && acct.sk) return { address, sk: acct.sk };
    } catch {
      /* fall through */
    }
  }
  const dedicated = env("REFUND_ALGORAND_PRIVATE_KEY");
  if (dedicated) {
    try {
      const sk = new Uint8Array(Buffer.from(dedicated, "base64"));
      if (sk.length === 64) {
        const address = algosdk.encodeAddress(sk.slice(32));
        if (address) return { address, sk };
      }
    } catch {
      /* fall through */
    }
  }
  return getAlgorandAgentFeeReserveAccount();
}

/**
 * @param {'solana' | 'base' | 'xlayer' | 'algorand'} chain
 */
export function getRefundTreasuryAddress(chain) {
  if (chain === "solana") {
    const kp = solanaKeypairFromSecret(env("REFUND_SOLANA_PRIVATE_KEY")) || getTreasuryKeypair();
    return kp ? kp.publicKey.toBase58() : SOLANA_PAYTO;
  }
  if (chain === "base") {
    return EVM_PAYTO;
  }
  if (chain === "xlayer") {
    return OKX_X402_PAYTO || EVM_PAYTO;
  }
  if (chain === "algorand") {
    const acct = algorandAccountFromEnv();
    return acct?.address || ALGORAND_PAYTO;
  }
  return null;
}

/**
 * @param {'solana' | 'base' | 'xlayer' | 'algorand'} chain
 */
export function hasRefundTreasurySigner(chain) {
  if (chain === "solana") {
    return Boolean(solanaKeypairFromSecret(env("REFUND_SOLANA_PRIVATE_KEY")) || getTreasuryKeypair());
  }
  if (chain === "base" || chain === "xlayer") {
    return Boolean(
      env("REFUND_EVM_PRIVATE_KEY") ||
        env("EVM_PRIVATE_KEY") ||
        env("SYRA_EVM_PAYER_PRIVATE_KEY") ||
        env("BASE_PAYER_PRIVATE_KEY"),
    );
  }
  if (chain === "algorand") {
    return Boolean(algorandAccountFromEnv());
  }
  return false;
}

async function resolveEvmFunder() {
  const raw =
    env("REFUND_EVM_PRIVATE_KEY") ||
    env("EVM_PRIVATE_KEY") ||
    env("SYRA_EVM_PAYER_PRIVATE_KEY") ||
    env("BASE_PAYER_PRIVATE_KEY");
  const account = await loadEvmAccount(raw);
  if (!account) {
    throw new Error(`${REFUND_INSUFFICIENT_FUNDS}: no EVM refund treasury key`);
  }
  return account;
}

function resolveSolanaFunder() {
  const kp = solanaKeypairFromSecret(env("REFUND_SOLANA_PRIVATE_KEY")) || getTreasuryKeypair();
  if (!kp) {
    throw new Error(`${REFUND_INSUFFICIENT_FUNDS}: no Solana refund treasury key`);
  }
  return kp;
}

async function sendSolana(toAddress, amountUsd) {
  const funder = resolveSolanaFunder();
  const payerPk = new PublicKey(toAddress);
  const funderPk = funder.publicKey;
  const amountMicro = BigInt(Math.round(amountUsd * 1e6));
  if (amountMicro <= 0n) return null;

  const sourceAta = await getAssociatedTokenAddress(USDC_MINT, funderPk);
  const destAta = await getAssociatedTokenAddress(USDC_MINT, payerPk);

  let lastErr;
  /** @type {string | null} */
  let submittedSig = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, "solana"))) {
      return { signature: submittedSig, amountUsdc: amountUsd, chain: "solana" };
    }
    try {
      const { connection } = await pickSolanaConnectionForReads(funderPk);
      const tx = new Transaction();
      const destInfo = await connection.getAccountInfo(destAta);
      if (!destInfo) {
        tx.add(createAssociatedTokenAccountInstruction(funderPk, destAta, payerPk, USDC_MINT));
      }
      tx.add(createTransferInstruction(sourceAta, destAta, funderPk, amountMicro, [], TOKEN_PROGRAM_ID));
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = funderPk;
      tx.sign(funder);

      const signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      submittedSig = signature;
      await confirmSolanaTransaction(connection, signature, { lastValidBlockHeight });
      return { signature, amountUsdc: amountUsd, chain: "solana" };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedSig = fromErr;
      if (submittedSig && (await isRefundTxAlreadyConfirmed(submittedSig, "solana"))) {
        return { signature: submittedSig, amountUsdc: amountUsd, chain: "solana" };
      }
      const msg = e?.message || String(e);
      if (
        submittedSig &&
        (/tx_confirm_timeout|tx_blockhash_expired|not confirmed|timeout/i.test(msg) || e?.ambiguous)
      ) {
        throw e;
      }
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e) && !submittedSig) {
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function sendEvm(chain, toAddress, amountUsd) {
  const payer = String(toAddress || "").trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(payer)) {
    throw new Error("invalid_evm_refund_address");
  }
  const account = await resolveEvmFunder();
  const token = chain === "xlayer" ? XLAYER_USDT0 : BASE_USDC;
  const publicClient = chain === "xlayer" ? getXlayerPublicClient() : getBasePublicClient();
  const walletClient =
    chain === "xlayer" ? createXlayerWalletClient(account) : createBaseWalletClient(account);
  const amountRaw = parseUnits(amountUsd.toFixed(6), 6);

  const [tokenBal, nativeBal] = await Promise.all([
    publicClient.readContract({
      address: /** @type {`0x${string}`} */ (token),
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [/** @type {`0x${string}`} */ (account.address)],
    }),
    publicClient.getBalance({ address: /** @type {`0x${string}`} */ (account.address) }),
  ]);
  const tokenBalance = Number(formatUnits(/** @type {bigint} */ (tokenBal), 6));
  const nativeBalance = Number(formatEther(nativeBal));
  if (tokenBalance < amountUsd) {
    throw new Error(
      `${REFUND_INSUFFICIENT_FUNDS}: funder ${chain} stable ${tokenBalance.toFixed(4)} < ${amountUsd.toFixed(4)}`,
    );
  }
  if (nativeBalance < FUNDER_MIN_EVM_NATIVE) {
    throw new Error(
      `${REFUND_INSUFFICIENT_FUNDS}: funder ${chain} native ${nativeBalance.toFixed(6)} below gas floor`,
    );
  }

  let lastErr;
  /** @type {string | null} */
  let submittedHash = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (submittedHash && (await isRefundTxAlreadyConfirmed(submittedHash, chain, { publicClient }))) {
      return { signature: submittedHash, amountUsdc: amountUsd, chain };
    }
    try {
      const hash = await walletClient.writeContract({
        address: /** @type {`0x${string}`} */ (token),
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [/** @type {`0x${string}`} */ (payer), amountRaw],
      });
      submittedHash = hash;
      await publicClient.waitForTransactionReceipt({ hash });
      return { signature: hash, amountUsdc: amountUsd, chain };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedHash = fromErr;
      if (submittedHash && (await isRefundTxAlreadyConfirmed(submittedHash, chain, { publicClient }))) {
        return { signature: submittedHash, amountUsdc: amountUsd, chain };
      }
      if (submittedHash) throw e;
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function sendAlgorand(toAddress, amountUsd) {
  const funder = algorandAccountFromEnv();
  if (!funder) {
    throw new Error(`${REFUND_INSUFFICIENT_FUNDS}: no Algorand refund treasury key`);
  }
  const optedIn = await isAlgorandAddressOptedInUsdc(toAddress);
  if (!optedIn) {
    throw new Error(`${REFUND_INSUFFICIENT_FUNDS}: payer not opted into USDC ASA`);
  }
  const client = getAlgorandAlgodClient();
  const asaId = getAlgorandUsdcAsaId();
  const amountMicro = Math.round(amountUsd * 1e6);
  if (amountMicro <= 0) return null;

  let lastErr;
  /** @type {string | null} */
  let submittedTxid = null;
  for (let attempt = 1; attempt <= REFUND_MAX_ATTEMPTS; attempt++) {
    if (submittedTxid && (await isRefundTxAlreadyConfirmed(submittedTxid, "algorand", { algod: client }))) {
      return { signature: submittedTxid, amountUsdc: amountUsd, chain: "algorand" };
    }
    try {
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: funder.address,
        receiver: toAddress,
        amount: amountMicro,
        assetIndex: asaId,
        suggestedParams: sp,
      });
      const signed = txn.signTxn(funder.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      submittedTxid = txid;
      await algosdk.waitForConfirmation(client, txid, 8);
      return { signature: txid, amountUsdc: amountUsd, chain: "algorand" };
    } catch (e) {
      lastErr = e;
      const fromErr = extractSubmittedTxId(e);
      if (fromErr) submittedTxid = fromErr;
      if (submittedTxid && (await isRefundTxAlreadyConfirmed(submittedTxid, "algorand", { algod: client }))) {
        return { signature: submittedTxid, amountUsdc: amountUsd, chain: "algorand" };
      }
      if (submittedTxid) throw e;
      if (attempt < REFUND_MAX_ATTEMPTS && isRetryableRefundError(e)) {
        await sleep(REFUND_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * @param {{
 *   chain: 'solana' | 'base' | 'xlayer' | 'algorand';
 *   toAddress: string;
 *   amountUsd: number;
 * }} opts
 * @returns {Promise<{ signature: string; amountUsdc: number; chain: string } | null>}
 */
export async function sendUsdcRefund({ chain, toAddress, amountUsd }) {
  const c = String(chain || "").toLowerCase();
  const to = String(toAddress || "").trim();
  const amount = Number(amountUsd);
  if (!to || !Number.isFinite(amount) || amount <= 0) return null;
  if (c === "solana") return sendSolana(to, amount);
  if (c === "base" || c === "xlayer") return sendEvm(c, to, amount);
  if (c === "algorand") return sendAlgorand(to, amount);
  throw new Error(`unsupported_refund_chain:${c}`);
}
