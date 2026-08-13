import { useCallback, useMemo, useState } from "react";
import { SwapWidget, type Token } from "@relayprotocol/relay-kit-ui";
import { adaptSolanaWallet } from "@relayprotocol/relay-svm-wallet-adapter";
import type { Execute } from "@relayprotocol/relay-sdk";
import { useAccount, useConnect } from "wagmi";
import { VersionedTransaction } from "@solana/web3.js";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  extractRelayRequestId,
  reportBridgeBuyback,
} from "@/lib/bridgeBuybackApi";
import {
  BASE_CHAIN_ID,
  BASE_USDC_ADDRESS,
  BRIDGE_APP_FEE_PERCENT_LABEL,
  RELAY_SOLANA_CHAIN_ID,
  SOLANA_USDC_ADDRESS,
} from "@/lib/bridgeConfig";

const DEFAULT_FROM: Token = {
  chainId: BASE_CHAIN_ID,
  address: BASE_USDC_ADDRESS,
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI: "https://ethereum-optimism.github.io/data/USDC/logo.png",
};

const DEFAULT_TO: Token = {
  chainId: RELAY_SOLANA_CHAIN_ID,
  address: SOLANA_USDC_ADDRESS,
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
};

function BridgeWidgetInner() {
  const [fromToken, setFromToken] = useState<Token | undefined>(DEFAULT_FROM);
  const [toToken, setToToken] = useState<Token | undefined>(DEFAULT_TO);

  const {
    connected: solanaConnected,
    address: solanaAddress,
    connection,
    signTransaction,
    openLoginModal,
  } = useWalletContext();

  const { isConnected: evmConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const solanaAdaptedWallet = useMemo(() => {
    if (!solanaConnected || !solanaAddress) return undefined;

    return adaptSolanaWallet(
      solanaAddress,
      RELAY_SOLANA_CHAIN_ID,
      connection,
      async (transaction, options) => {
        const signed = await signTransaction(transaction);
        const raw =
          signed instanceof VersionedTransaction
            ? signed.serialize()
            : (signed as { serialize: () => Uint8Array }).serialize();
        const signature = await connection.sendRawTransaction(raw, {
          skipPreflight: options?.skipPreflight ?? false,
          maxRetries: options?.maxRetries ?? 3,
          preflightCommitment: "confirmed",
        });
        return { signature };
      },
    );
  }, [solanaConnected, solanaAddress, connection, signTransaction]);

  const onConnectWallet = useCallback(() => {
    const toIsSolana = toToken?.chainId === RELAY_SOLANA_CHAIN_ID;
    const fromIsSolana = fromToken?.chainId === RELAY_SOLANA_CHAIN_ID;

    if ((toIsSolana || fromIsSolana) && !solanaConnected) {
      openLoginModal();
      return;
    }

    if (!evmConnected) {
      const injectedConnector =
        connectors.find((c) => c.id === "injected") ?? connectors[0];
      if (injectedConnector) {
        connect({ connector: injectedConnector });
        return;
      }
    }

    if (!solanaConnected) {
      openLoginModal();
    }
  }, [
    toToken?.chainId,
    fromToken?.chainId,
    evmConnected,
    solanaConnected,
    openLoginModal,
    connectors,
    connect,
  ]);

  const onSwapSuccess = useCallback((data: Execute) => {
    const requestId = extractRelayRequestId(data);
    if (requestId) void reportBridgeBuyback(requestId);
  }, []);

  const onAnalyticEvent = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      if (eventName === "swap_success" || eventName === "transaction_success") {
        const requestId =
          (typeof data?.requestId === "string" && data.requestId) ||
          (typeof data?.id === "string" && data.id) ||
          null;
        if (requestId) void reportBridgeBuyback(requestId);
      }
    },
    [],
  );

  // Pass Solana adapter when origin is Solana; otherwise leave undefined so wagmi drives EVM.
  const wallet =
    fromToken?.chainId === RELAY_SOLANA_CHAIN_ID
      ? solanaAdaptedWallet
      : undefined;

  return (
    <div className="w-full max-w-md">
      <SwapWidget
        fromToken={fromToken}
        setFromToken={setFromToken}
        toToken={toToken}
        setToToken={setToToken}
        supportedWalletVMs={["evm", "svm"]}
        wallet={wallet}
        onConnectWallet={onConnectWallet}
        onSwapSuccess={onSwapSuccess}
        onAnalyticEvent={onAnalyticEvent}
        disableInputAutoFocus
        popularChainIds={[BASE_CHAIN_ID, RELAY_SOLANA_CHAIN_ID, 1, 42161, 10]}
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        A {BRIDGE_APP_FEE_PERCENT_LABEL} app fee funds $SYRA buybacks (batched
        every 24h). Powered by{" "}
        <a
          href="https://docs.relay.link/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Relay
        </a>
        .
      </p>
    </div>
  );
}

export function BridgeWidget() {
  return <BridgeWidgetInner />;
}
