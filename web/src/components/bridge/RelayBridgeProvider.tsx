import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RelayKitProvider } from "@relayprotocol/relay-kit-ui";
import { useRelayChains } from "@relayprotocol/relay-kit-hooks";
import { MAINNET_RELAY_API } from "@relayprotocol/relay-sdk";
import { http, createConfig, WagmiProvider, type Config } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, base } from "wagmi/chains";
import type { Chain } from "viem";
import { useTheme } from "next-themes";
import {
  BRIDGE_APP_FEE_BPS,
  getBridgeFeeRecipient,
} from "@/lib/bridgeConfig";
import "@relayprotocol/relay-kit-ui/styles.css";

type Props = {
  children: ReactNode;
};

function buildWagmiConfig(viemChains: Chain[] | undefined): Config {
  const chains =
    viemChains && viemChains.length > 0
      ? (viemChains as [Chain, ...Chain[]])
      : ([mainnet, base] as [Chain, ...Chain[]]);

  const transports = Object.fromEntries(
    chains.map((chain) => [chain.id, http()]),
  ) as Record<number, ReturnType<typeof http>>;

  return createConfig({
    chains,
    connectors: [injected({ shimDisconnect: true })],
    transports,
    ssr: false,
  });
}

/**
 * Bridge-scoped Wagmi + RelayKit providers.
 * Reuses the app QueryClient from AppProviders (must already wrap this tree).
 */
export function RelayBridgeProvider({ children }: Props) {
  const { resolvedTheme } = useTheme();
  const { chains, viemChains } = useRelayChains(MAINNET_RELAY_API);
  const [wagmiConfig, setWagmiConfig] = useState<Config>(() =>
    buildWagmiConfig(undefined),
  );

  useEffect(() => {
    if (viemChains && viemChains.length > 0) {
      setWagmiConfig(buildWagmiConfig(viemChains as Chain[]));
    }
  }, [viemChains]);

  const feeRecipient = getBridgeFeeRecipient();
  const themeScheme = resolvedTheme === "light" ? "light" : "dark";

  const relayOptions = useMemo(
    () => ({
      appName: "Syra",
      appFees: [
        {
          recipient: feeRecipient,
          fee: BRIDGE_APP_FEE_BPS,
        },
      ],
      chains: chains ?? undefined,
      baseApiUrl: MAINNET_RELAY_API,
      themeScheme: themeScheme as "dark" | "light",
      acknowledgeApiKeyExposure: true,
    }),
    [chains, feeRecipient, themeScheme],
  );

  return (
    <RelayKitProvider options={relayOptions}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount>
        {children}
      </WagmiProvider>
    </RelayKitProvider>
  );
}
