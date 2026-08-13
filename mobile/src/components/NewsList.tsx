import React from 'react';
import {View, Text, StyleSheet, Linking, Pressable} from 'react-native';
import {Card} from './ui/Card';
import {colors, spacing, typography} from '../theme/tokens';
import type {PreviewNewsItem} from '../lib/previewApi';

export function NewsList({
  items,
  emptyLabel = 'No headlines yet',
}: {
  items: PreviewNewsItem[];
  emptyLabel?: string;
}) {
  if (!items?.length) {
    return (
      <Card>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </Card>
    );
  }
  return (
    <View style={styles.stack}>
      {items.slice(0, 8).map((item, idx) => (
        <Pressable
          key={`${item.title}-${idx}`}
          onPress={() => item.news_url && Linking.openURL(item.news_url)}
          accessibilityRole="link"
          accessibilityLabel={item.title || 'News article'}>
          <Card style={styles.item}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title || 'Untitled'}
            </Text>
            {item.text ? (
              <Text style={styles.body} numberOfLines={3}>
                {item.text}
              </Text>
            ) : null}
            <Text style={styles.meta}>
              {[item.source_name, item.date].filter(Boolean).join(' · ')}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: spacing.md},
  item: {gap: spacing.sm},
  title: {...typography.section, color: colors.foreground, fontSize: 16},
  body: {...typography.meta, color: colors.mutedStrong},
  meta: {...typography.mono, color: colors.muted, marginTop: spacing.xs},
  empty: {...typography.body, color: colors.muted},
});
