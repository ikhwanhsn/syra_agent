/** S3Labs ecosystem tokens shown on /arenass (Solana mints). */

export interface S3LabsArenaProject {
  /** Display name (may differ from on-chain token name). */
  name: string;
  mint: string;
}

export const S3LABS_ARENA_PROJECTS: readonly S3LabsArenaProject[] = [
  { name: "Syra", mint: "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump" },
  { name: "Xona", mint: "Ckit5s1Cpc3RdMh1HrhfW2nAy4PnkkgjXgXMeykbpump" },
  { name: "Gate", mint: "3EfCdzNM15mZzxiwXzyk32syZeSKJYgLVBXP9vJ4pump" },
  { name: "Colla", mint: "3oEHLDg8VokqBM37u7ohkbKUKcdPE8sT8Btgrxovpump" },
  { name: "Hexi", mint: "3ghjaogpDVt7QZ6eNauoggmj4WYw23TkpyVN2yZjpump" },
  { name: "ARSweep", mint: "dTMaF2F97BWo6s416JqsDrpzdwa1uarKngSwf25pump" },
  { name: "Hyre Agent", mint: "2HtyE1W7fE2cdoYxR5fsukr9AyoQGpJep14NAVBMpump" },
  { name: "Plankton", mint: "65Fp9stRoiF9AY4FqmpLTGGaeTkiv7duwiRCZrUGpump" },
] as const;

const ARENA_MINTS = new Set(S3LABS_ARENA_PROJECTS.map((p) => p.mint));

/** Whether this mint is part of the S3Labs Arena list (exact match, case-sensitive). */
export function isArenaListedMint(mint: string): boolean {
  return ARENA_MINTS.has(mint);
}

export function findArenaProjectByMint(mint: string): S3LabsArenaProject | undefined {
  return S3LABS_ARENA_PROJECTS.find((p) => p.mint === mint);
}
