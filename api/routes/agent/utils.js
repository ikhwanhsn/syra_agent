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
  return 'http://localhost:3000';
}
