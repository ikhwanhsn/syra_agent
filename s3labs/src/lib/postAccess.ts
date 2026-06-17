/** Internal team wallet allowed to access /post routes. */
export const POST_STUDIO_ALLOWED_WALLET = "FiejqEgqQ8bxtUJpZMy5p1wVCcejKyy5PgZ4cwmLBvYD";

export function isPostStudioAllowedWallet(address: string | null | undefined): boolean {
  return address === POST_STUDIO_ALLOWED_WALLET;
}
