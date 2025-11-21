import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";

// Routes (all async creators)
import updateSignals from "./routes/updateSignals";
import corbitsNansen from "./routes/corbitsNansen";
import getCryptoPrice from "./routes/getCryptoPrice";
// import { createWeatherRouter } from "./routes/weather";
import { createProtectedRouter } from "./routes/protected";
import { createAgentRouter } from "./routes/agent";
import { createWeatherAutopayRouter } from "./routes/weatherAutopay";
import onchainfiRouter from "./routes/onchainfi";

import { x402Middleware } from "./middleware";
import { runSignalUpdater } from "./jobs/signalUpdater";
import { x402Middleware as x402MiddlewareOnchainFi } from "@onchainfi/x402-aggregator-client";
// import { createAutoPaymentRouter } from "./routes/autoWeather";
import { createWeatherRouter } from "./routes/weather-server";
import { createAutoPaymentRouter } from "./routes/auto-payment-client";

dotenv.config();

// ----------------------------
// EXPRESS INITIALIZATION
// ----------------------------
const app = express();
const port = parseInt(process.env.PORT || "4000");

app.use(express.json());

// Global middleware
app.use(x402Middleware);
app.use(
  x402MiddlewareOnchainFi({
    apiKey: process.env.API_KEY_ONCHAINFI as string,
    recipientAddress: process.env.ADDRESS_ONCHAINFI as string,
    endpoints: {
      "GET /api/onchainfi": { price: "$0.0001" },
    },
  })
);

// ----------------------------
// ASYNC ROUTE SETUP
// ----------------------------
async function setupRoutes() {
  const protectedRouter = await createProtectedRouter();
  const agentRouter = await createAgentRouter();
  // const weatherRouter = await createWeatherRouter();
  const weatherRouter = await createWeatherRouter();
  const weatherAutopayRouter = await createWeatherAutopayRouter();
  const autoPaymentRouter = await createAutoPaymentRouter();
  app.use("/api/onchainfi", onchainfiRouter);

  app.use("/protected", protectedRouter);
  app.use("/agent", agentRouter);

  // Regular routes (non-async)
  app.use("/api/update-signals", updateSignals);
  app.use("/api/corbits-nansen", corbitsNansen);
  app.use("/api/get-crypto-price", getCryptoPrice);
  app.use("/weather", weatherRouter);
  app.use("/weather-autopay", weatherAutopayRouter);
  app.use("/auto-weather", autoPaymentRouter);

  app.get("/", (_, res) => {
    res.send("Server is running 🚀");
  });
}

// ----------------------------
// START SERVER
// ----------------------------
async function start() {
  try {
    await setupRoutes();

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    });

    // Graceful shutdown
    function shutdown() {
      console.log("Shutting down server...");
      server.close(() => process.exit(0));
    }

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();

// ----------------------------
// CRON JOB (runs independently)
// ----------------------------

// Run every 5 seconds
cron.schedule("*/5 * * * * *", async () => {
  console.log("⏰ Cron: running signal updater");
  await runSignalUpdater();
});
