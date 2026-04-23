/**
 * Shared 8004 registry read paths (stats, leaderboard, agents search with name enrichment).
 * Used by GET/POST /8004/* routes and by agent-direct tools (agentMigratedTools).
 */
import pLimit from "p-limit";
import {
  searchAgents,
  getLeaderboard,
  getGlobalStats,
  getAgentRegistrationMetadata,
  getRegistrationMetadataFromUri,
} from "./agentRegistry8004.js";

const REGISTRATION_METADATA_LIMIT = pLimit(6);

async function enrichAgentsWithRegistrationNames(agents) {
  if (!Array.isArray(agents) || agents.length === 0) return agents;
  const results = await Promise.all(
    agents.map((a) => {
      const asset = typeof a?.asset === "string" ? a.asset.trim() : "";
      const agentUri = typeof a?.agent_uri === "string" ? a.agent_uri.trim() : null;
      if (!asset) return { ...a };
      return REGISTRATION_METADATA_LIMIT(async () => {
        try {
          const meta = agentUri
            ? await getRegistrationMetadataFromUri(agentUri)
            : await getAgentRegistrationMetadata(asset);
          const name =
            meta?.name?.trim() ||
            (typeof a?.nft_name === "string" ? a.nft_name.trim() : null) ||
            (typeof a?.name === "string" ? a.name.trim() : null) ||
            null;
          const description = meta?.description?.trim() || null;
          const image = meta?.image?.trim() || null;
          if (name || description || image) {
            return {
              ...a,
              nft_name: name || a.nft_name,
              description: description ?? a.description,
              image: image ?? a.image,
            };
          }
          return { ...a };
        } catch {
          return { ...a };
        }
      });
    }),
  );
  return results;
}

/**
 * @param {Record<string, string | number | boolean | undefined>} q - merged query + body
 */
export async function run8004Stats() {
  return getGlobalStats();
}

/**
 * @param {Record<string, string | number | boolean | undefined>} q
 */
export async function run8004Leaderboard(q) {
  return getLeaderboard({
    minTier: q.minTier != null && q.minTier !== "" ? Number(q.minTier) : undefined,
    limit: q.limit != null && q.limit !== "" ? Number(q.limit) : 50,
    collection: q.collection ? String(q.collection) : undefined,
  });
}

/**
 * @param {Record<string, string | number | boolean | undefined>} q
 */
export async function run8004AgentsSearch(q) {
  const collectionParam = q.collection && String(q.collection).trim();
  const isPointer = collectionParam && collectionParam.startsWith("c1:");
  const searchParams = {
    owner: q.owner || undefined,
    creator: q.creator || undefined,
    limit: q.limit ? Number(q.limit) : 20,
    offset: q.offset ? Number(q.offset) : 0,
  };
  if (collectionParam) {
    if (isPointer) searchParams.collectionPointer = collectionParam;
    else searchParams.collection = collectionParam;
  }
  const list = await searchAgents(searchParams);
  const raw = Array.isArray(list) ? list : [];
  const agents = await enrichAgentsWithRegistrationNames(raw);
  return { agents, total: agents.length };
}
