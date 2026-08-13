import React, {useState} from 'react';
import {Alert, Share, Text, StyleSheet, View} from 'react-native';
import {Button} from './ui/Button';
import {SpendConfirmModal} from './SpendConfirmModal';
import {usePaidCall} from '../hooks/usePaidCall';
import {ConnectWalletButton} from './ConnectWalletButton';
import {colors, spacing, typography} from '../theme/tokens';
import {useAuthorization} from '../../components/providers/AuthorizationProvider';

export function UnlockButton({
  label,
  path,
  query,
  priceUsd,
  onUnlocked,
  shareText,
}: {
  label: string;
  path: string;
  query?: Record<string, string>;
  priceUsd: number;
  onUnlocked?: (data: unknown) => void;
  shareText?: string;
}) {
  const {selectedAccount} = useAuthorization();
  const {runPaid, busy} = usePaidCall();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amount = priceUsd.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

  const confirm = async () => {
    const res = await runPaid(path, label, query);
    setConfirmOpen(false);
    if (res.ok) {
      onUnlocked?.(res.data);
      if (shareText) {
        Alert.alert('Unlocked', `Charged $${res.chargedUsd || amount} USDC`, [
          {text: 'OK'},
          {
            text: 'Share',
            onPress: () =>
              Share.share({
                message: shareText,
              }),
          },
        ]);
      } else {
        Alert.alert('Unlocked', `Charged $${res.chargedUsd || amount} USDC`);
      }
    } else {
      Alert.alert('Payment failed', res.error || 'Could not complete payment');
    }
  };

  if (!selectedAccount) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.hint}>Connect a wallet to unlock for ${amount}</Text>
        <ConnectWalletButton />
      </View>
    );
  }

  return (
    <>
      <Button
        label={`${label} · $${amount}`}
        onPress={() => setConfirmOpen(true)}
        loading={busy}
      />
      <SpendConfirmModal
        visible={confirmOpen}
        title={label}
        amountUsd={amount}
        loading={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: spacing.sm},
  hint: {...typography.meta, color: colors.muted},
});
