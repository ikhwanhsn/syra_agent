import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {colors, spacing, typography} from '../theme/tokens';
import type {RootStackParamList} from '../navigation/types';
import {
  fetchPreviewNews,
  fetchPreviewSentiment,
  fetchPreviewSignal,
} from '../lib/previewApi';
import {fetchFreeDossierBasic} from '../lib/freeApi';
import {formatUsd} from '../lib/format';
import {NewsList} from '../components/NewsList';
import {SentimentCard} from '../components/SentimentCard';
import {SignalCard} from '../components/SignalCard';
import {UnlockButton} from '../components/UnlockButton';
import {Button} from '../components/ui/Button';
import {Skeleton} from '../components/ui/Skeleton';
import {Card} from '../components/ui/Card';
import {PAID_PRICES_USD} from '../lib/paidApi';
import {
  loadWatchlist,
  toggleWatchlistItem,
  type WatchlistItem,
} from '../lib/watchlist';

type Props = NativeStackScreenProps<RootStackParamList, 'TokenDetail'>;

export function TokenDetailScreen({route}: Props) {
  const {symbol, name, mint, tokenId, ticker} = route.params;
  const newsTicker = (ticker || symbol || 'BTC').toUpperCase();
  const signalToken = (tokenId || symbol || 'solana').toLowerCase();
  const qc = useQueryClient();
  const [paidNews, setPaidNews] = useState<any[] | null>(null);
  const [paidSignal, setPaidSignal] = useState<any | null>(null);
  const [paidSentiment, setPaidSentiment] = useState<any | null>(null);
  const [rug, setRug] = useState<any | null>(null);
  const [smartMoney, setSmartMoney] = useState<any | null>(null);

  const dossierQ = useQuery({
    queryKey: ['dossier-basic', mint],
    queryFn: () => fetchFreeDossierBasic(mint!),
    enabled: !!mint,
  });
  const newsQ = useQuery({
    queryKey: ['preview-news', newsTicker],
    queryFn: () => fetchPreviewNews(newsTicker),
  });
  const sentQ = useQuery({
    queryKey: ['preview-sentiment', newsTicker],
    queryFn: () => fetchPreviewSentiment(newsTicker),
  });
  const sigQ = useQuery({
    queryKey: ['preview-signal', signalToken],
    queryFn: () => fetchPreviewSignal(signalToken),
  });
  const watchQ = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => loadWatchlist(),
  });

  const watched = useMemo(() => {
    const list = watchQ.data || [];
    return list.some(
      x =>
        x.symbol === symbol ||
        (mint && x.mint === mint) ||
        x.id === (mint || symbol),
    );
  }, [watchQ.data, symbol, mint]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      dossierQ.refetch(),
      newsQ.refetch(),
      sentQ.refetch(),
      sigQ.refetch(),
    ]);
  }, [dossierQ, newsQ, sentQ, sigQ]);

  const toggleWatch = async () => {
    const item: WatchlistItem = {
      id: mint || symbol.toLowerCase(),
      symbol,
      name,
      mint,
      tokenId,
      ticker: newsTicker,
    };
    await toggleWatchlistItem(item);
    await qc.invalidateQueries({queryKey: ['watchlist']});
  };

  const shareCard = async () => {
    const signal =
      paidSignal?.signal?.metadata?.TRADING_SIGNAL ||
      sigQ.data?.signal?.metadata?.TRADING_SIGNAL ||
      'HOLD';
    await Share.share({
      message: `${symbol} · ${signal} on Syra Scout. Browse free, pay per alpha: https://syraa.fun`,
    });
  };

  const title = name || dossierQ.data?.name || symbol;
  const price = dossierQ.data?.priceUsd;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onRefresh}
          tintColor={colors.foreground}
        />
      }>
      <Text style={styles.kicker}>{symbol}</Text>
      <Text style={styles.title}>{title}</Text>
      {dossierQ.isLoading && mint ? (
        <Skeleton style={{height: 24, width: 120}} />
      ) : (
        <Text style={styles.price}>{formatUsd(price ?? null)}</Text>
      )}
      {mint ? <Text style={styles.mint}>{mint}</Text> : null}

      <View style={styles.actions}>
        <Button
          label={watched ? 'Remove watch' : 'Add to watchlist'}
          variant="outline"
          onPress={toggleWatch}
          style={styles.flex}
        />
        <Button
          label="Share"
          variant="outline"
          onPress={shareCard}
          style={styles.flex}
        />
      </View>

      <Text style={styles.section}>Signal</Text>
      <SignalCard
        data={paidSignal?.signal || sigQ.data?.signal}
        teaser={!paidSignal}
      />
      {!paidSignal ? (
        <UnlockButton
          label="Unlock full signal"
          path="/signal"
          query={{token: signalToken}}
          priceUsd={PAID_PRICES_USD.signal}
          onUnlocked={setPaidSignal}
          shareText={`${symbol} signal unlocked on Syra Scout`}
        />
      ) : null}

      <Text style={styles.section}>Sentiment</Text>
      <SentimentCard data={paidSentiment || sentQ.data} />
      {!paidSentiment ? (
        <UnlockButton
          label="Unlock full sentiment"
          path="/sentiment"
          query={{ticker: newsTicker}}
          priceUsd={PAID_PRICES_USD.sentiment}
          onUnlocked={setPaidSentiment}
        />
      ) : null}

      <Text style={styles.section}>News</Text>
      <NewsList
        items={
          paidNews ||
          newsQ.data?.news ||
          []
        }
        emptyLabel={newsQ.isLoading ? 'Loading…' : 'No news'}
      />
      {!paidNews ? (
        <UnlockButton
          label="Unlock full news feed"
          path="/news"
          query={{ticker: newsTicker}}
          priceUsd={PAID_PRICES_USD.news}
          onUnlocked={data => {
            const news = (data as any)?.news;
            setPaidNews(Array.isArray(news) ? news : []);
          }}
        />
      ) : null}

      {mint ? (
        <>
          <Text style={styles.section}>Rug risk</Text>
          {rug ? (
            <Card>
              <Text style={styles.rugScore}>
                Risk score{' '}
                {String(
                  rug?.riskScore ??
                    rug?.data?.riskScore ??
                    rug?.score ??
                    'n/a',
                )}
              </Text>
              <Text style={styles.meta}>
                Probabilistic analysis, not financial advice.
              </Text>
            </Card>
          ) : (
            <UnlockButton
              label="Run rugcheck"
              path="/rugcheck/report"
              query={{mint}}
              priceUsd={PAID_PRICES_USD.rugcheck}
              onUnlocked={setRug}
            />
          )}
        </>
      ) : null}

      <Text style={styles.section}>Smart money</Text>
      {smartMoney ? (
        <Card>
          <Text style={styles.meta}>
            Analytics summary loaded. Review smart-money sections in the payload.
          </Text>
          <Button
            label="Show raw snapshot"
            variant="ghost"
            onPress={() =>
              Alert.alert(
                'Smart money',
                JSON.stringify(smartMoney).slice(0, 800),
              )
            }
          />
        </Card>
      ) : (
        <UnlockButton
          label="Unlock analytics summary"
          path="/analytics/summary"
          priceUsd={PAID_PRICES_USD.analyticsSummary}
          onUnlocked={setSmartMoney}
        />
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
  price: {fontSize: 22, fontWeight: '700', color: colors.foreground},
  mint: {...typography.mono, color: colors.muted},
  actions: {flexDirection: 'row', gap: spacing.sm},
  flex: {flex: 1},
  section: {
    ...typography.kicker,
    color: colors.muted,
    marginTop: spacing.md,
  },
  rugScore: {...typography.section, color: colors.foreground},
  meta: {...typography.meta, color: colors.muted, marginTop: spacing.sm},
});
