import express from "express";
import { PublicKey } from "@solana/web3.js";
import { pickSolanaConnectionForReads } from "../libs/solanaServerRpc.js";
import { fetchAgentWalletPortfolio } from "../libs/agentWalletPortfolio.js";

const USDC_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const LAMPORTS_PER_SOL = 1e9;

function readTokenUiAmount(tokenAmount) {
  if (!tokenAmount) return 0;
  if (tokenAmount.uiAmount != null && Number.isFinite(tokenAmount.uiAmount)) {
    return tokenAmount.uiAmount;
  }
  const parsed = Number.parseFloat(tokenAmount.uiAmountString ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * GET /wallet/solana/balance?address=<base58>
 * Public on-chain read — used by Syra web (payment modal, dashboard) when browser RPC is blocked.
 */
export function createWalletSolanaBalanceRouter() {
  const router = express.Router();

  router.get("/balance", async (req, res) => {
    const address = typeof req.query.address === "string" ? req.query.address.trim() : "";
    if (!address) {
      return res.status(400).json({ success: false, error: "address query param is required" });
    }

    let pubkey;
    try {
      pubkey = new PublicKey(address);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid Solana address" });
    }

    try {
      const picked = await pickSolanaConnectionForReads(pubkey);
      const tokenAccounts = await picked.connection.getParsedTokenAccountsByOwner(pubkey, {
        mint: USDC_MAINNET,
      });

      const accounts = tokenAccounts?.value ?? [];
      const usdcBalance = accounts.reduce((sum, acc) => {
        const tokenAmount = acc?.account?.data?.parsed?.info?.tokenAmount;
        return sum + readTokenUiAmount(tokenAmount);
      }, 0);

      return res.json({
        success: true,
        address,
        solBalance: Number(picked.lamports) / LAMPORTS_PER_SOL,
        usdcBalance,
      });
    } catch (err) {
      const message = err?.message || "Failed to fetch wallet balance";
      console.error("[wallet/solana/balance]", message);
      return res.status(503).json({ success: false, error: message });
    }
  });

  /**
   * GET /wallet/solana/portfolio?address=<base58>
   * Full SPL holdings + SOL for agent treasuries (server RPC).
   */
  router.get("/portfolio", async (req, res) => {
    const address = typeof req.query.address === "string" ? req.query.address.trim() : "";
    if (!address) {
      return res.status(400).json({ success: false, error: "address query param is required" });
    }

    try {
      // Validate address early
      // eslint-disable-next-line no-new
      new PublicKey(address);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid Solana address" });
    }

    try {
      const portfolio = await fetchAgentWalletPortfolio(address);
      return res.json({ success: true, ...portfolio });
    } catch (err) {
      const message = err?.message || "Failed to fetch wallet portfolio";
      console.error("[wallet/solana/portfolio]", message);
      return res.status(503).json({ success: false, error: message });
    }
  });

  return router;
}
