#!/usr/bin/env node
/**
 * Poll Syra production deploys after a git push.
 *
 * Usage:
 *   node scripts/watch-deploys.mjs [--sha <gitsha>] [--web|--api|--docs|--all] [--timeout-ms N]
 *
 * Defaults: watch web + api. Exit 0 when required targets are Ready/live; 1 on failure/timeout.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const RENDER_SERVICE_ID = "srv-d4i17q3uibrs73dtb6qg";
const VERCEL_WEB = "syra-v2";
const VERCEL_DOCS = "syra-documentation";
const VC_CANDIDATES = [
  join(homedir(), ".local/lib/node_modules/vercel/dist/vc.js"),
  "vercel",
];

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function has(flag) {
  return process.argv.includes(flag);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadRenderKey() {
  if (process.env.RENDER_API_KEY) return process.env.RENDER_API_KEY.trim();
  const candidates = [
    join(homedir(), "Business/Web3/Trancepad/backend/.env"),
    join(process.cwd(), "../Trancepad/backend/.env"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      if (line.startsWith("RENDER_API_KEY=")) {
        return line
          .slice("RENDER_API_KEY=".length)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  }
  return null;
}

function resolveVc() {
  for (const c of VC_CANDIDATES) {
    if (c === "vercel") continue;
    if (existsSync(c)) return ["node", c];
  }
  return ["npx", "vercel"];
}

/** Vercel CLI prints tables on stderr; merge streams. */
function vc(args) {
  const [bin, ...prefix] = resolveVc();
  const quoted = [...prefix, ...args]
    .map((a) => `'${String(a).replace(/'/g, `'\\''`)}'`)
    .join(" ");
  const cmd =
    bin === "node"
      ? `env -u VERCEL_TOKEN node ${quoted} 2>&1`
      : `env -u VERCEL_TOKEN ${bin} ${quoted} 2>&1`;
  return execFileSync("bash", ["-lc", cmd], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

function parseVercelStatus(text) {
  return (
    text.match(/status\s*[●•]\s*(\w+)/i)?.[1] ??
    text.match(/\b(Error|Ready|Building|Queued|Canceled)\b/i)?.[1] ??
    "Unknown"
  );
}

async function latestVercel(project) {
  const out = vc(["ls", project]);
  for (const line of out.split("\n")) {
    const m = line.match(
      /(https:\/\/\S+\.vercel\.app)\s+[●•]\s+(Error|Ready|Building|Queued|Canceled)/i,
    );
    if (m) return { url: m[1], status: m[2] };
  }
  const url = out
    .split("\n")
    .map((l) => l.match(/https:\/\/\S+\.vercel\.app/)?.[0])
    .find(Boolean);
  if (!url) return null;
  return { url, status: parseVercelStatus(vc(["inspect", url])) };
}

async function vercelInspectStatus(url) {
  return parseVercelStatus(vc(["inspect", url]));
}

async function latestRenderDeploy(key) {
  const url = `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys?limit=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Render deploys HTTP ${res.status}`);
  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : data;
  const dep = item?.deploy || item;
  return {
    id: dep?.id,
    status: dep?.status,
    commit: dep?.commit?.id || dep?.commitId || null,
  };
}

function pickTargets() {
  if (has("--all")) return { web: true, api: true, docs: true };
  const any = has("--web") || has("--api") || has("--docs");
  if (!any) return { web: true, api: true, docs: false };
  return { web: has("--web"), api: has("--api"), docs: has("--docs") };
}

const timeoutMs = Number(arg("--timeout-ms", "900000"));
const wantSha = (arg("--sha") || "").slice(0, 7).toLowerCase() || null;
const targets = pickTargets();

const started = Date.now();
let webUrl = null;
let docsUrl = null;

console.log(
  JSON.stringify({
    event: "watch-start",
    targets,
    wantSha,
    timeoutMs,
  }),
);

while (Date.now() - started < timeoutMs) {
  const results = {};

  if (targets.web) {
    try {
      const latest = await latestVercel(VERCEL_WEB);
      if (latest) {
        webUrl = latest.url;
        const status = await vercelInspectStatus(webUrl);
        results.web = { project: VERCEL_WEB, url: webUrl, status };
      } else {
        results.web = { status: "Unknown" };
      }
    } catch (e) {
      results.web = { status: "PollError", error: String(e.message || e) };
    }
  }

  if (targets.docs) {
    try {
      const latest = await latestVercel(VERCEL_DOCS);
      if (latest) {
        docsUrl = latest.url;
        const status = await vercelInspectStatus(docsUrl);
        results.docs = { project: VERCEL_DOCS, url: docsUrl, status };
      } else {
        results.docs = { status: "Unknown" };
      }
    } catch (e) {
      results.docs = { status: "PollError", error: String(e.message || e) };
    }
  }

  if (targets.api) {
    const key = loadRenderKey();
    if (!key) {
      results.api = { status: "MissingRENDER_API_KEY" };
    } else {
      try {
        const dep = await latestRenderDeploy(key);
        results.api = {
          service: RENDER_SERVICE_ID,
          id: dep.id,
          status: dep.status,
          commit: dep.commit ? String(dep.commit).slice(0, 7) : null,
        };
      } catch (e) {
        results.api = { status: "PollError", error: String(e.message || e) };
      }
    }
  }

  console.log(
    JSON.stringify({ event: "poll", elapsedMs: Date.now() - started, results }),
  );

  const failed = [];
  const pending = [];
  const ok = [];

  for (const [name, r] of Object.entries(results)) {
    const st = (r.status || "").toLowerCase();
    if (
      [
        "error",
        "build_failed",
        "update_failed",
        "canceled",
        "deactivated",
        "pollerror",
        "missingrender_api_key",
      ].includes(st)
    ) {
      failed.push(name);
    } else if (["ready", "live"].includes(st)) {
      if (
        wantSha &&
        r.commit &&
        !String(r.commit).toLowerCase().startsWith(wantSha)
      ) {
        pending.push(name);
      } else {
        ok.push(name);
      }
    } else {
      pending.push(name);
    }
  }

  if (failed.length) {
    console.log(JSON.stringify({ event: "failed", failed, results }));
    if (results.web?.url) {
      try {
        const logs = vc(["inspect", results.web.url, "--logs"]);
        console.log("--- vercel web logs (tail) ---");
        console.log(logs.split("\n").slice(-80).join("\n"));
      } catch {
        /* ignore */
      }
    }
    process.exit(1);
  }

  const needed = Object.keys(results);
  if (ok.length === needed.length) {
    console.log(JSON.stringify({ event: "success", results }));
    process.exit(0);
  }

  await sleep(15000);
}

console.log(JSON.stringify({ event: "timeout", timeoutMs }));
process.exit(1);
