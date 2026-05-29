import { verifyShadowfeedHmac, getShadowfeedCanonicalPath } from "../utils/shadowfeedPartner.js";
import { createHmac, randomUUID } from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const secret = process.env.SHADOWFEED_PARTNER_SECRET;
const feedPath = "/health";
const ts = Math.floor(Date.now() / 1000);
const nonce = randomUUID();
const canonical = ["GET", feedPath, String(ts), nonce, ""].join("\n");
const sig = createHmac("sha256", secret).update(canonical).digest("hex");

const req = {
  method: "GET",
  originalUrl: "/health",
  path: "/",
  baseUrl: "/health",
  headers: {
    "x-sf-partner": "shadowfeed",
    "x-sf-timestamp": String(ts),
    "x-sf-nonce": nonce,
    "x-sf-signature": sig,
  },
};

const ok = verifyShadowfeedHmac(req, secret);
console.log("canonical path:", getShadowfeedCanonicalPath(req));
console.log("verify:", ok);
process.exit(ok ? 0 : 1);
