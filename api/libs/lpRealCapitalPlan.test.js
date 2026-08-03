/**
 * Regression: Earn beta wallets must respect small maxPositionSol caps
 * (0.25 SOL/slot) and not inflate slots via the global max-position ceiling.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCapitalDeploymentPlan,
  computeEffectiveMaxConcurrent,
} from "./lpRealService.js";
import { getLpRealMinDepositSol } from "../config/lpRealAgentAccess.js";

describe("lpReal capital plan (Earn beta safe mode)", () => {
  const earnConfig = {
    maxPositionSol: 0.25,
    maxConcurrentPositions: 9, // previously over-expanded
    publicEarnListed: true,
    reserveSolForFees: 0.05,
  };
  const availableSol = 4.320762819;

  it("caps Earn concurrent slots at 3 (not 9× minDeposit crumbs)", () => {
    const slots = computeEffectiveMaxConcurrent(earnConfig, availableSol);
    assert.equal(slots, 3);
  });

  it("sizes each Earn slot at maxPositionSol (0.25), not the global 3 SOL cap", () => {
    const slots = computeEffectiveMaxConcurrent(earnConfig, availableSol);
    const plan = computeCapitalDeploymentPlan({
      config: earnConfig,
      availableSol,
      remainingSlots: slots,
    });
    const minDep = getLpRealMinDepositSol();
    assert.ok(plan.depositSol >= minDep - 1e-9, `depositSol=${plan.depositSol}`);
    assert.ok(
      plan.depositSol <= 0.25 + 1e-9,
      `depositSol=${plan.depositSol} exceeds maxPositionSol 0.25`,
    );
    assert.equal(Number(plan.depositSol.toFixed(6)), 0.25);
  });

  it("with ~3 SOL available still opens 0.25 SOL slots under Earn concurrent cap", () => {
    const plan = computeCapitalDeploymentPlan({
      config: earnConfig,
      availableSol: 3,
      remainingSlots: 3,
    });
    assert.equal(Number(plan.depositSol.toFixed(6)), 0.25);
    assert.ok(plan.affordableSlots >= 1);
  });
});
