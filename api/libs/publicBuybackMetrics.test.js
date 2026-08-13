import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapRecentBuybackEvent,
  primaryBuybackProofFilter,
} from "./publicBuybackMetrics.js";

const PRIMARY = "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t";
const SILENT = "2uF4W95fKCQEhg64H6voKmZfTpVcCbo7SUUiaovoDaos";

describe("publicBuybackMetrics proof filters", () => {
  it("primaryBuybackProofFilter includes primary + legacy null only", () => {
    assert.deepEqual(primaryBuybackProofFilter(PRIMARY), {
      treasuryWallet: { $in: [PRIMARY, null] },
    });
    assert.deepEqual(primaryBuybackProofFilter(null), {
      treasuryWallet: { $in: [null] },
    });
  });

  it("mapRecentBuybackEvent never includes treasuryWallet", () => {
    const mapped = mapRecentBuybackEvent(
      {
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        buybackUsd: 12.5,
        outAmountHuman: 1000,
        swapSignature: "sigPrimary",
        source: "manual_onchain",
        treasuryWallet: PRIMARY,
      },
      { syraUsd: 0.01 },
    );
    assert.equal(mapped.buybackUsd, 12.5);
    assert.equal(mapped.swapSignature, "sigPrimary");
    assert.equal(mapped.solscanUrl, "https://solscan.io/tx/sigPrimary");
    assert.equal("treasuryWallet" in mapped, false);
  });

  it("proof filter would exclude silent-wallet events from recent list", () => {
    const filter = primaryBuybackProofFilter(PRIMARY);
    const allowed = new Set(filter.treasuryWallet.$in);
    assert.equal(allowed.has(PRIMARY), true);
    assert.equal(allowed.has(null), true);
    assert.equal(allowed.has(SILENT), false);
  });
});
