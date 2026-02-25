import {
  FC,
  ReactNode,
  useMemo,
  useCallback,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { WalletModalProviderFixed } from "../components/WalletModalProviderFixed";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/** Syra token mint – holding ≥ this amount grants view-only access. */
const SYRA_MINT = new PublicKey(
  import.meta.env.VITE_SYRA_TOKEN_MINT || "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
);

const COMMITMENT = "confirmed" as const;

function parseTokenAmountBalance(account: {
  account?: {
    data?: {
      parsed?: {
        info?: {
          tokenAmount?: {
            uiAmount?: number | null;
            uiAmountString?: string | null;
            amount?: string;
            decimals?: number;
          };
        };
      };
    };
  };
}): number {
  const tokenAmount = account.account?.data?.parsed?.info?.tokenAmount;
  if (!tokenAmount) return 0;
  if (tokenAmount.uiAmount != null) return Number(tokenAmount.uiAmount);
  if (tokenAmount.uiAmountString != null) return parseFloat(tokenAmount.uiAmountString) || 0;
  if (tokenAmount.amount != null && tokenAmount.decimals != null)
    return Number(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
  return 0;
}

/** Sum parsed token balance from getParsedTokenAccountsByOwner result (same shape as parseTokenAmountBalance). */
function sumParsedBalance(
  accounts: Parameters<typeof parseTokenAmountBalance>[0][]
): number {
  return accounts.reduce((sum, acc) => sum + parseTokenAmountBalance(acc), 0);
}

/**
 * Fetch SYRA balance using getParsedTokenAccountsByOwner.
 * SYRA is a Pump.fun token (Token-2022); the standard mint filter only queries Token program,
 * so we must query by programId for Token-2022 and filter by mint in code.
 */
async function fetchSyraBalanceParsed(
  connection: import("@solana/web3.js").Connection,
  owner: PublicKey
): Promise<number> {
  const mintStr = SYRA_MINT.toBase58();
  let total = 0;

  // 1) Standard Token program: filter by mint (same as USDC)
  try {
    const standard = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: SYRA_MINT,
    });
    total += sumParsedBalance(standard.value || []);
  } catch {
    // RPC or parse error; continue to Token-2022
  }

  // 2) Token-2022: get all Token-2022 accounts for owner, then filter by SYRA mint
  try {
    const token2022 = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_2022_PROGRAM_ID,
    });
    const syraAccounts = (token2022.value || []).filter(
      (acc) => acc.account?.data?.parsed?.info?.mint === mintStr
    );
    total += sumParsedBalance(syraAccounts);
  } catch {
    // RPC or parse error
  }

  return total;
}

/** Fetch SYRA balance using @solana/spl-token (ATA + getAccount + getMint). Tries both Token and Token-2022 programs. */
async function fetchSyraBalanceSpl(
  connection: import("@solana/web3.js").Connection,
  owner: PublicKey
): Promise<number> {
  const programs = [TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID]; // Token-2022 first (Pump.fun)
  let total = 0;
  for (const programId of programs) {
    try {
      const ata = getAssociatedTokenAddressSync(SYRA_MINT, owner, false, programId);
      const account = await getAccount(connection, ata, COMMITMENT);
      const mint = await getMint(connection, SYRA_MINT, COMMITMENT, programId);
      const amount = Number(account.amount);
      const decimals = mint.decimals;
      total += amount / Math.pow(10, decimals);
    } catch {
      // ATA may not exist or mint not in this program; try next program
    }
  }
  return total;
}
/** Minimum Syra balance (human units) required to view dashboard. */
const SYRA_MIN_VIEW = 1_000_000;

/** Only this wallet can interact (full access). Set via VITE_ALLOWED_WALLET. */
const DEFAULT_ALLOWED_WALLET = "Cp5yFGYx88EEuUjhDAaQzXHrgxvVeYEWixtRnLFE81K4";
const ALLOWED_WALLET =
  (import.meta.env.VITE_ALLOWED_WALLET as string) || DEFAULT_ALLOWED_WALLET;

const MAINNET_RPC =
  import.meta.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

export interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  /** True when connected AND address matches allowed wallet (full access). */
  isAuthorized: boolean;
  /** Syra token balance (human units). null while loading or not connected. */
  syraBalance: number | null;
  /** Can see dashboard: admin wallet OR syraBalance >= 1,000,000. */
  canViewDashboard: boolean;
  /** Can interact (submit, etc.): only admin wallet. */
  canInteract: boolean;
  /** Set when connected but syraBalance < 1m and not admin (insufficient hold). */
  insufficientSyra: boolean;
  address: string | null;
  shortAddress: string | null;
  solBalance: number | null;
  usdcBalance: number | null;
  network: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  publicKey: PublicKey | null;
}

const WalletContext = createContext<WalletContextState | null>(null);

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletContextProvider");
  }
  return context;
}

const WalletContextInner: FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect: walletDisconnect,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [syraBalance, setSyraBalance] = useState<number | null>(null);

  const address = publicKey?.toBase58() ?? null;
  const isAuthorized =
    connected && address !== null && address === ALLOWED_WALLET;
  const canViewDashboard =
    isAuthorized ||
    (connected &&
      syraBalance !== null &&
      syraBalance >= SYRA_MIN_VIEW);
  const canInteract = isAuthorized;
  const insufficientSyra =
    connected &&
    !isAuthorized &&
    syraBalance !== null &&
    syraBalance < SYRA_MIN_VIEW;

  // Fetch SOL, USDC, and Syra balances when wallet connects (any wallet)
  useEffect(() => {
    async function fetchBalances() {
      if (!publicKey || !connected) {
        setSolBalance(null);
        setUsdcBalance(null);
        setSyraBalance(null);
        return;
      }
      if (!connection) return;
      try {
        const balance = await connection.getBalance(publicKey, "confirmed");
        setSolBalance(balance / LAMPORTS_PER_SOL);

        // USDC: standard SPL token program only
        try {
          const usdcAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: USDC_MINT,
          });
          const usdcTotal = usdcAccounts.value.reduce(
            (sum, account) => sum + parseTokenAmountBalance(account),
            0
          );
          setUsdcBalance(usdcAccounts.value.length > 0 ? usdcTotal : 0);
        } catch {
          setUsdcBalance(0);
        }

        // SYRA: primary = getParsedTokenAccountsByOwner (Token + Token-2022); fallback = ATA + getAccount
        try {
          let syraTotal = await fetchSyraBalanceParsed(connection, publicKey);
          if (syraTotal === 0) {
            syraTotal = await fetchSyraBalanceSpl(connection, publicKey);
          }
          setSyraBalance(syraTotal);
        } catch {
          setSyraBalance(0);
        }
      } catch {
        // RPC/network error: set balances to 0 so UI doesn't stay on "Checking…"
        setSolBalance(0);
        setUsdcBalance(0);
        setSyraBalance(0);
      }
    }
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [publicKey, connected, connection]);

  const connect = useCallback(async () => {
    setVisible(true);
  }, [setVisible]);

  const disconnect = useCallback(async () => {
    await walletDisconnect();
    setSolBalance(null);
    setUsdcBalance(null);
    setSyraBalance(null);
  }, [walletDisconnect]);

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  const contextValue: WalletContextState = useMemo(
    () => ({
      connected,
      connecting,
      isAuthorized,
      syraBalance,
      canViewDashboard,
      canInteract,
      insufficientSyra,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      network: "Solana Mainnet",
      connect,
      disconnect,
      publicKey,
    }),
    [
      connected,
      connecting,
      isAuthorized,
      syraBalance,
      canViewDashboard,
      canInteract,
      insufficientSyra,
      address,
      shortAddress,
      solBalance,
      usdcBalance,
      connect,
      disconnect,
      publicKey,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => MAINNET_RPC, []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
      new CoinbaseWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProviderFixed>
          <WalletContextInner>{children}</WalletContextInner>
        </WalletModalProviderFixed>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
