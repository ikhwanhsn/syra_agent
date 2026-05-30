import { Buffer } from "buffer";

if (typeof globalThis !== "undefined") {
  (globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer ??= Buffer;
}
