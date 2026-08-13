import {useCallback, useState} from 'react';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import type {VersionedTransaction} from '@solana/web3.js';
import {useAuthorization} from '../../components/providers/AuthorizationProvider';
import {useConnection} from '../../components/providers/ConnectionProvider';
import {fetchPaidJson, type PaidFetchResult} from '../lib/paidApi';

export function usePaidCall() {
  const {authorizeSession, selectedAccount} = useAuthorization();
  const {connection} = useConnection();
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const runPaid = useCallback(
    async <T = unknown>(
      path: string,
      label: string,
      query?: Record<string, string>,
    ): Promise<PaidFetchResult<T>> => {
      setBusy(true);
      setLastError(null);
      try {
        const result = await transact(async wallet => {
          const account = await authorizeSession(wallet);
          return fetchPaidJson<T>(path, {
            publicKey: account.publicKey,
            connection,
            label,
            signTransactions: async (txs: VersionedTransaction[]) => {
              return wallet.signTransactions({transactions: txs});
            },
          }, query);
        });
        if (!result.ok) setLastError(result.error || 'Payment failed');
        return result;
      } catch (e: any) {
        const msg = e?.message || 'Wallet session failed';
        setLastError(msg);
        return {ok: false, status: 0, error: msg};
      } finally {
        setBusy(false);
      }
    },
    [authorizeSession, connection],
  );

  return {
    runPaid,
    busy,
    lastError,
    selectedAccount,
    isConnected: !!selectedAccount,
  };
}
