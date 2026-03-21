import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const STAKING_MINT = process.env.NEXT_PUBLIC_STAKING_MINT;
const STAKING_DECIMALS = Number(process.env.NEXT_PUBLIC_STAKING_DECIMALS || "6");
const FAUCET_AMOUNT = Number(process.env.FAUCET_AMOUNT || "1000");
const FAUCET_SECRET_KEY = process.env.FAUCET_SECRET_KEY;
const FAUCET_KEYPAIR_PATH = process.env.FAUCET_KEYPAIR_PATH;

function getFaucetKeypair(): Keypair | null {
  if (FAUCET_SECRET_KEY) {
    try {
      const parsed = JSON.parse(FAUCET_SECRET_KEY) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(parsed));
    } catch {
      return null;
    }
  }
  if (FAUCET_KEYPAIR_PATH) {
    try {
      const resolved = path.isAbsolute(FAUCET_KEYPAIR_PATH)
        ? FAUCET_KEYPAIR_PATH
        : path.join(process.cwd(), FAUCET_KEYPAIR_PATH);
      const data = JSON.parse(fs.readFileSync(resolved, "utf-8"));
      return Keypair.fromSecretKey(Uint8Array.from(data));
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const isMainnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta";
  if (isMainnet) {
    return NextResponse.json(
      { error: "Faucet is disabled on mainnet" },
      { status: 403 }
    );
  }

  if (!STAKING_MINT || STAKING_MINT === "11111111111111111111111111111111") {
    return NextResponse.json(
      { error: "Faucet not configured: NEXT_PUBLIC_STAKING_MINT missing" },
      { status: 500 }
    );
  }

  const faucetKeypair = getFaucetKeypair();
  if (!faucetKeypair) {
    return NextResponse.json(
      { error: "Faucet not configured: set FAUCET_SECRET_KEY or FAUCET_KEYPAIR_PATH in .env.local" },
      { status: 500 }
    );
  }

  let body: { wallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const walletStr = body.wallet;
  if (!walletStr || typeof walletStr !== "string") {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
  }

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(walletStr);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const amountRaw = BigInt(Math.floor(FAUCET_AMOUNT * 10 ** STAKING_DECIMALS));
  if (amountRaw <= 0n) {
    return NextResponse.json({ error: "Invalid FAUCET_AMOUNT" }, { status: 500 });
  }

  const connection = new Connection(RPC_URL, "confirmed");
  const mint = new PublicKey(STAKING_MINT);

  const sourceAta = await getAssociatedTokenAddress(
    mint,
    faucetKeypair.publicKey,
    false
  );
  const destAta = await getAssociatedTokenAddress(mint, recipient, false);

  try {
    const sourceInfo = await connection.getAccountInfo(sourceAta);
    if (!sourceInfo) {
      return NextResponse.json(
        { error: "Faucet wallet has no staking token account. Fund it with staking tokens first." },
        { status: 500 }
      );
    }

    const instructions = [];

    const destInfo = await connection.getAccountInfo(destAta);
    if (!destInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          faucetKeypair.publicKey,
          destAta,
          recipient,
          mint,
          undefined,
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID
        )
      );
    }

    instructions.push(
      createTransferInstruction(
        sourceAta,
        destAta,
        faucetKeypair.publicKey,
        Number(amountRaw),
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const tx = new Transaction().add(...instructions);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = faucetKeypair.publicKey;

    const sig = await connection.sendTransaction(tx, [faucetKeypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

    return NextResponse.json({ success: true, signature: sig, amount: FAUCET_AMOUNT });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
