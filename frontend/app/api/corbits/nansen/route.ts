import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createLocalWallet } from "@faremeter/wallet-solana";
import { lookupKnownSPLToken } from "@faremeter/info/solana";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";

export async function POST(request: Request) {
  try {
    // Load keypair from environment
    const { PAYER_KEYPAIR } = process.env;
    if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

    const network = "mainnet-beta";

    // Lookup USDC mint address automatically
    const usdcInfo = lookupKnownSPLToken(network, "USDC");
    if (!usdcInfo) throw new Error("Could not find USDC mint");

    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(PAYER_KEYPAIR))
    );
    const connection = new Connection(clusterApiUrl(network));
    const mint = new PublicKey(usdcInfo.address);

    const wallet = await createLocalWallet(network, keypair);
    const fetchWithPayer = wrapFetch(fetch, {
      handlers: [createPaymentHandler(wallet, mint, connection)],
    });

    const url = "https://nansen.api.corbits.dev/api/v1/smart-money/netflow";

    const payload = {
      chains: ["ethereum", "solana"],
      filters: {
        exclude_smart_money_labels: ["30D Smart Trader"],
        include_native_tokens: false,
        include_smart_money_labels: ["Fund", "Smart Trader"],
        include_stablecoins: false,
      },
      pagination: {
        page: 1,
        per_page: 10,
      },
      order_by: [
        {
          field: "chain",
          direction: "ASC",
        },
      ],
    };

    const response = await fetchWithPayer(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
    }

    const data = await response.json();
    console.log("Smart Money Net Flow:", JSON.stringify(data, null, 2));
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
