import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STOCKS_EARN_CURRENT_STAGE,
  STOCKS_EARN_GRADUATION_STAGES,
  STOCKS_PAPER_EDGE_GATES,
  evaluateStocksPaperEdge,
} from "./stocksEarnGraduation.js";
import { getEarnYieldBlockReason } from "./earnProducts.js";

describe("stocksEarnGraduation", () => {
  it("stays on paper_watch and keeps Earn listing false for early stages", () => {
    assert.equal(STOCKS_EARN_CURRENT_STAGE, "paper_watch");
    const paper = STOCKS_EARN_GRADUATION_STAGES.find((s) => s.id === "paper_watch");
    assert.equal(paper?.earnListed, false);
    const beta = STOCKS_EARN_GRADUATION_STAGES.find((s) => s.id === "earn_beta");
    assert.equal(beta?.earnListed, true);
  });

  it("requires ≥50 decided and net-positive champion", () => {
    assert.equal(STOCKS_PAPER_EDGE_GATES.minDecided, 50);
    const fail = evaluateStocksPaperEdge({
      decided: 12,
      championNetPnlUsd: 40,
      championWinRate: 0.6,
    });
    assert.equal(fail.pass, false);
    assert.equal(fail.earnYieldAllowed, false);

    const pass = evaluateStocksPaperEdge({
      decided: 50,
      championNetPnlUsd: 12,
      championWinRate: 0.55,
      maxDrawdownFrac: 0.1,
    });
    assert.equal(pass.pass, true);
    assert.equal(pass.earnYieldAllowed, false);
  });

  it("keeps stocks blocked from Earn Yield registry", () => {
    assert.equal(getEarnYieldBlockReason("stocks")?.blocked, true);
  });
});
