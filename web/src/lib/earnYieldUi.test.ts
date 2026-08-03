import { describe, expect, it } from "vitest";
import {
  humanizeAgentNote,
  resolveFlatInvestStatus,
} from "./earnYieldUi";

describe("humanizeAgentNote loss/funding codes", () => {
  it("maps stopped_after_losses, drawdown_stop, and absolute_kill", () => {
    expect(humanizeAgentNote("stopped_after_losses")).toMatch(/Paused after repeated losses/i);
    expect(humanizeAgentNote("drawdown_stop")).toMatch(/Paused after a large session drawdown/i);
    expect(humanizeAgentNote("absolute_kill")).toMatch(/Hard stop/i);
  });

  it("maps insufficient_available_sol to funding guidance", () => {
    expect(humanizeAgentNote("insufficient_available_sol")).toMatch(/0\.65 SOL/i);
  });
});

describe("resolveFlatInvestStatus", () => {
  it("shows paused after losses when lossPausedAt is set", () => {
    const r = resolveFlatInvestStatus({
      deployedSol: 0,
      waitingSol: 0.62,
      strategyDepositSol: 3,
      canOpenNewPositions: false,
      lastError: "stopped_after_losses",
      lossPausedAt: new Date().toISOString(),
    });
    expect(r.badge).toBe("paused_after_losses");
    expect(r.badgeLabel).toBe("Paused after losses");
    expect(r.message).toMatch(/Paused after/i);
  });

  it("shows needs funding when available SOL is below open gate", () => {
    const r = resolveFlatInvestStatus({
      deployedSol: 0,
      waitingSol: 0.62,
      strategyDepositSol: 3,
      canOpenNewPositions: false,
      lastError: "insufficient_available_sol",
    });
    expect(r.badge).toBe("needs_funding");
    expect(r.badgeLabel).toBe("Needs funding");
    expect(r.message).toMatch(/Add SOL/i);
  });

  it("keeps optimistic next-cycle copy only when it can open", () => {
    const r = resolveFlatInvestStatus({
      deployedSol: 0,
      waitingSol: 1.2,
      strategyDepositSol: 3,
      canOpenNewPositions: true,
      lastError: null,
    });
    expect(r.badge).toBe("waiting");
    expect(r.message).toMatch(/opens on the next cycle/i);
  });
});
