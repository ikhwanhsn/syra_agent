/**
 * Flint public market-data client (gRPC-Web binary over HTTPS).
 * Official @superis-labs/flint-api-client is not on npm yet — talk Connect/gRPC-Web
 * using the bundled proto from https://docs.flintlabs.dev/api.proto
 *
 * Maker / Tx services are intentionally not wired (gated maker_id + capital).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import protobuf from "protobufjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, "flint", "api.proto");

export const FLINT_PUBLIC_BASE_URL =
  process.env.FLINT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://mainnet.api.flint.trade";

const FETCH_TIMEOUT_MS = Number.parseInt(process.env.FLINT_FETCH_TIMEOUT_MS || "20000", 10);
const DEFAULT_STREAM_MS = Number.parseInt(process.env.FLINT_STREAM_TIMEOUT_MS || "2500", 10);
const DEFAULT_STREAM_MAX = Number.parseInt(process.env.FLINT_STREAM_MAX_EVENTS || "25", 10);

/** @type {Promise<protobuf.Root> | null} */
let rootPromise = null;

function loadRoot() {
  if (!rootPromise) {
    rootPromise = protobuf.load(PROTO_PATH);
  }
  return rootPromise;
}

/**
 * @param {unknown} v
 * @returns {string | null}
 */
export function flintLongToString(v) {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && v && typeof v.toString === "function") {
    return v.toString();
  }
  return null;
}

/**
 * @param {unknown} dec
 * @returns {string | null}
 */
export function flintDecimal(dec) {
  if (!dec || typeof dec !== "object") return null;
  const value = /** @type {{ value?: unknown }} */ (dec).value;
  return typeof value === "string" ? value : value != null ? String(value) : null;
}

/**
 * @param {Buffer} payload
 */
function encodeGrpcWebFrame(payload) {
  const frame = Buffer.alloc(5 + payload.length);
  frame.writeUInt8(0, 0);
  frame.writeUInt32BE(payload.length, 1);
  payload.copy(frame, 5);
  return frame;
}

/**
 * @param {Buffer} buf
 * @returns {{ flags: number; data: Buffer }[]}
 */
function decodeGrpcWebFrames(buf) {
  /** @type {{ flags: number; data: Buffer }[]} */
  const frames = [];
  let i = 0;
  while (i + 5 <= buf.length) {
    const flags = buf[i];
    const len = buf.readUInt32BE(i + 1);
    if (i + 5 + len > buf.length) break;
    frames.push({ flags, data: buf.subarray(i + 5, i + 5 + len) });
    i += 5 + len;
  }
  return frames;
}

/**
 * @param {{ flags: number; data: Buffer }[]} frames
 */
function parseGrpcTrailers(frames) {
  /** @type {Record<string, string>} */
  const trailers = {};
  for (const frame of frames) {
    if (frame.flags !== 0x80) continue;
    const text = frame.data.toString("utf8");
    for (const line of text.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      trailers[key] = value;
    }
  }
  return trailers;
}

/**
 * @param {string} service
 * @param {string} method
 * @param {Uint8Array} requestBytes
 * @param {{ timeoutMs?: number }} [opts]
 */
async function grpcWebUnary(service, method, requestBytes, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? FETCH_TIMEOUT_MS;
  const url = `${FLINT_PUBLIC_BASE_URL}/flint.spot.v1.${service}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/grpc-web+proto",
      Accept: "application/grpc-web+proto",
      "x-grpc-web": "1",
    },
    body: encodeGrpcWebFrame(Buffer.from(requestBytes)),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const buf = Buffer.from(await res.arrayBuffer());
  const frames = decodeGrpcWebFrames(buf);
  const trailers = parseGrpcTrailers(frames);
  const grpcStatus = trailers["grpc-status"] ?? res.headers.get("grpc-status") ?? "0";
  if (String(grpcStatus) !== "0") {
    const msg = trailers["grpc-message"] || res.headers.get("grpc-message") || "unknown";
    const err = new Error(`Flint gRPC ${service}/${method} status ${grpcStatus}: ${msg}`);
    /** @type {any} */ (err).grpcStatus = Number(grpcStatus);
    /** @type {any} */ (err).flintResourceExhausted = Number(grpcStatus) === 8;
    throw err;
  }

  const dataFrame = frames.find((f) => f.flags === 0);
  return dataFrame ? dataFrame.data : Buffer.alloc(0);
}

/**
 * Collect server-stream data frames until timeout or max events.
 * @param {string} service
 * @param {string} method
 * @param {Uint8Array} requestBytes
 * @param {{ timeoutMs?: number; maxEvents?: number }} [opts]
 */
async function grpcWebCollectStream(service, method, requestBytes, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_STREAM_MS;
  const maxEvents = opts.maxEvents ?? DEFAULT_STREAM_MAX;
  const url = `${FLINT_PUBLIC_BASE_URL}/flint.spot.v1.${service}/${method}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  /** @type {Buffer[]} */
  const payloads = [];
  let leftover = Buffer.alloc(0);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/grpc-web+proto",
        Accept: "application/grpc-web+proto",
        "x-grpc-web": "1",
      },
      body: encodeGrpcWebFrame(Buffer.from(requestBytes)),
      signal: controller.signal,
    });

    if (!res.ok && !res.body) {
      throw new Error(`Flint stream HTTP ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const buf = Buffer.from(await res.arrayBuffer());
      const frames = decodeGrpcWebFrames(buf);
      for (const f of frames) {
        if (f.flags === 0) payloads.push(f.data);
      }
      return payloads;
    }

    while (payloads.length < maxEvents) {
      const { done, value } = await reader.read();
      if (done) break;
      leftover = Buffer.concat([leftover, Buffer.from(value)]);
      while (leftover.length >= 5) {
        const flags = leftover[0];
        const len = leftover.readUInt32BE(1);
        if (leftover.length < 5 + len) break;
        const data = leftover.subarray(5, 5 + len);
        leftover = leftover.subarray(5 + len);
        if (flags === 0) {
          payloads.push(Buffer.from(data));
          if (payloads.length >= maxEvents) {
            controller.abort();
            break;
          }
        }
      }
    }
  } catch (err) {
    if (payloads.length === 0 && !(err instanceof Error && err.name === "AbortError")) {
      throw err;
    }
  } finally {
    clearTimeout(timer);
  }

  return payloads;
}

/**
 * @param {Record<string, unknown>} pairLike
 */
export function normalizePairInput(pairLike = {}) {
  const base =
    typeof pairLike.base === "string"
      ? pairLike.base.trim().toUpperCase()
      : typeof pairLike.baseSymbol === "string"
        ? pairLike.baseSymbol.trim().toUpperCase()
        : "";
  const quote =
    typeof pairLike.quote === "string"
      ? pairLike.quote.trim().toUpperCase()
      : typeof pairLike.quoteSymbol === "string"
        ? pairLike.quoteSymbol.trim().toUpperCase()
        : "USDC";
  const baseIdRaw = pairLike.baseId ?? pairLike.base_id;
  const quoteIdRaw = pairLike.quoteId ?? pairLike.quote_id;
  const baseId =
    baseIdRaw != null && String(baseIdRaw).trim() !== ""
      ? String(baseIdRaw)
      : undefined;
  const quoteId =
    quoteIdRaw != null && String(quoteIdRaw).trim() !== ""
      ? String(quoteIdRaw)
      : undefined;
  const label =
    typeof pairLike.label === "string" && pairLike.label.trim()
      ? pairLike.label.trim()
      : base && quote
        ? `${base}/${quote}`
        : "";

  /** @type {Record<string, unknown>} */
  const pair = {};
  if (baseId != null) pair.baseId = baseId;
  if (quoteId != null) pair.quoteId = quoteId;
  if (base) pair.base = base;
  if (quote) pair.quote = quote;
  if (label) pair.label = label;
  return pair;
}

/**
 * @param {unknown} pair
 */
function serializePair(pair) {
  if (!pair || typeof pair !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (pair);
  return {
    baseId: flintLongToString(p.baseId),
    base: typeof p.base === "string" ? p.base : null,
    quoteId: flintLongToString(p.quoteId),
    quote: typeof p.quote === "string" ? p.quote : null,
    label: typeof p.label === "string" ? p.label : null,
  };
}

/**
 * @param {unknown} level
 */
function serializeL2Level(level) {
  if (!level || typeof level !== "object") return null;
  const l = /** @type {Record<string, unknown>} */ (level);
  return {
    price: flintDecimal(l.price),
    size: flintDecimal(l.size),
  };
}

/**
 * @param {unknown} spot
 */
function serializeSpot(spot) {
  if (!spot || typeof spot !== "object") return null;
  const s = /** @type {Record<string, unknown>} */ (spot);
  const idObj = s.id && typeof s.id === "object" ? /** @type {any} */ (s.id) : null;
  return {
    id: flintLongToString(idObj?.id ?? s.id),
    name: typeof s.name === "string" ? s.name : null,
    mint: typeof s.mint === "string" ? s.mint : null,
    programId: typeof s.programId === "string" ? s.programId : null,
    decimals: typeof s.decimals === "number" ? s.decimals : null,
    atomsPerLot: typeof s.atomsPerLot === "number" ? s.atomsPerLot : null,
  };
}

/**
 * @param {unknown} window
 */
function serializeWindow(window) {
  if (!window || typeof window !== "object") return null;
  const w = /** @type {Record<string, unknown>} */ (window);
  return {
    volumeQuote: flintDecimal(w.volumeQuote),
    fillCount: flintLongToString(w.fillCount),
  };
}

export async function flintListPairs() {
  const root = await loadRoot();
  const Req = root.lookupType("flint.spot.v1.ListPairsRequest");
  const Res = root.lookupType("flint.spot.v1.ListPairsResponse");
  const bytes = await grpcWebUnary(
    "MarketDataService",
    "ListPairs",
    Req.encode(Req.create({})).finish(),
  );
  const decoded = Res.decode(bytes);
  const obj = Res.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: false,
  });
  const pairs = Array.isArray(obj.pairs)
    ? obj.pairs.map((row) => ({
        pair: serializePair(row.pair),
        base: serializeSpot(row.base),
        quote: serializeSpot(row.quote),
        lastPrice: flintDecimal(row.lastPrice),
      }))
    : [];
  return { pairs, count: pairs.length };
}

/**
 * @param {{ pair: Record<string, unknown>; level?: string | number }} params
 */
export async function flintGetBook(params) {
  const root = await loadRoot();
  const Req = root.lookupType("flint.spot.v1.GetBookRequest");
  const Res = root.lookupType("flint.spot.v1.GetBookResponse");
  const FeedLevel = root.lookupEnum("flint.spot.v1.FeedLevel");

  let level = FeedLevel.values.FEED_LEVEL_L2;
  const rawLevel = params.level;
  if (typeof rawLevel === "number") {
    level = rawLevel;
  } else if (typeof rawLevel === "string" && rawLevel.trim()) {
    const key = rawLevel.trim().toUpperCase().replace(/^FEED_LEVEL_/, "");
    const mapped =
      FeedLevel.values[`FEED_LEVEL_${key}`] ?? FeedLevel.values[rawLevel];
    if (mapped != null) level = mapped;
  }

  const message = Req.create({
    pair: normalizePairInput(params.pair),
    level,
  });
  const bytes = await grpcWebUnary(
    "MarketDataService",
    "GetBook",
    Req.encode(message).finish(),
  );
  const decoded = Res.decode(bytes);
  const obj = Res.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: false,
  });

  if (obj.l2) {
    return {
      level: "L2",
      pair: serializePair(obj.l2.pair),
      metadata: obj.l2.metadata
        ? {
            slot: flintLongToString(obj.l2.metadata.slot),
            updateId: flintLongToString(obj.l2.metadata.updateId),
            tsMicros: flintLongToString(obj.l2.metadata.ts?.micros),
          }
        : null,
      bids: (obj.l2.bids || []).map(serializeL2Level).filter(Boolean),
      asks: (obj.l2.asks || []).map(serializeL2Level).filter(Boolean),
    };
  }
  if (obj.l1) {
    return {
      level: "L1",
      pair: serializePair(obj.l1.pair),
      bid: serializeL2Level(obj.l1.bid),
      ask: serializeL2Level(obj.l1.ask),
      metadata: obj.l1.metadata
        ? {
            slot: flintLongToString(obj.l1.metadata.slot),
            updateId: flintLongToString(obj.l1.metadata.updateId),
            tsMicros: flintLongToString(obj.l1.metadata.ts?.micros),
          }
        : null,
    };
  }
  if (obj.l3) {
    return {
      level: "L3",
      pair: serializePair(obj.l3.pair),
      bids: (obj.l3.bids || []).map((e) => ({
        makerId: flintLongToString(e.makerId?.id),
        price: flintDecimal(e.price),
        size: flintDecimal(e.size),
      })),
      asks: (obj.l3.asks || []).map((e) => ({
        makerId: flintLongToString(e.makerId?.id),
        price: flintDecimal(e.price),
        size: flintDecimal(e.size),
      })),
    };
  }
  return { level: null, pair: serializePair(params.pair), bids: [], asks: [] };
}

export async function flintGetSummary() {
  const root = await loadRoot();
  const Req = root.lookupType("flint.spot.v1.GetSummaryRequest");
  const Res = root.lookupType("flint.spot.v1.GetSummaryResponse");
  const bytes = await grpcWebUnary(
    "StatsService",
    "GetSummary",
    Req.encode(Req.create({})).finish(),
  );
  const decoded = Res.decode(bytes);
  const obj = Res.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: false,
  });
  return {
    activePairs: obj.activePairs ?? null,
    activeMakers: obj.activeMakers ?? null,
    oneHour: serializeWindow(obj.oneHour),
    twentyFourHour: serializeWindow(obj.twentyFourHour),
    thirtyDay: serializeWindow(obj.thirtyDay),
    volumeQuoteAllTime: flintDecimal(obj.volumeQuoteAllTime),
    fillCountAllTime: flintLongToString(obj.fillCountAllTime),
    uniqueTraders24h: obj.uniqueTraders24h ?? null,
    totalNav: flintDecimal(obj.totalNav),
    largestTrade24h: obj.largestTrade24h
      ? {
          pair: serializePair(obj.largestTrade24h.pair),
          size: flintDecimal(obj.largestTrade24h.size),
          price: flintDecimal(obj.largestTrade24h.price),
          notional: flintDecimal(obj.largestTrade24h.notional),
          tsMicros: flintLongToString(obj.largestTrade24h.ts?.micros),
        }
      : null,
  };
}

/**
 * @param {{
 *   pair: Record<string, unknown>;
 *   interval?: string;
 *   startMicros?: string | number;
 *   endMicros?: string | number;
 * }} params
 */
export async function flintGetCandles(params) {
  const root = await loadRoot();
  const Req = root.lookupType("flint.spot.v1.GetCandlesRequest");
  const Res = root.lookupType("flint.spot.v1.GetCandlesResponse");
  const CandleInterval = root.lookupEnum("flint.spot.v1.CandleInterval");

  let interval = CandleInterval.values.CANDLE_INTERVAL_5M;
  const raw = params.interval;
  if (typeof raw === "string" && raw.trim()) {
    const key = raw.trim().toUpperCase().replace(/^CANDLE_INTERVAL_/, "");
    const mapped =
      CandleInterval.values[`CANDLE_INTERVAL_${key}`] ?? CandleInterval.values[raw];
    if (mapped != null) interval = mapped;
  }

  /** @type {Record<string, unknown>} */
  const body = {
    pair: normalizePairInput(params.pair),
    interval,
  };
  if (params.startMicros != null) {
    body.start = { micros: String(params.startMicros) };
  }
  if (params.endMicros != null) {
    body.end = { micros: String(params.endMicros) };
  }

  const bytes = await grpcWebUnary(
    "HistoricalService",
    "GetCandles",
    Req.encode(Req.create(body)).finish(),
  );
  const decoded = Res.decode(bytes);
  const obj = Res.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: false,
  });
  const candles = Array.isArray(obj.candles)
    ? obj.candles.map((c) => ({
        tsMicros: flintLongToString(c.ts?.micros),
        open: flintDecimal(c.open),
        high: flintDecimal(c.high),
        low: flintDecimal(c.low),
        close: flintDecimal(c.close),
        volume: flintDecimal(c.volume),
      }))
    : [];
  return { candles, count: candles.length };
}

/**
 * @param {{
 *   pair: Record<string, unknown>;
 *   limit?: number;
 *   startMicros?: string | number;
 *   endMicros?: string | number;
 * }} params
 */
export async function flintGetFills(params) {
  const root = await loadRoot();
  const Req = root.lookupType("flint.spot.v1.GetFillsRequest");
  const Res = root.lookupType("flint.spot.v1.GetFillsResponse");
  const limit = Math.min(1000, Math.max(1, Number(params.limit) || 50));
  /** @type {Record<string, unknown>} */
  const body = {
    pair: normalizePairInput(params.pair),
    limit,
  };
  if (params.startMicros != null) body.start = { micros: String(params.startMicros) };
  if (params.endMicros != null) body.end = { micros: String(params.endMicros) };

  const bytes = await grpcWebUnary(
    "HistoricalService",
    "GetFills",
    Req.encode(Req.create(body)).finish(),
  );
  const decoded = Res.decode(bytes);
  const obj = Res.toObject(decoded, {
    longs: String,
    enums: String,
    defaults: false,
  });
  const fills = Array.isArray(obj.fills)
    ? obj.fills.map((f) => ({
        pair: serializePair(f.pair),
        side: typeof f.side === "string" ? f.side : null,
        price: flintDecimal(f.price),
        size: flintDecimal(f.size),
        slot: flintLongToString(f.slot),
        tsMicros: flintLongToString(f.ts?.micros),
        signature: typeof f.signature === "string" ? f.signature : null,
      }))
    : [];
  return { fills, count: fills.length };
}

/**
 * Short-lived snapshot of external aggregator fills + venue quotes.
 * @param {{
 *   pair: Record<string, unknown>;
 *   timeoutMs?: number;
 *   maxEvents?: number;
 * }} params
 */
export async function flintExternalTape(params) {
  const root = await loadRoot();
  const FillReq = root.lookupType("flint.spot.v1.SubscribeExternalFillsRequest");
  const FillEvent = root.lookupType("flint.spot.v1.ExternalFillEvent");
  const QuoteReq = root.lookupType("flint.spot.v1.SubscribeExternalQuotesRequest");
  const QuoteEvent = root.lookupType("flint.spot.v1.ExternalVenueQuoteEvent");

  const pair = normalizePairInput(params.pair);
  const timeoutMs = params.timeoutMs ?? DEFAULT_STREAM_MS;
  const maxEvents = params.maxEvents ?? DEFAULT_STREAM_MAX;

  const [fillFrames, quoteFrames] = await Promise.all([
    grpcWebCollectStream(
      "MarketDataService",
      "SubscribeExternalFills",
      FillReq.encode(FillReq.create({ pair })).finish(),
      { timeoutMs, maxEvents },
    ).catch(() => []),
    grpcWebCollectStream(
      "MarketDataService",
      "SubscribeExternalQuotes",
      QuoteReq.encode(QuoteReq.create({ pair })).finish(),
      { timeoutMs, maxEvents: Math.min(maxEvents, 12) },
    ).catch(() => []),
  ]);

  const fills = fillFrames.map((buf) => {
    const obj = FillEvent.toObject(FillEvent.decode(buf), {
      longs: String,
      enums: String,
      defaults: false,
    });
    return {
      pair: serializePair(obj.pair),
      side: typeof obj.side === "string" ? obj.side : null,
      price: flintDecimal(obj.price),
      size: flintDecimal(obj.size),
      slot: flintLongToString(obj.slot),
      tsMicros: flintLongToString(obj.ts?.micros),
      signature: typeof obj.signature === "string" ? obj.signature : null,
      source: typeof obj.source === "string" ? obj.source : null,
    };
  });

  const quotes = quoteFrames.map((buf) => {
    const obj = QuoteEvent.toObject(QuoteEvent.decode(buf), {
      longs: String,
      enums: String,
      defaults: false,
    });
    return {
      pair: serializePair(obj.pair),
      venue: typeof obj.venue === "string" ? obj.venue : null,
      bid: serializeL2Level(obj.bid),
      ask: serializeL2Level(obj.ask),
      receivedTsMicros: flintLongToString(obj.receivedTs?.micros),
      askRoute: Array.isArray(obj.askRoute) ? obj.askRoute : [],
      bidRoute: Array.isArray(obj.bidRoute) ? obj.bidRoute : [],
    };
  });

  return {
    pair: serializePair(pair),
    fills,
    quotes,
    fillCount: fills.length,
    quoteCount: quotes.length,
    windowMs: timeoutMs,
    note: "Short-lived stream snapshot (not a live websocket). External quotes are reference polls, not firm executable prices.",
  };
}
