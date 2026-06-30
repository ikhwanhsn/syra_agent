import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const services = readFileSync(join(root, "services.json"), "utf8").trim();
const desc =
  "Machine money for agents on Solana pay-per-call crypto intelligence APIs, agent wallets, and autonomous research. Earn, Treasury, Invest, Spend, Grow.";

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
