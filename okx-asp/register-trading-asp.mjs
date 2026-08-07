#!/usr/bin/env node
/**
 * Register Syra as a Trading ASP on OKX.AI (Season 1 hackathon) — macOS/Linux.
 *
 * This is the Trading-ASP variant of register-syra-asp.mjs:
 *  - Resolves the `onchainos` binary from PATH / ~/.local/bin (no Windows .exe).
 *  - Registers the "Syra Signal Copy-Trade" subscription service
 *    (okx-asp/trading-services.json) which is the leaderboard scoring basis.
 *
 * Prerequisites:
 *   1. onchainos CLI installed and on PATH (see okx-asp/TRADING-HACKATHON.md).
 *   2. Agentic Wallet logged in: onchainos wallet login <your@email.com>
 *   3. Wallet funded with >= 300 USDT of on-chain assets (+ gas).
 *
 * Usage:
 *   node okx-asp/register-trading-asp.mjs                 # full flow
 *   node okx-asp/register-trading-asp.mjs --activate-only <agentId>
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const root = dirname(fileURLToPath(import.meta.url));

/** Resolve the onchainos binary across environments. */
function resolveOnchainos() {
  if (process.env.ONCHAINOS_BIN && existsSync(process.env.ONCHAINOS_BIN)) {
    return process.env.ONCHAINOS_BIN;
  }
  const which = spawnSync("bash", ["-lc", "command -v onchainos"], { encoding: "utf8" });
  const found = (which.stdout || "").trim();
  if (found && existsSync(found)) return found;
  const local = join(homedir(), ".local", "bin", "onchainos");
  if (existsSync(local)) return local;
  return "onchainos"; // fall back to PATH lookup at exec time
}

const onchainos = resolveOnchainos();
const avatar = join(root, "..", "web", "public", "images", "logo.jpg");
const services = JSON.stringify(JSON.parse(readFileSync(join(root, "trading-services.json"), "utf8")));
const desc =
  "Syra Trading ASP — an automated on-chain trading agent that trades on Syra's own pay-per-call crypto intelligence. Multi-timeframe technical signals plus sentiment rank a whitelist of liquid assets; the agent enters high-conviction momentum setups and manages risk with hard stop-losses, a trailing take-profit, and a daily loss circuit breaker. Always-on with a hard kill switch.";

function explainCreateFailure(error) {
  const msg = String(error || "");
  if (!/origin error|simulation failed/i.test(msg)) return msg;
  return (
    `${msg}\n\n` +
    `Diagnosis: the on-chain agent-registry create reverted (contract-level).\n` +
    `This is the same class of failure seen during the Genesis hackathon and is\n` +
    `NOT fixable via Syra config or OKX support chat. Escalate immediately\n` +
    `(registration closes Aug 11 12:00 UTC+8):\n\n` +
    `  1. Interactive agent flow (let the Onchain OS skill drive it):\n` +
    `     "Help me register for the OKX.AI trading hackathon"\n` +
    `  2. OKX Dev Portal: https://web3.okx.com/onchain-os/dev-portal\n` +
    `  3. GitHub issue: https://github.com/okx/onchainos-skills/issues/new\n\n` +
    `Your payload in okx-asp/trading-services.json is valid and ready.`
  );
}

function run(args, { json = true } = {}) {
  try {
    const out = execFileSync(onchainos, args, { encoding: "utf8" });
    return json ? JSON.parse(out) : out;
  } catch (e) {
    if (e.stdout) {
      try {
        const parsed = JSON.parse(e.stdout);
        die(`${parsed.error || parsed.msg || e.stdout}\n\nRaw: ${String(e.stdout).trim()}`);
      } catch {
        die(e.stdout || e.message);
      }
    }
    die(e.message);
  }
}

function runCreate(args) {
  try {
    return JSON.parse(execFileSync(onchainos, args, { encoding: "utf8" }));
  } catch (e) {
    const raw = e.stdout?.trim() || e.message;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      die(explainCreateFailure(raw) + `\n\nRaw: ${raw}`);
    }
    die(explainCreateFailure(parsed.error || parsed.msg || raw) + `\n\nRaw: ${raw}`);
  }
}

const unwrap = (res) => res?.data ?? res;
const die = (msg) => {
  console.error(`\nERROR: ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK  ${msg}`);

const activateOnly = process.argv.includes("--activate-only");
const agentIdArg = process.argv[process.argv.indexOf("--activate-only") + 1];

if (activateOnly) {
  if (!agentIdArg) die("Usage: node register-trading-asp.mjs --activate-only <agentId>");
  ok(`Submitting ASP #${agentIdArg} for marketplace listing...`);
  console.log(
    JSON.stringify(
      run(["agent", "activate", "--agent-id", agentIdArg, "--preferred-language", "en_US"]),
      null,
      2,
    ),
  );
  process.exit(0);
}

console.log(`\n=== Using onchainos: ${onchainos} ===`);

console.log("\n=== Step 0: Agentic Wallet ===");
const wallet = run(["wallet", "status"]);
if (!wallet.data?.loggedIn) {
  die(
    "Not logged in. Run first (check email for OTP):\n\n" +
      "  onchainos wallet login your@email.com\n\n" +
      "Then re-run: node okx-asp/register-trading-asp.mjs",
  );
}
ok(`Logged in as ${wallet.data.email || wallet.data.currentAccountName || "Agentic Wallet"}`);

console.log("\n=== Step 1: Pre-check ===");
let pre = unwrap(run(["agent", "pre-check", "--role", "asp"]));
if (pre.consent?.consentKey) {
  ok("Accepting OKX marketplace terms (first-time consent)...");
  pre = unwrap(run(["agent", "pre-check", "--role", "asp", "--consent-key", pre.consent.consentKey]));
}
if (!pre.canCreate) {
  if (pre.existingSameRole?.length) {
    const existing = pre.existingSameRole[0];
    console.log(`\nYou already have ASP #${existing.id} (${existing.name}).`);
    console.log(`To list it: node okx-asp/register-trading-asp.mjs --activate-only ${existing.id}`);
    process.exit(0);
  }
  die(pre.reason || "Cannot create ASP");
}
ok("Pre-check passed — can register new Trading ASP");

console.log("\n=== Step 2: Upload avatar ===");
if (!existsSync(avatar)) die(`Avatar not found: ${avatar}`);
const upload = unwrap(run(["agent", "upload", "--file", avatar]));
const pictureUrl = upload.url || upload.data?.url;
if (!pictureUrl) die("Avatar upload failed — no URL returned");
ok(`Avatar uploaded: ${pictureUrl}`);

console.log("\n=== Step 3: Validate listing ===");
const validation = unwrap(
  run([
    "agent",
    "validate-listing",
    "--role",
    "asp",
    "--name",
    "Syra Trading",
    "--description",
    desc,
    "--service",
    services,
  ]),
);
if (!validation.pass) {
  console.log(JSON.stringify(validation.findings, null, 2));
  die("Listing validation failed — fix trading-services.json and retry");
}
ok("Listing validation passed");

console.log("\n=== Step 4: Create Trading ASP on-chain ===");
const created = unwrap(
  runCreate([
    "agent",
    "create",
    "--role",
    "asp",
    "--name",
    "Syra Trading",
    "--description",
    desc,
    "--picture",
    String(pictureUrl),
    "--service",
    services,
  ]),
);
const agentId = created.newAgentId ?? created.id;
console.log(JSON.stringify(created, null, 2));
if (!agentId) {
  console.log("\nCreate may have succeeded but agent ID not returned (WS timeout).");
  console.log("Run: onchainos agent get-my-agents");
  process.exit(0);
}
ok(`Trading ASP identity #${agentId} created`);

console.log("\n=== Step 5: List on OKX.AI (activate) ===");
const activated = unwrap(
  run(["agent", "activate", "--agent-id", String(agentId), "--preferred-language", "en_US"]),
);
console.log(JSON.stringify(activated, null, 2));

console.log("\n=== Done ===");
console.log(`Trading ASP ID: #${agentId}`);
console.log("Subscription service: Syra Signal Copy-Trade (leaderboard scoring basis).");
console.log("NEXT: register for the competition and bind this funded Agentic Wallet:");
console.log('  Prompt your agent: "Help me register for the OKX.AI trading hackathon"');
console.log("Keep the ASP + subscription service online through review and the whole contest.");
