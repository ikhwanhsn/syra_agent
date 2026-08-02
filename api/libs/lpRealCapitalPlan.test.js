/**
 * Regression: Earn ~4 SOL wallets must not fragment into sub-minDeposit slots
 * that fail safeFallback half-sizing (safe_fallback_deposit_too_small).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCapitalDeploymentPlan,
  computeEffectiveMaxConcurrent,
} from "./lpRealService.js";
import { getLpRealMinDepositSol } from "../config/lpRealAgentAccess.js";

describe("lpReal capital plan (Earn anti-starvation)", () => {
  const earnConfig = {
    maxPositionSol: 1,
    maxConcurrentPositions: 9, // previously over-expanded
    publicEarnListed: true,
    reserveSolForFees: 0.05,
  };
  const availableSol = 4.320762819;

  it("caps Earn concurrent slots at 3 (not 9× minDeposit crumbs)", () => {
    const slots = computeEffectiveMaxConcurrent(earnConfig, availableSol);
    assert.equal(slots, 3);
  });

  it("sizes each Earn slot above minDeposit even after safeFallback half", () => {
    const slots = computeEffectiveMaxConcurrent(earnConfig, availableSol);
    const plan = computeCapitalDeploymentPlan({
      config: earnConfig,
      availableSol,
      remainingSlots: slots,
    });
    const minDep = getLpRealMinDepositSol();
    assert.ok(plan.depositSol >= minDep - 1e-9, `depositSol=${plan.depositSol}`);
    const half = plan.depositSol * 0.5;
    const safeOpen = half >= minDep - 1e-9 ? half : minDep;
    assert.ok(
      safeOpen >= minDep - 1e-9,
      `safeFallback open size ${safeOpen} below min ${minDep}`,
    );
    assert.ok(safeOpen >= 0.4, "expected ~0.4+ SOL open under safeFallback");
  });
});
