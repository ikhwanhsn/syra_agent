/**
 * Syra proxy for Rise token creation: Pinata (image + metadata) + api.rise.rich /program/create.
 * Mounted at /uponly-rise-create — no secrets returned to the client.
 */
import express from "express";
import multer from "multer";
import { risePostCreateToken } from "../libs/riseClient.js";

const PINATA_PIN_FILE = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_PIN_JSON = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const RISE_CALL_TIMEOUT_MS = 60_000;

const ALLOWED_IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/jpg", "image/gif"]);

const ADDR_MIN = 32;
const ADDR_MAX = 50;

function toStr(v) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function isValidAddress(addr) {
  if (typeof addr !== "string") return false;
  const t = addr.trim();
  return t.length >= ADDR_MIN && t.length <= ADDR_MAX;
}

function getIpfsGatewayBase() {
  const raw = typeof process.env.IPFS_GATEWAY === "string" ? process.env.IPFS_GATEWAY.trim() : "";
  if (raw) return raw.replace(/\/$/, "");
  return "https://ipfs.io";
}

function getPinataJwt() {
  return String(process.env.PINATA_JWT || "").trim();
}

function withTimeout(promise, ms) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Pinata / Rise upstream timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    if (ALLOWED_IMAGE_MIMES.has(mime)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only PNG, JPEG, or GIF images are allowed"));
  },
});

const CACHE_NONE = "no-store";

/** POST /uponly-rise-create/upload-image (multipart field: file) */
async function uploadImageHandler(req, res) {
  const jwt = getPinataJwt();
  if (!jwt) {
    return res.status(503).json({ success: false, error: "PINATA_JWT is not configured on the server" });
  }
  const file = req.file;
  if (!file || !file.buffer?.length) {
    return res.status(400).json({ success: false, error: "file is required (multipart field: file)" });
  }

  const form = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || "application/octet-stream" });
  form.append("file", blob, file.originalname || "image.png");

  let response;
  try {
    response = await withTimeout(
      fetch(PINATA_PIN_FILE, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: form,
      }),
      RISE_CALL_TIMEOUT_MS,
    );
  } catch (e) {
    const msg = e && typeof e.message === "string" ? e.message : "Pinata upload failed";
    return res.status(msg.includes("timeout") ? 504 : 502).json({ success: false, error: msg });
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const msg = json?.error || json?.message || `Pinata error (${response.status})`;
    return res.status(response.status < 500 ? response.status : 502).json({ success: false, error: msg });
  }
  const cid = json?.IpfsHash || json?.ipfsHash || json?.cid;
  if (!cid || typeof cid !== "string") {
    return res.status(502).json({ success: false, error: "Malformed Pinata response (missing IpfsHash)" });
  }
  const gateway = getIpfsGatewayBase();
  const url = `${gateway}/ipfs/${cid}`;
  res.setHeader("Cache-Control", CACHE_NONE);
  return res.json({ success: true, cid, url, updatedAt: new Date().toISOString() });
}

/** POST /uponly-rise-create/upload-metadata  JSON body */
async function uploadMetadataHandler(req, res) {
  const jwt = getPinataJwt();
  if (!jwt) {
    return res.status(503).json({ success: false, error: "PINATA_JWT is not configured on the server" });
  }
  const body = req.body || {};
  const name = toStr(body.name);
  const symbol = toStr(body.symbol);
  const description = toStr(body.description) ?? "";
  const image = toStr(body.image);
  if (!name || !symbol || !image) {
    return res.status(400).json({ success: false, error: "name, symbol, and image URL are required" });
  }

  const pinataContent = {
    name,
    symbol,
    description,
    image,
    ...(toStr(body.external_url) ? { external_url: toStr(body.external_url) } : {}),
    ...(toStr(body.twitter) ? { twitter: toStr(body.twitter) } : {}),
    ...(toStr(body.telegram) ? { telegram: toStr(body.telegram) } : {}),
  };

  let response;
  try {
    response = await withTimeout(
      fetch(PINATA_PIN_JSON, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataMetadata: { name: `${symbol}-metadata.json` },
          pinataContent,
        }),
      }),
      RISE_CALL_TIMEOUT_MS,
    );
  } catch (e) {
    const msg = e && typeof e.message === "string" ? e.message : "Pinata metadata upload failed";
    return res.status(msg.includes("timeout") ? 504 : 502).json({ success: false, error: msg });
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const msg = json?.error || json?.message || `Pinata error (${response.status})`;
    return res.status(response.status < 500 ? response.status : 502).json({ success: false, error: msg });
  }
  const cid = json?.IpfsHash || json?.ipfsHash || json?.cid;
  if (!cid || typeof cid !== "string") {
    return res.status(502).json({ success: false, error: "Malformed Pinata response (missing IpfsHash)" });
  }
  const gateway = getIpfsGatewayBase();
  const url = `${gateway}/ipfs/${cid}`;
  res.setHeader("Cache-Control", CACHE_NONE);
  return res.json({ success: true, cid, url, updatedAt: new Date().toISOString() });
}

/** POST /uponly-rise-create/transaction */
async function createTransactionHandler(req, res) {
  const body = req.body || {};
  const wallet = toStr(body.wallet);
  const tokenName = toStr(body.tokenName);
  const tokenSymbol = toStr(body.tokenSymbol);
  const tokenUri = toStr(body.tokenUri);
  const mintMain = toStr(body.mintMain);
  const creatorFeePercent = toNum(body.creatorFeePercent);

  if (!wallet || !isValidAddress(wallet)) {
    return res.status(400).json({ success: false, error: "valid wallet is required" });
  }
  if (!tokenName || !tokenSymbol || !tokenUri || !mintMain) {
    return res.status(400).json({ success: false, error: "tokenName, tokenSymbol, tokenUri, and mintMain are required" });
  }
  if (!isValidAddress(mintMain)) {
    return res.status(400).json({ success: false, error: "invalid mintMain" });
  }
  if (creatorFeePercent == null || creatorFeePercent < 0 || creatorFeePercent > 10 || !Number.isInteger(creatorFeePercent)) {
    return res.status(400).json({ success: false, error: "creatorFeePercent must be an integer 0–10" });
  }

  const payload = {
    wallet,
    tokenName,
    tokenSymbol,
    tokenUri,
    mintMain,
    creatorFeePercent,
  };

  const result = await Promise.race([
    risePostCreateToken(payload),
    new Promise((resolve) =>
      setTimeout(() => resolve({ ok: false, status: 504, error: "RISE create upstream timeout" }), RISE_CALL_TIMEOUT_MS),
    ),
  ]);
  if (!result.ok) {
    const code = result.status && result.status < 500 ? result.status : 502;
    return res.status(code).json({ success: false, error: result.error || "RISE create request failed" });
  }

  const d = result.data || {};
  if (!d.ok) {
    return res.status(502).json({ success: false, error: d.error || "RISE create returned ok: false" });
  }

  const tx1 =
    typeof d.createAndExtendLookupTable === "string"
      ? d.createAndExtendLookupTable
      : typeof d.lookupTableTransaction === "string"
        ? d.lookupTableTransaction
        : null;
  const tx2 = typeof d.mainTransaction === "string" ? d.mainTransaction : typeof d.transaction === "string" ? d.transaction : null;

  const transactions = [];
  if (tx1) transactions.push(tx1);
  if (tx2) transactions.push(tx2);

  if (transactions.length === 0) {
    return res.status(502).json({ success: false, error: "Malformed create response (no transactions)" });
  }

  const addresses =
    d.addresses && typeof d.addresses === "object"
      ? d.addresses
      : {
          mintToken: toStr(d.mint_token) || toStr(d.mintToken) || undefined,
          tokenDst: toStr(d.tokenDst) || undefined,
        };

  const mintToken =
    toStr(addresses?.mint_token) ||
    toStr(addresses?.mintToken) ||
    toStr(addresses?.tokenDst) ||
    toStr(d.mint_token) ||
    toStr(d.mintToken) ||
    null;

  res.setHeader("Cache-Control", CACHE_NONE);
  return res.json({
    success: true,
    transactions,
    addresses: { ...addresses, mintToken: mintToken || addresses?.mintToken },
    updatedAt: new Date().toISOString(),
  });
}

export function createUponlyRiseCreateRouter() {
  const router = express.Router();

  router.post("/upload-image", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        const code = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(code).json({ success: false, error: msg });
      }
      next();
    });
  }, uploadImageHandler);

  router.post("/upload-metadata", express.json({ limit: "512kb" }), uploadMetadataHandler);
  router.post("/transaction", express.json({ limit: "128kb" }), createTransactionHandler);

  return router;
}
