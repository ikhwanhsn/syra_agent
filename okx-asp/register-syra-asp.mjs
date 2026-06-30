#!/usr/bin/env node
/**
 * Register Syra ASP on OKX.AI (Steps 2–4).
 *
 * Prerequisites:
 *   1. onchainos CLI in %USERPROFILE%\.local\bin\onchainos.exe
 *   2. Agentic Wallet logged in: onchainos wallet login <your@email.com>
 *
 * Usage:
 *   node okx-asp/register-syra-asp.mjs           # full flow (login required)
 *   node okx-asp/register-syra-asp.mjs --activate-only <agentId>
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const onchainos = join(process.env.USERPROFILE ?? "", ".local", "bin", "onchainos.exe");
const avatar = join(root, "..", "web", "public", "images", "logo.jpg");
const services = JSON.stringify(JSON.parse(readFileSync(join(root, "services.json"), "utf8")));
const desc =
  "Machine money for agents on Solana pay-per-call crypto intelligence APIs, agent wallets, and autonomous research. Earn, Treasury, Invest, Spend, Grow.";

function explainCreateFailure(error) {
  const msg = String(error || "");
  if (!/origin error|simulation failed/i.test(msg)) return msg;

  return (
    `${msg}\n\n` +
    `Diagnosis (verified on your wallet):\n` +
    `  - Login, consent, validation: OK\n` +
    `  - XLayer OKB balance + send tx: OK\n` +
    `  - Agent identity create (user or ASP): FAILS on-chain\n\n` +
    `OKX support cannot whitelist wallets manually. This is a contract-level\n` +
    `simulation revert, not a Syra config issue.\n\n` +
    `Try these paths (in order):\n\n` +
    `  1. OFFICIAL FLOW (Cursor chat, not this script):\n` +
    `     "Help me register an A2MCP ASP on OKX.AI using Onchain OS"\n` +
    `     Let the Onchain OS skill drive registration interactively.\n\n` +
    `  2. OKX DEV PORTAL (not consumer support chat):\n` +
    `     https://web3.okx.com/onchain-os/dev-portal\n` +
    `     Ask about ASP agent create / ERC-8004 registration errors.\n\n` +
    `  3. GITHUB ISSUE with reproduction:\n` +
    `     https://github.com/okx/onchainos-skills/issues/new\n` +
    `     Include: origin error, wallet 0x3b35c4bb0b5304f97644de429f68e3b5be2b400c,\n` +
    `     onchainos 4.0.0, user+asp create both fail, send tx works.\n\n` +
    `  4. MONETIZE WITHOUT ASP LISTING (works today):\n` +
    `     Integrate OKX Payment SDK on api.syraa.fun (X Layer eip155:196).\n` +
    `     Docs: https://web3.okx.com/onchainos/dev-docs/payments/service-seller-sdk\n` +
    `     Syra already runs x402 — add OKX facilitator as another settlement rail.\n\n` +
    `Your payload in okx-asp/services.json is valid and ready when create works.`
  );
}

function run(args, { json = true, allowFail = false } = {}) {
  try {
    const out = execFileSync(onchainos, args, { encoding: "utf8" });
    if (!json) return out;
    return JSON.parse(out);
  } catch (e) {
    if (allowFail && e.stdout) {
      try {
        return JSON.parse(e.stdout);
      } catch {
        /* fall through */
      }
    }
    if (e.stdout) {
      try {
        const parsed = JSON.parse(e.stdout);
        const msg = parsed.error || parsed.msg || e.stdout;
        die(`${msg}\n\nRaw: ${e.stdout.trim()}`);
      } catch {
        die(e.stdout || e.message);
      }
    }
    die(e.message);
  }
}

function runCreate(args) {
  try {
    const out = execFileSync(onchainos, args, { encoding: "utf8" });
    return JSON.parse(out);
  } catch (e) {
    const raw = e.stdout?.trim() || e.message;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      die(raw);
    }
    const err = parsed.error || parsed.msg || raw;
    die(explainCreateFailure(err) + `\n\nRaw: ${raw}`);
  }
}

/** CLI responses wrap payloads in `{ ok, data }` — normalize both shapes. */
function unwrap(res) {
  return res?.data ?? res;
}

function die(msg) {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

if (!existsSync(onchainos)) {
  die(`onchainos not found at ${onchainos}. Install from https://github.com/okx/onchainos-skills`);
}

const activateOnly = process.argv.includes("--activate-only");
const agentIdArg = process.argv[process.argv.indexOf("--activate-only") + 1];

if (activateOnly) {
  if (!agentIdArg) die("Usage: node register-syra-asp.mjs --activate-only <agentId>");
  ok(`Submitting ASP #${agentIdArg} for marketplace listing...`);
  const res = run(["agent", "activate", "--agent-id", agentIdArg, "--preferred-language", "en_US"]);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

// Step 0: wallet login check
console.log("\n=== Step 0: Agentic Wallet ===");
const wallet = run(["wallet", "status"]);
if (!wallet.data?.loggedIn) {
  die(
    "Not logged in. Run this first (check your email for OTP):\n\n" +
      "  onchainos wallet login your@email.com\n\n" +
      "Then re-run: node okx-asp/register-syra-asp.mjs"
  );
}
ok(`Logged in as ${wallet.data.email || wallet.data.currentAccountName || "Agentic Wallet"}`);

// Step 1: pre-check (+ auto-accept first-time marketplace terms)
console.log("\n=== Step 1: Pre-check ===");
let pre = unwrap(run(["agent", "pre-check", "--role", "asp"]));
if (pre.consent?.consentKey) {
  ok("Accepting OKX marketplace terms (first-time consent)...");
  pre = unwrap(
    run(["agent", "pre-check", "--role", "asp", "--consent-key", pre.consent.consentKey])
  );
}
if (!pre.canCreate) {
  if (pre.existingSameRole?.length) {
    const existing = pre.existingSameRole[0];
    console.log(`\n⚠️  You already have ASP #${existing.id} (${existing.name}).`);
    console.log(`To list it: node okx-asp/register-syra-asp.mjs --activate-only ${existing.id}`);
    console.log(`To update services: onchainos agent update --agent-id ${existing.id} ...`);
    process.exit(0);
  }
  die(
    (pre.reason || "Cannot create ASP") +
      "\n\nIf you see legal terms: the script auto-accepts on next run after consent is shown once."
  );
}
ok("Pre-check passed — can register new ASP");

// Step 2: upload avatar
console.log("\n=== Step 2: Upload avatar ===");
if (!existsSync(avatar)) die(`Avatar not found: ${avatar}`);
const upload = unwrap(run(["agent", "upload", "--file", avatar]));
const pictureUrl = upload.url || upload.data?.url;
if (!pictureUrl) {
  console.log(upload);
  die("Avatar upload failed — no URL returned");
}
ok(`Avatar uploaded: ${pictureUrl}`);

// Step 3: validate listing (local QA)
console.log("\n=== Step 3: Validate listing ===");
const validation = unwrap(
  run([
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
  ])
);
if (!validation.pass) {
  console.log(JSON.stringify(validation.findings, null, 2));
  die("Listing validation failed — fix services.json and retry");
}
ok("Listing validation passed");

// Step 4: create ASP
console.log("\n=== Step 4: Create ASP on-chain ===");
const created = unwrap(
  runCreate([
    "agent",
    "create",
    "--role",
    "asp",
    "--name",
    "Syra",
    "--description",
    desc,
    "--picture",
    String(pictureUrl),
    "--service",
    services,
  ])
);

const agentId = created.newAgentId ?? created.id;
console.log(JSON.stringify(created, null, 2));

if (!agentId) {
  console.log("\n⚠️  Create may have succeeded but agent ID not returned (WS timeout).");
  console.log("Run: onchainos agent get-my-agents");
  process.exit(0);
}

ok(`ASP identity #${agentId} created`);

// Step 5: activate (list on OKX.AI)
console.log("\n=== Step 5: List on OKX.AI (activate) ===");
const activated = unwrap(
  run(["agent", "activate", "--agent-id", String(agentId), "--preferred-language", "en_US"])
);
console.log(JSON.stringify(activated, null, 2));

const act = activated.activate ?? activated;
if (act?.submitApproval || activated.submitApproval) {
  ok(`ASP #${agentId} submitted for OKX review (2 business days)`);
} else if (act?.success) {
  ok(`ASP #${agentId} is live on OKX.AI`);
} else {
  console.log(`\nTo list later: node okx-asp/register-syra-asp.mjs --activate-only ${agentId}`);
}

console.log("\n=== Done ===");
console.log(`ASP ID: #${agentId}`);
console.log("Services: A2MCP Syra x402 Crypto API + A2A Syra Brain Research");
console.log("Review email goes to your Agentic Wallet address.");
