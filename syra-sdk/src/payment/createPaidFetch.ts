/**
 * x402 v2 auto-pay fetch — Solana (default), Base, or Algorand.
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

export type CreatePaidFetchOptions = {
  /** Solana base58 or JSON byte array secret. Overrides env. */
  solanaKeypair?: string;
  /** EVM 32-byte hex private key. Overrides env. */
  evmPrivateKey?: string;
  /** algorand | base | solana — overrides X402_PREFERRED_NETWORK */
  network?: "solana" | "base" | "algorand";
};

async function createX402PaidFetch(
  fetchFn: typeof fetch = globalThis.fetch,
  options: CreatePaidFetchOptions = {},
): Promise<typeof fetch> {
  if (options.solanaKeypair) process.env.SYRA_PAYER_KEYPAIR = options.solanaKeypair;
  if (options.evmPrivateKey) process.env.SYRA_EVM_PAYER_PRIVATE_KEY = options.evmPrivateKey;
  if (options.network) process.env.X402_PREFERRED_NETWORK = options.network;

  if (shouldUseAlgorandX402()) return createAlgorandPaidFetch(fetchFn);
  if (shouldUseBaseX402()) return createBasePaidFetch(fetchFn);
  return createSolanaPaidFetch(fetchFn);
}

export async function getPaidFetch(options?: CreatePaidFetchOptions): Promise<typeof fetch> {
  if (!hasPaidFetchConfigured(options)) return globalThis.fetch;
  if (!options && cachedPaidFetch) return cachedPaidFetch;
  const paid = await createX402PaidFetch(globalThis.fetch, options);
  if (!options) cachedPaidFetch = paid;
  return paid;
}

export function hasPaidFetchConfigured(options?: CreatePaidFetchOptions): boolean {
  if (options?.solanaKeypair || options?.evmPrivateKey) return true;
  if (options?.network === "base") {
    return Boolean(firstNonEmptyEnv("SYRA_EVM_PAYER_PRIVATE_KEY", "CMC_PAYER_PRIVATE_KEY"));
  }
  if (options?.network === "algorand") {
    return Boolean(
      firstNonEmptyEnv(
        "SYRA_ALGORAND_PAYER_PRIVATE_KEY",
        "ALGORAND_AGENT_PRIVATE_KEY",
        "AVM_PRIVATE_KEY",
        "ALGORAND_PRIVATE_KEY",
      ),
    );
  }
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

/** Clear cached paid fetch (tests / key rotation). */
export function resetPaidFetchCache(): void {
  cachedPaidFetch = null;
}

export async function createPaidFetchFromKeypair(
  keypair: string,
  network: "solana" | "base" = "solana",
): Promise<typeof fetch> {
  return createX402PaidFetch(globalThis.fetch, {
    solanaKeypair: network === "solana" ? keypair : undefined,
    evmPrivateKey: network === "base" ? keypair : undefined,
    network,
  });
}
