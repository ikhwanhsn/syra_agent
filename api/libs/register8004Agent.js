/**
 * Register a new 8004 agent (with dynamic input) and optionally attach to an existing collection.
 * Uses SOLANA_PRIVATE_KEY (or PAYER_KEYPAIR / AGENT_PRIVATE_KEY) and PINATA_JWT from env.
 * @see https://8004.qnt.sh/skill.md
 */
import { Keypair } from "@solana/web3.js";
import {
  SolanaSDK,
  IPFSClient,
  buildRegistrationFileJson,
  ServiceType,
} from "8004-solana";
import bs58 from "bs58";

function getSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch (_) {}
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    const bytes = bs58.decode(b58);
    return Keypair.fromSecretKey(bytes);
  }
  throw new Error(
    "Missing signer: set SOLANA_PRIVATE_KEY, PAYER_KEYPAIR, or AGENT_PRIVATE_KEY in env"
  );
}

const SERVICE_TYPES = new Set(["MCP", "A2A", "ENS", "DID", "WALLET", "OASF"]);

function normalizeService(s) {
  if (!s || typeof s !== "object") return null;
  const type = (s.type && String(s.type).toUpperCase()) || "MCP";
  const value = typeof s.value === "string" ? s.value.trim() : "";
  if (!value || !SERVICE_TYPES.has(type)) return null;
  return { type: ServiceType[type] ?? type, value };
}

/**
 * Register a new agent and optionally attach it to a collection.
 *
 * @param {{
 *   name: string;
 *   description: string;
 *   image?: string;
 *   services?: Array<{ type: string; value: string }>;
 *   skills?: string[];
 *   domains?: string[];
 *   x402Support?: boolean;
 *   collectionPointer?: string;
 * }} input - Agent metadata and optional collection pointer (c1:...).
 * @returns {Promise<{ asset: string; registerSignature: string; setCollectionSignature?: string; tokenUri: string }>}
 */
export async function registerAgentAndAttachToCollection(input) {
  const signer = getSigner();
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    throw new Error("Missing PINATA_JWT in env");
  }

  const name = input.name && String(input.name).trim();
  const description = input.description && String(input.description).trim();
  if (!name || !description) {
    throw new Error("name and description are required");
  }

  const image =
    (input.image && String(input.image).trim()) ||
    process.env.SYRA_AGENT_IMAGE_URI ||
    "https://syraa.fun/images/logo.jpg";

  const rawServices = Array.isArray(input.services) ? input.services : [];
  const services = rawServices
    .map(normalizeService)
    .filter(Boolean);
  if (services.length === 0) {
    services.push({ type: ServiceType.MCP, value: "https://api.syraa.fun" });
  }

  const skills = Array.isArray(input.skills)
    ? input.skills.map((s) => String(s).trim()).filter(Boolean)
    : [
        "natural_language_processing/text_classification/sentiment_analysis",
        "natural_language_processing/information_retrieval_synthesis/knowledge_synthesis",
        "natural_language_processing/analytical_reasoning/problem_solving",
        "tool_interaction/tool_use_planning",
      ];

  const domains = Array.isArray(input.domains)
    ? input.domains.map((d) => String(d).trim()).filter(Boolean)
    : ["finance_and_business/finance"];

  const x402Support = input.x402Support !== false;

  const collectionPointer =
    input.collectionPointer && String(input.collectionPointer).trim();
  if (collectionPointer && !collectionPointer.startsWith("c1:")) {
    throw new Error("collectionPointer must start with c1:");
  }

  const ipfs = new IPFSClient({
    pinataEnabled: true,
    pinataJwt,
  });

  const cluster = process.env.SOLANA_CLUSTER || "mainnet-beta";
  const rpcUrl = process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_FALLBACK_URL;

  const sdk = new SolanaSDK({
    cluster,
    rpcUrl,
    signer,
    ipfsClient: ipfs,
  });

  const metadata = buildRegistrationFileJson({
    name,
    description,
    image,
    services,
    skills,
    domains,
    x402Support,
  });

  const cid = await ipfs.addJson(metadata);
  const tokenUri = `ipfs://${cid}`;

  const result = await sdk.registerAgent(tokenUri, {
    atomEnabled: process.env["8004_ATOM_ENABLED"] === "true",
  });

  if (!result?.asset) {
    await ipfs.close();
    throw new Error("Registration did not return an agent asset");
  }

  const asset = result.asset;
  const out = {
    asset: asset.toBase58(),
    registerSignature: result.signature || "",
    tokenUri,
  };

  if (collectionPointer) {
    const txResult = await sdk.setCollectionPointer(asset, collectionPointer, {
      lock: true,
    });
    if (txResult?.success && txResult?.signature) {
      out.setCollectionSignature = txResult.signature;
    } else {
      await ipfs.close();
      throw new Error(
        "setCollectionPointer failed: " + (txResult?.error ?? "no signature")
      );
    }
  }

  await ipfs.close();
  return out;
}
