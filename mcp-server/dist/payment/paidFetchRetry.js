const FACILITATOR_429_MAX_ATTEMPTS = 6;
const FACILITATOR_429_BASE_DELAY_MS = 2000;
const FACILITATOR_PAID_402_MAX_RETRIES = 2;
const FACILITATOR_PAID_402_BASE_DELAY_MS = 1200;
function facilitatorErrorLooks429(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return (/\b429\b/i.test(msg) &&
        (/too many requests/i.test(msg) || /rate limit/i.test(msg) || /HTTP error \(429\)/i.test(msg)));
}
function isTransientPaidFacilitatorError(status, msg) {
    if (status !== 402 && status !== 400)
        return false;
    if (/budget|sentinel/i.test(msg))
        return false;
    return (/payment required/i.test(msg) ||
        /blockhash|block height/i.test(msg) ||
        /account not found among transaction's account keys/i.test(msg) ||
        /x402 payment rejected/i.test(msg) ||
        /invalid[_\s-]?payload/i.test(msg) ||
        /failed to sign transaction via cdp/i.test(msg) ||
        /rate limit|temporarily unavailable|try again/i.test(msg));
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function paidFetchWithCorbits429Backoff(paymentFetch, url, init) {
    for (let attempt = 0; attempt < FACILITATOR_429_MAX_ATTEMPTS; attempt++) {
        try {
            return await paymentFetch(url, init);
        }
        catch (error) {
            if (!facilitatorErrorLooks429(error) || attempt === FACILITATOR_429_MAX_ATTEMPTS - 1) {
                throw error;
            }
            const delay = Math.round(FACILITATOR_429_BASE_DELAY_MS * 2 ** attempt + Math.random() * 400);
            await sleep(delay);
        }
    }
    throw new Error("x402 payment fetch: Corbits 429 retries exhausted");
}
/**
 * Wrap x402-paying fetch with transient 402/400 retries (stale blockhash, facilitator races).
 * Mirrors api/libs/agentX402Client.js retry behavior.
 */
export function wrapPaidFetchWithRetries(paymentFetch) {
    return async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        let lastResponse;
        let lastError;
        for (let attempt = 0; attempt <= FACILITATOR_PAID_402_MAX_RETRIES; attempt++) {
            try {
                const res = await paidFetchWithCorbits429Backoff(paymentFetch, url, init);
                lastResponse = res;
                if (res.ok || res.status !== 402)
                    return res;
                const bodyText = await res.clone().text();
                if (!isTransientPaidFacilitatorError(res.status, bodyText) || attempt >= FACILITATOR_PAID_402_MAX_RETRIES) {
                    return res;
                }
            }
            catch (error) {
                lastError = error;
                if (attempt >= FACILITATOR_PAID_402_MAX_RETRIES)
                    throw error;
                if (!facilitatorErrorLooks429(error))
                    throw error;
            }
            const delay = Math.round(FACILITATOR_PAID_402_BASE_DELAY_MS * 2 ** attempt + Math.random() * 300);
            await sleep(delay);
        }
        if (lastResponse)
            return lastResponse;
        throw lastError instanceof Error ? lastError : new Error(String(lastError));
    };
}
