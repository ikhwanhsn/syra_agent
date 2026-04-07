import { readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {{ apiKey: string; agentId: string }} ArenaCredentials
 */

/**
 * Load DevFun Arena credentials from env or `.arena-credentials` at repo root.
 * @returns {Promise<ArenaCredentials>}
 */
export async function loadArenaCredentials() {
  const fromEnvKey = process.env.ARENA_API_KEY?.trim();
  const fromEnvId = process.env.ARENA_AGENT_ID?.trim();
  if (fromEnvKey && fromEnvId) {
    return { apiKey: fromEnvKey, agentId: fromEnvId };
  }

  const explicit = process.env.ARENA_CREDENTIALS_PATH?.trim();
  const defaultPath = join(__dirname, "../../../.arena-credentials");
  const pathToTry = explicit || defaultPath;

  const raw = await readFile(pathToTry, "utf8");
  const parsed = JSON.parse(raw);
  const apiKey = typeof parsed.apiKey === "string" ? parsed.apiKey.trim() : "";
  const agentId = typeof parsed.agentId === "string" ? parsed.agentId.trim() : "";
  if (!apiKey.startsWith("arena_sk_") || !agentId) {
    throw new Error("Invalid .arena-credentials: need apiKey (arena_sk_*) and agentId");
  }
  return { apiKey, agentId };
}
