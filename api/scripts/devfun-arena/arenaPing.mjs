/**
 * Quick health check: credentials, active competition, open challenges vs already submitted.
 * Run: cd api && npm run arena-ping
 * Use in cron after worker: `npm run arena-ping >> /var/log/arena-ping.log 2>&1`
 */
import { loadArenaCredentials } from "./credentials.js";
import {
  fetchAllSubmittedChallengeIds,
  isExplicitlyClosedStatus,
  listActiveCompetitions,
  listCurrentChallenges,
  normalizeChallenges,
  pickFirstActiveCompetition,
  toEpochMs,
} from "./arenaApi.js";

const t = () => new Date().toISOString();

async function main() {
  console.log(`[arena-ping ${t()}] starting`);
  let creds;
  try {
    creds = await loadArenaCredentials();
  } catch (e) {
    console.error(`[arena-ping ${t()}] CREDENTIALS FAIL:`, e instanceof Error ? e.message : e);
    process.exit(2);
  }
  console.log(`[arena-ping ${t()}] agentId`, creds.agentId);

  const active = await listActiveCompetitions(creds.apiKey);
  const comp = pickFirstActiveCompetition(active);
  if (!comp) {
    console.log(`[arena-ping ${t()}] no active competition (between seasons)`);
    process.exit(0);
  }
  console.log(`[arena-ping ${t()}] competition`, comp.id, comp.name ?? "");

  const [currentRaw, submitted] = await Promise.all([
    listCurrentChallenges(creds.apiKey, comp.id),
    fetchAllSubmittedChallengeIds(creds.apiKey, comp.id),
  ]);

  const raw = normalizeChallenges(currentRaw);
  const now = Date.now();
  let open = 0;
  let closed = 0;
  let done = 0;
  let late = 0;
  for (const c of raw) {
    if (isExplicitlyClosedStatus(c.status)) {
      closed += 1;
      continue;
    }
    if (submitted.has(c.id)) {
      done += 1;
      continue;
    }
    const dl = toEpochMs(c.submissionDeadline);
    if (dl !== null && dl <= now) {
      late += 1;
      continue;
    }
    open += 1;
  }

  console.log(
    `[arena-ping ${t()}] challenges raw=${raw.length} openUnsubmitted=${open} alreadySubmitted=${done} closed=${closed} pastDeadlineUnsubmitted=${late}`
  );
  if (open === 0 && raw.length > 0) {
    console.log(
      `[arena-ping ${t()}] WORKER WOULD IDLE: nothing new to submit (you are caught up or all windows closed).`
    );
  }
  if (open > 0) {
    console.log(
      `[arena-ping ${t()}] WORKER SHOULD SUBMIT: ${open} challenge(s) need a prediction — if dashboard is stale, the worker process is not running or is failing.`
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`[arena-ping ${t()}]`, e);
  process.exit(1);
});
