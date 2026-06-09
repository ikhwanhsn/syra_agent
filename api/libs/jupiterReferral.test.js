/**
 * Jupiter referral helper unit tests.
 * Run: node --test api/libs/jupiterReferral.test.js
 */
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PublicKey } from "@solana/web3.js";
import {
  JUPITER_REFERRAL_PROGRAM_ID,
  clearReferralExistenceCache,
  deriveReferralTokenAccount,
  getPlatformFeeBps,
  getReferralAccount,
  resolveReferralFee,
} from "./jupiterReferral.js";

const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
const REFERRAL_ACCOUNT = "9zFnqSZiJkAqaj5o4eFsSacgb6k2YzD8HEECS3ssgLBZ";

const originalEnv = { ...process.env };

beforeEach(() => {
  clearReferralExistenceCache();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
  clearReferralExistenceCache();
});

test("deriveReferralTokenAccount is deterministic for wSOL output mint", () => {
  const referralPk = new PublicKey(REFERRAL_ACCOUNT);
  const first = deriveReferralTokenAccount(WRAPPED_SOL_MINT, referralPk);
  const second = deriveReferralTokenAccount(WRAPPED_SOL_MINT, referralPk);
  assert.ok(first);
  assert.ok(second);
  assert.equal(
    first.referralTokenAccount.toBase58(),
    second.referralTokenAccount.toBase58(),
  );
  assert.equal(first.referralAccount.toBase58(), REFERRAL_ACCOUNT);
});

test("deriveReferralTokenAccount uses Jupiter referral program", () => {
  const referralPk = new PublicKey(REFERRAL_ACCOUNT);
  const mintPk = new PublicKey(WRAPPED_SOL_MINT);
  const programId = new PublicKey(JUPITER_REFERRAL_PROGRAM_ID);
  const [expected] = PublicKey.findProgramAddressSync(
    [Buffer.from("referral_ata"), referralPk.toBuffer(), mintPk.toBuffer()],
    programId,
  );
  const derived = deriveReferralTokenAccount(WRAPPED_SOL_MINT, referralPk);
  assert.ok(derived);
  assert.equal(derived.referralTokenAccount.toBase58(), expected.toBase58());
});

test("getPlatformFeeBps defaults to 100 and clamps to 0-255", () => {
  delete process.env.JUPITER_PLATFORM_FEE_BPS;
  assert.equal(getPlatformFeeBps(), 100);

  process.env.JUPITER_PLATFORM_FEE_BPS = "50";
  assert.equal(getPlatformFeeBps(), 50);

  process.env.JUPITER_PLATFORM_FEE_BPS = "999";
  assert.equal(getPlatformFeeBps(), 255);

  process.env.JUPITER_PLATFORM_FEE_BPS = "0";
  assert.equal(getPlatformFeeBps(), 0);
});

test("getReferralAccount reads env override", () => {
  delete process.env.JUPITER_REFERRAL_ACCOUNT;
  assert.equal(getReferralAccount()?.toBase58(), REFERRAL_ACCOUNT);

  process.env.JUPITER_REFERRAL_ACCOUNT = "11111111111111111111111111111111";
  assert.equal(
    getReferralAccount()?.toBase58(),
    "11111111111111111111111111111111",
  );
});

test("resolveReferralFee returns zero when referral token account is missing", async () => {
  const connection = {
    async getAccountInfo() {
      return null;
    },
  };
  const result = await resolveReferralFee(connection, WRAPPED_SOL_MINT);
  assert.equal(result.platformFeeBps, 0);
  assert.equal(result.feeAccount, null);
});

test("resolveReferralFee returns fee when referral token account exists", async () => {
  const referralPk = new PublicKey(REFERRAL_ACCOUNT);
  const derived = deriveReferralTokenAccount(WRAPPED_SOL_MINT, referralPk);
  assert.ok(derived);

  const connection = {
    async getAccountInfo(pubkey) {
      if (pubkey.equals(derived.referralTokenAccount)) {
        return { lamports: 1, data: Buffer.alloc(0), owner: PublicKey.default };
      }
      return null;
    },
  };

  const result = await resolveReferralFee(connection, WRAPPED_SOL_MINT);
  assert.equal(result.platformFeeBps, 100);
  assert.equal(result.feeAccount, derived.referralTokenAccount.toBase58());
});

test("resolveReferralFee skips when platform fee bps is zero", async () => {
  process.env.JUPITER_PLATFORM_FEE_BPS = "0";
  let rpcCalls = 0;
  const connection = {
    async getAccountInfo() {
      rpcCalls += 1;
      return { lamports: 1 };
    },
  };
  const result = await resolveReferralFee(connection, WRAPPED_SOL_MINT);
  assert.equal(result.platformFeeBps, 0);
  assert.equal(result.feeAccount, null);
  assert.equal(rpcCalls, 0);
});
