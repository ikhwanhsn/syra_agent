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
    console.log(
      "🤖 AI Agent initialized with wallet:",
      this.wallet.publicKey.toBase58()
    );
  }

  // AI Agent creates signal automatically (NO USER INTERACTION!)
  async createSignalAutomatically(signalData: {
    type: "BUY" | "LONG";
    symbol: string;
    price: number;
  }) {
    console.log("🤖 AI Agent: Analyzing market...");
    console.log("🤖 AI Agent: Creating signal:", signalData);

    try {
      // STEP 1: Request payment info from server
      console.log("1. Requesting payment info...");
      const quoteRes = await fetch(`${this.serverUrl}/api/create-signal`);
      const quote = await quoteRes.json();

      if (quoteRes.status !== 402) {
        throw new Error("Expected 402 payment required");
      }

      console.log("Payment required:", quote.payment.amountUSDC, "USDC");

      // STEP 2: Build transaction
      console.log("2. Building transaction...");
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
      console.log("3. Signing transaction automatically...");
      tx.sign(this.wallet);

      // STEP 4: Send to server
      console.log("4. Sending payment proof...");
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
      console.log("5. Creating signal...");
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
        console.log("✅ Signal created successfully!");
        console.log("Paid:", result.paymentDetails.amountUSDC, "USDC");
        console.log("Transaction:", result.paymentDetails.explorerUrl);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ AI Agent error:", error);
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
    console.log("🤖 AI Agent Balance:", balance.value.uiAmountString, "USDC");
    return balance.value.uiAmountString;
  }
}
