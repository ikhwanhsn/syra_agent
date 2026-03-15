export function resolveAgentBaseUrl(req) {
  const envUrl = typeof process.env.BASE_URL === 'string' ? process.env.BASE_URL.trim() : '';
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const forwardedProto = (req.get && req.get('x-forwarded-proto')) || '';
  const protocol =
    forwardedProto && forwardedProto.trim()
      ? forwardedProto.split(',')[0].trim()
      : req.protocol || 'http';
  const host = req.get ? req.get('host') : '';
  if (host) {
    return `${protocol}://${host}`.replace(/\/$/, '');
  }
  // Fallback for localhost (e.g. server-to-self tool calls): use PORT so the correct API is reached
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
