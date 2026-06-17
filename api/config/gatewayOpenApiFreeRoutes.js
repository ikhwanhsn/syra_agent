/**
 * Routes listed as free (security: []) in GET /openapi.json.
 * Must be reachable without API key and without rate-limit blocking discovery probes.
 */
export function isGatewayOpenApiFreeRoute(p) {
  const path = String(p || '');
  if (path === '/dashboard-summary' || path === '/binance-ticker') return true;
  if (path.startsWith('/api/signal')) return true;
  if (path.startsWith('/preview/')) return true;
  if (path.startsWith('/x-projects-analyze')) return true;
  return false;
}
