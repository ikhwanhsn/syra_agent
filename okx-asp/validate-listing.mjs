import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const services = readFileSync(join(root, "services.json"), "utf8").trim();
const desc =
  "Finance Copilot for agents — pay-per-call crypto intelligence that turns market data into decisions. Signals, indicators, sentiment, arbitrage, Bitcoin hub, tokenized equity, Jupiter quotes, plus Syra Brain for natural-language token due diligence and market briefs.";

const onchainos = join(process.env.USERPROFILE ?? "", ".local", "bin", "onchainos.exe");

const out = execFileSync(
  onchainos,
  [
    "agent",
    "validate-listing",
    "--role",
    "asp",
    "--name",
    "Syra",
    "--description",
    desc,
    "--service",
    services,
  ],
  { encoding: "utf8" }
);

console.log(out);
