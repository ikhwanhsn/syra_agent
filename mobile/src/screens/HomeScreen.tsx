import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors, spacing, typography} from '../theme/tokens';
import {SYRA_SCOUT_NAME, SYRA_SCOUT_TAGLINE} from '../lib/syraBranding';
import {fetchFreePrices, fetchFreeAssets} from '../lib/freeApi';
import {fetchPreviewNews} from '../lib/previewApi';
import {loadWatchlist} from '../lib/watchlist';
import {formatUsd, formatPct} from '../lib/format';
import {Card} from '../components/ui/Card';
import {Skeleton} from '../components/ui/Skeleton';
import {NewsList} from '../components/NewsList';
import {ConnectWalletButton} from '../components/ConnectWalletButton';
import type {RootStackParamList} from '../navigation/types';

function priceOf(map: any, id: string): {usd?: number; change?: number} {
  const entry = map?.[id];
  if (entry == null) return {};
  if (typeof entry === 'number') return {usd: entry};
  return {usd: entry.usd, change: entry.usd_24h_change};
}

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);

  const pricesQ = useQuery({
    queryKey: ['free-prices'],
    queryFn: () => fetchFreePrices(),
  });
  const newsQ = useQuery({
    queryKey: ['preview-news', 'general'],
    queryFn: () => fetchPreviewNews('general'),
  });
  const assetsQ = useQuery({
    queryKey: ['free-assets'],
    queryFn: () => fetchFreeAssets(12),
  });
  const watchQ = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => loadWatchlist(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      pricesQ.refetch(),
      newsQ.refetch(),
      assetsQ.refetch(),
      watchQ.refetch(),
    ]);
    setRefreshing(false);
  }, [pricesQ, newsQ, assetsQ, watchQ]);

  const btc = priceOf(pricesQ.data, 'bitcoin');
  const eth = priceOf(pricesQ.data, 'ethereum');
  const sol = priceOf(pricesQ.data, 'solana');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />
      }>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Solana Mobile</Text>
          <Text style={styles.title}>{SYRA_SCOUT_NAME}</Text>
          <Text style={styles.sub}>{SYRA_SCOUT_TAGLINE}</Text>
        </View>
        <ConnectWalletButton variant="outline" />
      </View>

      <Text style={styles.section}>Markets</Text>
      <View style={styles.priceRow}>
        {[
          {label: 'BTC', ...btc, tokenId: 'bitcoin', ticker: 'BTC'},
          {label: 'ETH', ...eth, tokenId: 'ethereum', ticker: 'ETH'},
          {label: 'SOL', ...sol, tokenId: 'solana', ticker: 'SOL'},
        ].map(p => (
          <Pressable
            key={p.label}
            style={styles.priceCard}
            onPress={() =>
              navigation.navigate('TokenDetail', {
                symbol: p.label,
                tokenId: p.tokenId,
                ticker: p.ticker,
                name: p.label,
              })
            }>
            <Text style={styles.priceLabel}>{p.label}</Text>
            {pricesQ.isLoading ? (
              <Skeleton style={{width: 64, height: 20}} />
            ) : (
              <>
                <Text style={styles.priceValue}>{formatUsd(p.usd ?? null)}</Text>
                <Text
                  style={[
                    styles.priceChange,
                    {
                      color:
                        (p.change ?? 0) >= 0 ? colors.success : colors.destructive,
                    },
                  ]}>
                  {formatPct(p.change)}
                </Text>
              </>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Watchlist</Text>
      <Card>
        {(watchQ.data || []).map(item => (
          <Pressable
            key={item.id}
            style={styles.watchRow}
            onPress={() =>
              navigation.navigate('TokenDetail', {
                symbol: item.symbol,
                name: item.name,
                mint: item.mint,
                tokenId: item.tokenId,
                ticker: item.ticker || item.symbol,
              })
            }>
            <Text style={styles.watchSym}>{item.symbol}</Text>
            <Text style={styles.watchName}>{item.name || item.mint || ''}</Text>
          </Pressable>
        ))}
      </Card>

      <Text style={styles.section}>Free assets</Text>
      {assetsQ.isLoading ? (
        <Skeleton style={{height: 80}} />
      ) : (
        <View style={styles.assetGrid}>
          {(assetsQ.data || []).slice(0, 8).map((a: any, i: number) => {
            const symbol = a.symbol || a.ticker || a.name || `Asset ${i + 1}`;
            const mint = a.mint || a.address || a.id;
            return (
              <Pressable
                key={`${symbol}-${i}`}
                style={styles.assetChip}
                onPress={() =>
                  navigation.navigate('TokenDetail', {
                    symbol: String(symbol),
                    name: a.name,
                    mint: mint ? String(mint) : undefined,
                    ticker: String(symbol).toUpperCase().slice(0, 8),
                  })
                }>
                <Text style={styles.assetChipText}>{String(symbol)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.section}>Headlines (free preview)</Text>
      {newsQ.isLoading ? (
        <Skeleton style={{height: 120}} />
      ) : (
        <NewsList items={newsQ.data?.news || []} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerText: {flex: 1, gap: spacing.xs},
  kicker: {...typography.kicker, color: colors.muted},
  title: {...typography.title, color: colors.foreground},
  sub: {...typography.meta, color: colors.muted},
  section: {
    ...typography.kicker,
    color: colors.muted,
    marginTop: spacing.md,
  },
  priceRow: {flexDirection: 'row', gap: spacing.sm},
  priceCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    minHeight: 96,
    gap: 4,
  },
  priceLabel: {...typography.kicker, color: colors.muted},
  priceValue: {fontSize: 16, fontWeight: '700', color: colors.foreground},
  priceChange: {...typography.meta},
  watchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  watchSym: {color: colors.foreground, fontWeight: '600'},
  watchName: {color: colors.muted, ...typography.meta},
  assetGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  assetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minHeight: 40,
    justifyContent: 'center',
  },
  assetChipText: {color: colors.foreground, fontWeight: '600', fontSize: 13},
});
