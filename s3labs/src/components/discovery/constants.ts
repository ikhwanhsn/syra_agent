export const DISCOVERY_PAGE_SIZE = 12;

/** Keep listings fresh while browsing; still de-dupes rapid remounts. */
export const DISCOVERY_STALE_MS = 15_000;

/** Poll API while discovery pages are open so new scrapes show up quickly. */
export const DISCOVERY_REFETCH_MS = 60_000;

/** Debounce search / filter / sort before refetching — also drives skeleton UX. */
export const DISCOVERY_CONTROL_DEBOUNCE_MS = 450;
