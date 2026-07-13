/** Update #0 is the permanent format template on /post. */
export const POST_TEMPLATE_UPDATE_NUMBER = 0;

const LOCKED_UPDATE_NUMBERS = new Set<number>([POST_TEMPLATE_UPDATE_NUMBER]);

export function isLockedShipLogUpdate(updateNumber: number): boolean {
  return LOCKED_UPDATE_NUMBERS.has(updateNumber);
}

/** Strip locked template numbers so they can never be soft-deleted. */
export function filterDeletableUpdateNumbers(updateNumbers: number[]): number[] {
  return [
    ...new Set(
      updateNumbers.filter(
        (n) => Number.isFinite(n) && n >= 0 && !isLockedShipLogUpdate(n),
      ),
    ),
  ].sort((a, b) => a - b);
}

/** Remove locked numbers from a deleted list (self-heal after bad clients). */
export function stripLockedFromDeleted(deleted: number[]): number[] {
  return deleted.filter((n) => !isLockedShipLogUpdate(n));
}
