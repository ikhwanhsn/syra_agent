import type { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import BN from "bn.js";
import {
  SolanaStreamClient,
  getNumberFromBN,
  ICluster,
  StreamDirection,
  StreamType,
  calculateTotalAmountToDeposit,
  type ICreateLinearStreamData,
  type Stream,
} from "@streamflow/stream";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";

type StreamflowCreateExt = Parameters<SolanaStreamClient["create"]>[1];

const TOKEN_PROGRAM_ID_STR = TOKEN_PROGRAM_ID.toBase58().toLowerCase();
const SYSTEM_PROGRAM_ID_STR = "11111111111111111111111111111111";

/**
 * Streamflow charges ~0.16 SOL service fee + ~0.015 SOL network fee per lock.
 * Paid by the staker's wallet in SOL — not a Syra subscription.
 */
export const STREAMFLOW_LOCK_SOL_RECOMMENDED = 0.18;
export const STREAMFLOW_LOCK_SOL_MIN_LAMPORTS = Math.floor(
  STREAMFLOW_LOCK_SOL_RECOMMENDED * LAMPORTS_PER_SOL
);

export type StakeIssueCode =
  | "wallet_disconnected"
  | "no_sol"
  | "low_sol"
  | "no_syra_account"
  | "syra_scattered"
  | "no_syra_balance"
  | "amount_empty"
  | "amount_too_low"
  | "amount_too_high"
  | "insufficient_syra"
  | "insufficient_sol"
  | "simulation_failed"
  | "network"
  | "user_rejected"
  | "unknown";

export interface StakeReadinessIssue {
  code: StakeIssueCode;
  severity: "error" | "warning";
  title: string;
  detail: string;
  fix: string;
}

export interface StakeReadiness {
  canLock: boolean;
  solBalanceLamports: number;
  solRequiredLamports: number;
  solBalanceFormatted: string;
  solRequiredFormatted: string;
  feePercent: number;
  walletBalanceRaw: bigint;
  walletBalanceFormatted: string;
  maxLockableRaw: bigint;
  maxLockableFormatted: string;
  requestedRaw: bigint;
  requestedFormatted: string;
  /** Extra SYRA debited beyond lock amount (Streamflow token fee). */
  estimatedSyraFeeFormatted: string;
  issues: StakeReadinessIssue[];
}

export class StakeLockError extends Error {
  readonly code: StakeIssueCode;
  readonly fix: string;
  readonly title: string;

  constructor(args: {
    code: StakeIssueCode;
    title: string;
    message: string;
    fix: string;
  }) {
    super(args.message);
    this.name = "StakeLockError";
    this.code = args.code;
    this.title = args.title;
    this.fix = args.fix;
  }

  /** Full user-facing block: title, detail, and fix. */
  displayMessage(): string {
    return `${this.title}\n\n${this.message}\n\nHow to fix: ${this.fix}`;
  }
}

function formatSol(lamports: number, digits = 4): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(digits)} SOL`;
}

const FEE_MULTIPLIER_BN = new BN(1_000_000);
const FEE_NORMALIZER = 10_000;

/** Minimum safety buffer in base units (~0.1 SYRA at 6 decimals). */
const MIN_STAKE_BUFFER_RAW = 100_000n;

/** Maximum safety buffer in base units (~1 SYRA at 6 decimals). */
const MAX_STAKE_BUFFER_RAW = 1_000_000n;

export interface WalletMintState {
  /** Balance in the sender ATA Streamflow debits (use for max lock math). */
  balance: bigint;
  /** Sum across all token accounts for this mint (wallet UI total). */
  totalBalance: bigint;
  ata: PublicKey;
  tokenProgramId: PublicKey;
  decimals: number;
  ataExists: boolean;
}

/** Scales with balance so large locks keep headroom for fee rounding + simulation. */
export function computeStakeSafetyBufferRaw(balance: BN): BN {
  if (balance.lte(new BN(0))) {
    return new BN(MIN_STAKE_BUFFER_RAW.toString());
  }
  const fromPercent = balance.div(new BN(10_000));
  const minBn = new BN(MIN_STAKE_BUFFER_RAW.toString());
  const maxBn = new BN(MAX_STAKE_BUFFER_RAW.toString());
  if (fromPercent.lt(minBn)) return minBn;
  if (fromPercent.gt(maxBn)) return maxBn;
  return fromPercent;
}

export function createStreamflowClient(connection: Connection): SolanaStreamClient {
  const cluster = STREAMFLOW_CONFIG.isDevnet ? ICluster.Devnet : ICluster.Mainnet;
  return new SolanaStreamClient({
    clusterUrl: connection.rpcEndpoint,
    cluster,
    commitment: "confirmed",
  });
}

/** Max lock amount from wallet balance after reserving Streamflow's token fee. */
export function computeMaxLockableRaw(balance: BN, feePercent: number): BN {
  if (feePercent <= 0 || balance.lte(new BN(0))) {
    return balance;
  }
  const feeNorm = new BN(Math.round(feePercent * FEE_NORMALIZER));
  return balance.mul(FEE_MULTIPLIER_BN).div(feeNorm.add(FEE_MULTIPLIER_BN));
}

export function computeRequiredBalanceRaw(depositRaw: BN, feePercent: number): BN {
  return calculateTotalAmountToDeposit(depositRaw, feePercent);
}

/**
 * Largest deposit amount that still fits in `balance` after Streamflow fees and
 * integer rounding. Always use this (not raw wallet balance) for Max + submit.
 */
export function computeMaxDepositRaw(balance: BN, feePercent: number): BN {
  if (balance.lte(new BN(2))) {
    return new BN(0);
  }

  let deposit = computeMaxLockableRaw(balance, feePercent);

  while (deposit.gt(new BN(2))) {
    const required = computeRequiredBalanceRaw(deposit, feePercent);
    if (required.lte(balance)) {
      break;
    }
    deposit = deposit.subn(1);
  }

  if (deposit.lte(new BN(2))) {
    return new BN(0);
  }

  const bufferBn = computeStakeSafetyBufferRaw(balance);
  if (deposit.gt(bufferBn.addn(2))) {
    deposit = deposit.sub(bufferBn);
  }

  while (deposit.gt(new BN(2))) {
    const required = computeRequiredBalanceRaw(deposit, feePercent);
    if (required.lte(balance)) {
      break;
    }
    deposit = deposit.subn(1);
  }

  return deposit.gt(new BN(2)) ? deposit : new BN(0);
}

export interface ResolvedStakeAmount {
  amountRaw: bigint;
  maxDepositRaw: bigint;
  walletState: WalletMintState;
  wasClamped: boolean;
}

/**
 * Clamp a requested lock amount to what the wallet can actually fund on-chain.
 */
export async function resolveStakeAmountRaw(
  connection: Connection,
  owner: PublicKey,
  requestedRaw: bigint
): Promise<ResolvedStakeAmount> {
  const walletState = await fetchWalletMintState(
    connection,
    STREAMFLOW_CONFIG.tokenMint,
    owner
  );
  const client = createStreamflowClient(connection);
  const feePercent = await client.getTotalFee({ address: owner.toBase58() });
  const maxDeposit = computeMaxDepositRaw(
    new BN(walletState.balance.toString()),
    feePercent
  );
  const maxDepositRaw = BigInt(maxDeposit.toString());

  let amountRaw = requestedRaw;
  let wasClamped = false;
  if (amountRaw > maxDepositRaw) {
    amountRaw = maxDepositRaw;
    wasClamped = true;
  }

  return { amountRaw, maxDepositRaw, walletState, wasClamped };
}

/**
 * Detect whether the mint is owned by classic SPL Token or Token-2022.
 * Falls back to SPL Token if the mint cannot be read.
 */
export async function resolveTokenProgramId(
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  try {
    const info = await connection.getAccountInfo(mint, "confirmed");
    if (!info) return TOKEN_PROGRAM_ID;
    if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
    return TOKEN_PROGRAM_ID;
  } catch {
    return TOKEN_PROGRAM_ID;
  }
}

/**
 * Read mint decimals, token program, and the wallet's ATA balance used by Streamflow.
 */
export async function fetchWalletMintState(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<WalletMintState> {
  const tokenProgramId = await resolveTokenProgramId(connection, mint);
  const ata = getAssociatedTokenAddressSync(mint, owner, false, tokenProgramId);

  let decimals = STREAMFLOW_CONFIG.tokenDecimals;
  try {
    const mintInfo = await getMint(connection, mint, "confirmed", tokenProgramId);
    decimals = mintInfo.decimals;
  } catch {
    // keep configured decimals
  }

  let ataBalance = 0n;
  let ataExists = false;
  try {
    const acc = await getAccount(connection, ata, "confirmed", tokenProgramId);
    ataBalance = acc.amount;
    ataExists = true;
  } catch {
    ataExists = false;
  }

  let totalBalance = ataBalance;
  try {
    const parsed = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    totalBalance = (parsed.value ?? []).reduce((sum, entry) => {
      const raw = entry.account.data.parsed?.info?.tokenAmount?.amount;
      if (raw == null) return sum;
      try {
        return sum + BigInt(raw);
      } catch {
        return sum;
      }
    }, 0n);
  } catch {
    // keep ATA-only total
  }

  return {
    balance: ataBalance,
    totalBalance,
    ata,
    tokenProgramId,
    decimals,
    ataExists,
  };
}

/**
 * Fetch the on-chain ATA balance for a given owner/mint, auto-selecting
 * the correct token program. Returns 0n when the ATA doesn't exist yet.
 */
export async function fetchAtaBalance(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ balance: bigint; ata: PublicKey; tokenProgramId: PublicKey }> {
  const state = await fetchWalletMintState(connection, mint, owner);
  return {
    balance: state.balance,
    ata: state.ata,
    tokenProgramId: state.tokenProgramId,
  };
}

export function buildTokenLockCreateParams(args: {
  wallet: PublicKey;
  amountRaw: BN;
  unlockAtUnix: number;
  name: string;
  tokenProgramId?: PublicKey;
}): ICreateLinearStreamData {
  const { wallet, amountRaw, unlockAtUnix, name, tokenProgramId } = args;
  if (amountRaw.lte(new BN(1))) {
    throw new Error("Amount too small for a Streamflow token lock (min 2 base units).");
  }

  const cliffAmount = amountRaw.subn(1);

  return {
    recipient: wallet.toBase58(),
    tokenId: STREAMFLOW_CONFIG.tokenMint.toBase58(),
    tokenProgramId: tokenProgramId?.toBase58(),
    start: unlockAtUnix,
    amount: amountRaw,
    period: 1,
    cliff: unlockAtUnix,
    cliffAmount,
    amountPerPeriod: new BN(1),
    name,
    canTopup: false,
    cancelableBySender: false,
    cancelableByRecipient: false,
    transferableBySender: false,
    transferableByRecipient: false,
    automaticWithdrawal: false,
  };
}

export interface CreateLockStakeResult {
  txId: string;
  metadataId: string;
  unlockAtUnix: number;
  amountRaw: bigint;
  wasClamped: boolean;
}

function classifyInsufficientFundsCause(logs: string[]): "sol" | "token" | "ambiguous" {
  const haystack = logs.join("\n").toLowerCase();
  const mentionsSol =
    haystack.includes(SYSTEM_PROGRAM_ID_STR) ||
    haystack.includes("system program") ||
    haystack.includes("insufficient lamports");
  const mentionsToken =
    haystack.includes(TOKEN_PROGRAM_ID_STR) ||
    haystack.includes("token program") ||
    haystack.includes("spl-token");

  if (mentionsSol && !mentionsToken) return "sol";
  if (mentionsToken && !mentionsSol) return "token";
  return "ambiguous";
}

/**
 * Translate raw Streamflow / Solana send errors into clear, actionable StakeLockError.
 */
export function mapStreamflowError(err: unknown, symbol: string): StakeLockError {
  if (err instanceof StakeLockError) return err;

  const raw = err instanceof Error ? err.message : String(err);
  const logs: string[] =
    err && typeof err === "object" && "logs" in err
      ? ((err as { logs?: string[] }).logs ?? [])
      : [];
  const haystack = [raw, ...logs].join("\n").toLowerCase();

  if (haystack.includes("insufficient funds") || haystack.includes("insufficientfunds")) {
    const cause = classifyInsufficientFundsCause([haystack, ...logs]);

    if (cause === "sol") {
      return new StakeLockError({
        code: "insufficient_sol",
        title: "Not enough SOL for Streamflow fees",
        message:
          `This wallet does not have enough SOL to pay Streamflow's lock fee ` +
          `(~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL per lock: service + network + rent). ` +
          `Syra does not charge a separate subscription — the staker pays Streamflow in SOL when signing.`,
        fix: `Add at least ${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL to this wallet, then try again.`,
      });
    }

    if (cause === "token") {
      return new StakeLockError({
        code: "insufficient_syra",
        title: `Not enough ${symbol} (including Streamflow token fee)`,
        message:
          `The lock amount plus Streamflow's small ${symbol} fee exceeds what this token account can send. ` +
          `This often happens when you type a rounded number (e.g. 936000) instead of using Max.`,
        fix: `Tap Max to fill the exact lockable amount, or enter a slightly smaller ${symbol} amount.`,
      });
    }

    return new StakeLockError({
      code: "insufficient_sol",
      title: "Not enough balance to complete this lock",
      message:
        `The transaction failed for insufficient funds. Most often this is missing SOL for Streamflow ` +
        `(~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL per lock), or ${symbol} amount higher than the lockable max after fees.`,
      fix: `Keep ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL in the wallet, tap Max for ${symbol}, and retry.`,
    });
  }

  if (
    haystack.includes("0x1") &&
    (haystack.includes("system program") || haystack.includes("transfer"))
  ) {
    return new StakeLockError({
      code: "insufficient_sol",
      title: "Not enough SOL for this transaction",
      message:
        `Solana rejected the transaction because this wallet cannot pay the required SOL ` +
        `(Streamflow service fee ~0.16 SOL + network ~0.015 SOL + rent).`,
      fix: `Add at least ${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL to this wallet and retry.`,
    });
  }

  if (haystack.includes("blockhash not found") || haystack.includes("block height exceeded")) {
    return new StakeLockError({
      code: "network",
      title: "Transaction expired",
      message: "The network was slow and the transaction blockhash expired before confirmation.",
      fix: "Wait a moment and try again.",
    });
  }

  if (haystack.includes("user rejected") || haystack.includes("rejected the request")) {
    return new StakeLockError({
      code: "user_rejected",
      title: "Transaction cancelled",
      message: "You declined the transaction in your wallet.",
      fix: "Approve the transaction in your wallet when you are ready to lock.",
    });
  }

  return new StakeLockError({
    code: "unknown",
    title: "Lock failed",
    message: raw || "An unexpected error occurred.",
    fix: `Ensure ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL and enough ${symbol} (use Max), then retry.`,
  });
}

function isInsufficientFundsError(err: unknown, logs?: string[] | null): boolean {
  const haystack = [
    err instanceof Error ? err.message : String(err),
    JSON.stringify(err),
    ...(logs ?? []),
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes("insufficient funds") || haystack.includes("insufficientfunds");
}

function isInsufficientFundsSimulation(err: unknown, logs?: string[] | null): boolean {
  return isInsufficientFundsError(err, logs);
}

async function assertStakePreflight(
  connection: Connection,
  client: SolanaStreamClient,
  sender: PublicKey,
  amountRaw: bigint,
  walletState: WalletMintState
): Promise<void> {
  const symbol = STREAMFLOW_CONFIG.tokenSymbol;
  const solBalance = await connection.getBalance(sender, "confirmed");

  if (solBalance < STREAMFLOW_LOCK_SOL_MIN_LAMPORTS) {
    throw new StakeLockError({
      code: "low_sol",
      title: "Not enough SOL for Streamflow fees",
      message:
        `You have ${formatSol(solBalance)} but need about ${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL to create a lock. ` +
        `Streamflow charges ~0.16 SOL service fee + ~0.015 SOL network fee per lock (paid by you, not Syra).`,
      fix: `Send at least ${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL to this wallet, then retry.`,
    });
  }

  if (!walletState.ataExists || walletState.balance <= 0n) {
    if (walletState.totalBalance > 0n) {
      throw new StakeLockError({
        code: "syra_scattered",
        title: `${symbol} is split across token accounts`,
        message:
          `${symbol} exists in this wallet but not in the primary token account Streamflow uses. ` +
          `Your wallet may show a higher total than what can be locked in one transaction.`,
        fix: `Consolidate ${symbol} into one balance (swap or transfer to yourself), then tap Max and retry.`,
      });
    }
    throw new StakeLockError({
      code: "no_syra_account",
      title: `No ${symbol} in this wallet`,
      message: `This wallet has no ${symbol} token account on ${STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet"}.`,
      fix: `Receive or buy ${symbol} in this wallet first.`,
    });
  }

  const amountBn = new BN(amountRaw.toString());
  const feePercent = await client.getTotalFee({ address: sender.toBase58() });
  const requiredRaw = BigInt(computeRequiredBalanceRaw(amountBn, feePercent).toString());

  if (requiredRaw > walletState.balance) {
    const maxDeposit = computeMaxDepositRaw(
      new BN(walletState.balance.toString()),
      feePercent
    );
    const maxHuman = maxDeposit.gt(new BN(2))
      ? getNumberFromBN(maxDeposit, walletState.decimals).toString()
      : "0";
    const requiredHuman = getNumberFromBN(new BN(requiredRaw.toString()), walletState.decimals).toString();
    const balanceHuman = getNumberFromBN(new BN(walletState.balance.toString()), walletState.decimals).toString();

    throw new StakeLockError({
      code: "amount_too_high",
      title: `${symbol} amount too high (fee not included)`,
      message:
        `Locking ${getNumberFromBN(amountBn, walletState.decimals)} ${symbol} needs ${requiredHuman} ${symbol} total ` +
        `(lock + Streamflow fee ~${feePercent}%), but your account only has ${balanceHuman} ${symbol}.`,
      fix:
        maxDeposit.gt(new BN(2))
          ? `Tap Max to use ${maxHuman} ${symbol} — the highest amount that fits after fees.`
          : `Add more ${symbol} or enter a smaller amount.`,
    });
  }
}

/**
 * Find a deposit amount that passes Streamflow tx simulation (handles fee rounding drift).
 */
async function resolveStakeAmountForSimulation(
  connection: Connection,
  client: SolanaStreamClient,
  walletAdapter: SignerWalletAdapter,
  initialStakeRaw: bigint,
  lockDurationSeconds: number,
  walletState: WalletMintState
): Promise<{ stakeRaw: bigint; unlockAtUnix: number; wasAdjusted: boolean }> {
  const sender = walletAdapter.publicKey;
  if (!sender) throw new Error("Wallet not connected");

  const feePercent = await client.getTotalFee({ address: sender.toBase58() });
  let stakeRaw = initialStakeRaw;
  let wasAdjusted = false;
  const now = Math.floor(Date.now() / 1000);
  const unlockAt = now + lockDurationSeconds;

  const ext: StreamflowCreateExt = {
    sender: walletAdapter as unknown as StreamflowCreateExt["sender"],
    isNative: false,
  };

  for (let attempt = 0; attempt < 12; attempt++) {
    if (stakeRaw <= 2n) break;

    const amountBn = new BN(stakeRaw.toString());
    const params = buildTokenLockCreateParams({
      wallet: sender,
      amountRaw: amountBn,
      unlockAtUnix: unlockAt,
      name: `${STREAMFLOW_CONFIG.tokenSymbol} lock · Syra`,
      tokenProgramId: walletState.tokenProgramId,
    });

    const { tx } = await client.buildCreateTransaction(params, ext);
    const simulation = await client.getConnection().simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });

    if (!simulation.value.err) {
      return { stakeRaw, unlockAtUnix: unlockAt, wasAdjusted };
    }

    if (!isInsufficientFundsSimulation(simulation.value.err, simulation.value.logs)) {
      throw mapStreamflowError(
        {
          message: JSON.stringify(simulation.value.err),
          logs: simulation.value.logs ?? undefined,
        },
        STREAMFLOW_CONFIG.tokenSymbol
      );
    }

    wasAdjusted = true;
    const freshState = await fetchWalletMintState(
      connection,
      STREAMFLOW_CONFIG.tokenMint,
      sender
    );
    walletState = freshState;
    let maxBn = computeMaxDepositRaw(
      new BN(freshState.balance.toString()),
      feePercent
    );
    if (attempt > 0) {
      maxBn = maxBn.muln(999).divn(1000);
    }
    const nextStake = BigInt(maxBn.toString());
    if (nextStake >= stakeRaw && attempt > 0) {
      stakeRaw = (stakeRaw * 999n) / 1000n;
    } else {
      stakeRaw = nextStake;
    }
  }

  throw new StakeLockError({
    code: "simulation_failed",
    title: `Could not lock ${STREAMFLOW_CONFIG.tokenSymbol}`,
    message:
      `On-chain simulation failed after adjusting for Streamflow fees. ` +
      `Your ${STREAMFLOW_CONFIG.tokenSymbol} balance may be too tight, or SOL may be too low.`,
    fix: `Tap Max. Keep ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL in this wallet and retry.`,
  });
}

export async function createTokenLockStake(
  connection: Connection,
  walletAdapter: SignerWalletAdapter,
  amountRaw: bigint,
  lockDurationSeconds: number
): Promise<CreateLockStakeResult> {
  const sender = walletAdapter.publicKey;
  if (!sender) throw new Error("Wallet not connected");

  const resolved = await resolveStakeAmountRaw(connection, sender, amountRaw);
  if (resolved.amountRaw <= 2n) {
    throw new StakeLockError({
      code: "amount_too_low",
      title: "Amount too small",
      message: `The amount is below Streamflow's minimum (2 base units of ${STREAMFLOW_CONFIG.tokenSymbol}).`,
      fix: `Enter a larger amount or tap Max.`,
    });
  }

  let walletState = resolved.walletState;
  let wasClamped = resolved.wasClamped;

  const client = createStreamflowClient(connection);
  await assertStakePreflight(connection, client, sender, resolved.amountRaw, walletState);

  const simulated = await resolveStakeAmountForSimulation(
    connection,
    client,
    walletAdapter,
    resolved.amountRaw,
    lockDurationSeconds,
    walletState
  );

  let stakeRaw = simulated.stakeRaw;
  if (simulated.wasAdjusted) {
    wasClamped = true;
  }

  const ext: StreamflowCreateExt = {
    sender: walletAdapter as unknown as StreamflowCreateExt["sender"],
    isNative: false,
  };

  for (let sendAttempt = 0; sendAttempt < 2; sendAttempt++) {
    walletState = await fetchWalletMintState(
      connection,
      STREAMFLOW_CONFIG.tokenMint,
      sender
    );

    const amountBn = new BN(stakeRaw.toString());
    const unlockAt = simulated.unlockAtUnix;

    const params = buildTokenLockCreateParams({
      wallet: sender,
      amountRaw: amountBn,
      unlockAtUnix: unlockAt,
      name: `${STREAMFLOW_CONFIG.tokenSymbol} lock · Syra`,
      tokenProgramId: walletState.tokenProgramId,
    });

    try {
      const { txId, metadataId } = await client.create(params, ext);
      return {
        txId,
        metadataId,
        unlockAtUnix: unlockAt,
        amountRaw: stakeRaw,
        wasClamped,
      };
    } catch (err) {
      const logs =
        err && typeof err === "object" && "logs" in err
          ? ((err as { logs?: string[] }).logs ?? undefined)
          : undefined;

      if (sendAttempt === 0 && isInsufficientFundsError(err, logs)) {
        const feePercent = await client.getTotalFee({ address: sender.toBase58() });
        const freshState = await fetchWalletMintState(
          connection,
          STREAMFLOW_CONFIG.tokenMint,
          sender
        );
        const maxBn = computeMaxDepositRaw(
          new BN(freshState.balance.toString()),
          feePercent
        );
        const nextStake = BigInt(maxBn.toString());
        if (nextStake > 2n && nextStake < stakeRaw) {
          stakeRaw = nextStake;
          wasClamped = true;
          continue;
        }
      }

      throw mapStreamflowError(err, STREAMFLOW_CONFIG.tokenSymbol);
    }
  }

  throw new StakeLockError({
    code: "simulation_failed",
    title: `Could not lock ${STREAMFLOW_CONFIG.tokenSymbol}`,
    message:
      `The transaction could not be submitted after adjusting for fees. ` +
      `Check SOL (~${STREAMFLOW_LOCK_SOL_RECOMMENDED}) and ${STREAMFLOW_CONFIG.tokenSymbol} balance.`,
    fix: `Tap Max, ensure ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL, and retry.`,
  });
}

/** Max deposit (raw) the wallet can lock after Streamflow fees and safety buffer. */
export async function fetchMaxLockableRaw(
  connection: Connection,
  owner: PublicKey
): Promise<{ maxLockable: bigint; walletState: WalletMintState; feePercent: number }> {
  const walletState = await fetchWalletMintState(connection, STREAMFLOW_CONFIG.tokenMint, owner);
  const client = createStreamflowClient(connection);
  const feePercent = await client.getTotalFee({ address: owner.toBase58() });
  const maxDeposit = computeMaxDepositRaw(
    new BN(walletState.balance.toString()),
    feePercent
  );
  return {
    maxLockable: BigInt(maxDeposit.toString()),
    walletState,
    feePercent,
  };
}

function parseHumanAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!trimmed) return 0n;
  const [whole = "0", fraction = ""] = trimmed.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  try {
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || "0");
  } catch {
    return 0n;
  }
}

/**
 * Pre-submit checklist: explains exactly why a lock would fail (SOL fees, SYRA amount, etc.).
 */
export async function evaluateStakeReadiness(
  connection: Connection,
  owner: PublicKey | null,
  amountInput: string
): Promise<StakeReadiness> {
  const symbol = STREAMFLOW_CONFIG.tokenSymbol;
  const empty: StakeReadiness = {
    canLock: false,
    solBalanceLamports: 0,
    solRequiredLamports: STREAMFLOW_LOCK_SOL_MIN_LAMPORTS,
    solBalanceFormatted: "0 SOL",
    solRequiredFormatted: formatSol(STREAMFLOW_LOCK_SOL_MIN_LAMPORTS),
    feePercent: 0,
    walletBalanceRaw: 0n,
    walletBalanceFormatted: "0",
    maxLockableRaw: 0n,
    maxLockableFormatted: "0",
    requestedRaw: 0n,
    requestedFormatted: "0",
    estimatedSyraFeeFormatted: "0",
    issues: [
      {
        code: "wallet_disconnected",
        severity: "error",
        title: "Wallet not connected",
        detail: "Connect a Solana wallet to check balances and create a lock.",
        fix: "Click Connect wallet and try again.",
      },
    ],
  };

  if (!owner) return empty;

  const solBalanceLamports = await connection.getBalance(owner, "confirmed");
  const { maxLockable, walletState, feePercent } = await fetchMaxLockableRaw(connection, owner);
  const walletBalanceFormatted = getNumberFromBN(
    new BN(walletState.balance.toString()),
    walletState.decimals
  ).toString();
  const maxLockableFormatted = getNumberFromBN(
    new BN(maxLockable.toString()),
    walletState.decimals
  ).toString();

  const requestedRaw = parseHumanAmount(amountInput, walletState.decimals);
  const requestedFormatted =
    requestedRaw > 0n
      ? getNumberFromBN(new BN(requestedRaw.toString()), walletState.decimals).toString()
      : "0";

  let estimatedSyraFeeFormatted = "0";
  if (requestedRaw > 2n) {
    const required = computeRequiredBalanceRaw(new BN(requestedRaw.toString()), feePercent);
    const feeRaw = required.sub(new BN(requestedRaw.toString()));
    if (feeRaw.gt(new BN(0))) {
      estimatedSyraFeeFormatted = getNumberFromBN(feeRaw, walletState.decimals).toString();
    }
  }

  const issues: StakeReadinessIssue[] = [];

  if (solBalanceLamports < STREAMFLOW_LOCK_SOL_MIN_LAMPORTS) {
    issues.push({
      code: "low_sol",
      severity: "error",
      title: "Not enough SOL for Streamflow fees",
      detail:
        `You have ${formatSol(solBalanceLamports)} but need ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL. ` +
        `Streamflow charges ~0.16 SOL service + ~0.015 SOL network per lock (you pay this, not Syra).`,
      fix: `Add SOL until you have at least ${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL, then retry.`,
    });
  } else if (solBalanceLamports < STREAMFLOW_LOCK_SOL_MIN_LAMPORTS * 1.1) {
    issues.push({
      code: "low_sol",
      severity: "warning",
      title: "SOL balance is tight",
      detail: `You have ${formatSol(solBalanceLamports)}. We recommend ~${STREAMFLOW_LOCK_SOL_RECOMMENDED} SOL per lock.`,
      fix: "Consider adding a little extra SOL so the transaction does not fail.",
    });
  }

  if (!walletState.ataExists || walletState.balance <= 0n) {
    if (walletState.totalBalance > 0n) {
      issues.push({
        code: "syra_scattered",
        severity: "error",
        title: `${symbol} split across accounts`,
        detail: `${symbol} is in this wallet but not in the account Streamflow can debit.`,
        fix: `Consolidate ${symbol}, then tap Max.`,
      });
    } else {
      issues.push({
        code: "no_syra_balance",
        severity: "error",
        title: `No ${symbol} to lock`,
        detail: `This wallet has no ${symbol} available.`,
        fix: `Receive or buy ${symbol} first.`,
      });
    }
  } else if (maxLockable <= 2n) {
    issues.push({
      code: "no_syra_balance",
      severity: "error",
      title: `${symbol} balance too low after fees`,
      detail: `After Streamflow's ~${feePercent}% ${symbol} fee, nothing meaningful can be locked.`,
      fix: `Add more ${symbol} to this wallet.`,
    });
  }

  if (!amountInput.trim()) {
    issues.push({
      code: "amount_empty",
      severity: "warning",
      title: "Enter an amount",
      detail: `Choose how much ${symbol} to lock, or tap Max.`,
      fix: "Tap Max to use the highest lockable amount.",
    });
  } else if (requestedRaw <= 2n) {
    issues.push({
      code: "amount_too_low",
      severity: "error",
      title: "Amount too small",
      detail: "Streamflow requires more than 2 base units.",
      fix: "Enter a larger amount or tap Max.",
    });
  } else if (requestedRaw > maxLockable) {
    const required = computeRequiredBalanceRaw(new BN(requestedRaw.toString()), feePercent);
    issues.push({
      code: "amount_too_high",
      severity: "error",
      title: `${symbol} amount too high`,
      detail:
        `Locking ${requestedFormatted} ${symbol} needs ~${getNumberFromBN(required, walletState.decimals)} ${symbol} ` +
        `(includes ~${estimatedSyraFeeFormatted} ${symbol} Streamflow fee). ` +
        `Max lockable: ${maxLockableFormatted} ${symbol}.`,
      fix: "Tap Max — do not type a rounded number like 936K manually.",
    });
  }

  const hasBlockingError = issues.some((i) => i.severity === "error");
  const canLock = !hasBlockingError && requestedRaw > 2n && maxLockable > 2n;

  return {
    canLock,
    solBalanceLamports,
    solRequiredLamports: STREAMFLOW_LOCK_SOL_MIN_LAMPORTS,
    solBalanceFormatted: formatSol(solBalanceLamports),
    solRequiredFormatted: formatSol(STREAMFLOW_LOCK_SOL_MIN_LAMPORTS),
    feePercent,
    walletBalanceRaw: walletState.balance,
    walletBalanceFormatted,
    maxLockableRaw: maxLockable,
    maxLockableFormatted,
    requestedRaw,
    requestedFormatted,
    estimatedSyraFeeFormatted,
    issues,
  };
}

export interface UserLockRow {
  id: string;
  contract?: Stream;
  mint: string;
  sender: string;
  recipient: string;
  depositedRaw: string;
  depositedFormatted: string;
  unlockedRaw: string;
  unlockedFormatted: string;
  withdrawnRaw: string;
  withdrawnFormatted: string;
  unlocksAtUnix: number;
  closed: boolean;
}

function mapContractToRow(id: string, c: Stream, decimals: number): UserLockRow {
  const now = Math.floor(Date.now() / 1000);
  const unlocked = c.unlocked(now);
  return {
    id,
    contract: c,
    mint: c.mint,
    sender: c.sender,
    recipient: c.recipient,
    depositedRaw: c.depositedAmount.toString(),
    depositedFormatted: getNumberFromBN(c.depositedAmount, decimals).toString(),
    unlockedRaw: unlocked.toString(),
    unlockedFormatted: getNumberFromBN(unlocked, decimals).toString(),
    withdrawnRaw: c.withdrawnAmount.toString(),
    withdrawnFormatted: getNumberFromBN(c.withdrawnAmount, decimals).toString(),
    unlocksAtUnix: c.cliff,
    closed: c.closed,
  };
}

/**
 * Fetch user locks using SolanaStreamClient.get() (reads directly from on-chain).
 * Falls back to searchStreams with mint filter if initial fetch returns nothing.
 */
export async function fetchUserTokenLocks(
  connection: Connection,
  wallet: PublicKey
): Promise<UserLockRow[]> {
  const decimals = STREAMFLOW_CONFIG.tokenDecimals;
  const mintStr = STREAMFLOW_CONFIG.tokenMint.toBase58();
  const walletStr = wallet.toBase58();
  const client = createStreamflowClient(connection);

  try {
    const allStreams = await client.get({
      address: walletStr,
      type: StreamType.All,
      direction: StreamDirection.All,
    });

    const rows: UserLockRow[] = [];
    for (const [id, stream] of allStreams) {
      if (stream.closed) continue;
      if (stream.mint !== mintStr) continue;
      rows.push(mapContractToRow(id, stream, decimals));
    }

    return rows.sort((a, b) => a.unlocksAtUnix - b.unlocksAtUnix);
  } catch (err) {
    console.warn("[Streamflow] client.get() failed, trying searchStreams:", err);
  }

  try {
    const results = await client.searchStreams({
      mint: mintStr,
      recipient: walletStr,
    });

    const rows: UserLockRow[] = [];
    for (const { publicKey, account: stream } of results) {
      if (stream.closed) continue;
      rows.push(mapContractToRow(publicKey.toBase58(), stream, decimals));
    }

    return rows.sort((a, b) => a.unlocksAtUnix - b.unlocksAtUnix);
  } catch (err) {
    console.warn("[Streamflow] searchStreams fallback also failed:", err);
    return [];
  }
}

/**
 * Same as fetchUserTokenLocks but includes closed streams (for history / merged state).
 */
export async function fetchUserTokenLocksAll(
  connection: Connection,
  wallet: PublicKey
): Promise<UserLockRow[]> {
  const decimals = STREAMFLOW_CONFIG.tokenDecimals;
  const mintStr = STREAMFLOW_CONFIG.tokenMint.toBase58();
  const walletStr = wallet.toBase58();
  const client = createStreamflowClient(connection);

  try {
    const allStreams = await client.get({
      address: walletStr,
      type: StreamType.All,
      direction: StreamDirection.All,
    });

    const rows: UserLockRow[] = [];
    for (const [id, stream] of allStreams) {
      if (stream.mint !== mintStr) continue;
      rows.push(mapContractToRow(id, stream, decimals));
    }

    return rows.sort((a, b) => a.unlocksAtUnix - b.unlocksAtUnix);
  } catch (err) {
    console.warn("[Streamflow] client.get() (all) failed, trying searchStreams:", err);
  }

  try {
    const results = await client.searchStreams({
      mint: mintStr,
      recipient: walletStr,
    });

    const rows: UserLockRow[] = [];
    for (const { publicKey, account: stream } of results) {
      rows.push(mapContractToRow(publicKey.toBase58(), stream, decimals));
    }

    return rows.sort((a, b) => a.unlocksAtUnix - b.unlocksAtUnix);
  } catch (err) {
    console.warn("[Streamflow] searchStreams (all) fallback also failed:", err);
    return [];
  }
}

export { getNumberFromBN };
