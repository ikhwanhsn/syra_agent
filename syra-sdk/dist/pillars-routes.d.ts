/**
 * Five-pillar route prefixes — keep in sync with api/config/pillars.js
 */
export declare const SYRA_PILLAR_IDS: readonly ["earn", "treasury", "invest", "spend", "grow"];
export type SyraPillarId = (typeof SYRA_PILLAR_IDS)[number];
export declare const SYRA_PILLAR_ROUTES: Record<SyraPillarId, readonly string[]>;
export declare function resolveSyraPillarForPath(pathname: string): SyraPillarId;
