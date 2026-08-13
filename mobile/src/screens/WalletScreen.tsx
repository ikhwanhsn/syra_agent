import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {colors, spacing, typography} from '../theme/tokens';
import {useAuthorization} from '../../components/providers/AuthorizationProvider';
import {useConnection} from '../../components/providers/ConnectionProvider';
import {ConnectWalletButton} from '../components/ConnectWalletButton';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {Skeleton} from '../components/ui/Skeleton';
import {fetchUsdcBalance} from '../lib/usdcBalance';
import {fetchHolderBenefits} from '../lib/holderBenefits';
import {loadSpendHistory} from '../lib/spendHistory';
import {formatUsd, shortenAddress} from '../lib/format';

export function WalletScreen() {
  const {selectedAccount, deauthorizeSession, authorizeSession} =
    useAuthorization();
  const {connection} = useConnection();
  const [refreshing, setRefreshing] = useState(false);
  const wallet = selectedAccount?.publicKey.toBase58();

  const usdcQ = useQuery({
    queryKey: ['usdc', wallet],
    queryFn: () => fetchUsdcBalance(connection, selectedAccount!.publicKey),
    enabled: !!selectedAccount,
  });
  const benefitsQ = useQuery({
    queryKey: ['holder-benefits', wallet],
    queryFn: () => fetchHolderBenefits(wallet!),
    enabled: !!wallet,
  });
  const spendQ = useQuery({
    queryKey: ['spend-history'],
    queryFn: () => loadSpendHistory(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      usdcQ.refetch(),
      benefitsQ.refetch(),
      spendQ.refetch(),
    ]);
    setRefreshing(false);
  }, [usdcQ, benefitsQ, spendQ]);

  const disconnect = async () => {
    try {
      await transact(async walletApi => {
        await deauthorizeSession(walletApi);
      });
    } catch {
      await deauthorizeSession({
        deauthorize: async () => undefined,
      } as any);
    }
  };

  const reconnect = async () => {
    try {
      await transact(async walletApi => {
        await authorizeSession(walletApi);
      });
    } catch {
      // cancelled
    }
  };

  const discountPct =
    benefitsQ.data?.discount != null
      ? Math.round(Number(benefitsQ.data.discount) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.foreground}
        />
      }>
      <Text style={styles.kicker}>Account</Text>
      <Text style={styles.title}>Wallet</Text>

      {!selectedAccount ? (
        <Card style={styles.gap}>
          <Text style={styles.body}>
            Connect a Mobile Wallet Adapter wallet to pay for alpha in USDC. Gas
            is sponsored; you do not need SOL for fees.
          </Text>
          <ConnectWalletButton />
        </Card>
      ) : (
        <>
          <Card style={styles.gap}>
            <Text style={styles.label}>Connected</Text>
            <Text style={styles.addr}>
              {shortenAddress(wallet || '', 6, 6)}
            </Text>
            <Text style={styles.label}>USDC balance</Text>
            {usdcQ.isLoading ? (
              <Skeleton style={{width: 80, height: 24}} />
            ) : (
              <Text style={styles.balance}>
                {formatUsd(usdcQ.data ?? 0, 4)}
              </Text>
            )}
            <View style={styles.row}>
              <Button
                label="Refresh session"
                variant="outline"
                onPress={reconnect}
                style={styles.flex}
              />
              <Button
                label="Disconnect"
                variant="ghost"
                onPress={disconnect}
                style={styles.flex}
              />
            </View>
          </Card>

          <Text style={styles.section}>$SYRA holder discount</Text>
          <Card>
            {benefitsQ.isLoading ? (
              <Skeleton style={{height: 48}} />
            ) : (
              <>
                <Text style={styles.balance}>
                  {discountPct > 0 ? `${discountPct}% off` : 'No discount yet'}
                </Text>
                <Text style={styles.meta}>
                  Tier {String(benefitsQ.data?.tier ?? 'none')} · balance{' '}
                  {String(benefitsQ.data?.syraAmount ?? 0)} $SYRA
                </Text>
                <Text style={styles.meta}>
                  Holder pricing uses X-Payer-Address on every paid call.
                </Text>
              </>
            )}
          </Card>
        </>
      )}

      <Text style={styles.section}>Spend history</Text>
      <Card>
        {(spendQ.data || []).length === 0 ? (
          <Text style={styles.meta}>No paid calls yet.</Text>
        ) : (
          (spendQ.data || []).slice(0, 20).map(item => (
            <View key={item.id} style={styles.spendRow}>
              <View style={styles.flex}>
                <Text style={styles.spendLabel}>{item.label}</Text>
                <Text style={styles.meta}>
                  {new Date(item.at).toLocaleString()} · {item.path}
                </Text>
              </View>
              <Text
                style={[
                  styles.spendAmt,
                  {color: item.ok ? colors.success : colors.destructive},
                ]}>
                ${item.amountUsd}
              </Text>
            </View>
          ))
        )}
      </Card>
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
  section: {
    ...typography.kicker,
    color: colors.muted,
    marginTop: spacing.md,
  },
  gap: {gap: spacing.md},
  body: {...typography.body, color: colors.mutedStrong},
  label: {...typography.kicker, color: colors.muted},
  addr: {
    ...typography.mono,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  balance: {fontSize: 28, fontWeight: '700', color: colors.foreground},
  meta: {...typography.meta, color: colors.muted, marginTop: spacing.xs},
  row: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
  flex: {flex: 1},
  spendRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  spendLabel: {color: colors.foreground, fontWeight: '600'},
  spendAmt: {fontWeight: '700'},
});
