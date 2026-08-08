/**
 * Call-log error copy for Labs funding skips (manual run + scheduler).
 */

/**
 * @param {{ reason?: string; error?: string; includeTopUpHint?: boolean }} input
 * @returns {string}
 */
export function formatFundingSkipError(input = {}) {
  const reason = String(input.reason || 'cannot_pay').trim();
  const detail = String(input.error || '').trim();
  const includeTopUpHint = input.includeTopUpHint !== false;
  let hint = 'Top up any lab wallet or the deposit hub.';
  if (reason === 'payto_native_underfunded') {
    hint =
      'Top up spendable ALGO (or native gas) on PayTo, any lab wallet, or the deposit hub.';
  }
  const error = detail
    ? `Payer cannot pay (${reason}): ${detail}`
    : includeTopUpHint
      ? `Payer cannot pay (${reason}). ${hint}`
      : `Payer cannot pay (${reason}).`;
  return error.slice(0, 500);
}
