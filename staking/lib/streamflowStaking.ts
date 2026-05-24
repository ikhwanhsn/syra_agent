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

/** Minimum SOL required for Streamflow metadata + escrow rent. */
const MIN_SOL_FOR_LOCK_LAMPORTS = Math.floor(0.005 * LAMPORTS_PER_SOL);

const FEE_MULTIPLIER_BN = new BN(1_000_000);
const FEE_NORMALIZER = 10_000;

/** Extra base units reserved so fee rounding + simulation never exceeds ATA balance. */
const STAKE_AMOUNT_BUFFER_RAW = 10_000n;

export interface WalletMintState {
  balance: bigint;
  ata: PublicKey;
  tokenProgramId: PublicKey;
  decimals: number;
  ataExists: boolean;
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

  const bufferBn = new BN(STAKE_AMOUNT_BUFFER_RAW.toString());
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

  try {
    const acc = await getAccount(connection, ata, "confirmed", tokenProgramId);
    return {
      balance: acc.amount,
      ata,
      tokenProgramId,
      decimals,
      ataExists: true,
    };
  } catch {
    return {
      balance: BigInt(0),
      ata,
      tokenProgramId,
      decimals,
      ataExists: false,
    };
  }
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

/**
 * Translate raw Streamflow / Solana send errors into clear user-facing strings.
 * Falls back to the original message if no known pattern is found.
 */
export function mapStreamflowError(err: unknown, symbol: string): Error {
  const raw = err instanceof Error ? err.message : String(err);
  const logs: string[] | undefined =
    err && typeof err === "object" && "logs" in err
      ? ((err as { logs?: string[] }).logs ?? undefined)
      : undefined;
  const haystack = [raw, ...(logs ?? [])].join("\n").toLowerCase();

  if (haystack.includes("insufficient funds") || haystack.includes("insufficientfunds")) {
    const mentionsSol =
      haystack.includes("system program") ||
      haystack.includes("11111111111111111111111111111111");
    if (mentionsSol) {
      return new Error(
        "Not enough SOL in this wallet to pay Streamflow account rent. " +
          "Keep at least 0.005 SOL and try again."
      );
    }
    return new Error(
      `Insufficient ${symbol} in your token account for this lock. ` +
        `Use Max (not your full wallet display if it includes other tokens) or enter a smaller amount.`
    );
  }
  if (
    haystack.includes("0x1") &&
    (haystack.includes("system program") || haystack.includes("transfer"))
  ) {
    return new Error(
      `Not enough SOL to pay for Streamflow account rent. Add a small amount of SOL and retry.`
    );
  }
  if (haystack.includes("blockhash not found") || haystack.includes("block height exceeded")) {
    return new Error("Network was slow — your transaction expired. Please try again.");
  }
  if (haystack.includes("user rejected") || haystack.includes("rejected the request")) {
    return new Error("Transaction was rejected in your wallet.");
  }
  return err instanceof Error ? err : new Error(raw);
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
  if (solBalance < MIN_SOL_FOR_LOCK_LAMPORTS) {
    throw new Error(
      `Not enough SOL to open a Streamflow lock (need ~0.005 SOL for rent). ` +
        `You have ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL — add SOL and retry.`
    );
  }

  if (!walletState.ataExists || walletState.balance <= 0n) {
    throw new Error(
      `No ${symbol} token account found for this wallet on ${STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet"}. ` +
        `Receive ${symbol} in your wallet first, then try again.`
    );
  }

  const amountBn = new BN(amountRaw.toString());
  const feePercent = await client.getTotalFee({ address: sender.toBase58() });
  const requiredRaw = BigInt(computeRequiredBalanceRaw(amountBn, feePercent).toString());

  if (requiredRaw > walletState.balance) {
    const maxDeposit = computeMaxDepositRaw(
      new BN(walletState.balance.toString()),
      feePercent
    );
    throw new Error(
      `Insufficient ${symbol} balance. ` +
        `This lock needs ${requiredRaw.toString()} base units` +
        (feePercent > 0 ? ` (includes Streamflow fee ~${feePercent}%)` : "") +
        ` but your account has ${walletState.balance.toString()}.` +
        (maxDeposit.gt(new BN(2))
          ? ` Use Max or enter at most ${getNumberFromBN(maxDeposit, walletState.decimals)} ${symbol}.`
          : "")
    );
  }
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
    throw new Error(
      `Amount too small to lock ${STREAMFLOW_CONFIG.tokenSymbol}. Use Max or enter a larger amount.`
    );
  }

  const walletState = resolved.walletState;
  const stakeRaw = resolved.amountRaw;

  const amountBn = new BN(stakeRaw.toString());
  const now = Math.floor(Date.now() / 1000);
  const unlockAt = now + lockDurationSeconds;

  const client = createStreamflowClient(connection);
  await assertStakePreflight(connection, client, sender, stakeRaw, walletState);

  const params = buildTokenLockCreateParams({
    wallet: sender,
    amountRaw: amountBn,
    unlockAtUnix: unlockAt,
    name: `${STREAMFLOW_CONFIG.tokenSymbol} lock · Syra`,
    tokenProgramId: walletState.tokenProgramId,
  });

  const ext: StreamflowCreateExt = {
    sender: walletAdapter as unknown as StreamflowCreateExt["sender"],
    isNative: false,
  };

  try {
    const { tx } = await client.buildCreateTransaction(params, ext);
    const simulation = await client.getConnection().simulateTransaction(tx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });
    if (simulation.value.err) {
      throw mapStreamflowError(
        {
          message: JSON.stringify(simulation.value.err),
          logs: simulation.value.logs ?? undefined,
        },
        STREAMFLOW_CONFIG.tokenSymbol
      );
    }

    const { txId, metadataId } = await client.create(params, ext);
    return {
      txId,
      metadataId,
      unlockAtUnix: unlockAt,
      amountRaw: stakeRaw,
      wasClamped: resolved.wasClamped,
    };
  } catch (err) {
    throw mapStreamflowError(err, STREAMFLOW_CONFIG.tokenSymbol);
  }
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
