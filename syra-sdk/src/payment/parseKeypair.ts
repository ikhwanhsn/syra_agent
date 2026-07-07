import bs58 from "bs58";

/** Parse Solana secret key from base58 or JSON byte array. */
export function parseSolanaKeypairBytes(raw: string): Uint8Array {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (!s) throw new Error("Solana payer keypair is empty");

  if (s.startsWith("[")) {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr) || arr.length < 32) {
      throw new Error("Solana keypair JSON must be an array of at least 32 bytes");
    }
    return Uint8Array.from(arr as number[]);
  }

  return bs58.decode(s);
}

export function trimEnv(name: string): string {
  return String(process.env[name] || "").trim();
}

export function firstNonEmptyEnv(...names: string[]): string {
  for (const name of names) {
    const value = trimEnv(name);
    if (value) return value;
  }
  return "";
}
