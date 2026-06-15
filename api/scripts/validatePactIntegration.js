/**
 * Validate Pact Network integration config and optionally probe endpoint estimates.
 *
 * Usage:
 *   node scripts/validatePactIntegration.js
 *   node scripts/validatePactIntegration.js --host api.nansen.ai
 *   node scripts/validatePactIntegration.js --agent <anonymousId>
 */
import '../config/mongoose.js';
import { getPactResolvedConfig, isPactEnabled } from '../libs/pactConfig.js';
import { getAgentKeypair } from '../libs/agentWallet.js';
import { getPactInstanceForAgent } from '../libs/pactFetch.js';

function parseArgs(argv) {
  const out = { host: null, agentId: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--host' && argv[i + 1]) {
      out.host = argv[++i];
    } else if (argv[i] === '--agent' && argv[i + 1]) {
      out.agentId = argv[++i];
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const cfg = getPactResolvedConfig();

  console.log('=== Pact Network integration status ===');
  console.log('PACT_ENABLED:', isPactEnabled());
  console.log('Config:', JSON.stringify({ ...cfg, apiKey: cfg.apiKey ? '(set)' : '(unset)' }, null, 2));

  if (!isPactEnabled()) {
    console.log('\nPact is disabled. Set PACT_ENABLED=true after beta access + API key.');
    process.exit(0);
  }

  if (!cfg.apiKey) {
    console.warn('\nWarning: PACT_API_KEY is not set (optional for mainnet but may be required for beta proxy).');
  }

  const host = args.host || cfg.providerAllowlist[0] || 'api.nansen.ai';
  const agentId = args.agentId;

  if (agentId) {
    const keypair = await getAgentKeypair(agentId);
    if (!keypair) {
      console.error(`No Solana keypair for anonymousId=${agentId} (legacy custody required for Pact signer).`);
      process.exit(1);
    }
    const pact = await getPactInstanceForAgent(agentId, keypair);
    if (!pact) {
      console.error('Failed to create Pact instance.');
      process.exit(1);
    }
    console.log(`\nAgent pubkey: ${keypair.publicKey.toBase58()}`);
    try {
      const policy = await pact.policy();
      console.log('Policy:', JSON.stringify(policy, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
    } catch (e) {
      console.warn('policy() failed (may need pact.setup):', e?.message || e);
    }
    try {
      const claims = await pact.claims({ limit: 5 });
      console.log(`Recent claims: ${claims.length}`);
    } catch (e) {
      console.warn('claims() failed:', e?.message || e);
    }
  }

  if (agentId) {
    const keypair = await getAgentKeypair(agentId);
    const pact = keypair ? await getPactInstanceForAgent(agentId, keypair) : null;
    if (pact) {
      try {
        const estimate = await pact.estimate(host);
        console.log(`\nEstimate for ${host}:`, JSON.stringify(estimate, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
      } catch (e) {
        console.warn(`estimate(${host}) failed:`, e?.message || e);
      }
    }
  } else {
    console.log(`\nTip: pass --agent <anonymousId> to probe policy/estimate for ${host}`);
  }

  console.log('\nRollout checklist:');
  console.log('  1. PACT_ENABLED=true');
  console.log('  2. PACT_PROVIDER_ALLOWLIST=<one-host> for phased rollout');
  console.log('  3. Run pact.setup once per agent (or PACT_AUTO_SETUP=true)');
  console.log('  4. Force a covered failure; confirm refund via GET /agent/pact/refunds');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
