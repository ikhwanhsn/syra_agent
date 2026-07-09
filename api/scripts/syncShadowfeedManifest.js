#!/usr/bin/env node
/**
 * Write web/public/.well-known/shadowfeed-feeds.json from api/config/shadowfeedDiscovery.js
 *
 * Run after changing feed catalog:
 *   node api/scripts/syncShadowfeedManifest.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { buildShadowfeedFeedsManifest } from "../config/shadowfeedDiscovery.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const manifest = buildShadowfeedFeedsManifest();
const json = `${JSON.stringify(manifest, null, 2)}\n`;

const outDir = path.resolve(__dirname, "../../web/public/.well-known");
const outFile = path.join(outDir, "shadowfeed-feeds.json");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, json, "utf8");

console.log(`Wrote ${outFile}`);
console.log(`Feeds: ${manifest.feeds.length}`);
