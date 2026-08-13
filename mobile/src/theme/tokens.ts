/**
 * Dark-first Syra tokens mirrored from web/src/index.css (.dark).
 * Use with StyleSheet or NativeWind classNames.
 */
export const colors = {
  background: '#0a0b0f',
  foreground: '#f4f6f8',
  card: '#101218',
  cardElevated: '#141820',
  muted: '#9aa3b2',
  mutedStrong: '#c4cad4',
  border: '#22262f',
  borderSoft: 'rgba(34, 38, 47, 0.7)',
  primary: '#fafafa',
  primaryFg: '#0a0b0f',
  success: '#35996a',
  destructive: '#ad2f2f',
  warning: '#f5a524',
  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  kicker: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  section: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  mono: {
    fontSize: 12,
    fontVariant: ['tabular-nums' as const],
  },
};

export function signalTone(signal?: string): string {
  const s = String(signal || '').toUpperCase();
  if (s.includes('BUY') || s.includes('BULL')) return colors.success;
  if (s.includes('SELL') || s.includes('BEAR')) return colors.destructive;
  return colors.mutedStrong;
}
