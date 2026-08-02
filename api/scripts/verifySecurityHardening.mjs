/**
 * Static regression checks for Syra security hardening patches.
 * Usage: node api/scripts/verifySecurityHardening.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checks = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(cond, msg) {
  checks.push({ ok: Boolean(cond), msg });
}

const labsX402 = read("api/routes/labs/x402.js");
assert(!/req\.get\(\s*['"]x-admin-wallet['"]/.test(labsX402), "labs/x402: no spoofable x-admin-wallet header read");
assert(labsX402.includes("requireSession()"), "labs/x402: uses requireSession");
assert(labsX402.includes("auth_required"), "labs/x402: requires verified session");

const labsLlm = read("api/routes/labs/llm.js");
assert(!/req\.get\(\s*['"]x-admin-wallet['"]/.test(labsLlm), "labs/llm: no spoofable x-admin-wallet header read");

const labsOrg = read("api/routes/labs/organize.js");
assert(!/req\.get\(\s*['"]x-admin-wallet['"]/.test(labsOrg), "labs/organize: no spoofable x-admin-wallet header read");

const rewards = read("api/routes/syraRewards.js");
assert(rewards.includes("requireSession"), "rewards: requireSession imported");
assert(rewards.includes("req.user.walletAddress"), "rewards: claim bound to session wallet");
assert(rewards.includes("cron_secret_not_configured"), "rewards fund: fail closed");

const earn = read("api/routes/earn.js");
assert(earn.includes("creator_anonymous_id_mismatch"), "earn: IDOR rejection");

const outcomes = read("api/routes/outcomes.js");
assert(outcomes.includes("requireMandateOwner"), "outcomes: ownership helper");
assert(outcomes.includes("mandate_ownership_required"), "outcomes: ownership error");

const pred = read("api/routes/prediction-game/events.js");
assert(pred.includes("verifyPredictionGameSolPayment"), "prediction: on-chain tx verify");
assert(pred.includes("requireSession()"), "prediction: session on mutations");

const x402 = read("api/utils/x402PaymentV2.js");
assert(!x402.includes("accept anyway"), "x402: removed unconfirmed accept");
assert(x402.includes("Transaction not found or unconfirmed"), "x402: rejects unconfirmed");

const billing = read("api/libs/outcomeBillingService.js");
assert(billing.includes("verifyOutcomeBillingSolanaUsdcTx"), "billing: on-chain verify");
assert(billing.includes("tx_signature_already_used"), "billing: idempotency reuse guard");

const agentscore = read("api/libs/agentscoreClient.js");
assert(agentscore.includes("validateUpstreamUrl"), "agentscore: SSRF guard");

const crawl = read("api/libs/agentMigratedTools.js");
assert(crawl.includes("validateUpstreamUrl"), "crawl: SSRF guard");

const meta = read("api/libs/solanaTokenMetadata.js");
assert(meta.includes("validateUpstreamUrl"), "token metadata: SSRF guard");

const scalper = read("api/routes/scalperExperiment.js");
assert(scalper.includes("cron_secret_not_configured"), "scalper: fail closed");

const lp = read("api/routes/lpAgentExperiment.js");
assert(lp.includes("cron_secret_not_configured"), "lpAgent: fail closed");

const buyback = read("api/routes/internalBuyback.js");
assert(buyback.includes("requireBuybackCronSecret"), "buyback: cron gate");

const lpSvc = read("api/libs/lpExperimentService.js");
assert(lpSvc.includes("\\\\$&"), "lpExperiment: regex escaped");

const chat = read("api/routes/agent/chat.js");
assert(
  chat.includes("requireSession({ allowGuest: true })") && chat.includes("req.user?.anonymousId"),
  "chat list: session-bound",
);

const mcp = read("mcp-server/src/registerTools.ts");
assert(mcp.includes(", active)"), "mcp: syra_call_tool uses active profile");

const sdk = read("syra-sdk/src/payment/createPaidFetch.ts");
assert(sdk.includes("credentialOverrides"), "sdk: credential overrides");
assert(!sdk.includes("process.env.SYRA_PAYER_KEYPAIR = options.solanaKeypair"), "sdk: no env key write");

const vite = read("web/vite.config.ts");
assert(vite.includes("VITE_API_KEY / VITE_SYRA_API_KEY must not be set"), "vite: API key guard");

const gen = read("api/scripts/generateB402Keypair.js");
assert(!gen.includes("console.log(privateKey)"), "b402 gen: no private key stdout");
assert(!gen.includes("console.log(privateB64)"), "b402 gen: no private b64 stdout");

const gitignore = read(".gitignore");
assert(gitignore.includes("rise-api-snapshot.json"), "gitignore: snapshot");
assert(gitignore.includes(".cursor/debug.log"), "gitignore: debug.log");

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} - ${c.msg}`);
}
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} static checks passed`);
