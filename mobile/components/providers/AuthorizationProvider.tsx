import {PublicKey} from '@solana/web3.js';
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {toUint8Array} from 'js-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useCallback, useMemo, useEffect, ReactNode} from 'react';
import React from 'react';
import {SYRA_APP_IDENTITY} from '../../src/lib/syraBranding';
import {RPC_ENDPOINT} from './ConnectionProvider';

const STORAGE_KEY = '@syra_scout/mwa_auth_v1';

export type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

type StoredAuthorization = {
  accounts: Array<{address: Base64EncodedAddress; label?: string}>;
  authToken: AuthToken;
  selectedAddress: Base64EncodedAddress;
};

export const APP_IDENTITY = SYRA_APP_IDENTITY;

function getAccountFromAuthorizedAccount(account: AuthorizedAccount): Account {
  return {
    ...account,
    publicKey: getPublicKeyFromAddress(account.address),
  };
}

function getPublicKeyFromAddress(address: Base64EncodedAddress): PublicKey {
  const publicKeyByteArray = toUint8Array(address);
  return new PublicKey(publicKeyByteArray);
}

function getAuthorizationFromAuthorizationResult(
  authorizationResult: AuthorizationResult,
  previouslySelectedAccount?: Account,
): Authorization {
  let selectedAccount: Account;
  if (
    previouslySelectedAccount == null ||
    !authorizationResult.accounts.some(
      ({address}) => address === previouslySelectedAccount.address,
    )
  ) {
    selectedAccount = getAccountFromAuthorizedAccount(
      authorizationResult.accounts[0],
    );
  } else {
    selectedAccount = previouslySelectedAccount;
  }
  return {
    accounts: authorizationResult.accounts.map(getAccountFromAuthorizedAccount),
    authToken: authorizationResult.auth_token,
    selectedAccount,
  };
}

async function persistAuthorization(auth: Authorization | null) {
  if (!auth) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  const stored: StoredAuthorization = {
    accounts: auth.accounts.map(a => ({address: a.address, label: a.label})),
    authToken: auth.authToken,
    selectedAddress: auth.selectedAccount.address,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

async function loadStoredAuthorization(): Promise<Authorization | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredAuthorization;
    if (!stored?.authToken || !stored.accounts?.length) return null;
    const accounts = stored.accounts.map(a => ({
      ...a,
      publicKey: getPublicKeyFromAddress(a.address),
    }));
    const selected =
      accounts.find(a => a.address === stored.selectedAddress) || accounts[0];
    return {
      accounts,
      authToken: stored.authToken,
      selectedAccount: selected,
    };
  } catch {
    return null;
  }
}

export interface AuthorizationProviderContext {
  accounts: Account[] | null;
  authToken: AuthToken | null;
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  selectedAccount: Account | null;
  ready: boolean;
}

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  accounts: null,
  authToken: null,
  authorizeSession: (_wallet: AuthorizeAPI & ReauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  deauthorizeSession: (_wallet: DeauthorizeAPI) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  onChangeAccount: (_nextSelectedAccount: Account) => {
    throw new Error('AuthorizationProvider not initialized');
  },
  selectedAccount: null,
  ready: false,
});

function AuthorizationProvider(props: {children: ReactNode}) {
  const {children} = props;
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStoredAuthorization()
      .then(auth => {
        if (auth) setAuthorization(auth);
      })
      .finally(() => setReady(true));
  }, []);

  const handleAuthorizationResult = useCallback(
    async (
      authorizationResult: AuthorizationResult,
    ): Promise<Authorization> => {
      const nextAuthorization = getAuthorizationFromAuthorizationResult(
        authorizationResult,
        authorization?.selectedAccount,
      );
      setAuthorization(nextAuthorization);
      await persistAuthorization(nextAuthorization);
      return nextAuthorization;
    },
    [authorization],
  );

  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI & ReauthorizeAPI) => {
      const authorizationResult = await (authorization
        ? wallet.reauthorize({
            auth_token: authorization.authToken,
            identity: APP_IDENTITY,
          })
        : wallet.authorize({
            cluster: RPC_ENDPOINT,
            identity: APP_IDENTITY,
          }));
      return (await handleAuthorizationResult(authorizationResult))
        .selectedAccount;
    },
    [authorization, handleAuthorizationResult],
  );

  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken == null) {
        setAuthorization(null);
        await persistAuthorization(null);
        return;
      }
      try {
        await wallet.deauthorize({auth_token: authorization.authToken});
      } catch {
        // clear local anyway
      }
      setAuthorization(null);
      await persistAuthorization(null);
    },
    [authorization],
  );

  const onChangeAccount = useCallback((nextSelectedAccount: Account) => {
    setAuthorization(currentAuthorization => {
      if (
        !currentAuthorization?.accounts.some(
          ({address}) => address === nextSelectedAccount.address,
        )
      ) {
        throw new Error(
          `${nextSelectedAccount.address} is not one of the available addresses`,
        );
      }
      const next = {
        ...currentAuthorization,
        selectedAccount: nextSelectedAccount,
      };
      void persistAuthorization(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authToken: authorization?.authToken ?? null,
      authorizeSession,
      deauthorizeSession,
      onChangeAccount,
      selectedAccount: authorization?.selectedAccount ?? null,
      ready,
    }),
    [
      authorization,
      authorizeSession,
      deauthorizeSession,
      onChangeAccount,
      ready,
    ],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

const useAuthorization = () => React.useContext(AuthorizationContext);

export {AuthorizationProvider, useAuthorization};
