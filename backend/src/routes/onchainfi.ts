import express from "express";

const router = express.Router();

router.get("/", (_, res) => {
  res.send("OnchainFI is working 🚀");
});

export default router;
