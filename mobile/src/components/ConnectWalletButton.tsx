import React, {useCallback, useState} from 'react';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {useAuthorization} from '../../components/providers/AuthorizationProvider';
import {Button} from './ui/Button';
import {shortenAddress} from '../lib/format';

export function ConnectWalletButton({
  variant = 'primary',
}: {
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  const {authorizeSession, selectedAccount} = useAuthorization();
  const [loading, setLoading] = useState(false);

  const onConnect = useCallback(async () => {
    setLoading(true);
    try {
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
    } catch {
      // user cancelled
    } finally {
      setLoading(false);
    }
  }, [authorizeSession]);

  if (selectedAccount) {
    return (
      <Button
        label={shortenAddress(selectedAccount.publicKey.toBase58())}
        variant="outline"
        onPress={() => {}}
        disabled
      />
    );
  }

  return (
    <Button
      label="Connect wallet"
      onPress={onConnect}
      loading={loading}
      variant={variant}
      accessibilityLabel="Connect Solana mobile wallet"
    />
  );
}
