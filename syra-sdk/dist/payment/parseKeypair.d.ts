/** Parse Solana secret key from base58 or JSON byte array. */
export declare function parseSolanaKeypairBytes(raw: string): Uint8Array;
export declare function trimEnv(name: string): string;
export declare function firstNonEmptyEnv(...names: string[]): string;
