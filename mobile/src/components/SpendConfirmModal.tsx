import React from 'react';
import {Modal, View, Text, StyleSheet, Pressable} from 'react-native';
import {colors, radii, spacing, typography} from '../theme/tokens';
import {Button} from './ui/Button';

export function SpendConfirmModal({
  visible,
  title,
  amountUsd,
  detail,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  amountUsd: string;
  detail?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.kicker}>Pay with USDC</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.amount}>${amountUsd}</Text>
          <Text style={styles.detail}>
            {detail ||
              'Your wallet signs a USDC transfer. Gas is sponsored by the facilitator. You need USDC, not SOL.'}
          </Text>
          <View style={styles.row}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={onCancel}
              disabled={loading}
              style={styles.flex}
            />
            <Button
              label="Confirm & sign"
              onPress={onConfirm}
              loading={loading}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardElevated,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1,
  },
  kicker: {
    ...typography.kicker,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.section,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  detail: {
    ...typography.meta,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex: {flex: 1},
});
