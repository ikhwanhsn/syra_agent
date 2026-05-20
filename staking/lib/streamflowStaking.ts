import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import BN from "bn.js";
import {
  SolanaStreamClient,
  getNumberFromBN,
  ICluster,
  StreamDirection,
  StreamType,
  type ICreateLinearStreamData,
  type Stream,
} from "@streamflow/stream";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";

type StreamflowCreateExt = Parameters<SolanaStreamClient["create"]>[1];

export function createStreamflowClient(connection: Connection): SolanaStreamClient {
  const cluster = STREAMFLOW_CONFIG.isDevnet ? ICluster.Devnet : ICluster.Mainnet;
  return new SolanaStreamClient({
    clusterUrl: STREAMFLOW_CONFIG.rpcEndpoint,
    cluster,
    commitment: "confirmed",
  });
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
 * Fetch the on-chain ATA balance for a given owner/mint, auto-selecting
 * the correct token program. Returns 0n when the ATA doesn't exist yet.
 */
export async function fetchAtaBalance(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ balance: bigint; ata: PublicKey; tokenProgramId: PublicKey }> {
  const tokenProgramId = await resolveTokenProgramId(connection, mint);
  const ata = getAssociatedTokenAddressSync(mint, owner, false, tokenProgramId);
  try {
    const acc = await getAccount(connection, ata, "confirmed", tokenProgramId);
    return { balance: acc.amount, ata, tokenProgramId };
  } catch {
    return { balance: BigInt(0), ata, tokenProgramId };
  }
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
    return new Error(
      `Insufficient ${symbol} balance in your wallet to create this lock. ` +
        `Refresh your balance and try a smaller amount.`
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

export async function createTokenLockStake(
  connection: Connection,
  walletAdapter: SignerWalletAdapter,
  amountRaw: bigint,
  lockDurationSeconds: number
): Promise<CreateLockStakeResult> {
  const sender = walletAdapter.publicKey;
  if (!sender) throw new Error("Wallet not connected");

  const { balance: liveBalance, tokenProgramId } = await fetchAtaBalance(
    connection,
    STREAMFLOW_CONFIG.tokenMint,
    sender
  );

  if (amountRaw > liveBalance) {
    throw new Error(
      `Insufficient ${STREAMFLOW_CONFIG.tokenSymbol} balance. ` +
        `Your wallet has fewer tokens than requested — refresh and try again.`
    );
  }

  const amountBn = new BN(amountRaw.toString());
  const now = Math.floor(Date.now() / 1000);
  const unlockAt = now + lockDurationSeconds;

  const client = createStreamflowClient(connection);
  const params = buildTokenLockCreateParams({
    wallet: sender,
    amountRaw: amountBn,
    unlockAtUnix: unlockAt,
    name: `${STREAMFLOW_CONFIG.tokenSymbol} lock · Syra`,
    tokenProgramId,
  });

  try {
    const { txId, metadataId } = await client.create(params, {
      sender: walletAdapter as unknown as StreamflowCreateExt["sender"],
      isNative: false,
    });
    return { txId, metadataId, unlockAtUnix: unlockAt };
  } catch (err) {
    throw mapStreamflowError(err, STREAMFLOW_CONFIG.tokenSymbol);
  }
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
