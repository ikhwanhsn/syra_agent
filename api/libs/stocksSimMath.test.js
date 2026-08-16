import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeStocksNotionalUsd,
  computeStocksCostBps,
  isTradableStocksQuote,
  signedPnlPct,
  evaluateStocksExit,
  computeStocksSimPnl,
  scaleExitsByVolatility,
  relabelStatusAfterCost,
  STOCKS_MIN_TRADE_NOTIONAL_USD,
} from "./stocksSimMath.js";

describe("stocksSimMath", () => {
  it("caps notional to a risk fraction of equity, never all-in", () => {
    assert.equal(computeStocksNotionalUsd(1000, 1000, 20), 200);
    assert.equal(computeStocksNotionalUsd(50, 1000, 20), 50);
    assert.equal(computeStocksNotionalUsd(10, 1000, 20), 0);
    assert.ok(computeStocksNotionalUsd(1000, 1000, 20) < 1000);
    assert.ok(computeStocksNotionalUsd(1000, 1000, 20) >= STOCKS_MIN_TRADE_NOTIONAL_USD);
  });

  it("adds spread and slippage on top of base round-trip bps", () => {
    const cheap = computeStocksCostBps({
      notionalUsd: 200,
      liquidityUsd: 5_000_000,
      spreadPct: 0.1,
      baseRoundTripBps: 110,
    });
    const expensive = computeStocksCostBps({
      notionalUsd: 200,
      liquidityUsd: 12_000,
      spreadPct: 3,
      baseRoundTripBps: 110,
    });
    assert.ok(cheap > 110);
    assert.ok(expensive > cheap);
  });

  it("rejects nasdaq-only and thin or mismatched quotes", () => {
    assert.equal(isTradableStocksQuote({ priceUsd: 100, source: "nasdaq_reference" }).ok, false);
    assert.equal(
      isTradableStocksQuote({ priceUsd: 100, source: "jupiter", liquidityUsd: 100 }).ok,
      false,
    );
    assert.equal(
      isTradableStocksQuote({ priceUsd: 100, source: "jupiter", spreadPct: 12 }).ok,
      false,
    );
    assert.equal(
      isTradableStocksQuote({
        priceUsd: 100,
        source: "jupiter",
        liquidityUsd: 80_000,
        spreadPct: 0.4,
      }).ok,
      true,
    );
  });

  it("inverts P&L for shorts", () => {
    assert.ok(signedPnlPct("long", 100, 110) > 0);
    assert.ok(signedPnlPct("short", 100, 90) > 0);
    assert.ok(signedPnlPct("short", 100, 110) < 0);
  });

  it("hits take-profit and stop-loss for both sides", () => {
    const longTp = evaluateStocksExit({
      side: "long",
      entryPriceUsd: 100,
      markPriceUsd: 110,
      stopLossPct: -5,
      takeProfitPct: 8,
    });
    const shortTp = evaluateStocksExit({
      side: "short",
      entryPriceUsd: 100,
      markPriceUsd: 90,
      stopLossPct: -5,
      takeProfitPct: 8,
    });
    const longSl = evaluateStocksExit({
      side: "long",
      entryPriceUsd: 100,
      markPriceUsd: 94,
      stopLossPct: -5,
      takeProfitPct: 8,
    });
    assert.equal(longTp?.resolution, "take_profit");
    assert.equal(shortTp?.resolution, "take_profit");
    assert.equal(longSl?.resolution, "stop_loss");
  });

  it("time-stops underwater positions at half max hold", () => {
    const openedAt = new Date(Date.now() - 25 * 3_600_000);
    const cut = evaluateStocksExit({
      side: "long",
      entryPriceUsd: 100,
      markPriceUsd: 98,
      openedAt,
      now: Date.now(),
      stopLossPct: -5,
      takeProfitPct: 8,
      maxHoldHours: 48,
    });
    assert.equal(cut?.resolution, "time_stop");
  });

  it("subtracts costs and relabels tiny wins as losses", () => {
    const pnl = computeStocksSimPnl({
      side: "long",
      entryPriceUsd: 100,
      exitPriceUsd: 100.5,
      notionalUsd: 200,
      costBps: 110,
    });
    assert.ok(pnl.simPnlUsd < 0);
    assert.equal(relabelStatusAfterCost("win", pnl.simPnlUsd), "loss");
  });

  it("widens exits when volatility is high", () => {
    const calm = scaleExitsByVolatility({ stopLossPct: -4, takeProfitPct: 6 }, 1);
    const wild = scaleExitsByVolatility({ stopLossPct: -4, takeProfitPct: 6 }, 3);
    assert.ok(Math.abs(wild.stopLossPct) > Math.abs(calm.stopLossPct));
    assert.ok(wild.takeProfitPct > calm.takeProfitPct);
  });
});
