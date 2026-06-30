/**
 * x402 v2 auto-pay fetch for Syra MCP — aligned with api/libs/agentX402Client.js + sentinelPayer.js.
 *
 * Uses @x402/fetch + x402Client + ExactSvmScheme (default), with optional Base (EVM) or Algorand rails.
 * Reads Payment-Required header (v2) and sends PAYMENT-SIGNATURE on retry.
 *
 * Env (Solana — default):
 * - SYRA_PAYER_KEYPAIR or PAYER_KEYPAIR — base58 or JSON byte array
 * - SYRA_SOLANA_RPC_URL / SOLANA_RPC_URL / SOLANA_RPC_BLOCKCHAIN_URL / SOLANA_RPC_FALLBACK_URL
 *
 * Env (Base EVM — set X402_PREFERRED_NETWORK=base):
 * - SYRA_EVM_PAYER_PRIVATE_KEY or CMC_PAYER_PRIVATE_KEY — 32-byte hex (optional 0x)
 * - BASE_BUILDER_CODE or SYRA_BASE_BUILDER_CODE — optional Base builder attribution
 *
 * Env (Algorand — set X402_PREFERRED_NETWORK=algorand):
 * - SYRA_ALGORAND_PAYER_PRIVATE_KEY or ALGORAND_AGENT_PRIVATE_KEY or AVM_PRIVATE_KEY
 */
import { firstNonEmptyEnv, parseSolanaKeypairBytes } from "./parseKeypair.js";
import { registerBuilderCodeClientExtension, registerRequiredExtensionsHook, type X402ClientLike } from "./x402Extensions.js";
import { shouldUseAlgorandX402, shouldUseBaseX402 } from "./x402Network.js";
import { getSvmRpcUrlForX402, isRpcBlockchainAccessError, switchToFallbackRpc } from "./x402Rpc.js";
import { wrapPaidFetchWithRetries } from "./paidFetchRetry.js";

let cachedPaidFetch: typeof fetch | null = null;

async function createSolanaPaidFetch(fetchFn: typeof fetch): Promise<typeof fetch> {
  const keypairRaw = firstNonEmptyEnv("SYRA_PAYER_KEYPAIR", "PAYER_KEYPAIR");
  if (!keypairRaw) throw new Error("SYRA_PAYER_KEYPAIR (or PAYER_KEYPAIR) must be set for Solana x402 auto-pay");

  const secretBytes = parseSolanaKeypairBytes(keypairRaw);
  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactSvmScheme } = await import("@x402/svm/exact/client");

  async function buildPaymentFetch(): Promise<typeof fetch> {
    const signer = await createKeyPairSignerFromBytes(secretBytes);
    const scheme = new ExactSvmScheme(signer, { rpcUrl: getSvmRpcUrlForX402() });
    const client = x402Client.fromConfig({ schemes: [{ network: "solana:*", client: scheme }] });
    registerRequiredExtensionsHook(client as unknown as X402ClientLike);
    return wrapFetchWithPayment(fetchFn, client);
  }

  try {
    return wrapPaidFetchWithRetries(await buildPaymentFetch());
  } catch (error) {
    if (!isRpcBlockchainAccessError(error)) throw error;
    switchToFallbackRpc();
    return wrapPaidFetchWithRetries(await buildPaymentFetch());
  }
}

async function createBasePaidFetch(fetchFn: typeof fetch): Promise<typeof fetch> {
  const raw = firstNonEmptyEnv("SYRA_EVM_PAYER_PRIVATE_KEY", "CMC_PAYER_PRIVATE_KEY");
  if (!raw) {
    throw new Error("SYRA_EVM_PAYER_PRIVATE_KEY (or CMC_PAYER_PRIVATE_KEY) must be set for Base x402 auto-pay");
  }

  let hex = raw.startsWith("0x") || raw.startsWith("0X") ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("EVM payer private key must be 32-byte hex (64 chars, optional 0x prefix)");
  }

  const { privateKeyToAccount } = await import("viem/accounts");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactEvmScheme } = await import("@x402/evm/exact/client");

  const account = privateKeyToAccount(`0x${hex}` as `0x${string}`);
  const scheme = new ExactEvmScheme(account);
  const client = x402Client.fromConfig({ schemes: [{ network: "eip155:*", client: scheme }] });
  registerRequiredExtensionsHook(client as unknown as X402ClientLike);
  await registerBuilderCodeClientExtension(client as unknown as X402ClientLike);
  return wrapPaidFetchWithRetries(wrapFetchWithPayment(fetchFn, client));
}

async function createAlgorandPaidFetch(fetchFn: typeof fetch): Promise<typeof fetch> {
  const key = firstNonEmptyEnv(
    "SYRA_ALGORAND_PAYER_PRIVATE_KEY",
    "ALGORAND_AGENT_PRIVATE_KEY",
    "AVM_PRIVATE_KEY",
    "ALGORAND_PRIVATE_KEY",
  );
  if (!key) {
    throw new Error(
      "SYRA_ALGORAND_PAYER_PRIVATE_KEY (or ALGORAND_AGENT_PRIVATE_KEY) must be set for Algorand x402 auto-pay",
    );
  }

  const { toClientAvmSigner } = await import("@x402-avm/avm");
  const { registerExactAvmScheme } = await import("@x402-avm/avm/exact/client");
  const { wrapFetchWithPayment } = await import("@x402-avm/fetch");
  const { x402Client } = await import("@x402-avm/core/client");

  const DEFAULT_ALGOD_MAINNET = "https://mainnet-api.algonode.cloud";
  const DEFAULT_ALGOD_TESTNET = "https://testnet-api.algonode.cloud";
  const preferred = String(process.env.X402_PREFERRED_NETWORK || "").toLowerCase();
  const algodUrl =
    preferred === "algorand-testnet"
      ? String(process.env.ALGOD_TESTNET_URL || DEFAULT_ALGOD_TESTNET).trim()
      : String(process.env.ALGOD_MAINNET_URL || DEFAULT_ALGOD_MAINNET).trim();

  const signer = toClientAvmSigner(key);
  const client = new x402Client((_version, requirements) => {
    const list = Array.isArray(requirements) ? requirements : [];
    const algo = list.find((r) => String(r?.network || "").startsWith("algorand:"));
    return algo || list[0];
  });
  registerExactAvmScheme(client, {
    signer,
    algodConfig: {
      algodUrl,
      ...(String(process.env.ALGOD_TOKEN || "").trim()
        ? { algodToken: String(process.env.ALGOD_TOKEN).trim() }
        : {}),
    },
  });

  return wrapPaidFetchWithRetries(wrapFetchWithPayment(fetchFn, client));
}

async function createX402PaidFetch(fetchFn: typeof fetch = globalThis.fetch): Promise<typeof fetch> {
  if (shouldUseAlgorandX402()) return createAlgorandPaidFetch(fetchFn);
  if (shouldUseBaseX402()) return createBasePaidFetch(fetchFn);
  return createSolanaPaidFetch(fetchFn);
}

export async function getPaidFetch(): Promise<typeof fetch> {
  if (!hasPaidFetchConfigured()) return globalThis.fetch;
  if (!cachedPaidFetch) {
    cachedPaidFetch = await createX402PaidFetch(globalThis.fetch);
  }
  return cachedPaidFetch;
}

/** True when any payer credential is configured for the active X402_PREFERRED_NETWORK rail. */
export function hasPaidFetchConfigured(): boolean {
  if (shouldUseAlgorandX402()) {
    return Boolean(
      firstNonEmptyEnv(
        "SYRA_ALGORAND_PAYER_PRIVATE_KEY",
        "ALGORAND_AGENT_PRIVATE_KEY",
        "AVM_PRIVATE_KEY",
        "ALGORAND_PRIVATE_KEY",
      ),
    );
  }
  if (shouldUseBaseX402()) {
    return Boolean(firstNonEmptyEnv("SYRA_EVM_PAYER_PRIVATE_KEY", "CMC_PAYER_PRIVATE_KEY"));
  }
  return Boolean(firstNonEmptyEnv("SYRA_PAYER_KEYPAIR", "PAYER_KEYPAIR"));
}

export function getPaidFetchNetworkLabel(): string {
  if (shouldUseAlgorandX402()) return "algorand";
  if (shouldUseBaseX402()) return "base";
  return "solana";
}

/** @deprecated Use getPaidFetch — kept for tests */
export async function createPaidFetch(keypairEnv: string): Promise<typeof fetch> {
  process.env.SYRA_PAYER_KEYPAIR = keypairEnv;
  cachedPaidFetch = null;
  return getPaidFetch();
}
