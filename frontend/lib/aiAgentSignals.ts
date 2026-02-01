import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export class AITradingAgent {
  private connection: Connection;
  private wallet: Keypair;
  private serverUrl: string;

  constructor(
    privateKeyArray: number[],
    serverUrl: string = "http://localhost:3000"
  ) {
    this.connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    this.wallet = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    this.serverUrl = serverUrl;
  }

  // AI Agent creates signal automatically (NO USER INTERACTION!)
  async createSignalAutomatically(signalData: {
    type: "BUY" | "LONG";
    symbol: string;
    price: number;
  }) {
    try {
      // STEP 1: Request payment info from server
      const quoteRes = await fetch(`${this.serverUrl}/api/create-signal`);
      const quote = await quoteRes.json();

      if (quoteRes.status !== 402) {
        throw new Error("Expected 402 payment required");
      }

      // STEP 2: Build transaction
      const mint = new PublicKey(quote.payment.mint);
      const recipientTokenAccount = new PublicKey(quote.payment.tokenAccount);

      // Get AI agent's USDC token account
      const agentTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.wallet.publicKey
      );

      // Create transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      const tx = new Transaction({
        feePayer: this.wallet.publicKey,
        blockhash,
        lastValidBlockHeight: (await this.connection.getLatestBlockhash())
          .lastValidBlockHeight,
      });

      // Add USDC transfer
      tx.add(
        createTransferInstruction(
          agentTokenAccount,
          recipientTokenAccount,
          this.wallet.publicKey,
          quote.payment.amount
        )
      );

      // STEP 3: Sign automatically (NO POPUP!)
      tx.sign(this.wallet);

      // STEP 4: Send to server
      const serializedTx = tx.serialize().toString("base64");

      const paymentProof = {
        x402Version: 1,
        scheme: "exact",
        network:
          quote.payment.cluster === "devnet"
            ? "solana-devnet"
            : "solana-mainnet",
        payload: { serializedTransaction: serializedTx },
      };

      const xPaymentHeader = Buffer.from(JSON.stringify(paymentProof)).toString(
        "base64"
      );

      // STEP 5: Create signal with payment
      const response = await fetch(`${this.serverUrl}/api/create-signal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment": xPaymentHeader,
        },
        body: JSON.stringify(signalData),
      });

      const result = await response.json();

      if (response.ok) {
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw error;
    }
  }

  // Check AI Agent's USDC balance
  async checkBalance() {
    const mint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
    const agentTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const balance = await this.connection.getTokenAccountBalance(
      agentTokenAccount
    );
    return balance.value.uiAmountString;
  }
}
