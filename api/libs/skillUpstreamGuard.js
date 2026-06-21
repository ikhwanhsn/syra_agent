import dns from 'node:dns/promises';
import net from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

/**
 * @param {string} ip
 */
function isPrivateOrReservedIp(ip) {
  if (!ip) return true;
  const kind = net.isIP(ip);
  if (kind === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (kind === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
  }
  return false;
}

/**
 * Validate upstream URL for SSRF safety (https-only, no private/reserved targets).
 * @param {string} rawUrl
 * @returns {Promise<{ ok: true, url: URL } | { ok: false, error: string }>}
 */
export async function validateUpstreamUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return { ok: false, error: 'Invalid upstream URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Upstream URL must use HTTPS' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, error: 'Upstream URL hostname is required' };
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, error: 'Upstream hostname is not allowed' };
  }

  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { ok: false, error: 'Upstream IP address is not allowed' };
    }
    return { ok: true, url: parsed };
  }

  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        return { ok: false, error: 'Upstream hostname resolves to a private or reserved IP' };
      }
    }
  } catch {
    return { ok: false, error: 'Upstream hostname could not be resolved' };
  }

  return { ok: true, url: parsed };
}
