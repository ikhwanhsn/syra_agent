/**
 * Pumpfun paper-trading experiment — singleton ledger in MongoDB (no browser storage).
 */
import express from "express";
import {
  getPumpfunExperimentLedger,
  resetPumpfunExperimentLedger,
  savePumpfunExperimentLedger,
} from "../libs/pumpfunExperimentService.js";

export function createPumpfunExperimentRouter() {
  const router = express.Router();

  router.get("/ledger", async (_req, res) => {
    try {
      const ledger = await getPumpfunExperimentLedger();
      res.json({ success: true, data: { ledger } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.put("/ledger", async (req, res) => {
    try {
      const ledger = req.body?.ledger ?? req.body;
      if (!ledger || typeof ledger !== "object") {
        return res.status(400).json({ success: false, error: "Missing ledger body" });
      }
      const saved = await savePumpfunExperimentLedger(ledger);
      res.json({ success: true, data: { ledger: saved } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/reset", async (_req, res) => {
    try {
      const ledger = await resetPumpfunExperimentLedger();
      res.json({ success: true, data: { ledger } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
