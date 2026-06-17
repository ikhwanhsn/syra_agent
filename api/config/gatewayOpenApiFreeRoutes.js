/**
 * Routes listed as free (security: []) in GET /openapi.json.
 * Must be reachable without API key and without rate-limit blocking discovery probes.
 */
export function isGatewayOpenApiFreeRoute(p) {
  const path = String(p || '');
  if (path.startsWith('/info')) return true;
  if (path.startsWith('/prediction-game/health')) return true;
  return false;
}
