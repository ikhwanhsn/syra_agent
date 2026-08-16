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
