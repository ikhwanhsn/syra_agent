/**
 * Base Builder Code for playground Base (EVM) x402 payments — client service attribution (`s`).
 * @see https://docs.cdp.coinbase.com/x402/core-concepts/builder-codes
 */

const BUILDER_CODE_PATTERN = /^[a-z0-9_]{1,32}$/;

export function isValidBaseBuilderCode(code: string): boolean {
  return BUILDER_CODE_PATTERN.test(code);
}

/** Client service code from VITE_BASE_BUILDER_CODE (optional). */
export function getBaseBuilderCode(): string | null {
  const raw = String(import.meta.env.VITE_BASE_BUILDER_CODE || '').trim();
  if (!raw) return null;
  if (!isValidBaseBuilderCode(raw)) {
    console.warn(
      `[x402] VITE_BASE_BUILDER_CODE is invalid ("${raw}"). Must match ^[a-z0-9_]{1,32}$ — builder-code attribution disabled.`
    );
    return null;
  }
  return raw;
}
