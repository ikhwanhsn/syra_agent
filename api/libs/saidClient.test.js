/**
 * SAID account parse + AgentCard helpers.
 * Run: node --test libs/saidClient.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  buildTokenAgentCard,
  parseSaidAgentAccountData,
} from "./saidClient.js";

/**
 * @param {{
 *   owner: PublicKey;
 *   authority?: PublicKey;
 *   metadataUri: string;
 *   createdAt: number;
 *   isVerified: boolean;
 *   verifiedAt?: number | null;
 *   accountSize: number;
 *   legacy?: boolean;
 * }} opts
 */
function buildSaidAccountBuffer(opts) {
  const {
    owner,
    authority = owner,
    metadataUri,
    createdAt,
    isVerified,
    verifiedAt = null,
    accountSize,
    legacy = false,
  } = opts;

  const buf = Buffer.alloc(accountSize, 0);
  // 8-byte Anchor discriminator (zeros fine for parse tests)
  owner.toBuffer().copy(buf, 8);

  const uriBytes = Buffer.from(metadataUri, "utf8");
  assert.ok(uriBytes.length >= 10 && uriBytes.length <= 200);

  if (legacy) {
    buf.writeUInt32LE(uriBytes.length, 40);
    uriBytes.copy(buf, 44);
    const after = 44 + uriBytes.length;
    buf.writeBigInt64LE(BigInt(createdAt), after);
    buf[after + 8] = isVerified ? 1 : 0;
    buf.writeBigInt64LE(BigInt(verifiedAt ?? 0), after + 9);
  } else {
    authority.toBuffer().copy(buf, 40);
    buf.writeUInt32LE(uriBytes.length, 72);
    uriBytes.copy(buf, 76);
    const after = 76 + uriBytes.length;
    buf.writeBigInt64LE(BigInt(createdAt), after);
    buf[after + 8] = isVerified ? 1 : 0;
    if (verifiedAt != null) {
      buf[after + 9] = 1;
      buf.writeBigInt64LE(BigInt(verifiedAt), after + 10);
    } else {
      buf[after + 9] = 0;
    }
  }

  return buf;
}

test("parseSaidAgentAccountData reads current 342-byte verified layout", () => {
  const owner = Keypair.generate().publicKey;
  const uri = "https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const createdAt = 1_781_754_134;
  const verifiedAt = 1_781_754_391;
  const data = buildSaidAccountBuffer({
    owner,
    metadataUri: uri,
    createdAt,
    isVerified: true,
    verifiedAt,
    accountSize: 342,
  });

  const parsed = parseSaidAgentAccountData("AgentPda1111111111111111111111111111111", data);
  assert.ok(parsed);
  assert.equal(parsed.owner, owner.toBase58());
  assert.equal(parsed.authority, owner.toBase58());
  assert.equal(parsed.metadataUri, uri);
  assert.equal(parsed.registeredAt, createdAt);
  assert.equal(parsed.isVerified, true);
  assert.equal(parsed.verifiedAt, verifiedAt);
});

test("parseSaidAgentAccountData reads current unverified layout (Option None)", () => {
  const owner = Keypair.generate().publicKey;
  const uri = "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const createdAt = 1_700_000_000;
  const data = buildSaidAccountBuffer({
    owner,
    metadataUri: uri,
    createdAt,
    isVerified: false,
    verifiedAt: null,
    accountSize: 342,
  });

  const parsed = parseSaidAgentAccountData("pda", data);
  assert.ok(parsed);
  assert.equal(parsed.isVerified, false);
  assert.equal(parsed.verifiedAt, undefined);
  assert.equal(parsed.metadataUri, uri);
});

test("parseSaidAgentAccountData reads legacy 263-byte layout", () => {
  const owner = Keypair.generate().publicKey;
  const uri = "https://example.com/said-card.json";
  const createdAt = 1_700_000_111;
  const verifiedAt = 1_700_000_222;
  const data = buildSaidAccountBuffer({
    owner,
    metadataUri: uri,
    createdAt,
    isVerified: true,
    verifiedAt,
    accountSize: 263,
    legacy: true,
  });

  const parsed = parseSaidAgentAccountData("legacy-pda", data);
  assert.ok(parsed);
  assert.equal(parsed.owner, owner.toBase58());
  assert.equal(parsed.metadataUri, uri);
  assert.equal(parsed.isVerified, true);
  assert.equal(parsed.registeredAt, createdAt);
  assert.equal(parsed.verifiedAt, verifiedAt);
  assert.equal(parsed.authority, undefined);
});

test("parseSaidAgentAccountData returns null for truncated buffers", () => {
  assert.equal(parseSaidAgentAccountData("x", Buffer.alloc(20)), null);
});

test("buildTokenAgentCard has no em dash and points at earn token page", () => {
  const wallet = Keypair.generate().publicKey.toBase58();
  const mint = Keypair.generate().publicKey.toBase58();
  const card = buildTokenAgentCard({
    wallet,
    name: "MoonCat",
    symbol: "MOON",
    mint,
  });
  assert.equal(card.wallet, wallet);
  assert.equal(card.name, "MoonCat");
  assert.ok(!card.description.includes("\u2014"));
  assert.ok(card.description.includes("community token"));
  assert.equal(card.website, `https://syraa.fun/earn/token/${encodeURIComponent(mint)}`);
});

test("registerAndVerifyAgentCard requires keypair or wallet+signAndSendTransaction", async () => {
  const { registerAndVerifyAgentCard } = await import("./saidClient.js");
  await assert.rejects(
    () => registerAndVerifyAgentCard({ card: { name: "x", wallet: "y" } }),
    /signerKeypair is required \(or wallet \+ signAndSendTransaction\)/,
  );
  await assert.rejects(
    () =>
      registerAndVerifyAgentCard({
        card: { name: "x", wallet: "y" },
        signAndSendTransaction: async () => "sig",
      }),
    /signerKeypair is required \(or wallet \+ signAndSendTransaction\)|wallet is required/,
  );
});
