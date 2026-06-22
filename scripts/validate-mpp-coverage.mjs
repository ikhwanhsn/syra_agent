/**
 * Validates GET /mpp-openapi.json path coverage against agentTools catalog.
 * Run: node scripts/validate-mpp-coverage.mjs
 */
import { AGENT_TOOLS } from '../api/config/agentTools.js';
import { buildMppOpenApiPaths } from '../api/libs/mppOpenApiPaths.js';

/** Express `:id` → OpenAPI `{id}` */
function toOpenApiPath(path) {
  return String(path || '').replace(/:([^/]+)/g, '{$1}');
}

function shouldSkipMppTool(tool) {
  if (tool.tempoPublic || tool.tempoPayout) return true;
  if (tool.zerionPath) return true;
  const raw = tool.path;
  if (!raw || typeof raw !== 'string' || !raw.startsWith('/')) return true;
  if (raw.includes('__tempo_public__')) return true;
  return false;
}

const paths = buildMppOpenApiPaths();
const pathKeys = new Set(Object.keys(paths));

const missing = [];
for (const tool of AGENT_TOOLS) {
  if (shouldSkipMppTool(tool)) continue;
  const key = toOpenApiPath(tool.path);
  if (!pathKeys.has(key)) {
    missing.push({ id: tool.id, path: tool.path, openApiPath: key });
  }
}

if (!pathKeys.has('/skills/{slug}')) {
  missing.push({ id: 'skills-template', path: '/skills/:slug', openApiPath: '/skills/{slug}' });
}

if (missing.length > 0) {
  console.error(`MPP coverage validation failed: ${missing.length} missing path(s):`);
  for (const m of missing.slice(0, 30)) {
    console.error(`  - ${m.id}: ${m.openApiPath}`);
  }
  if (missing.length > 30) {
    console.error(`  ... and ${missing.length - 30} more`);
  }
  process.exit(1);
}

console.log(
  `MPP coverage OK: ${pathKeys.size} OpenAPI paths cover ${AGENT_TOOLS.length} agent tools (excluding zerion/tempo reference tools).`,
);
