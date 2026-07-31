#!/usr/bin/env node
/**
 * Audit all :lp agent wallets — balances, open positions, earn sibling status.
 * Usage: cd api && node -r dotenv/config scripts/audit-lp-wallets.js
 */
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch { /* ignore */ }
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import LpRealPosition from '../models/LpRealPosition.js';
import { snapshotAgentBalances } from '../libs/agentWalletSweep.js';
import { baseAnonymousIdFrom, siblingAnonymousId } from '../libs/agentWalletPurpose.js';

await connectMongoose();

const lpWallets = await AgentWallet.find({
  purpose: 'lp',
  status: { $ne: 'retired' },
})
  .select('anonymousId agentAddress walletAddress status purpose chain createdAt')
  .lean();

// Also find retired ones that may still hold funds (agentAddress still set)
const retiredLp = await AgentWallet.find({
  purpose: 'lp',
  status: 'retired',
})
  .select('anonymousId agentAddress walletAddress status purpose')
  .lean();

console.log(`Active/non-retired :lp wallets: ${lpWallets.length}`);
console.log(`Retired :lp wallets: ${retiredLp.length}`);

const rows = [];
for (const lp of [...lpWallets, ...retiredLp]) {
  const base = baseAnonymousIdFrom(lp.anonymousId.replace(/^retired:\d+:/, '')) || lp.anonymousId;
  // For retired ids like retired:ts:wallet:ADDR:lp, strip retired prefix first
  let cleanId = lp.anonymousId;
  if (cleanId.startsWith('retired:')) {
    const parts = cleanId.split(':');
    // retired:TIMESTAMP:rest...
    cleanId = parts.slice(2).join(':');
  }
  const baseClean = baseAnonymousIdFrom(cleanId) || cleanId.replace(/:lp$/, '');
  const earnId = siblingAnonymousId(baseClean, 'earn');
  const earn = earnId
    ? await AgentWallet.findOne({ anonymousId: earnId, status: { $ne: 'retired' } })
        .select('anonymousId agentAddress status')
        .lean()
    : null;

  let balances = null;
  let balError = null;
  if (lp.agentAddress) {
    try {
      balances = await snapshotAgentBalances(lp.agentAddress);
    } catch (e) {
      balError = e?.message || String(e);
    }
  }

  const openCount = lp.agentAddress
    ? await LpRealPosition.countDocuments({
        agentAddress: lp.agentAddress,
        status: { $in: ['open', 'opening', 'closing'] },
      })
    : 0;

  const hasFunds =
    balances &&
    (balances.sol > 0.003 || (balances.tokens && balances.tokens.length > 0));

  rows.push({
    lpAnonymousId: lp.anonymousId,
    lpAgentAddress: lp.agentAddress,
    lpStatus: lp.status,
    ownerWallet: lp.walletAddress || null,
    earnAnonymousId: earn?.anonymousId || earnId || null,
    earnAgentAddress: earn?.agentAddress || null,
    openPositions: openCount,
    sol: balances?.sol ?? null,
    tokenCount: balances?.tokens?.length ?? null,
    tokens: balances?.tokens?.map((t) => ({ mint: t.mint.slice(0, 8), uiAmount: t.uiAmount })) ?? null,
    hasFunds: Boolean(hasFunds),
    balError,
  });
}

const withFunds = rows.filter((r) => r.hasFunds);
const withOpen = rows.filter((r) => r.openPositions > 0);
const missingEarn = rows.filter((r) => !r.earnAgentAddress && r.hasFunds);

console.log(JSON.stringify({
  totalLpRows: rows.length,
  withFunds: withFunds.length,
  withOpenPositions: withOpen.length,
  missingEarnSibling: missingEarn.length,
  wallets: rows,
}, null, 2));

await mongoose.connection.close();
