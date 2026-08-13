import React, {type ReactNode} from 'react';
import {View, StyleSheet, type ViewStyle} from 'react-native';
import {colors, radii, spacing} from '../../theme/tokens';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
});
