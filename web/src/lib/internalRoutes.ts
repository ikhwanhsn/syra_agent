/** Internal team hub — product metrics + scout agents. */
export const INTERNAL_BASE_PATH = "/internal";

export function internalAgentPath(slug: string): string {
  return `${INTERNAL_BASE_PATH}/${slug}`;
}

export function internalPartnershipBoardPath(): string {
  return `${INTERNAL_BASE_PATH}?tab=agents#partnership-board`;
}

export function isInternalRoute(pathname: string): boolean {
  return pathname === INTERNAL_BASE_PATH || pathname.startsWith(`${INTERNAL_BASE_PATH}/`);
}
