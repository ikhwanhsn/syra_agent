import { trimEnv } from "./parseKeypair.js";
const DEFAULT_PUBLIC_SOLANA_HTTP = "https://api.mainnet-beta.solana.com";
let useFallbackRpc = false;
function getPrimaryRpcUrl() {
    return (trimEnv("SOLANA_RPC_BLOCKCHAIN_URL") ||
        trimEnv("SYRA_SOLANA_RPC_URL") ||
        trimEnv("SOLANA_RPC_URL") ||
        DEFAULT_PUBLIC_SOLANA_HTTP);
}
function getFallbackRpcUrl(primary) {
    const candidate = trimEnv("SOLANA_RPC_FALLBACK_URL");
    if (candidate && candidate !== primary)
        return candidate;
    if (primary === DEFAULT_PUBLIC_SOLANA_HTTP)
        return "https://rpc.ankr.com/solana";
    return DEFAULT_PUBLIC_SOLANA_HTTP;
}
const PRIMARY_RPC = getPrimaryRpcUrl();
const FALLBACK_RPC = getFallbackRpcUrl(PRIMARY_RPC);
/** RPC for @x402/svm ExactSvmScheme — must allow getAccountInfo / getLatestBlockhash. */
export function getSvmRpcUrlForX402() {
    return useFallbackRpc ? FALLBACK_RPC : PRIMARY_RPC;
}
export function isRpcBlockchainAccessError(error) {
    const parts = [];
    if (error instanceof Error) {
        parts.push(error.message);
        if (error.cause instanceof Error)
            parts.push(error.cause.message);
    }
    else if (typeof error === "string") {
        parts.push(error);
    }
    const msg = parts.filter(Boolean).join(" ");
    return (/not allowed to access blockchain|json-rpc code:\s*-32052|403 Forbidden|-32052/i.test(msg) ||
        /failed to get info about account.*403/i.test(msg));
}
export function switchToFallbackRpc() {
    if (!useFallbackRpc) {
        useFallbackRpc = true;
        console.error("[syra-mcp] Primary Solana RPC blocked blockchain access — switching to fallback");
    }
}
