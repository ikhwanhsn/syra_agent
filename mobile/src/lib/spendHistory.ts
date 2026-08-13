import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@syra_scout/spend_history_v1';

export type SpendRecord = {
  id: string;
  at: string;
  path: string;
  label: string;
  amountUsd: string;
  signature?: string;
  ok: boolean;
  error?: string;
};

export async function loadSpendHistory(): Promise<SpendRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendSpendRecord(
  record: Omit<SpendRecord, 'id' | 'at'> & {id?: string; at?: string},
): Promise<SpendRecord[]> {
  const next: SpendRecord = {
    id: record.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: record.at || new Date().toISOString(),
    path: record.path,
    label: record.label,
    amountUsd: record.amountUsd,
    signature: record.signature,
    ok: record.ok,
    error: record.error,
  };
  const prev = await loadSpendHistory();
  const list = [next, ...prev].slice(0, 100);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  return list;
}
