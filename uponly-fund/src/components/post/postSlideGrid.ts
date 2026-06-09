/** Pick grid columns from item count — works for any future slide content length. */
export function getPostGridCols(itemCount: number): 1 | 2 | 3 | 4 {
  if (itemCount <= 1) return 1;
  if (itemCount === 2) return 2;
  if (itemCount === 3) return 3;
  return 4;
}

export function isPostSlideDense(itemCount: number): boolean {
  return itemCount >= 4;
}
