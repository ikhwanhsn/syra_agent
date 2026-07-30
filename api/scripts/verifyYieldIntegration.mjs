import { getAgentTool, listAgentToolsWithPillars } from '../config/agentTools.js';
import { resolvePillarForToolId } from '../config/pillars.js';
import { runAgentPartnerDirectTool } from '../libs/agentPartnerDirectTools.js';
import { closeYieldMcpClient } from '../libs/yieldMcpClient.js';

const ids = [
  'yield-find',
  'yield-get',
  'yield-networks',
  'yield-providers',
  'yield-risk',
  'yield-reward-history',
  'yield-tvl-history',
  'yield-balances',
];

for (const id of ids) {
  const t = getAgentTool(id);
  if (!t) {
    console.log(id, '-> MISSING');
    continue;
  }
  console.log(id, '->', t.pillar, 'agentDirect=' + t.agentDirect, 'price=' + t.priceUsd);
}

console.log('pillar yield-find', resolvePillarForToolId('yield-find'));

const missing = await runAgentPartnerDirectTool('yield-get', {});
console.log('gate missing yieldId', missing.ok, missing.error, missing.status);

const ok = await runAgentPartnerDirectTool('yield-find', {
  token: 'ETH',
  networks: 'ethereum',
  limit: 1,
  sort: 'rewardRateDesc',
});
console.log('direct find', ok.ok, ok.ok ? ok.data?.result?.total : ok.error);

const investCount = listAgentToolsWithPillars().filter(
  (t) => t.pillar === 'invest' && t.id.startsWith('yield-'),
).length;
console.log('invest yield tools', investCount);

await closeYieldMcpClient();

if (!ok.ok || investCount !== 8 || missing.ok !== false) {
  process.exit(1);
}
