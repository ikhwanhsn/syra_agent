import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { startupInfo, startupVerbose } from '../utils/startupLog.js';

dotenv.config({ quiet: true });

// Fail fast when disconnected — avoids 10s "buffering timed out" spam per query.
mongoose.set('bufferCommands', false);

let isConnected = false;
/** @type {Promise<boolean> | null} */
let connectPromise = null;
/** @type {ReturnType<typeof setInterval> | null} */
let reconnectTimer = null;
/** @type {Set<() => void | Promise<void>>} */
const onConnectedHandlers = new Set();
let lastConnectFailLogAt = 0;

function logAtlasHint() {
  console.error(
    '[mongoose] Atlas network access: add your current IP (or 0.0.0.0/0 for local dev only) at https://cloud.mongodb.com → Network Access',
  );
}

export function isMongooseConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * Register a handler to run when MongoDB connects (and immediately if already connected).
 * @param {() => void | Promise<void>} handler
 */
export function onMongooseConnected(handler) {
  onConnectedHandlers.add(handler);
  if (isMongooseConnected()) {
    void invokeConnectHandler(handler);
  }
}

/**
 * @param {() => void | Promise<void>} handler
 */
async function invokeConnectHandler(handler) {
  try {
    await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mongoose] onConnected handler failed:', message);
  }
}

async function fireOnConnectedHandlers() {
  for (const handler of onConnectedHandlers) {
    await invokeConnectHandler(handler);
  }
}

/**
 * @param {(...args: unknown[]) => unknown} fn
 * @returns {(...args: unknown[]) => unknown}
 */
export function runIfMongoConnected(fn) {
  return (...args) => {
    if (!isMongooseConnected()) return undefined;
    const result = fn(...args);
    if (
      result != null &&
      typeof result === 'object' &&
      typeof /** @type {{ catch?: unknown }} */ (result).catch === 'function'
    ) {
      return /** @type {Promise<unknown>} */ (result).catch((error) => {
        if (!isMongooseConnected()) return undefined;
        throw error;
      });
    }
    return result;
  };
}

/**
 * @param {{ required?: boolean }} [options]
 * @returns {Promise<boolean>} true when connected, false when optional connect failed
 */
const connectMongoose = async (options = {}) => {
  const { required = true } = options;

  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    const msg = 'MONGODB_URI is not set in api/.env';
    console.error(`[mongoose] ${msg}`);
    if (required) throw new Error(msg);
    return false;
  }

  if (!connectPromise) {
    const maxPoolRaw = Number.parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10);
    const maxPoolSize =
      Number.isFinite(maxPoolRaw) && maxPoolRaw > 0 ? maxPoolRaw : 10;

    connectPromise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        maxPoolSize,
        minPoolSize: 0,
      })
      .then(async () => {
        isConnected = true;
        startupInfo('[mongoose] Connected');
        await fireOnConnectedHandlers();
        return true;
      })
      .catch((error) => {
        connectPromise = null;
        isConnected = false;
        throw error;
      });
  }

  try {
    return await connectPromise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const now = Date.now();
    if (now - lastConnectFailLogAt >= 60_000) {
      lastConnectFailLogAt = now;
      console.error('[mongoose] Connection failed:', message);
      if (
        error?.name === 'MongooseServerSelectionError' ||
        message.includes('whitelist') ||
        message.includes('timed out')
      ) {
        logAtlasHint();
      }
    }
    if (required) throw error;
    return false;
  }
};

/** Retry MongoDB until connected (does not block HTTP server startup). */
export function startMongooseConnectionLoop() {
  const retryMs = Math.max(
    5_000,
    Number.parseInt(process.env.MONGODB_RETRY_MS || '30000', 10) || 30_000,
  );

  const attempt = () => {
    if (isMongooseConnected()) return;
    void connectMongoose({ required: false });
  };

  attempt();

  if (reconnectTimer) return;
  reconnectTimer = setInterval(attempt, retryMs);
  if (typeof reconnectTimer.unref === 'function') {
    reconnectTimer.unref();
  }

  startupVerbose(`[mongoose] connection retry every ${Math.round(retryMs / 1000)}s until connected`);
}

/** Express middleware — responds 503 when MongoDB is unavailable. */
export function requireMongooseConnection(req, res, next) {
  connectMongoose({ required: false })
    .then((ok) => {
      if (!ok) {
        res.status(503).json({
          success: false,
          error: 'database_unavailable',
          message:
            'MongoDB is not connected. Set MONGODB_URI in api/.env and whitelist your IP in MongoDB Atlas Network Access.',
        });
        return;
      }
      next();
    })
    .catch(next);
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  connectPromise = null;
});

mongoose.connection.on('error', () => {
  isConnected = false;
});

export default connectMongoose;
