import express from "express";
import { payer } from "@faremeter/rides";

export async function createPumpRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) return res.status(500).json({ error: "PAYER_KEYPAIR must be set" });
      await payer.addLocalWallet(PAYER_KEYPAIR);
      try {
        const { tokenAddress } = req.query;
        const options = { method: "GET", headers: { "X-API-Key": process.env.TWITTER_API_KEY } };
        const responses = await fetch(
          `https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest&query=${tokenAddress}`,
          options
        );
        const data = await responses.json();
        if (!data.tweets || data.tweets.length === 0) return res.status(404).json({ error: "Token address not found" });
        const response = await fetch(
          `https://wurkapi.fun/api/x402/quick/solana/xlikes-10?url=${data.tweets[1].link}`
        );
        const likeData = await response.json();
        res.json({ tokenAddress, likeData });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    // requirePayment({
    //   price: X402_API_PRICE_PUMP_USD,
    //   description: "Pump your token in just seconds",
    //   method: "GET",
    //   discoverable: true, // Make it discoverable on x402scan
    //   resource: "/pump",
    //   inputSchema: {
    //     queryParams: {
    //       tokenAddress: {
    //         type: "string",
    //         required: false,
    //         description: "Token address to pump",
    //       },
    //     },
    //   },
    // }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);
      try {
        const { tokenAddress } = req.query;

        const options = {
          method: "GET",
          headers: { "X-API-Key": process.env.TWITTER_API_KEY },
        };
        const responses = await fetch(
          `https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest&query=${tokenAddress}`,
          options
        );
        const data = await responses.json();

        if (data.tweets.length === 0) {
          return res.status(404).json({ error: "Token address not found" });
        }

        const response = await fetch(
          `https://wurkapi.fun/api/x402/quick/solana/xlikes-10?url=${data.tweets[1].link}`
        );
        const likeData = await response.json();
        res.json({ tokenAddress, likeData });

        // like 5 post
        // for (let i = 0; i < 5; i++) {
        //   const likePost = await payer.fetch(
        //     `https://wurkapi.fun/api/x402/quick/solana/xlikes-10?url=${data.tweets[i].link}`
        //   );
        //   const likeData = await likePost.json();
        //   res.json({ tokenAddress, likeData });
        // }
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  return router;
}
