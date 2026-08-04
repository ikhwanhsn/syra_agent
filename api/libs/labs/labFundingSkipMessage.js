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
  const error = detail
    ? `Payer cannot pay (${reason}): ${detail}`
    : includeTopUpHint
      ? `Payer cannot pay (${reason}). Top up any lab wallet or the deposit hub.`
      : `Payer cannot pay (${reason}).`;
  return error.slice(0, 500);
}
