import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendTreasurySnapshot,
  computeTreasuryBalanceChanges,
  readTreasuryHistory,
  treasuryToSnapshotValues,
  type BalanceChangeResult,
  type TreasurySnapshotInput,
} from "@/lib/treasuryBalanceHistory";

export interface TreasuryBalanceChanges {
  total: BalanceChangeResult | null;
  user: BalanceChangeResult | null;
  trading: BalanceChangeResult | null;
  lp: BalanceChangeResult | null;
  agent: BalanceChangeResult | null;
  chartPoints: Array<{ label: string; value: number; at: number }>;
}

export function useTreasuryBalanceChange(
  walletAddress: string | null | undefined,
  treasury: TreasurySnapshotInput,
  loading: boolean,
): TreasuryBalanceChanges {
  const [changes, setChanges] = useState<TreasuryBalanceChanges>({
    total: null,
    user: null,
    trading: null,
    lp: null,
    agent: null,
    chartPoints: [],
  });
  const recordedRef = useRef<string | null>(null);

  const snapshotValues = useMemo(() => treasuryToSnapshotValues(treasury), [treasury]);

  useEffect(() => {
    if (!walletAddress || loading || !snapshotValues) return;

    const fingerprint = [
      walletAddress,
      snapshotValues.totalUsd.toFixed(2),
      snapshotValues.userUsd.toFixed(2),
      snapshotValues.tradingUsd.toFixed(2),
      snapshotValues.lpUsd.toFixed(2),
    ].join("|");

    if (recordedRef.current === fingerprint) return;
    recordedRef.current = fingerprint;

    const historyBefore = readTreasuryHistory(walletAddress);
    const computed = computeTreasuryBalanceChanges(historyBefore, snapshotValues);
    setChanges(computed);

    appendTreasurySnapshot(walletAddress, snapshotValues);
  }, [walletAddress, loading, snapshotValues]);

  useEffect(() => {
    if (!walletAddress) {
      recordedRef.current = null;
      setChanges({
        total: null,
        user: null,
        trading: null,
        lp: null,
        agent: null,
        chartPoints: [],
      });
    }
  }, [walletAddress]);

  return changes;
}
