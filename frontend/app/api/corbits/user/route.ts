// app/api/prepare-payment/route.ts
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { lookupKnownSPLToken } from "@faremeter/info/solana";

export async function POST(request: Request) {
  try {
    const { userPublicKey } = await request.json();

    if (!userPublicKey) {
      return new Response(
        JSON.stringify({ error: "User public key required" }),
        { status: 400 }
      );
    }

    const network: any = "mainnet-beta";
    const usdcInfo = lookupKnownSPLToken(network, "USDC");
    if (!usdcInfo) throw new Error("Could not find USDC mint");

    const connection = new Connection(clusterApiUrl(network));
    const mint = new PublicKey(usdcInfo.address);

    // Return payment configuration to client
    return new Response(
      JSON.stringify({
        mint: mint.toString(),
        network,
        apiUrl: "https://helius.api.corbits.dev",
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
