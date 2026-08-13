import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors, spacing, typography} from '../theme/tokens';
import {Card} from '../components/ui/Card';
import {UnlockButton} from '../components/UnlockButton';
import {PAID_PRICES_USD} from '../lib/paidApi';
import type {RootStackParamList} from '../navigation/types';
import {formatCompactAmount, formatUsd} from '../lib/format';

type ScoutItem = {
  mint?: string;
  symbol?: string;
  name?: string;
  priceUsd?: number | string;
  marketCap?: number;
  pumpScore?: number;
  syraAlpha?: number;
};

export function ScoutScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<ScoutItem[] | null>(null);
  const [segment, setSegment] = useState<'alpha' | 'beta' | 'predicted'>(
    'alpha',
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Discover</Text>
      <Text style={styles.title}>Scout</Text>
      <Text style={styles.sub}>
        Scan alpha candidates from pump.fun. Browse the idea free; unlock the live
        scout for $
        {PAID_PRICES_USD.scout}.
      </Text>

      <View style={styles.segRow}>
        {(['alpha', 'beta', 'predicted'] as const).map(s => (
          <Pressable
            key={s}
            onPress={() => setSegment(s)}
            style={[styles.seg, segment === s && styles.segActive]}
            accessibilityRole="button"
            accessibilityState={{selected: segment === s}}>
            <Text
              style={[styles.segText, segment === s && styles.segTextActive]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {!items ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No scout results yet</Text>
          <Text style={styles.emptyBody}>
            Unlock a paid scout call to pull the latest {segment} segment. Wallet
            signs USDC only; gas is sponsored.
          </Text>
          <UnlockButton
            label={`Unlock ${segment} scout`}
            path="/pumpfun/scout"
            query={{segment, limit: '12'}}
            priceUsd={PAID_PRICES_USD.scout}
            onUnlocked={data => {
              const list =
                (data as any)?.data?.items ||
                (data as any)?.items ||
                (data as any)?.coins ||
                [];
              setItems(Array.isArray(list) ? list : []);
              if (!Array.isArray(list) || !list.length) {
                Alert.alert('Scout', 'Call succeeded but returned no items.');
              }
            }}
          />
        </Card>
      ) : (
        <>
          <UnlockButton
            label={`Refresh ${segment} scout`}
            path="/pumpfun/scout"
            query={{segment, limit: '12'}}
            priceUsd={PAID_PRICES_USD.scout}
            onUnlocked={data => {
              const list =
                (data as any)?.data?.items ||
                (data as any)?.items ||
                [];
              setItems(Array.isArray(list) ? list : []);
            }}
          />
          <View style={styles.list}>
            {items.map((item, idx) => {
              const symbol = item.symbol || item.name || `Token ${idx + 1}`;
              return (
                <Pressable
                  key={`${item.mint || symbol}-${idx}`}
                  onPress={() =>
                    navigation.navigate('TokenDetail', {
                      symbol: String(symbol),
                      name: item.name,
                      mint: item.mint,
                      ticker: String(symbol).toUpperCase().slice(0, 8),
                    })
                  }>
                  <Card style={styles.row}>
                    <View style={styles.rowTop}>
                      <Text style={styles.sym}>{String(symbol)}</Text>
                      <Text style={styles.score}>
                        {item.syraAlpha != null
                          ? `α ${item.syraAlpha}`
                          : item.pumpScore != null
                            ? `score ${item.pumpScore}`
                            : ''}
                      </Text>
                    </View>
                    <Text style={styles.meta}>
                      {formatUsd(
                        typeof item.priceUsd === 'string'
                          ? Number(item.priceUsd)
                          : item.priceUsd ?? null,
                        6,
                      )}
                      {item.marketCap != null
                        ? ` · mcap ${formatCompactAmount(item.marketCap)}`
                        : ''}
                    </Text>
                    {item.mint ? (
                      <Text style={styles.mint} numberOfLines={1}>
                        {item.mint}
                      </Text>
                    ) : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </>
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
  kicker: {...typography.kicker, color: colors.muted},
  title: {...typography.title, color: colors.foreground},
  sub: {...typography.meta, color: colors.muted},
  segRow: {flexDirection: 'row', gap: spacing.sm},
  seg: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  segActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  segText: {color: colors.foreground, fontWeight: '600', textTransform: 'capitalize'},
  segTextActive: {color: colors.primaryFg},
  emptyCard: {gap: spacing.md},
  emptyTitle: {...typography.section, color: colors.foreground},
  emptyBody: {...typography.meta, color: colors.muted},
  list: {gap: spacing.sm},
  row: {gap: 4},
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sym: {color: colors.foreground, fontWeight: '700', fontSize: 16},
  score: {color: colors.mutedStrong, ...typography.meta},
  meta: {color: colors.muted, ...typography.meta},
  mint: {color: colors.muted, ...typography.mono},
});
