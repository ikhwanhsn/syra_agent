import type { Connection, ParsedTransactionMeta } from '@solana/web3.js';
import {
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
} from '@solana/web3.js';
import type { PumpfunChainExecution, PumpfunOnChainDetails } from '@/types/api';

/**
 * Merges playground chain execution into the API JSON body under `playground.chainExecution`
 * so the Body tab is the single source of truth.
 * @returns new body + size, or null if `responseText` is not a JSON object.
 */
export function mergePumpfunChainExecutionIntoResponseBody(
  responseText: string,
  chain: PumpfunChainExecution,
): { body: string; size: number } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const merged = {
    ...(parsed as Record<string, unknown>),
    playground: {
      chainExecution: {
        attempted: chain.attempted,
        status: chain.status,
        signature: chain.signature,
        error: chain.error,
        pumpApiHints: chain.pumpApiHints,
        onChainDetails: chain.onChainDetails,
      },
    },
  };
  const body = JSON.stringify(merged, null, 2);
  return { body, size: new TextEncoder().encode(body).length };
}

/** True when the request targets Syra’s `/pumpfun/*` APIs (requires Solana wallet in the playground). */
export function isSyraPumpfunApiUrl(urlStr: string): boolean {
  try {
    const p = new URL(urlStr.trim()).pathname.toLowerCase();
    return p === '/pumpfun' || p.startsWith('/pumpfun/');
  } catch {
    return false;
  }
}

/** POST endpoints that return `{ transaction: "<base64>" }` from Syra pump.fun proxy. */
const EXECUTABLE_PATHS = new Set([
  '/pumpfun/agents/swap',
  '/pumpfun/agents/create-coin',
  '/pumpfun/agents/collect-fees',
  '/pumpfun/agents/sharing-config',
  '/pumpfun/agent-payments/build-accept',
]);

export function isPumpfunExecutableTxPath(pathnameLower: string): boolean {
  return EXECUTABLE_PATHS.has(pathnameLower);
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  const trimmed = b64.trim();
  const bin = atob(trimmed);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** True if any 64-byte ed25519 slot has a non-zero byte (e.g. upstream pre-signed). */
function hasNonEmptySignatures(vtx: VersionedTransaction): boolean {
  for (const sig of vtx.signatures) {
    if (sig.length > 0 && sig.some((b) => b !== 0)) return true;
  }
  return false;
}

const PUMP_API_HINT_KEYS = [
  'mintPublicKey',
  'quoteTokenAmount',
  'expectedOutAmount',
  'sellAmount',
  'solLamports',
  'creator',
  'isGraduated',
  'usesSharingConfig',
] as const;

function extractPumpApiHints(body: Record<string, unknown>): Record<string, string> | undefined {
  const hints: Record<string, string> = {};
  for (const k of PUMP_API_HINT_KEYS) {
    const v = body[k];
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      hints[k] = String(v);
    }
  }
  return Object.keys(hints).length > 0 ? hints : undefined;
}

function buildTokenDeltas(meta: ParsedTransactionMeta): PumpfunOnChainDetails['tokenDeltas'] {
  const pre = meta.preTokenBalances ?? [];
  const post = meta.postTokenBalances ?? [];
  const key = (b: { accountIndex: number; mint: string }) => `${b.accountIndex}:${b.mint}`;
  const preMap = new Map<string, number>();
  for (const b of pre) {
    const n = b.uiTokenAmount?.uiAmount != null ? Number(b.uiTokenAmount.uiAmount) : 0;
    preMap.set(key(b), n);
  }
  const out: PumpfunOnChainDetails['tokenDeltas'] = [];
  const seen = new Set<string>();
  for (const b of post) {
    const k = key(b);
    seen.add(k);
    const preAmt = preMap.get(k) ?? 0;
    const postAmt = b.uiTokenAmount?.uiAmount != null ? Number(b.uiTokenAmount.uiAmount) : 0;
    const delta = postAmt - preAmt;
    if (delta !== 0) {
      out.push({
        mint: b.mint,
        owner: b.owner,
        uiChange: delta > 0 ? `+${delta}` : String(delta),
      });
    }
  }
  for (const b of pre) {
    const k = key(b);
    if (seen.has(k)) continue;
    const preAmt = b.uiTokenAmount?.uiAmount != null ? Number(b.uiTokenAmount.uiAmount) : 0;
    if (preAmt !== 0) {
      out.push({ mint: b.mint, owner: b.owner, uiChange: String(-preAmt) });
    }
  }
  return out.slice(0, 32);
}

async function fetchParsedTransactionSummary(
  connection: Connection,
  signature: string,
): Promise<PumpfunOnChainDetails | undefined> {
  for (let attempt = 0; attempt < 14; attempt++) {
    const parsed = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    const meta = parsed?.meta;
    if (meta && !meta.err) {
      const feeLamports = meta.fee ?? 0;
      const feeSol = (feeLamports / 1e9).toFixed(6);
      let feePayerSolDeltaLamports: number | undefined;
      let feePayerSolDelta: string | undefined;
      if (
        Array.isArray(meta.preBalances) &&
        Array.isArray(meta.postBalances) &&
        meta.preBalances.length > 0 &&
        meta.postBalances.length > 0
      ) {
        feePayerSolDeltaLamports = meta.postBalances[0] - meta.preBalances[0];
        feePayerSolDelta = (feePayerSolDeltaLamports / 1e9).toFixed(6);
      }
      const blockTimeIso =
        parsed.blockTime != null && parsed.blockTime > 0
          ? new Date(parsed.blockTime * 1000).toISOString()
          : undefined;
      return {
        slot: parsed.slot,
        blockTimeIso,
        feeLamports,
        feeSol,
        computeUnitsConsumed: meta.computeUnitsConsumed ?? undefined,
        feePayerSolDeltaLamports,
        feePayerSolDelta,
        tokenDeltas: buildTokenDeltas(meta),
      };
    }
    await new Promise((r) => setTimeout(r, 450));
  }
  return undefined;
}

/**
 * Rebuild the message with a fresh recentBlockhash so submit works after API / x402 delay.
 * Only safe when no signatures are set yet (rebuilding invalidates existing signatures).
 */
async function refreshVersionedTransactionBlockhash(
  connection: Connection,
  vtx: VersionedTransaction,
): Promise<VersionedTransaction> {
  const msg = vtx.message;
  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

  if (msg.version === 0 && msg.addressTableLookups?.length) {
    for (const lookup of msg.addressTableLookups) {
      const res = await connection.getAddressLookupTable(lookup.accountKey);
      if (res.value) addressLookupTableAccounts.push(res.value);
    }
  }

  const decompileOpts =
    addressLookupTableAccounts.length > 0 ? { addressLookupTableAccounts } : undefined;

  const decompiled = TransactionMessage.decompile(msg, decompileOpts);
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  const rebuilt = new TransactionMessage({
    payerKey: decompiled.payerKey,
    recentBlockhash: blockhash,
    instructions: decompiled.instructions,
  });

  const compiled =
    addressLookupTableAccounts.length > 0
      ? rebuilt.compileToV0Message(addressLookupTableAccounts)
      : rebuilt.compileToV0Message();

  return new VersionedTransaction(compiled);
}

/**
 * After a successful API response, deserialize the returned VersionedTransaction,
 * sign with the connected playground wallet, and broadcast to Solana.
 */
export async function tryExecutePumpfunReturnedTransaction(opts: {
  requestPathnameLower: string;
  responseBodyText: string;
  connection: Connection;
  solanaConnected: boolean;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
}): Promise<PumpfunChainExecution | null> {
  const { requestPathnameLower, responseBodyText, connection, solanaConnected, signTransaction } = opts;

  if (!isPumpfunExecutableTxPath(requestPathnameLower)) return null;

  let bodyJson: Record<string, unknown>;
  try {
    bodyJson = JSON.parse(responseBodyText) as Record<string, unknown>;
  } catch {
    return {
      attempted: true,
      status: 'skipped_parse',
      error: 'Response body is not JSON; cannot submit on-chain.',
    };
  }

  const pumpApiHints = extractPumpApiHints(bodyJson);
  const txB64 = typeof bodyJson.transaction === 'string' ? bodyJson.transaction.trim() : '';
  if (!txB64) {
    return {
      attempted: false,
      status: 'skipped_no_tx_field',
      error: 'Response has no base64 transaction field.',
      pumpApiHints,
    };
  }

  if (!solanaConnected) {
    return {
      attempted: false,
      status: 'skipped_no_wallet',
      error: 'Connect a Solana wallet (header) to sign and submit this transaction.',
      pumpApiHints,
    };
  }

  try {
    const vtx = VersionedTransaction.deserialize(decodeBase64ToBytes(txB64));
    let toSign = vtx;
    if (!hasNonEmptySignatures(vtx)) {
      try {
        toSign = await refreshVersionedTransactionBlockhash(connection, vtx);
      } catch {
        toSign = vtx;
      }
    }

    const signed = await signTransaction(toSign);
    const raw = signed.serialize();

    let signature: string;
    try {
      signature = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3,
      });
    } catch (firstErr) {
      const m = String(firstErr instanceof Error ? firstErr.message : firstErr);
      if (/blockhash|not found|expired/i.test(m)) {
        signature = await connection.sendRawTransaction(raw, {
          skipPreflight: true,
          maxRetries: 3,
        });
      } else {
        throw firstErr;
      }
    }

    const deadline = Date.now() + 60_000;
    let lastErr: unknown;
    let confirmed = false;
    while (Date.now() < deadline) {
      const st = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
      const v = st?.value?.[0];
      if (v?.err) {
        lastErr = v.err;
        break;
      }
      if (v?.confirmationStatus === 'confirmed' || v?.confirmationStatus === 'finalized') {
        confirmed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    if (confirmed) {
      const onChainDetails = await fetchParsedTransactionSummary(connection, signature);
      return {
        attempted: true,
        status: 'confirmed',
        signature,
        pumpApiHints,
        onChainDetails,
      };
    }

    if (lastErr != null) {
      return {
        attempted: true,
        status: 'failed',
        signature,
        pumpApiHints,
        error: typeof lastErr === 'object' ? JSON.stringify(lastErr) : String(lastErr),
      };
    }

    return {
      attempted: true,
      status: 'failed',
      signature,
      pumpApiHints,
      error: 'Confirmation timed out; check the signature on an explorer — the transaction may still land.',
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return {
      attempted: true,
      status: 'failed',
      pumpApiHints,
      error: msg,
    };
  }
}
