/**
 * Routes listed as free (security: []) in GET /openapi.json.
 * Must be reachable without API key and without rate-limit blocking discovery probes.
 */
export function isGatewayOpenApiFreeRoute(p) {
  const path = String(p || '');
  if (path.startsWith('/info')) return true;
  if (path.startsWith('/syra-analytics')) return true;
  if (path.startsWith('/prediction-game/health')) return true;
  if (path === '/api/metrics' || path.startsWith('/api/live/')) return true;
  if (path.startsWith('/free/')) return true;
  if (path === '/llms-full.txt') return true;
  if (path.startsWith('/reference/')) return true;
  if (path === '/experiment/scalper/overview') return true;
  if (path === '/experiment/scalper/equity-history') return true;
  if (path === '/experiment/scalper/runs') return true;
  if (path === '/experiment/scalper/learning') return true;
  if (path === '/experiment/scalper/reference') return true;
  return false;
}
