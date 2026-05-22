#!/usr/bin/env node
/**
 * P2 — daily Merkle anchoring of the SignAudit hash chain.
 *
 * Reads every audit row from the last 24h, builds a Merkle tree over their `selfHash` values,
 * and writes the root to either:
 *   - SYRA_AUDIT_ROOT_S3_BUCKET (with Object Lock recommended), or
 *   - stdout / a local file (`audit-roots/<date>.json`) when S3 is not configured.
 *
 * The chain itself is already tamper-evident (each row commits to the previous hash). Anchoring
 * the root externally adds an offline witness so even a malicious DB admin can't rewrite
 * history without rewriting the anchor.
 *
 * Usage:
 *   cd api && node -r dotenv/config scripts/anchor-audit-merkle-root.js
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import connectMongoose from '../config/mongoose.js';
import SignAudit from '../models/agent/SignAudit.js';

function hash(buf) {
  return crypto.createHash('sha256').update(buf).digest();
}

function merkleRoot(hexLeaves) {
  if (hexLeaves.length === 0) return null;
  let layer = hexLeaves.map((h) => Buffer.from(h, 'hex'));
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] || a;
      next.push(hash(Buffer.concat([a, b])));
    }
    layer = next;
  }
  return layer[0].toString('hex');
}

async function main() {
  await connectMongoose();
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const rows = await SignAudit.find({ ts: { $gte: start, $lt: end } })
    .sort({ seq: 1 })
    .select('seq selfHash ts')
    .lean();
  const leaves = rows.map((r) => r.selfHash);
  const root = merkleRoot(leaves);
  const anchor = {
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    leafCount: leaves.length,
    firstSeq: rows[0]?.seq || null,
    lastSeq: rows[rows.length - 1]?.seq || null,
    merkleRoot: root,
    chainTip: leaves[leaves.length - 1] || null,
    generatedAt: new Date().toISOString(),
  };

  const bucket = (process.env.SYRA_AUDIT_ROOT_S3_BUCKET || '').trim();
  if (bucket) {
    try {
      const aws = await import('@aws-sdk/client-s3').catch(() => null);
      if (!aws) {
        console.warn('@aws-sdk/client-s3 not installed; falling back to local file.');
      } else {
        const { S3Client, PutObjectCommand } = aws;
        const client = new S3Client({ region: process.env.AWS_REGION });
        const key = `audit-roots/${end.toISOString().slice(0, 10)}.json`;
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(anchor, null, 2),
            ContentType: 'application/json',
            ServerSideEncryption: 'AES256',
            ObjectLockMode: 'COMPLIANCE',
            ObjectLockRetainUntilDate: new Date(end.getTime() + 365 * 24 * 60 * 60 * 1000),
          })
        );
        console.log(`Anchored to s3://${bucket}/${key}`);
        await mongoose.connection.close();
        return;
      }
    } catch (err) {
      console.warn('S3 anchor failed; writing local fallback:', err?.message || err);
    }
  }

  const dir = path.resolve('audit-roots');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${end.toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(out, JSON.stringify(anchor, null, 2));
  console.log(`Wrote local anchor ${out}`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
