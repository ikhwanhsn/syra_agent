/**
 * B402 BSC EIP-3009 signing (TransferWithAuthorization).
 * Uses the full `extra` from the 402 accept (name, version from /supported) — not Base USDC defaults.
 */
import { createPublicClient, getAddress, http, recoverTypedDataAddress, type Address, type Hex } from 'viem';
import { bsc } from 'viem/chains';
import type {
  EvmSigner,
  PaymentResult,
  X402PaymentOption,
  X402ResourceInfo,
} from '@/lib/x402Client';
import {
  BSC_MAINNET_CAIP2,
  BSC_USD1_MAINNET,
  createEvmPaymentHeader,
} from '@/lib/x402Client';

const X402_VERSION = 2;

const authorizationTypes = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

function parseEvmChainId(network: string): number {
  const parts = String(network || '').split(':');
  const id = Number.parseInt(parts[parts.length - 1] ?? '', 10);
  if (!Number.isFinite(id)) {
    throw new Error(`Invalid EVM network for B402: ${network}`);
  }
  return id;
}

function createNonce(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}` as Hex;
}

function resolveBscAsset(option: X402PaymentOption): Address {
  const raw = option._raw ?? option;
  const candidate = String(
    option.asset ?? (raw as { asset?: string }).asset ?? (raw as { price?: { asset?: string } }).price?.asset ?? ''
  ).trim();
  if (candidate.toLowerCase().startsWith('0x')) {
    return getAddress(candidate as Address);
  }
  return getAddress(BSC_USD1_MAINNET);
}

function resolveEip712Extra(option: X402PaymentOption): { name: string; version: string } {
  const raw = option._raw ?? option;
  const extra =
    (option.extra && typeof option.extra === 'object' ? option.extra : null) ??
    ((raw as { extra?: Record<string, unknown> }).extra ?? {});
  const nested =
    extra.eip712 && typeof extra.eip712 === 'object'
      ? (extra.eip712 as { name?: string; version?: string })
      : {};
  const name = String(extra.name ?? nested.name ?? '').trim();
  const version = String(extra.version ?? nested.version ?? '').trim();
  if (!name || !version) {
    throw new Error(
      'B402 payment is missing EIP-712 domain (extra.name / extra.version). Refresh the 402 response and try again.'
    );
  }
  return { name, version };
}

function buildPaymentRequirements(option: X402PaymentOption) {
  const { name, version } = resolveEip712Extra(option);
  const network = String(option.network || BSC_MAINNET_CAIP2);
  const amount = String(option.amount ?? '0');
  if (amount === '0' || BigInt(amount) <= 0n) {
    throw new Error('B402 requires a non-zero payment amount. Refresh the request and try again.');
  }
  return {
    scheme: 'exact' as const,
    payTo: getAddress(option.payTo as Address),
    amount,
    maxTimeoutSeconds: option.maxTimeoutSeconds ?? 60,
    network,
    asset: resolveBscAsset(option),
    extra: { name, version },
  };
}

async function verifySignatureLocally(
  requirements: ReturnType<typeof buildPaymentRequirements>,
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: Hex;
  },
  signature: Hex
): Promise<boolean> {
  const chainId = parseEvmChainId(requirements.network);
  const domain = {
    name: requirements.extra.name,
    version: requirements.extra.version,
    chainId,
    verifyingContract: requirements.asset,
  };
  const message = {
    from: getAddress(authorization.from as Address),
    to: getAddress(authorization.to as Address),
    value: BigInt(authorization.value),
    validAfter: BigInt(authorization.validAfter),
    validBefore: BigInt(authorization.validBefore),
    nonce: authorization.nonce,
  };
  try {
    const recovered = await recoverTypedDataAddress({
      domain,
      types: authorizationTypes,
      primaryType: 'TransferWithAuthorization',
      message,
      signature,
    });
    return getAddress(recovered) === getAddress(authorization.from as Address);
  } catch {
    return false;
  }
}

/**
 * Sign B402 EIP-3009 payment for BSC and return x402 v2 PAYMENT-SIGNATURE payload.
 */
export async function signB402Eip3009Payment(
  evmSigner: EvmSigner,
  paymentOption: X402PaymentOption,
  resourceUrl?: string,
  resourceFrom402?: X402ResourceInfo
): Promise<PaymentResult> {
  try {
    const method = paymentOption.extra?.assetTransferMethod;
    if (method && method !== 'eip3009') {
      return {
        success: false,
        error: `Token uses ${method}; use USD1 or U (EIP-3009) in the playground Binance tab.`,
      };
    }

    const requirements = buildPaymentRequirements(paymentOption);
    const requiredValue = BigInt(requirements.amount);
    try {
      const client = createPublicClient({ chain: bsc, transport: http() });
      const balance = await client.readContract({
        address: requirements.asset,
        abi: [
          {
            name: 'balanceOf',
            type: 'function',
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
          },
        ] as const,
        functionName: 'balanceOf',
        args: [getAddress(evmSigner.address as Address)],
      });
      if (balance < requiredValue) {
        const approxUsd = Number(requiredValue) / 1e18;
        return {
          success: false,
          error:
            `Insufficient USD1 on BSC. Add at least ~$${approxUsd.toFixed(6)} USD1 ` +
            `to ${evmSigner.address} on BNB Smart Chain, then pay again.`,
        };
      }
    } catch {
      /* RPC unavailable — B402 settle will surface balance errors */
    }

    const nonce = createNonce();
    const now = Math.floor(Date.now() / 1000);
    const authWindowSec = Math.max(requirements.maxTimeoutSeconds ?? 60, 300);
    const authorization = {
      from: getAddress(evmSigner.address as Address),
      to: requirements.payTo,
      value: requirements.amount,
      validAfter: String(now - 600),
      validBefore: String(now + authWindowSec),
      nonce,
    };

    const signature = await evmSigner.signTypedData({
      domain: {
        name: requirements.extra.name,
        version: requirements.extra.version,
        chainId: parseEvmChainId(requirements.network),
        verifyingContract: requirements.asset,
      },
      types: authorizationTypes,
      primaryType: 'TransferWithAuthorization',
      message: {
        from: authorization.from,
        to: authorization.to,
        value: BigInt(authorization.value),
        validAfter: BigInt(authorization.validAfter),
        validBefore: BigInt(authorization.validBefore),
        nonce: authorization.nonce,
      },
    });

    const sigHex = signature as Hex;
    const ok = await verifySignatureLocally(requirements, authorization, sigHex);
    if (!ok) {
      return {
        success: false,
        error:
          `EIP-712 signature check failed. Confirm MetaMask is on BSC (chain 56), ` +
          `you have USD1 (${requirements.asset}), and the wallet that signed matches ${authorization.from}.`,
      };
    }

    const paymentHeader = createEvmPaymentHeader(
      { authorization, signature: sigHex },
      paymentOption,
      resourceUrl,
      resourceFrom402
    );

    return { success: true, paymentHeader };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg || 'B402 payment signing failed' };
  }
}
