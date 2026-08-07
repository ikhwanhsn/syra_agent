/**
 * Risk engine for the OKX.AI Trading Hackathon agent.
 *
 * Pure functions (no IO) so they are deterministic and unit-tested. They turn
 * ranked candidates + current book state into a concrete, risk-bounded trade
 * plan. Posture is aggressive (large per-trade sizing, low entry bar) but
 * survivable (hard stop-loss, trailing take-profit, daily loss breaker, total
 * drawdown kill).
 */

/**
 * Position notional sizing from equity and conviction. Aggressive: conviction
 * scales the per-trade allocation between 60% and 100% of the configured max.
 * @param {{ equityUsd: number, conviction: number, cfg: any }} args
 */
export function sizePosition({ equityUsd, conviction, cfg }) {
  const base = equityUsd * cfg.perTradePct;
  const convictionMult = 0.6 + 0.4 * Math.max(0, Math.min(1, conviction));
  return Math.max(0, base * convictionMult);
}

/**
 * Decide whether an open long should be exited this cycle.
 * @param {{ position: any, currentPriceUsd: number, candidateScore: number, cfg: any }} args
 * @returns {{ exit: boolean, reason: string|null, newPeak: number }}
 */
export function evaluateExit({ position, currentPriceUsd, candidateScore, cfg }) {
  const entry = Number(position.entryPriceUsd) || 0;
  const peak = Math.max(Number(position.peakPriceUsd) || 0, currentPriceUsd, entry);
  if (!Number.isFinite(currentPriceUsd) || currentPriceUsd <= 0 || entry <= 0) {
    return { exit: false, reason: null, newPeak: peak };
  }

  const changeFromEntry = (currentPriceUsd - entry) / entry;
  const drawFromPeak = peak > 0 ? (peak - currentPriceUsd) / peak : 0;

  // Hard stop-loss.
  if (changeFromEntry <= -cfg.stopLossPct) {
    return { exit: true, reason: "stop_loss", newPeak: peak };
  }
  // Trailing take-profit once we've run far enough into profit.
  if (changeFromEntry >= cfg.takeProfitPct && drawFromPeak >= cfg.trailingTakeProfitPct) {
    return { exit: true, reason: "trailing_take_profit", newPeak: peak };
  }
  // Signal flipped decisively bearish -> exit even if not at a stop.
  if (typeof candidateScore === "number" && candidateScore <= -0.4) {
    return { exit: true, reason: "signal_flip", newPeak: peak };
  }
  return { exit: false, reason: null, newPeak: peak };
}

/**
 * Circuit breakers. Daily loss halts new entries for the day; total drawdown is
 * a harder kill signal (caller should set `killed`).
 * @param {{ equityUsd: number, dayStartEquityUsd: number|null, startEquityUsd: number|null, cfg: any }} args
 * @returns {{ haltEntries: boolean, kill: boolean, reason: string|null }}
 */
export function checkCircuitBreakers({ equityUsd, dayStartEquityUsd, startEquityUsd, cfg }) {
  let haltEntries = false;
  let kill = false;
  let reason = null;

  if (dayStartEquityUsd && dayStartEquityUsd > 0) {
    const dayChange = (equityUsd - dayStartEquityUsd) / dayStartEquityUsd;
    if (dayChange <= -cfg.dailyMaxLossPct) {
      haltEntries = true;
      reason = `daily_max_loss ${(dayChange * 100).toFixed(1)}%`;
    }
  }
  if (startEquityUsd && startEquityUsd > 0) {
    const totalChange = (equityUsd - startEquityUsd) / startEquityUsd;
    if (totalChange <= -cfg.maxDrawdownPct) {
      kill = true;
      reason = `max_drawdown ${(totalChange * 100).toFixed(1)}%`;
    }
  }
  return { haltEntries, kill, reason };
}

/**
 * Build the full trade plan for a cycle: which positions to exit and which new
 * entries to open, respecting max positions, cash reserve, and the daily loss
 * breaker.
 *
 * @param {{
 *   candidates: Array<{ token: string, instrument?: string, priceUsd: number|null, score: number, side: string, conviction: number }>,
 *   positions: Array<any>,
 *   equityUsd: number,
 *   cashUsd: number,
 *   breaker: { haltEntries: boolean },
 *   cfg: any,
 * }} args
 * @returns {{ sells: Array<any>, buys: Array<any> }}
 */
export function buildTradePlan({ candidates, positions, equityUsd, cashUsd, breaker, cfg }) {
  const byToken = new Map(candidates.map((c) => [c.token, c]));
  const openByToken = new Map(positions.map((p) => [p.token, p]));

  // 1. Exits.
  const sells = [];
  for (const pos of positions) {
    const cand = byToken.get(pos.token);
    const price = cand?.priceUsd ?? pos.entryPriceUsd;
    const { exit, reason, newPeak } = evaluateExit({
      position: pos,
      currentPriceUsd: Number(price),
      candidateScore: cand?.score,
      cfg,
    });
    if (exit) {
      sells.push({
        token: pos.token,
        instrument: pos.symbol,
        priceUsd: Number(price),
        reason,
        position: pos,
        peakPriceUsd: newPeak,
      });
    }
  }

  // 2. Entries — only if breaker allows and we have room + cash.
  const buys = [];
  if (!breaker.haltEntries) {
    const closingTokens = new Set(sells.map((s) => s.token));
    const remainingOpen = positions.filter(
      (p) => !closingTokens.has(p.token),
    ).length;
    let slots = Math.max(0, cfg.maxOpenPositions - remainingOpen);
    let deployableCash = Math.max(
      0,
      Math.min(cashUsd - cfg.reserveUsd, equityUsd * cfg.maxDeployedPct - positionsValue(positions)),
    );

    for (const cand of candidates) {
      if (slots <= 0 || deployableCash < cfg.minTradeUsd) break;
      if (cand.side !== "buy") continue;
      if (cand.conviction < cfg.minConviction) continue;
      if (!Number.isFinite(cand.priceUsd) || cand.priceUsd <= 0) continue;
      if (openByToken.has(cand.token) && !closingTokens.has(cand.token)) continue; // already holding

      let notional = sizePosition({ equityUsd, conviction: cand.conviction, cfg });
      notional = Math.min(notional, deployableCash);
      if (notional < cfg.minTradeUsd) continue;

      buys.push({
        token: cand.token,
        instrument: cand.instrument,
        priceUsd: cand.priceUsd,
        notionalUsd: notional,
        conviction: cand.conviction,
        score: cand.score,
      });
      deployableCash -= notional;
      slots -= 1;
    }
  }

  return { sells, buys };
}

function positionsValue(positions) {
  return positions.reduce((sum, p) => sum + (Number(p.notionalUsd) || 0), 0);
}
