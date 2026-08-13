import {Connection, type ConnectionConfig} from '@solana/web3.js';
import React, {
  type FC,
  type ReactNode,
  useMemo,
  createContext,
  useContext,
} from 'react';
import {getSolanaRpcUrl} from '../../src/lib/env';

/** MWA authorize cluster + app default network. */
export const RPC_ENDPOINT = 'mainnet-beta' as const;

export interface ConnectionProviderProps {
  children: ReactNode;
  endpoint?: string;
  config?: ConnectionConfig;
}

export const ConnectionProvider: FC<ConnectionProviderProps> = ({
  children,
  endpoint = getSolanaRpcUrl(),
  config = {commitment: 'confirmed'},
}) => {
  const connection = useMemo(
    () => new Connection(endpoint, config),
    [endpoint, config],
  );

  return (
    <ConnectionContext.Provider value={{connection}}>
      {children}
    </ConnectionContext.Provider>
  );
};

export interface ConnectionContextState {
  connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>(
  {} as ConnectionContextState,
);

export function useConnection(): ConnectionContextState {
  return useContext(ConnectionContext);
}
