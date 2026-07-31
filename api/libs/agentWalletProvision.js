/**
 * Shared agent wallet provisioning (five pillar treasuries).
 * Legacy :lp wallet system is retired — LP Autopilot signs with the earn pillar.
 */
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import pkg from 'random-avatar-generator';
import AgentWallet from '../models/agent/AgentWallet.js';
import { defaultAllocationConfigForPurpose } from '../config/walletAllocations.js';
import { encryptAgentSecretForStorage } from './agentWalletSecretCrypto.js';
import { isPrivyConfigured, createPrivyServerWallet, getDefaultCustodyMode } from '../services/privyServerWallet.js';
import { LP_REAL_TOOL_IDS } from '../services/policyEngine.js';
import {
  baseAnonymousIdFrom,
  normalizeAgentWalletPurpose,
  PILLAR_WALLET_PURPOSES,
  purposeQuery,
  siblingAnonymousId,
} from './agentWalletPurpose.js';
import { canonicalAnonymousId, resolveSpendBaseForWalletSet, walletAddressQuery } from './agentWalletResolve.js';

const { AvatarGenerator } = pkg;
const avatarGenerator = new AvatarGenerator();

const SPEND_DEFAULT_TOOLS = Object.freeze([
  'news',
  'signal',
  'sentiment',
  'event',
  'trending-headline',
  'sundown-digest',
  'analytics-summary',
  'arbitrage',
  'trending-jupiter',
  'jupiter-swap-order',
  'pumpfun-agents-swap',
  'stablecrypto-coingecko-price',
  'stablecrypto-coingecko-global',
  'stablecrypto-coingecko-trending',
]);

const LP_DEFAULT_TOOLS = Object.freeze([...LP_REAL_TOOL_IDS, 'lp_real_swap']);

/**
 * @param {import('./agentWalletPurpose.js').AgentWalletPurpose} purpose
 */
function policyDefaultsForPurpose(purpose, provisionedVia = 'guest') {
  const p = normalizeAgentWalletPurpose(purpose);
  if (p === 'spend' && provisionedVia === 'telegram') {
    return {
      allowedTools: [],
      perTxCapUsd: 50,
      dailySpendCapUsd: 250,
      hourlySpendCapUsd: 100,
    };
  }
  if (p === 'spend') {
    return {
      allowedTools: [...SPEND_DEFAULT_TOOLS],
      perTxCapUsd: 50,
      dailySpendCapUsd: 250,
      hourlySpendCapUsd: 100,
    };
  }
  if (p === 'invest') {
    return {
      allowedTools: [...LP_REAL_TOOL_IDS, 'jupiter-swap-order'],
      perTxCapUsd: 250,
      dailySpendCapUsd: 2500,
      hourlySpendCapUsd: 400,
    };
  }
  if (p === 'earn') {
    return {
      allowedTools: [
        'register-agent',
        'purch-vault',
        'pumpfun-agents-create-coin',
        'pumpfun-collect-fees',
        ...LP_DEFAULT_TOOLS,
      ],
      // Caps raised so LP Autopilot (now on earn) can open/close Meteora positions.
      perTxCapUsd: 250,
      dailySpendCapUsd: 2500,
      hourlySpendCapUsd: 400,
    };
  }
  if (p === 'treasury') {
    return {
      allowedTools: [],
      perTxCapUsd: 500,
      dailySpendCapUsd: 5000,
      hourlySpendCapUsd: 1000,
    };
  }
  if (p === 'grow') {
    return {
      allowedTools: ['jupiter-swap-order'],
      perTxCapUsd: 100,
      dailySpendCapUsd: 1000,
      hourlySpendCapUsd: 200,
    };
  }
  return {
    allowedTools: [],
    perTxCapUsd: 50,
    dailySpendCapUsd: 250,
    hourlySpendCapUsd: 100,
  };
}

/**
 * @param {{
 *   anonymousId: string;
 *   purpose?: import('./agentWalletPurpose.js').AgentWalletPurpose;
 *   walletAddress?: string | null;
 *   chain?: 'solana' | 'base' | 'bsc';
 *   avatarSeed?: string;
 *   provisionedVia?: 'guest' | 'connect' | 'signin' | 'x402' | 'migration' | 'telegram';
 *   payerAddress?: string | null;
 * }} params
 */
export async function createAgentWalletRecord({
  anonymousId,
  purpose = 'spend',
  walletAddress = null,
  chain = 'solana',
  avatarSeed,
  provisionedVia = 'guest',
  payerAddress = null,
}) {
  const normalizedPurpose = normalizeAgentWalletPurpose(purpose);
  const avatarUrl = avatarGenerator.generateRandomAvatar(avatarSeed || anonymousId);
  const policy = policyDefaultsForPurpose(normalizedPurpose, provisionedVia);
  const allocationConfig = defaultAllocationConfigForPurpose(normalizedPurpose);
  const custody = getDefaultCustodyMode();

  const commonFields = {
    anonymousId,
    walletAddress: walletAddress || undefined,
    chain,
    status: 'active',
    purpose: normalizedPurpose,
    avatarUrl,
    provisionedVia,
    payerAddress: payerAddress || undefined,
    allocationConfig,
    destinationAllowlist: walletAddress ? [walletAddress] : [],
    ...policy,
  };

  if (custody === 'privy' && isPrivyConfigured()) {
    const out = await createPrivyServerWallet({ chain, anonymousId });
    return AgentWallet.create({
      ...commonFields,
      agentAddress: out.agentAddress,
      custody: 'privy',
      privyWalletId: out.privyWalletId,
    });
  }

  const keypair = Keypair.generate();
  const agentAddress = keypair.publicKey.toBase58();
  return AgentWallet.create({
    ...commonFields,
    agentAddress,
    agentSecretKey: encryptAgentSecretForStorage(bs58.encode(keypair.secretKey)),
    custody: 'legacy',
  });
}

/**
 * Ensure all five pillar wallets exist for a base anonymousId.
 * @param {{
 *   baseAnonymousId: string;
 *   walletAddress?: string | null;
 *   chain?: 'solana' | 'base' | 'bsc';
 *   provisionedVia?: 'guest' | 'connect' | 'signin' | 'x402' | 'migration' | 'telegram';
 *   payerAddress?: string | null;
 *   includeLp?: boolean; // ignored — LP wallet system retired
 * }} params
 */
export async function ensureAgentWalletSet({
  baseAnonymousId,
  walletAddress = null,
  chain = 'solana',
  provisionedVia = 'guest',
  payerAddress = null,
}) {
  const resolved = await resolveSpendBaseForWalletSet({
    anonymousId: baseAnonymousId,
    walletAddress,
    chain,
  });
  const base = resolved.baseAnonymousId;
  const linkedWalletAddress = walletAddress || resolved.spendDoc?.walletAddress || null;

  const purposes = [...PILLAR_WALLET_PURPOSES];
  const wallets = {};

  for (const purpose of purposes) {
    const id = siblingAnonymousId(base, purpose);
    if (!id) continue;

    let doc = await AgentWallet.findOne({ anonymousId: id, status: { $ne: 'retired' } }).lean();
    if (!doc && linkedWalletAddress) {
      doc = await AgentWallet.findOne({
        ...walletAddressQuery(linkedWalletAddress, chain, purpose),
        status: { $ne: 'retired' },
      }).lean();
    }
    if (!doc) {
      try {
        await createAgentWalletRecord({
          anonymousId: id,
          purpose,
          walletAddress: linkedWalletAddress,
          chain,
          avatarSeed: id,
          provisionedVia,
          payerAddress: purpose === 'spend' ? payerAddress : null,
        });
      } catch (err) {
        // Concurrent connect/sign-in requests may race on the same sibling row (E11000) — tolerate
        // that and re-read below. Any other error means provisioning genuinely failed.
        if (err?.code !== 11000) {
          console.error(
            `[agentWalletProvision] create failed for ${id} (purpose=${purpose}):`,
            err?.name,
            err?.message,
            err?.status ?? err?.statusCode ?? '',
            err?.body ? JSON.stringify(err.body) : '',
          );
          throw err;
        }
      }
      doc = await AgentWallet.findOne({ anonymousId: id, status: { $ne: 'retired' } }).lean();
      if (!doc && linkedWalletAddress) {
        doc = await AgentWallet.findOne({
          ...walletAddressQuery(linkedWalletAddress, chain, purpose),
          status: { $ne: 'retired' },
        }).lean();
      }
      if (!doc) throw new Error(`agent_wallet_provision_failed:${purpose}`);
    } else if (linkedWalletAddress && !doc.walletAddress) {
      await AgentWallet.updateOne(
        { _id: doc._id },
        { $set: { walletAddress: linkedWalletAddress, chain } },
      );
      doc = await AgentWallet.findOne({ _id: doc._id }).lean();
    }

    wallets[purpose] = {
      anonymousId: doc.anonymousId,
      agentAddress: doc.agentAddress,
      avatarUrl: doc.avatarUrl || null,
      purpose: doc.purpose || purpose,
      provisionedVia: doc.provisionedVia || provisionedVia,
      isNewWallet: false,
    };
  }

  return { baseAnonymousId: base, wallets };
}

/**
 * Serialize wallet set for API responses.
 * @param {Awaited<ReturnType<typeof ensureAgentWalletSet>>} set
 */
export function walletSetResponseFields(set) {
  const w = set.wallets;
  return {
    anonymousId: set.baseAnonymousId,
    agentAddress: w.spend?.agentAddress ?? null,
    avatarUrl: w.spend?.avatarUrl ?? null,
    purpose: 'spend',
    wallets: Object.fromEntries(
      Object.entries(w).map(([purpose, row]) => [
        purpose,
        {
          anonymousId: row.anonymousId,
          agentAddress: row.agentAddress,
          avatarUrl: row.avatarUrl,
          purpose: row.purpose,
          provisionedVia: row.provisionedVia,
        },
      ]),
    ),
    // Legacy LP fields always null — :lp wallet system retired (use earn).
    lpAnonymousId: null,
    lpAgentAddress: null,
    lpAvatarUrl: null,
  };
}

/**
 * Find linked spend wallet by user wallet address.
 * @param {string} walletAddress
 * @param {'solana'|'base'|'bsc'} chain
 */
export async function findLinkedChatWallet(walletAddress, chain = 'solana') {
  const base =
    chain === 'base'
      ? { walletAddress, chain: 'base', ...purposeQuery('spend') }
      : chain === 'bsc'
        ? { walletAddress, chain: 'bsc', ...purposeQuery('spend') }
        : {
            walletAddress,
            ...purposeQuery('spend'),
            $or: [{ chain: 'solana' }, { chain: { $exists: false } }, { chain: null }],
          };
  return AgentWallet.findOne({ ...base, status: { $ne: 'retired' } }).lean();
}

/**
 * Retire an agent wallet so a fresh one can be provisioned later.
 * @param {string} anonymousId
 */
export async function retireAgentWalletRecord(anonymousId) {
  const id = typeof anonymousId === 'string' ? anonymousId.trim() : '';
  if (!id) throw new Error('anonymous_id_required');

  const doc = await AgentWallet.findOne({ anonymousId: id, status: { $ne: 'retired' } });
  if (!doc) return null;

  const retiredAnonymousId = `retired:${Date.now()}:${id}`.slice(0, 240);

  await AgentWallet.updateOne(
    { _id: doc._id },
    {
      $set: {
        status: 'retired',
        anonymousId: retiredAnonymousId,
        walletAddress: null,
        agentSecretKey: null,
      },
    },
  );

  return {
    previousAnonymousId: id,
    retiredAnonymousId,
    purpose: normalizeAgentWalletPurpose(doc.purpose),
  };
}

/**
 * Retire spend wallet and all pillar siblings (and legacy :lp if still present).
 * @param {string} chatOrSiblingAnonymousId
 */
export async function retireAgentWalletWithSibling(chatOrSiblingAnonymousId) {
  const base = baseAnonymousIdFrom(chatOrSiblingAnonymousId);
  if (!base) throw new Error('anonymous_id_required');

  const results = [];
  const ids = [
    base,
    ...PILLAR_WALLET_PURPOSES.filter((p) => p !== 'spend').map((p) => siblingAnonymousId(base, p)),
    `${base}:lp`, // retire legacy LP sibling if it still exists
  ].filter(Boolean);

  for (const id of ids) {
    const result = await retireAgentWalletRecord(id);
    if (result) results.push(result);
  }

  return results;
}

/**
 * Provision wallets for an external x402 payer on first successful settlement.
 * @param {{ payerAddress: string; chain?: 'solana' | 'base' | 'bsc' }} params
 */
export async function provisionWalletsForX402Payer({ payerAddress, chain = 'solana' }) {
  const address = typeof payerAddress === 'string' ? payerAddress.trim() : '';
  if (!address) return null;

  const baseAnonymousId = canonicalAnonymousId(address, chain, 'spend');
  const set = await ensureAgentWalletSet({
    baseAnonymousId,
    walletAddress: address,
    chain,
    provisionedVia: 'x402',
    payerAddress: address,
  });

  return set;
}

/** @deprecated LP wallet system retired — always false. */
export function shouldIncludeLpWallet() {
  return false;
}

/** @deprecated LP wallet system retired. */
export async function getOrCreateLpAgentWallet() {
  throw new Error('lp_wallet_retired — use earn wallet for LP Autopilot');
}

/** @deprecated LP wallet system retired — returns null fields. */
export async function lpWalletResponseFields() {
  return {
    lpAnonymousId: null,
    lpAgentAddress: null,
    lpAvatarUrl: null,
    lpIsNewWallet: false,
  };
}

/** @deprecated LP wallet system retired. */
export async function ensureLpAgentWalletForUser() {
  return null;
}

/** @deprecated LP wallet system retired. */
export async function findLinkedLpWallet() {
  return null;
}
