import express from "express";

export async function createSmartMoneyRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    res.json({ data: "premium content" });
  });

  return router;
}
