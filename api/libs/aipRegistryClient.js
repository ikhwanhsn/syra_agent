/**
 * AIP on-chain registry client — register / deregister AgentRecord PDAs.
 * Instruction layout matches @aipagents/cli registry.ts.
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { sendAndConfirmSolanaTransaction } from "./solanaConfirm.js";
import {
  AIP_REGISTRY_PROGRAM_ID,
  AIP_DEFAULT_AGENT_ID,
  getAipCluster,
  getAipRpcUrl,
} from "../config/aipConfig.js";
import { buildSyraAipAgentCard } from "./aipAgentCard.js";

const REGISTRY_PROGRAM_ID = new PublicKey(AIP_REGISTRY_PROGRAM_ID);

const DISCRIMINATORS = {
  register_agent: Buffer.from([135, 157, 66, 195, 2, 113, 175, 30]),
  deregister_agent: Buffer.from([227, 208, 166, 164, 48, 69, 111, 1]),
};

/** @type {Record<string, number>} */
const AGENT_TYPE_MAP = { LLM: 0, Task: 1, Execution: 2 };

/**
 * @returns {Keypair}
 */
export function getAipSigner() {
  const raw = process.env.SOLANA_PRIVATE_KEY || process.env.PAYER_KEYPAIR;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      /* fall through */
    }
  }
  const b58 = process.env.AGENT_PRIVATE_KEY || process.env.ZAUTH_SOLANA_PRIVATE_KEY;
  if (b58) {
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  throw new Error(
    "Missing signer: set SOLANA_PRIVATE_KEY, PAYER_KEYPAIR, or AGENT_PRIVATE_KEY in env"
  );
}

/**
 * @param {PublicKey} owner
 * @param {string} agentId
 */
export function deriveAgentRecordPda(owner, agentId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), owner.toBuffer(), Buffer.from(agentId)],
    REGISTRY_PROGRAM_ID
  );
}

/** @param {string} s */
function borshString(s) {
  const utf8 = Buffer.from(s, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(utf8.length, 0);
  return Buffer.concat([len, utf8]);
}

/** @param {number} n */
function borshU8(n) {
  return Buffer.from([n]);
}

/** @param {bigint} n */
function borshU64(n) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n, 0);
  return b;
}

/** @param {PublicKey} pk */
function borshPubkey(pk) {
  return pk.toBuffer();
}

/**
 * @param {Array<{ name: string; description: string }>} caps
 */
function borshCapabilities(caps) {
  const count = Buffer.alloc(4);
  count.writeUInt32LE(caps.length, 0);
  const parts = [count];
  for (const cap of caps) {
    parts.push(borshString(cap.name));
    parts.push(borshString(cap.description));
  }
  return Buffer.concat(parts);
}

/**
 * @param {import('@aipagents/agent-sdk').AgentCard['capabilities']} caps
 */
function toOnChainCapabilities(caps) {
  return caps.slice(0, 8).map((c) => ({
    name: c.id.slice(0, 32),
    description: c.description.slice(0, 64),
  }));
}

/**
 * @param {import('@aipagents/agent-sdk').AgentCard['capabilities']} caps
 */
function derivePricePerTask(caps) {
  if (!caps.length) return 0n;
  let min = null;
  for (const cap of caps) {
    const n = Number(cap.pricing?.amount ?? 0);
    if (Number.isFinite(n) && (min === null || n < min)) min = n;
  }
  if (min === null || min <= 0) return 0n;
  return BigInt(Math.round(min * 1e6));
}

/**
 * @param {object} params
 * @param {PublicKey} params.owner
 * @param {string} params.agentId
 * @param {string} params.did
 * @param {string} params.name
 * @param {string} params.endpoint
 * @param {PublicKey} params.walletAddress
 * @param {number} params.agentType
 * @param {Array<{ name: string; description: string }>} params.capabilities
 * @param {bigint} params.pricePerTask
 * @param {string} params.version
 */
function buildRegisterAgentIx(params) {
  const [agentRecord] = deriveAgentRecordPda(params.owner, params.agentId);
  const data = Buffer.concat([
    DISCRIMINATORS.register_agent,
    borshString(params.agentId),
    borshString(params.did),
    borshString(params.name),
    borshString(params.endpoint),
    borshPubkey(params.walletAddress),
    borshU8(params.agentType),
    borshCapabilities(params.capabilities),
    borshU64(params.pricePerTask),
    borshString(params.version),
  ]);
  return new TransactionInstruction({
    programId: REGISTRY_PROGRAM_ID,
    keys: [
      { pubkey: params.owner, isSigner: true, isWritable: true },
      { pubkey: agentRecord, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * @param {{ owner: PublicKey; agentId: string }} params
 */
function buildDeregisterAgentIx(params) {
  const [agentRecord] = deriveAgentRecordPda(params.owner, params.agentId);
  return new TransactionInstruction({
    programId: REGISTRY_PROGRAM_ID,
    keys: [
      { pubkey: params.owner, isSigner: true, isWritable: true },
      { pubkey: agentRecord, isSigner: false, isWritable: true },
    ],
    data: DISCRIMINATORS.deregister_agent,
  });
}

/**
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {string} agentId
 */
export async function isAgentOnChain(connection, owner, agentId) {
  const [pda] = deriveAgentRecordPda(owner, agentId);
  const account = await connection.getAccountInfo(pda);
  return account !== null;
}

/**
 * @param {object} [opts]
 * @param {Keypair} [opts.signer]
 * @param {string} [opts.agentId]
 * @param {import('@aipagents/agent-sdk').AgentCard} [opts.card]
 * @param {boolean} [opts.deregisterFirst]
 */
export async function registerSyraOnAipRegistry(opts = {}) {
  const signer = opts.signer ?? getAipSigner();
  const agentId = opts.agentId ?? AIP_DEFAULT_AGENT_ID;
  const wallet = signer.publicKey.toBase58();
  const card = opts.card ?? buildSyraAipAgentCard(wallet, agentId);
  const connection = new Connection(getAipRpcUrl(), "confirmed");

  if (opts.deregisterFirst) {
    const exists = await isAgentOnChain(connection, signer.publicKey, agentId);
    if (exists) {
      const deregIx = buildDeregisterAgentIx({ owner: signer.publicKey, agentId });
      const deregTx = new Transaction().add(deregIx);
      await sendAndConfirmSolanaTransaction(connection, deregTx, [signer], {
        commitment: "confirmed",
      });
    }
  }

  const did = `did:aip:${wallet}:${agentId}`;
  const agentType = AGENT_TYPE_MAP[card.type] ?? 1;
  const ix = buildRegisterAgentIx({
    owner: signer.publicKey,
    agentId,
    did,
    name: card.name,
    endpoint: card.endpoint,
    walletAddress: card.walletAddress
      ? new PublicKey(card.walletAddress)
      : signer.publicKey,
    agentType,
    capabilities: toOnChainCapabilities(card.capabilities),
    pricePerTask: derivePricePerTask(card.capabilities),
    version: card.version,
  });

  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmSolanaTransaction(connection, tx, [signer], {
    commitment: "confirmed",
  });
  const [pda] = deriveAgentRecordPda(signer.publicKey, agentId);

  return {
    wallet,
    agentId,
    did,
    pda: pda.toBase58(),
    registerSignature: signature,
    cluster: getAipCluster(),
    programId: AIP_REGISTRY_PROGRAM_ID,
    card,
  };
}

/**
 * @param {object} [opts]
 * @param {Keypair} [opts.signer]
 * @param {string} [opts.agentId]
 */
export async function deregisterSyraFromAipRegistry(opts = {}) {
  const signer = opts.signer ?? getAipSigner();
  const agentId = opts.agentId ?? AIP_DEFAULT_AGENT_ID;
  const connection = new Connection(getAipRpcUrl(), "confirmed");
  const ix = buildDeregisterAgentIx({ owner: signer.publicKey, agentId });
  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmSolanaTransaction(connection, tx, [signer], {
    commitment: "confirmed",
  });
  return { signature, agentId, wallet: signer.publicKey.toBase58() };
}
