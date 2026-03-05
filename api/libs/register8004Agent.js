/**
 * Register a new 8004 agent (with dynamic input) and optionally attach to an existing collection.
 * - If feePayer + agentAssetPubkey are provided: builds serialized tx for the user to sign (no server signer).
 * - Otherwise uses SOLANA_PRIVATE_KEY (or PAYER_KEYPAIR / AGENT_PRIVATE_KEY) and PINATA_JWT from env.
 * @see https://8004.qnt.sh/skill.md
 */
import { Keypair, PublicKey } from "@solana/web3.js";
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

function toPublicKey(base58) {
  if (!base58 || typeof base58 !== "string") throw new Error("Invalid public key");
  return new PublicKey(base58.trim());
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
 *   feePayer?: string;       // User wallet (base58) – when set with agentAssetPubkey, returns serialized tx for client to sign
 *   agentAssetPubkey?: string; // New agent mint pubkey (base58) – must be provided with feePayer
 *   signerKeypair?: Keypair;  // When set (e.g. user's agent wallet), use this signer instead of env; agent is owned by this key
 * }} input - Agent metadata and optional collection pointer (c1:...).
 * @returns {Promise<{ asset: string; registerSignature?: string; setCollectionSignature?: string; tokenUri: string } | { asset: string; tokenUri: string; registerTransaction: object; setCollectionTransaction?: object }>}
 */
export async function registerAgentAndAttachToCollection(input) {
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

  let collectionPointer =
    input.collectionPointer && String(input.collectionPointer).trim();
  if (!collectionPointer && process.env.SYRA_COLLECTION_POINTER) {
    collectionPointer = String(process.env.SYRA_COLLECTION_POINTER).trim();
  }
  if (collectionPointer && !collectionPointer.startsWith("c1:")) {
    throw new Error("collectionPointer must start with c1:");
  }

  const ipfs = new IPFSClient({
    pinataEnabled: true,
    pinataJwt,
  });

  const cluster = process.env.SOLANA_CLUSTER || "mainnet-beta";
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

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

  const feePayerRaw = input.feePayer && String(input.feePayer).trim();
  const agentAssetPubkeyRaw = input.agentAssetPubkey && String(input.agentAssetPubkey).trim();

  // User-signed path: build serialized transaction(s) for the client to sign with their wallet + agent keypair
  if (feePayerRaw && agentAssetPubkeyRaw) {
    const userPubkey = toPublicKey(feePayerRaw);
    const assetPubkey = toPublicKey(agentAssetPubkeyRaw);
    const sdk = new SolanaSDK({ cluster, ...(rpcUrl && { rpcUrl }) });

    const registerOptions = {
      skipSend: true,
      signer: userPubkey,
      assetPubkey,
      atomEnabled: process.env["8004_ATOM_ENABLED"] === "true",
    };
    const registerResult = await sdk.registerAgent(tokenUri, registerOptions);

    if (!registerResult?.asset) {
      await ipfs.close();
      const err = registerResult?.error && String(registerResult.error).trim();
      throw new Error(err ? `Registration build failed: ${err}` : "Registration did not return an agent asset");
    }

    const out = {
      asset: registerResult.asset.toBase58(),
      tokenUri,
      registerTransaction: {
        transaction: registerResult.transaction,
        blockhash: registerResult.blockhash,
        lastValidBlockHeight: registerResult.lastValidBlockHeight,
        signer: registerResult.signer,
      },
    };

    if (collectionPointer) {
      const pointerResult = await sdk.setCollectionPointer(registerResult.asset, collectionPointer, {
        lock: true,
        skipSend: true,
        signer: userPubkey,
      });
      if (pointerResult?.transaction != null) {
        out.setCollectionTransaction = {
          transaction: pointerResult.transaction,
          blockhash: pointerResult.blockhash,
          lastValidBlockHeight: pointerResult.lastValidBlockHeight,
          signer: pointerResult.signer,
        };
      }
    }

    await ipfs.close();
    return out;
  }

  // Server-signed path: use provided signer (e.g. user's agent wallet) or env keypair
  const signer = input.signerKeypair || getSigner();
  const atomEnabled = process.env["8004_ATOM_ENABLED"] === "true";

  /** Public RPC used when SOLANA_RPC_URL blocks getAccountInfo (403). */
  const FALLBACK_RPC_8004 = "https://rpc.ankr.com/solana";

  const runRegister = (sdk) =>
    sdk.registerAgent(tokenUri, { atomEnabled });

  let serverSdk = new SolanaSDK({
    cluster,
    rpcUrl,
    signer,
    ipfsClient: ipfs,
  });

  let result;
  try {
    result = await runRegister(serverSdk);
  } catch (firstErr) {
    const msg = firstErr?.message || String(firstErr);
    const isRootConfigError =
      /Root config not initialized|Registry not initialized|initialize the registry first/i.test(msg) ||
      /403|not allowed to access blockchain|getAccountInfo/i.test(msg);
    if (isRootConfigError && rpcUrl !== FALLBACK_RPC_8004) {
      serverSdk = new SolanaSDK({
        cluster,
        rpcUrl: FALLBACK_RPC_8004,
        signer,
        ipfsClient: ipfs,
      });
      result = await runRegister(serverSdk);
    } else {
      throw firstErr;
    }
  }

  if (!result?.asset) {
    await ipfs.close();
    const underlying = result?.error && String(result.error).trim();
    if (underlying) {
      const isUserWallet = !!input.signerKeypair;
      const walletAddr = signer?.publicKey?.toBase58?.();
      const hint = /insufficient lamports|insufficient funds|not enough sol/i.test(underlying)
        ? isUserWallet
          ? ` Fund your agent wallet with more SOL (needs ~0.006+ SOL for registration).${walletAddr ? ` Send SOL to: ${walletAddr}` : ""}`
          : " Fund the agent wallet (SOLANA_PRIVATE_KEY / AGENT_PRIVATE_KEY in api/.env) with SOL for fees and rent."
        : "";
      throw new Error(`Registration failed: ${underlying}.${hint}`);
    }
    throw new Error("Registration did not return an agent asset");
  }

  const asset = result.asset;
  const out = {
    asset: asset.toBase58(),
    registerSignature: result.signature || "",
    tokenUri,
  };

  if (collectionPointer) {
    const txResult = await serverSdk.setCollectionPointer(asset, collectionPointer, {
      lock: true,
    });
    if (txResult?.success && txResult?.signature) {
      out.setCollectionSignature = txResult.signature;
    } else {
      await ipfs.close();
      const err = txResult?.error ?? "no signature";
      const isUserWallet = !!input.signerKeypair;
      const walletAddr = signer?.publicKey?.toBase58?.();
      const hint = /insufficient lamports|insufficient funds|not enough sol/i.test(String(err))
        ? isUserWallet
          ? ` Fund your agent wallet with more SOL.${walletAddr ? ` Send SOL to: ${walletAddr}` : ""}`
          : " Fund the agent wallet (SOLANA_PRIVATE_KEY / AGENT_PRIVATE_KEY in api/.env) with SOL."
        : "";
      throw new Error(`setCollectionPointer failed: ${err}.${hint}`);
    }
  }

  await ipfs.close();
  return out;
}
