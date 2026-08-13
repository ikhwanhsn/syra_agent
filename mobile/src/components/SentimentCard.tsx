import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {Card} from './ui/Card';
import {colors, spacing, typography} from '../theme/tokens';
import type {PreviewSentimentResponse} from '../lib/previewApi';

export function SentimentCard({data}: {data?: PreviewSentimentResponse}) {
  const series =
    data?.sentimentAnalysis ||
    data?.sentiment?.data ||
    [];
  const latest = series[series.length - 1] || series[0];
  const score =
    latest?.sentiment_score ??
    (latest?.ticker && typeof latest.ticker === 'object'
      ? (latest.ticker as any).sentiment_score
      : undefined);
  const pos =
    latest?.Positive ??
    (latest?.ticker as any)?.Positive ??
    data?.sentiment?.totals?.Positive;
  const neg =
    latest?.Negative ??
    (latest?.ticker as any)?.Negative ??
    data?.sentiment?.totals?.Negative;

  return (
    <Card>
      <Text style={styles.kicker}>Sentiment</Text>
      <Text style={styles.score}>
        {score != null && Number.isFinite(Number(score))
          ? Number(score).toFixed(2)
          : '-'}
      </Text>
      <Text style={styles.meta}>
        Positive {pos ?? '-'} · Negative {neg ?? '-'} · {series.length} days
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {...typography.kicker, color: colors.muted, marginBottom: spacing.sm},
  score: {fontSize: 32, fontWeight: '700', color: colors.foreground},
  meta: {...typography.meta, color: colors.muted, marginTop: spacing.sm},
});
