import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@syra_scout/watchlist_v1';

export type WatchlistItem = {
  id: string;
  symbol: string;
  name?: string;
  mint?: string;
  /** CoinGecko / signal token id (bitcoin, solana, …) */
  tokenId?: string;
  /** News/sentiment ticker (BTC, SOL, …) */
  ticker?: string;
};

const DEFAULTS: WatchlistItem[] = [
  {id: 'btc', symbol: 'BTC', name: 'Bitcoin', tokenId: 'bitcoin', ticker: 'BTC'},
  {id: 'eth', symbol: 'ETH', name: 'Ethereum', tokenId: 'ethereum', ticker: 'ETH'},
  {id: 'sol', symbol: 'SOL', name: 'Solana', tokenId: 'solana', ticker: 'SOL'},
];

export async function loadWatchlist(): Promise<WatchlistItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function saveWatchlist(items: WatchlistItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function toggleWatchlistItem(
  item: WatchlistItem,
): Promise<WatchlistItem[]> {
  const list = await loadWatchlist();
  const exists = list.some(x => x.id === item.id || (item.mint && x.mint === item.mint));
  const next = exists
    ? list.filter(x => !(x.id === item.id || (item.mint && x.mint === item.mint)))
    : [item, ...list].slice(0, 40);
  await saveWatchlist(next);
  return next;
}

export async function isWatched(idOrMint: string): Promise<boolean> {
  const list = await loadWatchlist();
  return list.some(x => x.id === idOrMint || x.mint === idOrMint || x.symbol === idOrMint);
}
