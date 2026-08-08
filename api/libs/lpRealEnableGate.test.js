/**
 * Regression: Earn beta enable gate must match open affordability (~0.55 SOL native),
 * not lab default maxPositionSol=1 (~1.30 SOL).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeMinWalletToStartSol } from "./lpRealService.js";
import {
  getLpRealFeeBufferSol,
  getLpRealMinDepositSol,
} from "../config/lpRealAgentAccess.js";

describe("lpReal enable gate (Earn small SOL)", () => {
  const reserve = 0.05;
  const minDeposit = getLpRealMinDepositSol();
  const feeBuffer = getLpRealFeeBufferSol();

  it("lab default maxPositionSol=1 still requires ~1.30 SOL native", () => {
    const minStart = computeMinWalletToStartSol({
      maxPositionSol: 1,
      reserveSolForFees: reserve,
    });
    assert.ok(
      Math.abs(minStart - (1 + reserve + feeBuffer)) < 1e-9,
      `lab minStart=${minStart}`,
    );
    assert.ok(minStart >= 1.2, "lab gate must stay above 1.2 SOL");
  });

  it("Earn beta maxPositionSol=0.25 requires ~0.55 SOL native (matches open gate)", () => {
    const minStart = computeMinWalletToStartSol({
      maxPositionSol: 0.25,
      reserveSolForFees: reserve,
      publicEarnListed: true,
    });
    const expectedNative = minDeposit + reserve + feeBuffer;
    assert.ok(
      Math.abs(minStart - expectedNative) < 1e-9,
      `earn minStart=${minStart} expected=${expectedNative}`,
    );
    assert.ok(minStart < 1.0, "Earn enable must work below lab 1.3 SOL gate");
    assert.ok(minStart >= 0.5 && minStart <= 0.6, `earn minStart=${minStart} out of ~0.55 band`);
  });

  it("slot yardstick never drops below minDeposit", () => {
    const minStart = computeMinWalletToStartSol({
      maxPositionSol: 0.1,
      reserveSolForFees: reserve,
    });
    assert.ok(
      Math.abs(minStart - (minDeposit + reserve + feeBuffer)) < 1e-9,
      `minStart=${minStart}`,
    );
  });

  it("balance in [0.55, 1.2) clears Earn gate but not lab default gate", () => {
    const earnMin = computeMinWalletToStartSol({
      maxPositionSol: 0.25,
      reserveSolForFees: reserve,
    });
    const labMin = computeMinWalletToStartSol({
      maxPositionSol: 1,
      reserveSolForFees: reserve,
    });
    const trialBalance = 0.6;
    assert.ok(trialBalance >= earnMin - 1e-9, "0.6 SOL must enable Earn");
    assert.ok(trialBalance < labMin - 1e-9, "0.6 SOL must fail lab default enable");
  });
});
