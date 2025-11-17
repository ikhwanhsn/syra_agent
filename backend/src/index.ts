import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";
import updateSignals from "./routes/updateSignals";
import corbitsNansen from "./routes/corbitsNansen";
import { runSignalUpdater } from "./jobs/signalUpdater";

dotenv.config();

const app = express();
const port: number = parseInt(process.env.PORT || "3000");

app.use(express.json());
app.use("/api/update-signals", updateSignals);
app.use("/api/corbits-nansen", corbitsNansen);

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
