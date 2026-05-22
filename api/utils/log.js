/**
 * Structured logger (P1.8).
 *
 * Uses pino for JSON-line output (machine-readable). The console.* APIs continue to work for
 * legacy call sites; new code should `import { log } from 'utils/log.js'` and call
 * `log.info({ event, ... }, 'message')`.
 *
 * Redacts known sensitive paths so they never enter the log stream.
 */
import pino from 'pino';

const SENSITIVE_PATHS = [
  'agentSecretKey',
  '*.agentSecretKey',
  'secretKey',
  '*.secretKey',
  'privateKey',
  '*.privateKey',
  'mnemonic',
  '*.mnemonic',
  'authorization',
  'headers.authorization',
  'cookie',
  'headers.cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'AGENT_PRIVATE_KEY',
  'AGENT_WALLET_SECRET_ENCRYPTION_KEY',
];

export const log = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: { service: 'syra-api', env: process.env.NODE_ENV || 'development' },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: { paths: SENSITIVE_PATHS, censor: '[REDACTED]' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Sentry shim — only initializes when SENTRY_DSN is set AND @sentry/node is installed.
 * Allows fire-and-forget `captureException(err, ctx)` from anywhere in the codebase.
 */
let _sentry = null;
let _sentryLoaded = false;
async function ensureSentry() {
  if (_sentryLoaded) return _sentry;
  _sentryLoaded = true;
  const dsn = (process.env.SENTRY_DSN || '').trim();
  if (!dsn) return null;
  try {
    const mod = await import('@sentry/node').catch(() => null);
    if (!mod) return null;
    mod.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
      environment: process.env.NODE_ENV || 'development',
      release: process.env.GIT_COMMIT || undefined,
    });
    _sentry = mod;
    log.info({ event: 'sentry_initialized' }, 'Sentry enabled');
    return mod;
  } catch (e) {
    log.warn({ event: 'sentry_init_failed', err: e?.message }, 'Sentry init failed');
    return null;
  }
}
ensureSentry();

export function captureException(err, ctx = {}) {
  if (!_sentry) return;
  try {
    _sentry.captureException(err, { extra: ctx });
  } catch {
    /* ignore */
  }
}
