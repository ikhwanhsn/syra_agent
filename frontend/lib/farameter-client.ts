import { wrap as wrapFetch } from "@faremeter/fetch";
import { createPaymentHandler } from "@faremeter/payment-solana/exact";
import { lookupKnownSPLToken } from "@faremeter/info/solana";
import { Connection, PublicKey } from "@solana/web3.js";

declare global {
  interface Window {
    solana: any;
  }
}

const DEVNET_RPC = "https://api.devnet.solana.com";
const ASSET = "USDC";
const USDC_DECIMALS = 6;

function toUsdc(rawAmount: bigint | number): number {
  return Number(rawAmount) / 10 ** USDC_DECIMALS;
}

async function ensureWallet() {
  const provider = window.solana;
  if (!provider?.isPhantom) {
    throw new Error("Phantom not found. Install Phantom and switch to Devnet.");
  }
  await provider.connect({ onlyIfTrusted: false });
  return provider;
}

function createPhantomWallet(network: string, provider: any) {
  return {
    network,
    publicKey: new PublicKey(provider.publicKey.toString()),
    updateTransaction: async (tx: any) => provider.signTransaction(tx),
  };
}

async function getUsdcBalance(payerPubkey: PublicKey, usdcMint: PublicKey) {
  const conn = new Connection(DEVNET_RPC, "confirmed");
  const resp = await conn.getParsedTokenAccountsByOwner(payerPubkey, {
    mint: usdcMint,
  });
  let raw = BigInt(0);
  for (const a of resp.value) {
    const amt = a.account.data.parsed.info.tokenAmount.amount;
    raw += BigInt(amt);
  }
  return toUsdc(raw);
}

export async function createFareMeterClient() {
  const provider = await ensureWallet();
  const wallet = createPhantomWallet("devnet", provider);

  const tokenInfo = lookupKnownSPLToken("devnet", ASSET);
  if (!tokenInfo) {
    throw new Error(`Unknown asset: ${ASSET} on devnet`);
  }

  const usdcMint = new PublicKey(tokenInfo.address);
  const usdc = await getUsdcBalance(wallet.publicKey, usdcMint);

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const handler = createPaymentHandler(wallet, usdcMint, connection);

  const payerChooser = async (execers: any[]) => {
    if (execers.length < 1) throw new Error("no applicable payers found");

    for (const e of execers) {
      const need = toUsdc(e.requirements.maxAmountRequired);
      if (need <= usdc) return e;
    }

    const candidate = execers[0];
    const need = toUsdc(candidate.requirements.maxAmountRequired);
    const short = need - usdc;
    throw new Error(
      `Insufficient USDC. Need ${need.toFixed(6)} USDC. Have ${usdc.toFixed(
        6
      )} USDC. Short by ${short.toFixed(6)} USDC.`
    );
  };

  return wrapFetch(fetch, { handlers: [handler], payerChooser });
}
