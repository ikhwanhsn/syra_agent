// // routes/weather.js
// import express from "express";
// import { express as faremeter } from "@faremeter/middleware";
// import { solana } from "@faremeter/info";

// export async function createNewsRouter() {
//   const router = express.Router();

//   const app = express();

//   // Create the middleware
//   const paywalledMiddleware = await faremeter.createMiddleware({
//     facilitatorURL: "https://facilitator.corbits.dev",
//     accepts: [
//       {
//         ...solana.x402Exact({
//           network: "mainnet-beta",
//           asset: "USDC",
//           amount: 10000, // $0.01 in USDC base units
//           payTo: "53JhuF8bgxvUQ59nDG6kWs4awUQYCS3wswQmUsV5uC7t",
//         }),
//         resource: `${process.env.BASE_URL}/news`,
//         description: "Premium API access",
//       },
//     ],
//   });

//   const MAX_PAGE = 5;

//   const fetchPages = async (section) => {
//     const requests = [];

//     for (let i = 1; i <= MAX_PAGE; i++) {
//       requests.push(
//         fetch(
//           `https://cryptonews-api.com/api/v1/category?section=${section}&items=100&page=${i}&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
//         ).then((res) => res.json())
//       );
//     }

//     const results = await Promise.all(requests);

//     // merge all pages into a single array (optional)
//     return results.flatMap((data) => data.data || []);
//   };

//   const generalNews = await fetchPages("general");
//   const tickerNews = await fetchPages("alltickers");

//   // Apply middleware to routes
//   router.get("/", paywalledMiddleware, (req, res) => {
//     res.json({
//       generalNews,
//       tickerNews,
//     });
//   });

//   router.post("/", paywalledMiddleware, (req, res) => {
//     res.json({
//       generalNews,
//       tickerNews,
//     });
//   });

//   return router;
// }

import express from "express";
import { express as faremeter } from "@faremeter/middleware";
import { solana } from "@faremeter/info";

const app = express();

// Create the middleware
const paywalledMiddleware = await faremeter.createMiddleware({
  facilitatorURL: "https://facilitator.corbits.dev",
  accepts: [
    {
      ...solana.x402Exact({
        network: "devnet",
        asset: "USDC",
        amount: 10000, // $0.01 in USDC base units
        payTo: "YOUR_WALLET_ADDRESS",
      }),
      resource: "https://yourapi.com/api/premium",
      description: "Premium API access",
    },
  ],
});

// Free endpoint
app.get("/api/free", (req, res) => {
  res.json({ data: "free content" });
});

// Premium endpoint with payment required
app.get("/api/premium", paywalledMiddleware, (req, res) => {
  res.json({ data: "premium content" });
});

export default app;
