import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Card} from './ui/Card';
import {colors, spacing, typography, signalTone} from '../theme/tokens';
import type {PreviewSignalResponse} from '../lib/previewApi';

export function SignalCard({
  data,
  teaser,
}: {
  data?: PreviewSignalResponse['signal'];
  teaser?: boolean;
}) {
  const meta = data?.metadata;
  const signal = meta?.TRADING_SIGNAL || data?.recommendation || 'HOLD';
  const strength = meta?.SIGNAL_STRENGTH ?? '-';
  const tone = signalTone(String(signal));

  return (
    <Card>
      <Text style={styles.kicker}>{teaser ? 'Preview signal' : 'Live signal'}</Text>
      <View style={styles.row}>
        <Text style={[styles.signal, {color: tone}]}>{String(signal)}</Text>
        <Text style={styles.strength}>Strength {String(strength)}</Text>
      </View>
      {meta?.instrument ? (
        <Text style={styles.meta}>{meta.instrument}</Text>
      ) : null}
      {teaser ? (
        <Text style={styles.hint}>
          Preview is free. Unlock the full paid signal for the latest technicals.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {...typography.kicker, color: colors.muted, marginBottom: spacing.sm},
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  signal: {fontSize: 28, fontWeight: '700'},
  strength: {...typography.meta, color: colors.mutedStrong},
  meta: {...typography.meta, color: colors.muted, marginTop: spacing.sm},
  hint: {...typography.meta, color: colors.muted, marginTop: spacing.md},
});
