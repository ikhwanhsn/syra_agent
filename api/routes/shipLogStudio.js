/**
 * Ship log post studio — posted-on-X flags and soft-deletes (MongoDB singleton).
 */
import express from "express";
import {
  deleteShipLogUpdates,
  getShipLogStudioState,
  migrateShipLogStudioState,
  setShipLogUpdatePosted,
} from "../libs/shipLogStudioService.js";

function studioErrorResponse(res, error) {
  const code = error?.code;
  if (code === "mongodb_not_connected") {
    return res.status(503).json({ success: false, error: "Database unavailable" });
  }
  if (code === "invalid_update_number" || code === "invalid_posted" || code === "invalid_update_numbers") {
    return res.status(400).json({ success: false, error: error.message });
  }
  return res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  });
}

export function createShipLogStudioRouter() {
  const router = express.Router();

  router.get("/state", async (_req, res) => {
    try {
      const result = await getShipLogStudioState();
      return res.json(result);
    } catch (error) {
      return studioErrorResponse(res, error);
    }
  });

  router.post("/state/migrate", async (req, res) => {
    try {
      const postedOnX = req.body?.postedOnX;
      const deleted = req.body?.deleted;
      const result = await migrateShipLogStudioState({ postedOnX, deleted });
      return res.json(result);
    } catch (error) {
      return studioErrorResponse(res, error);
    }
  });

  router.patch("/updates/:updateNumber/posted", async (req, res) => {
    try {
      const posted = req.body?.posted;
      const result = await setShipLogUpdatePosted(req.params.updateNumber, posted);
      return res.json(result);
    } catch (error) {
      return studioErrorResponse(res, error);
    }
  });

  router.post("/updates/delete", async (req, res) => {
    try {
      const updateNumbers = Array.isArray(req.body?.updateNumbers) ? req.body.updateNumbers : [];
      const result = await deleteShipLogUpdates(updateNumbers);
      return res.json(result);
    } catch (error) {
      return studioErrorResponse(res, error);
    }
  });

  return router;
}
