/**
 * Labs deposit hub — equal-split USDC + native (SOL / ETH / CELO / ALGO) to active payer/payto wallets.
 * Distribution is manual only (Distribute button) to avoid RPC rate limits from polling.
 */
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { formatEther, formatUnits } from 'viem';
import algosdk from 'algosdk';
import LabX402Settings, {
  normalizeLabChain,
  settingsKeyForChain,
} from '../../models/labs/LabX402Settings.js';
import { getDexterNetworkByCaip2 } from '../../config/dexterX402Networks.js';
import { CELO_USDC_MAINNET } from '../../config/celoX402Networks.js';
import { sendTaggedCeloUsdcTransfer } from '../../utils/celoX402Settle.js';
import { pickSolanaConnectionForReads } from '../solanaServerRpc.js';
import {
  getActiveDepositWalletDoc,
  getOrCreateDepositWallet,
  listDepositRecipients,
  keypairFromLabWalletDoc,
  evmAccountFromLabWalletDoc,
  algorandAccountFromLabWalletDoc,
  getBasePublicClient,
  createBaseWalletClient,
  getCeloPublicClient,
  createCeloWalletClient,
  getLabWalletBalances,
  getAlgorandAlgodClient,
  getAlgorandUsdcAsaId,
  getAlgorandLabWalletBalances,
  getActivePayToAlgorandAccount,
  ensureAlgorandUsdcOptInForAccount,
  ensureAlgorandLabWalletUsdcOptIn,
} from './labWalletService.js';
import { getLabX402Settings } from './labX402Payer.js';
import LabWallet from '../../models/labs/LabWallet.js';

const SOLANA_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const BASE_USDC =
  getDexterNetworkByCaip2('eip155:8453')?.usdc ||
  process.env.BASE_USDC ||
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

const DISTRIBUTE_LOCK_MS = 30_000;
/** ~5000 lamports base fee + cushion per Solana tx. */
const SOL_FEE_LAMPORTS_PER_TX = 10_000n;
/** ATA rent-exempt minimum (~2.04M lamports) for reserve planning. */
const SOL_ATA_RENT_LAMPORTS = 2_040_000n;

/** @type {Set<string>} */
const runningByChain = new Set();
/** @type {Map<string, number>} */
const lastRunAtByChain = new Map();

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} chain
 * @returns {'SOL' | 'ETH' | 'CELO' | 'ALGO'}
 */
function nativeSymbolForChain(chain) {
  if (chain === 'celo') return 'CELO';
  if (chain === 'base') return 'ETH';
  if (chain === 'algorand') return 'ALGO';
  return 'SOL';
}

/** ~0.001 ALGO fee cushion per outbound tx + min-balance buffer on deposit hub. */
const ALGO_FEE_MICRO_PER_TX = 1_000n;
const ALGO_MIN_BALANCE_RESERVE_MICRO = 200_000n;
const MICRO_ALGO = 1_000_000n;
/** Min ALGO per recipient so they can opt into USDC ASA (~0.1 locked + fee). */
const ALGO_OPT_IN_FUND_MICRO = 150_000n;

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} chain
 * @param {Date | string | null | undefined} at
 */
async function markDistributed(chain, at = new Date()) {
  await LabX402Settings.findOneAndUpdate(
    { singletonKey: settingsKeyForChain(chain) },
    {
      $set: { depositLastDistributedAt: at instanceof Date ? at : new Date(at) },
      $setOnInsert: { singletonKey: settingsKeyForChain(chain) },
    },
    { upsert: true },
  );
}

/**
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain='base']
 * @returns {Promise<object>}
 */
export async function getLabDepositHub(chain = 'base') {
  const c = normalizeLabChain(chain);
  const wallet = await getOrCreateDepositWallet(c);
  const settings = await getLabX402Settings(c);
  const recipients = await listDepositRecipients(c);
  return {
    id: wallet.id,
    label: wallet.label,
    address: wallet.address,
    chain: c,
    role: 'deposit',
    nativeBalance: wallet.nativeBalance,
    nativeSymbol: wallet.nativeSymbol ?? nativeSymbolForChain(c),
    usdcBalance: wallet.usdcBalance,
    balanceAvailable: wallet.balanceAvailable !== false,
    /** Algorand only — false until hub opts into USDC ASA (needs ALGO first). */
    optedInUsdc: c === 'algorand' ? Boolean(wallet.optedInUsdc) : undefined,
    recipientsCount: recipients.length,
    depositDistributeEnabled: settings.depositDistributeEnabled,
    depositMinUsdc: settings.depositMinUsdc,
    depositMinEth: settings.depositMinEth,
    depositEthGasReserve: settings.depositEthGasReserve,
    lastDistributedAt: settings.depositLastDistributedAt,
  };
}

/**
 * Equal-split USDC + native from the deposit hub to all active payer/payto wallets.
 * @param {'solana' | 'base' | 'celo' | 'algorand'} [chain='base']
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<object>}
 */
export async function distributeLabDeposit(chain = 'base', opts = {}) {
  const c = normalizeLabChain(chain);
  const force = opts.force === true;

  if (runningByChain.has(c)) {
    return { skipped: true, reason: 'already_running', transfers: [] };
  }
  const last = lastRunAtByChain.get(c) ?? 0;
  if (!force && Date.now() - last < DISTRIBUTE_LOCK_MS) {
    return { skipped: true, reason: 'cooldown', transfers: [] };
  }

  runningByChain.add(c);
  lastRunAtByChain.set(c, Date.now());

  try {
    const settings = await getLabX402Settings(c);
    if (!force && !settings.depositDistributeEnabled) {
      return { skipped: true, reason: 'disabled', transfers: [] };
    }

    const depositDoc = await getActiveDepositWalletDoc(c);
    if (!depositDoc) {
      await getOrCreateDepositWallet(c);
      return { skipped: true, reason: 'deposit_created_empty', transfers: [] };
    }

    const recipients = await listDepositRecipients(c);
    if (recipients.length === 0) {
      return { skipped: true, reason: 'no_recipients', transfers: [] };
    }

    if (c === 'solana') return await distributeSolanaDeposit(depositDoc, recipients, settings);
    if (c === 'celo') return await distributeCeloDeposit(depositDoc, recipients, settings);
    if (c === 'algorand') return await distributeAlgorandDeposit(depositDoc, recipients, settings);
    return await distributeBaseDeposit(depositDoc, recipients, settings);
  } finally {
    runningByChain.delete(c);
  }
}

/**
 * @param {object} depositDoc
 * @param {object[]} recipients
 * @param {object} settings
 */
async function distributeBaseDeposit(depositDoc, recipients, settings) {
  const account = evmAccountFromLabWalletDoc(depositDoc);
  const publicClient = getBasePublicClient();
  const walletClient = createBaseWalletClient(account);
  const depositAddr = /** @type {`0x${string}`} */ (account.address);
  const n = recipients.length;

  let usdcRaw;
  let ethWei;
  let gasPrice;
  try {
    [usdcRaw, ethWei, gasPrice] = await Promise.all([
      publicClient.readContract({
        address: /** @type {`0x${string}`} */ (BASE_USDC),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [depositAddr],
      }),
      publicClient.getBalance({ address: depositAddr }),
      publicClient.getGasPrice(),
    ]);
  } catch (e) {
    console.warn('[lab-deposit] Base balance read failed:', e?.message || e);
    return {
      skipped: true,
      reason: 'rpc_unavailable',
      depositAddress: depositAddr,
      error: e?.message || String(e),
      transfers: [],
    };
  }

  const usdcRawBi = /** @type {bigint} */ (usdcRaw);
  const usdcBalance = Number(formatUnits(usdcRawBi, 6));
  const ethBalance = Number(formatEther(ethWei));
  /** @type {object[]} */
  const transfers = [];

  const gasPriceBi = /** @type {bigint} */ (gasPrice);
  const ethGasPerTx = 21_000n;
  const estimateGasWei = (gasUnits) => (gasUnits * gasPriceBi * 125n) / 100n;

  const perUsdc = usdcRawBi > 0n ? usdcRawBi / BigInt(n) : 0n;
  if (perUsdc > 0n) {
    for (const recipient of recipients) {
      const to = String(recipient.address || '').trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(to)) continue;
      try {
        const hash = await walletClient.writeContract({
          address: /** @type {`0x${string}`} */ (BASE_USDC),
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [/** @type {`0x${string}`} */ (to), perUsdc],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(formatUnits(perUsdc, 6)),
          tx: hash,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] Base USDC transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(formatUnits(perUsdc, 6)),
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  }

  let ethWeiCursor = await publicClient.getBalance({ address: depositAddr });
  const ethBalanceAfterUsdc = Number(formatEther(ethWeiCursor));
  const validRecipients = recipients.filter((r) =>
    /^0x[0-9a-fA-F]{40}$/.test(String(r.address || '').trim()),
  );
  let remaining = validRecipients.length;
  const ethGasReserveAll = estimateGasWei(ethGasPerTx * BigInt(Math.max(remaining, 1)));

  if (ethWeiCursor > ethGasReserveAll) {
    for (const recipient of validRecipients) {
      const to = String(recipient.address || '').trim();
      ethWeiCursor = await publicClient.getBalance({ address: depositAddr });
      const keep = estimateGasWei(ethGasPerTx * BigInt(Math.max(remaining, 1)));
      const avail = ethWeiCursor > keep ? ethWeiCursor - keep : 0n;
      const perWei = remaining > 0 ? avail / BigInt(remaining) : 0n;
      remaining -= 1;

      if (perWei <= 0n) {
        transfers.push({
          asset: 'ETH',
          to,
          amount: 0,
          tx: null,
          ok: false,
          error: 'insufficient_eth_after_gas',
        });
        continue;
      }

      try {
        const hash = await walletClient.sendTransaction({
          to: /** @type {`0x${string}`} */ (to),
          value: perWei,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        transfers.push({
          asset: 'ETH',
          to,
          amount: Number(formatEther(perWei)),
          tx: hash,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] Base ETH transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'ETH',
          to,
          amount: Number(formatEther(perWei)),
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  } else if (ethBalanceAfterUsdc > 0 && ethWeiCursor <= ethGasReserveAll) {
    transfers.push({
      asset: 'ETH',
      to: depositAddr,
      amount: ethBalanceAfterUsdc,
      tx: null,
      ok: false,
      error: 'eth_reserved_for_gas',
    });
  }

  return finalizeDistributeResult({
    chain: 'base',
    depositAddr,
    usdcRawBi,
    nativeBalanceBefore: ethBalance,
    nativeAfterWeiOrLamports: ethWeiCursor,
    ethGasReserveAll,
    perUsdc,
    transfers,
    settings,
    n,
  });
}

/**
 * @param {object} depositDoc
 * @param {object[]} recipients
 * @param {object} settings
 */
async function distributeCeloDeposit(depositDoc, recipients, settings) {
  const account = evmAccountFromLabWalletDoc(depositDoc);
  const publicClient = getCeloPublicClient();
  const walletClient = createCeloWalletClient(account);
  const depositAddr = /** @type {`0x${string}`} */ (account.address);
  const n = recipients.length;

  let usdcRaw;
  let celoWei;
  let gasPrice;
  try {
    [usdcRaw, celoWei, gasPrice] = await Promise.all([
      publicClient.readContract({
        address: /** @type {`0x${string}`} */ (CELO_USDC_MAINNET),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [depositAddr],
      }),
      publicClient.getBalance({ address: depositAddr }),
      publicClient.getGasPrice(),
    ]);
  } catch (e) {
    console.warn('[lab-deposit] Celo balance read failed:', e?.message || e);
    return {
      skipped: true,
      reason: 'rpc_unavailable',
      depositAddress: depositAddr,
      error: e?.message || String(e),
      transfers: [],
    };
  }

  const usdcRawBi = /** @type {bigint} */ (usdcRaw);
  const usdcBalance = Number(formatUnits(usdcRawBi, 6));
  const celoBalance = Number(formatEther(celoWei));
  /** @type {object[]} */
  const transfers = [];

  const gasPriceBi = /** @type {bigint} */ (gasPrice);
  const nativeGasPerTx = 21_000n;
  const estimateGasWei = (gasUnits) => (gasUnits * gasPriceBi * 125n) / 100n;

  const perUsdc = usdcRawBi > 0n ? usdcRawBi / BigInt(n) : 0n;
  if (perUsdc > 0n) {
    for (const recipient of recipients) {
      const to = String(recipient.address || '').trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(to)) continue;
      try {
        const hash = await sendTaggedCeloUsdcTransfer(
          account,
          /** @type {`0x${string}`} */ (to),
          perUsdc,
        );
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(formatUnits(perUsdc, 6)),
          tx: hash,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] Celo USDC transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(formatUnits(perUsdc, 6)),
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  }

  let celoWeiCursor = await publicClient.getBalance({ address: depositAddr });
  const celoBalanceAfterUsdc = Number(formatEther(celoWeiCursor));
  const validRecipients = recipients.filter((r) =>
    /^0x[0-9a-fA-F]{40}$/.test(String(r.address || '').trim()),
  );
  let remaining = validRecipients.length;
  const gasReserveAll = estimateGasWei(nativeGasPerTx * BigInt(Math.max(remaining, 1)));

  if (celoWeiCursor > gasReserveAll) {
    for (const recipient of validRecipients) {
      const to = String(recipient.address || '').trim();
      celoWeiCursor = await publicClient.getBalance({ address: depositAddr });
      const keep = estimateGasWei(nativeGasPerTx * BigInt(Math.max(remaining, 1)));
      const avail = celoWeiCursor > keep ? celoWeiCursor - keep : 0n;
      const perWei = remaining > 0 ? avail / BigInt(remaining) : 0n;
      remaining -= 1;

      if (perWei <= 0n) {
        transfers.push({
          asset: 'CELO',
          to,
          amount: 0,
          tx: null,
          ok: false,
          error: 'insufficient_celo_after_gas',
        });
        continue;
      }

      try {
        const hash = await walletClient.sendTransaction({
          to: /** @type {`0x${string}`} */ (to),
          value: perWei,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        transfers.push({
          asset: 'CELO',
          to,
          amount: Number(formatEther(perWei)),
          tx: hash,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] CELO transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'CELO',
          to,
          amount: Number(formatEther(perWei)),
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  } else if (celoBalanceAfterUsdc > 0 && celoWeiCursor <= gasReserveAll) {
    transfers.push({
      asset: 'CELO',
      to: depositAddr,
      amount: celoBalanceAfterUsdc,
      tx: null,
      ok: false,
      error: 'celo_reserved_for_gas',
    });
  }

  void usdcBalance;
  return finalizeDistributeResult({
    chain: 'celo',
    depositAddr,
    usdcRawBi,
    nativeBalanceBefore: celoBalance,
    nativeAfterWeiOrLamports: celoWeiCursor,
    ethGasReserveAll: gasReserveAll,
    perUsdc,
    transfers,
    settings,
    n,
  });
}

/**
 * @param {object} depositDoc
 * @param {object[]} recipients
 * @param {object} settings
 */
async function distributeSolanaDeposit(depositDoc, recipients, settings) {
  const keypair = keypairFromLabWalletDoc(depositDoc);
  const depositPk = keypair.publicKey;
  const depositAddr = depositPk.toBase58();
  const n = recipients.length;

  let connection;
  let lamports;
  try {
    const picked = await pickSolanaConnectionForReads(depositPk);
    connection = picked.connection;
    lamports = BigInt(picked.lamports ?? (await connection.getBalance(depositPk, 'confirmed')));
  } catch (e) {
    console.warn('[lab-deposit] Solana balance read failed:', e?.message || e);
    return {
      skipped: true,
      reason: 'rpc_unavailable',
      depositAddress: depositAddr,
      error: e?.message || String(e),
      transfers: [],
    };
  }

  const sourceAta = await getAssociatedTokenAddress(SOLANA_USDC_MINT, depositPk);
  let usdcRawBi = 0n;
  try {
    const ataInfo = await connection.getTokenAccountBalance(sourceAta, 'confirmed');
    usdcRawBi = BigInt(ataInfo?.value?.amount || '0');
  } catch {
    usdcRawBi = 0n;
  }

  const usdcBalance = Number(usdcRawBi) / 1e6;
  const solBalance = Number(lamports) / LAMPORTS_PER_SOL;
  /** @type {object[]} */
  const transfers = [];

  const validRecipients = [];
  for (const r of recipients) {
    const addr = String(r.address || '').trim();
    try {
      validRecipients.push({ address: addr, pubkey: new PublicKey(addr) });
    } catch {
      // skip invalid
    }
  }
  const recipientCount = validRecipients.length;
  if (recipientCount === 0) {
    return { skipped: true, reason: 'no_recipients', transfers: [], depositAddress: depositAddr };
  }

  const perUsdc = usdcRawBi > 0n ? usdcRawBi / BigInt(recipientCount) : 0n;
  let atasCreated = 0;

  if (perUsdc > 0n) {
    for (const recipient of validRecipients) {
      const to = recipient.address;
      try {
        const destAta = await getAssociatedTokenAddress(SOLANA_USDC_MINT, recipient.pubkey);
        const tx = new Transaction();
        const destInfo = await connection.getAccountInfo(destAta);
        if (!destInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              depositPk,
              destAta,
              recipient.pubkey,
              SOLANA_USDC_MINT,
            ),
          );
          atasCreated += 1;
        }
        tx.add(
          createTransferInstruction(
            sourceAta,
            destAta,
            depositPk,
            perUsdc,
            [],
            TOKEN_PROGRAM_ID,
          ),
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = depositPk;
        const signature = await sendAndConfirmTransaction(connection, tx, [keypair], {
          commitment: 'confirmed',
          maxRetries: 3,
        });
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(perUsdc) / 1e6,
          tx: signature,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] Solana USDC transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(perUsdc) / 1e6,
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  }

  // Re-read SOL after USDC + possible ATA creation
  let lamportsCursor = BigInt(await connection.getBalance(depositPk, 'confirmed'));
  const solAfterUsdc = Number(lamportsCursor) / LAMPORTS_PER_SOL;
  let remaining = recipientCount;
  const feeReserveAll =
    SOL_FEE_LAMPORTS_PER_TX * BigInt(Math.max(remaining, 1)) +
    SOL_ATA_RENT_LAMPORTS; // keep rent dust / buffer for account

  if (lamportsCursor > feeReserveAll) {
    for (const recipient of validRecipients) {
      const to = recipient.address;
      lamportsCursor = BigInt(await connection.getBalance(depositPk, 'confirmed'));
      const keep =
        SOL_FEE_LAMPORTS_PER_TX * BigInt(Math.max(remaining, 1)) + SOL_ATA_RENT_LAMPORTS;
      const avail = lamportsCursor > keep ? lamportsCursor - keep : 0n;
      const perLamports = remaining > 0 ? avail / BigInt(remaining) : 0n;
      remaining -= 1;

      if (perLamports <= 0n) {
        transfers.push({
          asset: 'SOL',
          to,
          amount: 0,
          tx: null,
          ok: false,
          error: 'insufficient_sol_after_fees',
        });
        continue;
      }

      try {
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: depositPk,
            toPubkey: recipient.pubkey,
            lamports: Number(perLamports),
          }),
        );
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = depositPk;
        const signature = await sendAndConfirmTransaction(connection, tx, [keypair], {
          commitment: 'confirmed',
          maxRetries: 3,
        });
        transfers.push({
          asset: 'SOL',
          to,
          amount: Number(perLamports) / LAMPORTS_PER_SOL,
          tx: signature,
          ok: true,
        });
      } catch (e) {
        console.warn(`[lab-deposit] SOL transfer to ${to} failed:`, e?.message || e);
        transfers.push({
          asset: 'SOL',
          to,
          amount: Number(perLamports) / LAMPORTS_PER_SOL,
          tx: null,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }
  } else if (solAfterUsdc > 0 && lamportsCursor <= feeReserveAll) {
    transfers.push({
      asset: 'SOL',
      to: depositAddr,
      amount: solAfterUsdc,
      tx: null,
      ok: false,
      error: 'sol_reserved_for_fees',
    });
  }

  void atasCreated;
  void usdcBalance;
  return finalizeDistributeResult({
    chain: 'solana',
    depositAddr,
    usdcRawBi,
    nativeBalanceBefore: solBalance,
    nativeAfterWeiOrLamports: lamportsCursor,
    ethGasReserveAll: feeReserveAll,
    perUsdc,
    transfers,
    settings,
    n: recipientCount,
  });
}

/**
 * Opt an Algorand lab wallet into USDC ASA using its encrypted secret.
 * @param {string} address
 * @returns {Promise<{ ok: boolean; tx?: string; error?: string; already?: boolean }>}
 */
async function ensureAlgorandRecipientUsdcOptIn(address) {
  const result = await ensureAlgorandLabWalletUsdcOptIn(address);
  if (!result.ok && result.error === 'wallet_not_found') {
    return { ok: false, error: 'not_opted_in' };
  }
  return result;
}

/**
 * Equal-split USDC ASA + ALGO from the Algorand deposit hub.
 * Sends ALGO first, then opts recipients into USDC (using their keys), then sends USDC.
 * @param {object} depositDoc
 * @param {object[]} recipients
 * @param {object} settings
 */
async function distributeAlgorandDeposit(depositDoc, recipients, settings) {
  const depositAccount = algorandAccountFromLabWalletDoc(depositDoc);
  const depositAddr = depositAccount.address;
  const client = getAlgorandAlgodClient();
  const asaId = getAlgorandUsdcAsaId();
  const n = recipients.length;

  // Ensure deposit hub itself is opted into USDC ASA when it has ALGO for fees.
  try {
    const hubOpt = await ensureAlgorandUsdcOptInForAccount(depositAccount);
    if (!hubOpt.ok && !hubOpt.already) {
      console.warn('[lab-deposit] Algorand deposit hub USDC opt-in skipped:', hubOpt.error);
    }
  } catch (e) {
    console.warn('[lab-deposit] Algorand deposit hub USDC opt-in skipped:', e?.message || e);
  }

  let accountInfo;
  try {
    accountInfo = await client.accountInformation(depositAddr).do();
  } catch (e) {
    console.warn('[lab-deposit] Algorand balance read failed:', e?.message || e);
    return {
      skipped: true,
      reason: 'rpc_unavailable',
      depositAddress: depositAddr,
      error: e?.message || String(e),
      transfers: [],
    };
  }

  const algoMicro = BigInt(accountInfo?.amount ?? 0);
  const algoBalance = Number(algoMicro) / Number(MICRO_ALGO);
  const assets = Array.isArray(accountInfo?.assets) ? accountInfo.assets : [];
  const holding = assets.find((a) => Number(a?.assetId ?? a?.['asset-id'] ?? a?.asset_id) === asaId);
  const usdcRawBi = BigInt(holding?.amount ?? 0);
  const usdcBalance = Number(usdcRawBi) / 1e6;

  /** @type {object[]} */
  const transfers = [];
  const validRecipients = recipients
    .map((r) => String(r.address || '').trim())
    .filter(Boolean);
  const recipientCount = validRecipients.length;
  if (recipientCount === 0) {
    return { skipped: true, reason: 'no_recipients', transfers: [], depositAddress: depositAddr };
  }

  /**
   * Send ALGO from deposit hub → recipient.
   * @param {string} to
   * @param {bigint} amountMicro
   * @returns {Promise<object>}
   */
  async function sendAlgo(to, amountMicro) {
    if (amountMicro <= 0n) {
      return { asset: 'ALGO', to, amount: 0, tx: null, ok: false, error: 'zero_amount' };
    }
    try {
      const sp = await client.getTransactionParams().do();
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: depositAddr,
        receiver: to,
        amount: Number(amountMicro),
        suggestedParams: sp,
      });
      const signed = txn.signTxn(depositAccount.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      await algosdk.waitForConfirmation(client, txid, 8);
      return {
        asset: 'ALGO',
        to,
        amount: Number(amountMicro) / Number(MICRO_ALGO),
        tx: txid,
        ok: true,
      };
    } catch (e) {
      console.warn(`[lab-deposit] ALGO transfer to ${to} failed:`, e?.message || e);
      return {
        asset: 'ALGO',
        to,
        amount: Number(amountMicro) / Number(MICRO_ALGO),
        tx: null,
        ok: false,
        error: e?.message || String(e),
      };
    }
  }

  async function refreshHubAlgo() {
    try {
      const info = await client.accountInformation(depositAddr).do();
      return BigInt(info?.amount ?? 0);
    } catch {
      return null;
    }
  }

  // 1a) Top up each not-opted-in recipient to ~0.15 ALGO so USDC opt-in can succeed.
  // Without this, equal-splitting a small ALGO balance across 10 wallets leaves each under
  // the ASA min-balance and every USDC send fails with not_opted_in / insufficient_algo.
  /** @type {Map<string, boolean>} */
  const needsOptInFund = new Map();
  for (const to of validRecipients) {
    const bal = await getAlgorandLabWalletBalances(to);
    const alreadyOpted = Boolean(bal?.optedInUsdc);
    const haveMicro = BigInt(Math.round((bal?.nativeBalance ?? 0) * Number(MICRO_ALGO)));
    needsOptInFund.set(to, !alreadyOpted && haveMicro < ALGO_OPT_IN_FUND_MICRO);
  }

  let algoCursor = algoMicro;
  for (const to of validRecipients) {
    if (!needsOptInFund.get(to)) continue;
    const bal = await getAlgorandLabWalletBalances(to);
    const haveMicro = BigInt(Math.round((bal?.nativeBalance ?? 0) * Number(MICRO_ALGO)));
    const needMicro =
      haveMicro < ALGO_OPT_IN_FUND_MICRO ? ALGO_OPT_IN_FUND_MICRO - haveMicro : 0n;
    if (needMicro <= 0n) continue;

    const refreshed = await refreshHubAlgo();
    if (refreshed != null) algoCursor = refreshed;
    const keep = ALGO_FEE_MICRO_PER_TX + ALGO_MIN_BALANCE_RESERVE_MICRO;
    const avail = algoCursor > keep ? algoCursor - keep : 0n;
    if (avail < needMicro) {
      transfers.push({
        asset: 'ALGO',
        to,
        amount: Number(needMicro) / Number(MICRO_ALGO),
        tx: null,
        ok: false,
        error: `insufficient_algo_for_recipient_opt_in (need ~${(Number(needMicro) / Number(MICRO_ALGO)).toFixed(3)} ALGO more on hub for this wallet)`,
      });
      continue;
    }
    const sent = await sendAlgo(to, needMicro);
    transfers.push(sent);
    if (sent.ok) algoCursor -= needMicro + ALGO_FEE_MICRO_PER_TX;
  }

  // 1b) Equal-split remaining ALGO (keep fee + min-balance reserve)
  let remaining = recipientCount;
  {
    const refreshed = await refreshHubAlgo();
    if (refreshed != null) algoCursor = refreshed;
  }
  const feeReserveAll =
    ALGO_FEE_MICRO_PER_TX * BigInt(Math.max(remaining, 1)) + ALGO_MIN_BALANCE_RESERVE_MICRO;

  if (algoCursor > feeReserveAll) {
    for (const to of validRecipients) {
      const refreshed = await refreshHubAlgo();
      if (refreshed != null) algoCursor = refreshed;
      const keep =
        ALGO_FEE_MICRO_PER_TX * BigInt(Math.max(remaining, 1)) + ALGO_MIN_BALANCE_RESERVE_MICRO;
      const avail = algoCursor > keep ? algoCursor - keep : 0n;
      const perMicro = remaining > 0 ? avail / BigInt(remaining) : 0n;
      remaining -= 1;

      if (perMicro <= 0n) {
        transfers.push({
          asset: 'ALGO',
          to,
          amount: 0,
          tx: null,
          ok: false,
          error: 'insufficient_algo_after_fees',
        });
        continue;
      }

      transfers.push(await sendAlgo(to, perMicro));
    }
  } else {
    // Only report reserved ALGO when we actually needed more ALGO for opt-in funding.
    const neededOptInAlgo = [...needsOptInFund.values()].some(Boolean);
    if (neededOptInAlgo && algoBalance > 0) {
      transfers.push({
        asset: 'ALGO',
        to: depositAddr,
        amount: algoBalance,
        tx: null,
        ok: false,
        error: 'algo_reserved_for_fees',
      });
    }
  }

  // 2) Opt recipients into USDC ASA (uses recipient keys when available)
  const optedInRecipients = [];
  for (const to of validRecipients) {
    const opt = await ensureAlgorandRecipientUsdcOptIn(to);
    if (opt.ok) {
      optedInRecipients.push(to);
    } else {
      transfers.push({
        asset: 'USDC',
        to,
        amount: 0,
        tx: null,
        ok: false,
        error: opt.error || 'not_opted_in',
      });
    }
  }

  // 3) Equal-split USDC ASA to opted-in recipients
  let usdcCursor = usdcRawBi;
  try {
    const refreshed = await client.accountInformation(depositAddr).do();
    const refreshedAssets = Array.isArray(refreshed?.assets) ? refreshed.assets : [];
    const h = refreshedAssets.find(
      (a) => Number(a?.assetId ?? a?.['asset-id'] ?? a?.asset_id) === asaId,
    );
    usdcCursor = BigInt(h?.amount ?? 0);
  } catch {
    /* keep prior */
  }

  const perUsdc =
    usdcCursor > 0n && optedInRecipients.length > 0
      ? usdcCursor / BigInt(optedInRecipients.length)
      : 0n;

  /**
   * Hub often sits exactly at ASA min-balance (0.2 ALGO) after opt-in, so it cannot pay
   * USDC axfer fees. Borrow a small fee buffer from PayTo / a funded recipient.
   * @param {number} txCount
   */
  async function ensureHubAlgoForUsdcFees(txCount) {
    const needMicro =
      ALGO_FEE_MICRO_PER_TX * BigInt(Math.max(txCount, 1)) * 2n + 20_000n; // cushion
    let hubInfo;
    try {
      hubInfo = await client.accountInformation(depositAddr).do();
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
    const hubAmount = BigInt(hubInfo?.amount ?? 0);
    const hubMin = BigInt(hubInfo?.minBalance ?? hubInfo?.['min-balance'] ?? 0);
    const spendable = hubAmount > hubMin ? hubAmount - hubMin : 0n;
    if (spendable >= needMicro) {
      return { ok: true, already: true, spendable: Number(spendable) / Number(MICRO_ALGO) };
    }
    const deficit = needMicro - spendable;

    /** @type {{ address: string; sk: Uint8Array }[]} */
    const funders = [];
    try {
      const payTo = await getActivePayToAlgorandAccount();
      if (payTo && payTo.address !== depositAddr) funders.push(payTo);
    } catch {
      /* ignore */
    }
    for (const to of optedInRecipients) {
      if (funders.some((f) => f.address === to)) continue;
      try {
        const doc = await LabWallet.findOne({
          address: to,
          chain: 'algorand',
          active: true,
        })
          .select('+encryptedSecret')
          .lean();
        if (doc?.encryptedSecret) funders.push(algorandAccountFromLabWalletDoc(doc));
      } catch {
        /* ignore */
      }
    }

    for (const funder of funders) {
      try {
        const finfo = await client.accountInformation(funder.address).do();
        const fAmount = BigInt(finfo?.amount ?? 0);
        const fMin = BigInt(finfo?.minBalance ?? finfo?.['min-balance'] ?? 0);
        const fSpend = fAmount > fMin ? fAmount - fMin : 0n;
        // Keep funder with some spare too
        if (fSpend < deficit + ALGO_FEE_MICRO_PER_TX + 50_000n) continue;

        const sp = await client.getTransactionParams().do();
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: funder.address,
          receiver: depositAddr,
          amount: Number(deficit),
          suggestedParams: sp,
        });
        const signed = txn.signTxn(funder.sk);
        const { txid } = await client.sendRawTransaction(signed).do();
        await algosdk.waitForConfirmation(client, txid, 8);
        transfers.push({
          asset: 'ALGO',
          to: depositAddr,
          amount: Number(deficit) / Number(MICRO_ALGO),
          tx: txid,
          ok: true,
          note: `fee_topup_from_${funder.address.slice(0, 6)}`,
        });
        return {
          ok: true,
          funded: true,
          from: funder.address,
          amount: Number(deficit) / Number(MICRO_ALGO),
        };
      } catch (e) {
        console.warn(
          `[lab-deposit] hub fee top-up from ${funder.address} failed:`,
          e?.message || e,
        );
      }
    }

    return {
      ok: false,
      error: `insufficient_algo_for_usdc_fees (hub spendable ${Number(spendable) / Number(MICRO_ALGO)} ALGO; need ~${Number(needMicro) / Number(MICRO_ALGO)} above min-balance)`,
    };
  }

  if (perUsdc > 0n) {
    const feeReady = await ensureHubAlgoForUsdcFees(optedInRecipients.length);
    if (!feeReady.ok) {
      for (const to of optedInRecipients) {
        transfers.push({
          asset: 'USDC',
          to,
          amount: Number(perUsdc) / 1e6,
          tx: null,
          ok: false,
          error: feeReady.error,
        });
      }
    } else {
      for (const to of optedInRecipients) {
        try {
          const sp = await client.getTransactionParams().do();
          const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: depositAddr,
            receiver: to,
            amount: Number(perUsdc),
            assetIndex: asaId,
            suggestedParams: sp,
          });
          const signed = txn.signTxn(depositAccount.sk);
          const { txid } = await client.sendRawTransaction(signed).do();
          await algosdk.waitForConfirmation(client, txid, 8);
          transfers.push({
            asset: 'USDC',
            to,
            amount: Number(perUsdc) / 1e6,
            tx: txid,
            ok: true,
          });
        } catch (e) {
          console.warn(`[lab-deposit] Algorand USDC transfer to ${to} failed:`, e?.message || e);
          transfers.push({
            asset: 'USDC',
            to,
            amount: Number(perUsdc) / 1e6,
            tx: null,
            ok: false,
            error: e?.message || String(e),
          });
        }
      }
    }
  } else if (usdcCursor > 0n && optedInRecipients.length === 0) {
    transfers.push({
      asset: 'USDC',
      to: depositAddr,
      amount: Number(usdcCursor) / 1e6,
      tx: null,
      ok: false,
      error: 'no_opted_in_recipients',
    });
  }

  void usdcBalance;
  let algoAfter = algoCursor;
  try {
    const after = await client.accountInformation(depositAddr).do();
    algoAfter = BigInt(after?.amount ?? 0);
  } catch {
    /* keep */
  }

  return finalizeDistributeResult({
    chain: 'algorand',
    depositAddr,
    usdcRawBi,
    nativeBalanceBefore: algoBalance,
    nativeAfterWeiOrLamports: algoAfter,
    ethGasReserveAll: feeReserveAll,
    perUsdc,
    transfers,
    settings,
    n: recipientCount,
  });
}

/**
 * Shared result finalizer for all chains.
 * @param {{
 *   chain: 'solana' | 'base' | 'celo' | 'algorand';
 *   depositAddr: string;
 *   usdcRawBi: bigint;
 *   nativeBalanceBefore: number;
 *   nativeAfterWeiOrLamports: bigint;
 *   ethGasReserveAll: bigint;
 *   perUsdc: bigint;
 *   transfers: object[];
 *   settings: object;
 *   n: number;
 * }} args
 */
async function finalizeDistributeResult(args) {
  const {
    chain,
    depositAddr,
    usdcRawBi,
    nativeBalanceBefore,
    nativeAfterWeiOrLamports,
    ethGasReserveAll,
    perUsdc,
    transfers,
    settings,
    n,
  } = args;

  const anyOk = transfers.some((t) => t.ok);
  if (anyOk) {
    await markDistributed(chain);
  }

  const balances = await getLabWalletBalances(depositAddr, chain);
  const nativeBalanceAfter =
    balances?.nativeBalance ??
    (chain === 'solana'
      ? Number(nativeAfterWeiOrLamports) / LAMPORTS_PER_SOL
      : chain === 'algorand'
        ? Number(nativeAfterWeiOrLamports) / Number(MICRO_ALGO)
        : Number(formatEther(nativeAfterWeiOrLamports)));

  if (!anyOk) {
    return {
      skipped: true,
      reason:
        usdcRawBi === 0n && nativeBalanceBefore <= 0
          ? 'empty'
          : perUsdc <= 0n && nativeAfterWeiOrLamports <= ethGasReserveAll
            ? 'nothing_distributable'
            : 'distribute_failed',
      depositAddress: depositAddr,
      usdcBalance: balances?.usdcBalance ?? Number(usdcRawBi) / 1e6,
      ethBalance: nativeBalanceAfter,
      nativeBalance: nativeBalanceAfter,
      recipientsCount: n,
      transfers,
    };
  }

  return {
    skipped: false,
    depositAddress: depositAddr,
    usdcBalance: balances?.usdcBalance ?? Number(usdcRawBi) / 1e6,
    ethBalance: nativeBalanceAfter,
    nativeBalance: nativeBalanceAfter,
    recipientsCount: n,
    transfers,
    lastDistributedAt: new Date().toISOString(),
  };
}
