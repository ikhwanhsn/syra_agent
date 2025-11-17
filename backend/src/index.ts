import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import updateSignals from "./routes/updateSignals";
import corbitsNansen from "./routes/corbitsNansen";
import getCryptoPrice from "./routes/getCryptoPrice";
import { runSignalUpdater } from "./jobs/signalUpdater";
import createCorbitsRoutes from "./routes/corbitsTest";
import { x402Middleware } from "./middleware";

dotenv.config();

const app = express();
const port: number = parseInt(process.env.PORT || "3000");
app.use(x402Middleware);

app.use(express.json());
app.use("/api/update-signals", updateSignals);
app.use("/api/corbits-nansen", corbitsNansen);
app.use("/api/get-crypto-price", getCryptoPrice);
app.use("/btc-price", createCorbitsRoutes);

app.get("/", (_, res) => res.send("Server is running 🚀"));

// 🕒 Run every 5 minutes (*/5 * * * *)
// You can adjust timing based on your needs
cron.schedule("*/5 * * * * *", async () => {
  console.log("⏰ Cron job triggered: Running signal updater");
  await runSignalUpdater();
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});
