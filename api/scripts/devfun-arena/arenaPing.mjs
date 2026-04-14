/**
 * Quick health check: credentials, active competition, open challenges vs already submitted.
 * Run: cd api && npm run arena-ping
 * Use in cron after worker: `npm run arena-ping >> /var/log/arena-ping.log 2>&1`
 */
import { loadArenaCredentials } from "./credentials.js";
import {
  fetchAllSubmittedChallengeIds,
  listActiveCompetitions,
  listCurrentChallenges,
  pickFirstActiveCompetition,
} from "./arenaApi.js";

const t = () => new Date().toISOString();

async function main() {
  let creds;
  try {
    creds = await loadArenaCredentials();
  } catch (e) {
    console.error(`[arena-ping ${t()}] CREDENTIALS FAIL:`, e instanceof Error ? e.message : e);
    process.exit(2);
  }

  const active = await listActiveCompetitions(creds.apiKey);
  const comp = pickFirstActiveCompetition(active);
  if (!comp) {
    process.exit(0);
  }

  await Promise.all([
    listCurrentChallenges(creds.apiKey, comp.id),
    fetchAllSubmittedChallengeIds(creds.apiKey, comp.id),
  ]);

  process.exit(0);
}

main().catch((e) => {
  console.error(`[arena-ping ${t()}]`, e);
  process.exit(1);
});
