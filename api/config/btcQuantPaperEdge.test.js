import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BTC_QUANT_PAPER_EDGE_CURRENT_STAGE,
  BTC_QUANT_PAPER_EDGE_GATES,
  BTC_QUANT_PAPER_EDGE_STAGES,
  BTC_QUANT_PAPER_EDGE_KILL_CRITERIA,
  evaluateBtcQuantPaperEdge,
} from "./btcQuantPaperEdge.js";

describe("btcQuantPaperEdge", () => {
  it("stays on paper_measure and never opens Earn from paper edge alone", () => {
    assert.equal(BTC_QUANT_PAPER_EDGE_CURRENT_STAGE, "paper_measure");
    assert.equal(BTC_QUANT_PAPER_EDGE_GATES.minDecided, 50);
    assert.equal(BTC_QUANT_PAPER_EDGE_GATES.minLeaderWinRate, 0.52);
    const measure = BTC_QUANT_PAPER_EDGE_STAGES.find((s) => s.id === "paper_measure");
    assert.equal(measure?.earnListed, false);
    assert.ok(BTC_QUANT_PAPER_EDGE_KILL_CRITERIA.endlessAlmost);
  });

  it("fails when cohort or leader bar is short", () => {
    const fail = evaluateBtcQuantPaperEdge({
      decided: 20,
      leaderDecided: 10,
      leaderWinRate: 0.6,
      leaderNetPnlUsd: 40,
      hasQualifiedLeader: true,
    });
    assert.equal(fail.pass, false);
    assert.equal(fail.checks.minDecided, false);
    assert.equal(fail.earnYieldAllowed, false);
  });

  it("passes paper edge when cohort and qualified leader clear gates", () => {
    const pass = evaluateBtcQuantPaperEdge({
      decided: 50,
      leaderDecided: 12,
      leaderWinRate: 0.55,
      leaderNetPnlUsd: 80,
      hasQualifiedLeader: true,
    });
    assert.equal(pass.pass, true);
    assert.equal(pass.earnYieldAllowed, false);
    assert.equal(pass.nextBlockedUntil, "real_adapter_readiness");
  });

  it("fails without a qualified leader even if cohort is large", () => {
    const fail = evaluateBtcQuantPaperEdge({
      decided: 80,
      leaderDecided: 4,
      leaderWinRate: 0.4,
      leaderNetPnlUsd: -10,
      hasQualifiedLeader: false,
    });
    assert.equal(fail.pass, false);
    assert.equal(fail.checks.qualifiedLeader, false);
  });
});
