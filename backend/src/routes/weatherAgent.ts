// import express from "express";
// import { Hex } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { decodeXPaymentResponse, wrapFetchWithPayment } from "x402-fetch";

// const { PRIVATE_KEY_PAYAI, RESOURCE_SERVER_URL_PAYAI } = process.env;

// if (!PRIVATE_KEY_PAYAI || !RESOURCE_SERVER_URL_PAYAI) {
//   throw new Error(
//     "PRIVATE_KEY_PAYAI and RESOURCE_SERVER_URL_PAYAI must be set in your environment"
//   );
// }

// // const formattedPrivateKey = PRIVATE_KEY_PAYAI.startsWith("0x")
// //   ? PRIVATE_KEY_PAYAI
// //   : `0x${PRIVATE_KEY_PAYAI}`;
// const formattedPrivateKey = PRIVATE_KEY_PAYAI;

// const account = privateKeyToAccount(formattedPrivateKey as Hex);

// export async function createWeatherAgentRouter() {
//   const router = express.Router();

//   const fetchWithPayment = wrapFetchWithPayment(fetch, account);

//   // Reusable request handler
//   const handleRequest = async (
//     req: express.Request,
//     res: express.Response,
//     method: "GET" | "POST"
//   ) => {
//     try {
//       console.log(`🤖 Agent paying automatically (${method})...`);

//       const response = await fetchWithPayment(
//         `${RESOURCE_SERVER_URL_PAYAI}/weather`,
//         {
//           method,
//           headers: {
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//           ...(method === "POST"
//             ? { body: JSON.stringify(req.body || {}) }
//             : {}),
//         }
//       );

//       if (!response.ok) {
//         const text = await response.text().catch(() => "");
//         throw new Error(
//           `HTTP ${response.status} ${response.statusText} ${text}`
//         );
//       }

//       const data = await response.json();
//       const paymentResponse = decodeXPaymentResponse(
//         response.headers.get("x-payment-response")!
//       );

//       const responseData = {
//         ...data,
//         payment: paymentResponse || null,
//       };

//       res.status(200).json(responseData);
//     } catch (err) {
//       console.error("❌ Error:", err);
//       res.status(500).json({ error: "Failed to fetch weather resource" });
//     }
//   };

//   // GET route
//   router.get("/", (req, res) => handleRequest(req, res, "GET"));

//   // POST route
//   router.post("/", (req, res) => handleRequest(req, res, "POST"));

//   return router;
// }
