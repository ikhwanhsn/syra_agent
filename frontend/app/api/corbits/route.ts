// This api will fund from server wallet

import { Keypair, PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { wrap as wrapFetch } from "@faremeter/fetch";
import { lookupKnownSPLToken } from "@faremeter/info/solana";
import { createLocalWallet } from "@faremeter/wallet-solana";

export async function POST(request: Request) {
  try {
    // Load keypair from environment
    const { PAYER_KEYPAIR } = process.env;
    if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

    const network: any = "mainnet-beta";

    // Lookup USDC automatically
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

    // Make a paid API request
    const url = "https://helius.api.corbits.dev";
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "getBlockHeight",
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
    console.log("Latest Block Height:", data.result);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
