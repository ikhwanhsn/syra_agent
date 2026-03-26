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
  type IWithdrawData,
  type Stream,
} from "@streamflow/stream";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";

type StreamflowCreateExt = Parameters<SolanaStreamClient["create"]>[1];
type StreamflowWithdrawExt = Parameters<SolanaStreamClient["withdraw"]>[1];

export function createStreamflowClient(connection: Connection): SolanaStreamClient {
  const cluster = STREAMFLOW_CONFIG.isDevnet ? ICluster.Devnet : ICluster.Mainnet;
  return new SolanaStreamClient({
    clusterUrl: STREAMFLOW_CONFIG.rpcEndpoint,
    cluster,
    commitment: "confirmed",
  });
}

export function buildTokenLockCreateParams(args: {
  wallet: PublicKey;
  amountRaw: BN;
  unlockAtUnix: number;
  name: string;
}): ICreateLinearStreamData {
  const { wallet, amountRaw, unlockAtUnix, name } = args;
  if (amountRaw.lte(new BN(1))) {
    throw new Error("Amount too small for a Streamflow token lock (min 2 base units).");
  }

  const cliffAmount = amountRaw.subn(1);

  return {
    recipient: wallet.toBase58(),
    tokenId: STREAMFLOW_CONFIG.tokenMint.toBase58(),
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

export async function createTokenLockStake(
  connection: Connection,
  walletAdapter: SignerWalletAdapter,
  amountRaw: bigint,
  lockDurationSeconds: number
): Promise<CreateLockStakeResult> {
  const sender = walletAdapter.publicKey;
  if (!sender) throw new Error("Wallet not connected");

  const amountBn = new BN(amountRaw.toString());
  const now = Math.floor(Date.now() / 1000);
  const unlockAt = now + lockDurationSeconds;

  const client = createStreamflowClient(connection);
  const params = buildTokenLockCreateParams({
    wallet: sender,
    amountRaw: amountBn,
    unlockAtUnix: unlockAt,
    name: `${STREAMFLOW_CONFIG.tokenSymbol} lock · Syra`,
  });

  const { txId, metadataId } = await client.create(params, {
    sender: walletAdapter as unknown as StreamflowCreateExt["sender"],
    isNative: false,
  });

  return { txId, metadataId, unlockAtUnix: unlockAt };
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

export async function withdrawFromLock(
  connection: Connection,
  walletAdapter: SignerWalletAdapter,
  streamId: string,
  amountRaw?: bigint
): Promise<string> {
  const invoker = walletAdapter.publicKey;
  if (!invoker) throw new Error("Wallet not connected");

  const client = createStreamflowClient(connection);
  const data: IWithdrawData = {
    id: streamId,
    amount: amountRaw !== undefined ? new BN(amountRaw.toString()) : undefined,
  };

  const { txId } = await client.withdraw(data, {
    invoker: walletAdapter as unknown as StreamflowWithdrawExt["invoker"],
  });

  return txId;
}

export { getNumberFromBN };
