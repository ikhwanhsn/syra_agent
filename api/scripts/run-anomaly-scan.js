#!/usr/bin/env node
/**
 * Periodic anomaly scan (P2). Reads recent SignAudit rows, runs the detector, persists incidents.
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/run-anomaly-scan.js [--hours=2]
 *
 * Recommended cron: every 5 minutes.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import SignAudit from '../models/agent/SignAudit.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import WalletIncident from '../models/agent/WalletIncident.js';
import { detectIncidents } from '../services/anomalyDetector.js';

function readFlag(name, fallback) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return fallback;
  return arg.split('=')[1];
}

async function main() {
  const hours = Number.parseInt(readFlag('hours', '2'), 10);
  await connectMongoose();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await SignAudit.find({ ts: { $gte: since } })
    .select('anonymousId ts action amountUsd status toAddress')
    .lean();
  const aids = [...new Set(rows.map((r) => r.anonymousId).filter(Boolean))];
  const wallets = await AgentWallet.find({ anonymousId: { $in: aids } })
    .select('anonymousId destinationAllowlist walletAddress')
    .lean();
  const allowlists = new Map(
    wallets.map((w) => [
      w.anonymousId,
      {
        destinationAllowlist: w.destinationAllowlist || [],
        linkedUserWallet: w.walletAddress,
      },
    ])
  );
  const incidents = detectIncidents(rows, allowlists);
  if (incidents.length > 0) {
    await WalletIncident.insertMany(incidents.map((i) => ({ ...i, detectedAt: new Date() })));
  }
  console.log(JSON.stringify({ scanned: rows.length, users: aids.length, incidents: incidents.length }, null, 2));
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
