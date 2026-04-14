/**
 * Tokenized agent payments (pump-fun-skills tokenized-agents).
 * Build accept-payment txs and verify invoices — buyback % is set at coin creation; revenue to the agent payment address is handled on-chain + pump.fun UI.
 *
 * Load SDK via require(): the package ESM entry re-exports @coral-xyz/anchor in a way that can
 * throw "Named export 'BN' not found" under Node ESM; the CJS build resolves cleanly.
 */
import { createRequire } from "node:module";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
} from "@solana/spl-token";
import { ComputeBudgetProgram, Connection, PublicKey, Transaction } from "@solana/web3.js";

const require = createRequire(import.meta.url);
const { PumpAgent, getTokenAgentPaymentsPDA } = require("@pump-fun/agent-payments-sdk");

/** Thrown when the tx would fail on-chain for predictable reasons; maps to HTTP 400 in routes. */
export const BUILD_ACCEPT_PREFLIGHT_PREFIX = "BUILD_ACCEPT_PREFLIGHT:";

/**
 * PumpAgent SDK only wraps SOL (native mint) with create-ATA + wrap; SPL mints assume the user's ATA exists.
 * Anchor 3012 (AccountNotInitialized) is common when paying in USDC without an ATA yet.
 * @param {import("@solana/web3.js").TransactionInstruction[]} instructions
 * @param {import("@solana/web3.js").TransactionInstruction} insertIx
 */
function insertAfterComputeBudgetInstructions(instructions, insertIx) {
  const idx = instructions.findIndex((ix) => !ix.programId.equals(ComputeBudgetProgram.programId));
  if (idx === -1) return [insertIx, ...instructions];
  return [...instructions.slice(0, idx), insertIx, ...instructions.slice(idx)];
}

function getRpcUrl() {
  const u = (process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || "").trim();
  return u || "https://rpc.ankr.com/solana";
}

/**
 * @param {{
 *   agentMint: string;
 *   user: string;
 *   currencyMint: string;
 *   amount: string | number;
 *   memo: string | number;
 *   startTime: string | number;
 *   endTime: string | number;
 *   computeUnitLimit?: number;
 *   computeUnitPrice?: number;
 *   tokenProgram?: string;
 * }} params
 * @returns {Promise<{ transaction: string; agentMint: string; user: string; currencyMint: string; amount: string; memo: string; startTime: string; endTime: string }>}
 */
export async function buildAcceptPaymentTransactionBase64(params) {
  const connection = new Connection(getRpcUrl(), "confirmed");
  const agentMint = new PublicKey(String(params.agentMint).trim());
  const userPublicKey = new PublicKey(String(params.user).trim());
  const currencyMint = new PublicKey(String(params.currencyMint).trim());
  const tokenProgramId =
    params.tokenProgram != null && String(params.tokenProgram).trim()
      ? new PublicKey(String(params.tokenProgram).trim())
      : TOKEN_PROGRAM_ID;

  const [tokenAgentPaymentsPda] = getTokenAgentPaymentsPDA(agentMint);
  const tapAccount = await connection.getAccountInfo(tokenAgentPaymentsPda, "confirmed");
  if (!tapAccount) {
    throw new Error(
      `${BUILD_ACCEPT_PREFLIGHT_PREFIX} No pump tokenized-agent payments account exists for this agentMint on Solana mainnet. ` +
        "Use the actual tokenized-agent coin mint from pump.fun (not a random mint). Anchor error 3012 means an account the program expects is still uninitialized."
    );
  }

  const agent = new PumpAgent(agentMint, "mainnet", connection);
  let instructions = await agent.buildAcceptPaymentInstructions({
    user: userPublicKey,
    currencyMint,
    amount: String(params.amount),
    memo: String(params.memo),
    startTime: String(params.startTime),
    endTime: String(params.endTime),
    ...(params.computeUnitLimit != null ? { computeUnitLimit: Number(params.computeUnitLimit) } : {}),
    ...(params.computeUnitPrice != null ? { computeUnitPrice: Number(params.computeUnitPrice) } : {}),
    ...(params.tokenProgram != null && String(params.tokenProgram).trim()
      ? { tokenProgram: tokenProgramId }
      : {}),
  });

  if (!currencyMint.equals(NATIVE_MINT)) {
    const createUserAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      userPublicKey,
      userPublicKey,
      currencyMint,
      false,
      tokenProgramId,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    instructions = insertAfterComputeBudgetInstructions(instructions, createUserAtaIx);
  }

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = userPublicKey;
  tx.add(...instructions);

  const transaction = Buffer.from(
    tx.serialize({ requireAllSignatures: false, verifySignatures: false })
  ).toString("base64");

  return {
    transaction,
    agentMint: agentMint.toBase58(),
    user: userPublicKey.toBase58(),
    currencyMint: currencyMint.toBase58(),
    amount: String(params.amount),
    memo: String(params.memo),
    startTime: String(params.startTime),
    endTime: String(params.endTime),
  };
}

/**
 * @param {{
 *   agentMint: string;
 *   user: string;
 *   currencyMint: string;
 *   amount: number;
 *   memo: number;
 *   startTime: number;
 *   endTime: number;
 * }} params
 */
export async function verifyInvoicePaymentOnChain(params) {
  const connection = new Connection(getRpcUrl(), "confirmed");
  const agentMint = new PublicKey(String(params.agentMint).trim());
  const agent = new PumpAgent(agentMint, "mainnet", connection);

  const paid = await agent.validateInvoicePayment({
    user: new PublicKey(String(params.user).trim()),
    currencyMint: new PublicKey(String(params.currencyMint).trim()),
    amount: Number(params.amount),
    memo: Number(params.memo),
    startTime: Number(params.startTime),
    endTime: Number(params.endTime),
  });

  return { verified: Boolean(paid) };
}
